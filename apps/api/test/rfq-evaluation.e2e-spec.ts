/**
 * Bid evaluation: the score is computed, and the recommendation follows from it.
 *
 * The bid matrix had one box — "Score / 100" — that an evaluating officer typed
 * a number into, and a Recommend button beside it. So the spec's "automated
 * technical scoring (0-100) and winner recommendation" was one person's opinion
 * recorded to two significant figures, with nothing on the record saying what
 * it was an opinion about: nobody could see why a vendor scored 84, or what the
 * runner-up lost on.
 *
 * The marks below are still human — somebody has to read the bids — but each is
 * against a named criterion with a declared weight, and the total is arithmetic.
 * The three refusals are as important as the arithmetic: each is a way a vendor
 * could otherwise win by accident rather than on merit.
 */
import type { Server } from 'node:http';
import { execSync } from 'child_process';
import { useThrowawaySchema, dropSchema } from './throwaway-schema';
import { join } from 'path';

const schema = useThrowawaySchema('rfqeval');
process.env.JWT_SECRET = 'e2e-only-secret-that-is-comfortably-long-enough';
process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
process.env.NODE_ENV = 'test';
process.env.LOGIN_RATE_LIMIT = '10000';

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/all-exceptions.filter';

const PASSWORD = 'e2e-test-password';

function body<T>(response: { body: unknown }): T {
  return response.body as T;
}

type Criterion = {
  id: string;
  label: string;
  weight: number;
  maxScore: number;
};
type Evaluation = {
  reference: string;
  technicalWeight: number;
  financialWeight: number;
  recommended: { quoteId: string; vendorName: string };
  ranking: Array<{
    quoteId: string;
    vendorName: string;
    price: number;
    technicalScore: number;
    financialScore: number;
    combinedScore: number;
    breakdown: Array<{ label: string; mark: number; contribution: number }>;
  }>;
};

describe('RFQ evaluation (e2e)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let prisma: PrismaClient;

  const token: Record<string, string> = {};
  const userId: Record<string, string> = {};
  let vendorA: string;
  let vendorB: string;
  let vendorC: string;

  beforeAll(async () => {
    execSync('npx prisma migrate deploy', {
      cwd: join(__dirname, '..'),
      env: { ...process.env },
      stdio: 'ignore',
    });

    prisma = new PrismaClient();
    const hash = await bcrypt.hash(PASSWORD, 4);
    for (const a of [
      { key: 'procurement', email: 'proc@rfq.test', role: 'PROCUREMENT' },
      { key: 'finance', email: 'finance@rfq.test', role: 'FINANCE' },
      { key: 'volunteer', email: 'volunteer@rfq.test', role: 'VOLUNTEER' },
    ]) {
      const user = await prisma.user.create({
        data: {
          email: a.email,
          password: hash,
          firstName: a.key,
          lastName: 'Test',
          role: a.role,
        },
      });
      userId[a.key] = user.id;
    }

    vendorA = (
      await prisma.vendor.create({
        data: { name: 'Alpha Medical Supplies', category: 'Reagents' },
      })
    ).id;
    vendorB = (
      await prisma.vendor.create({
        data: { name: 'Beta Diagnostics', category: 'Reagents' },
      })
    ).id;
    vendorC = (
      await prisma.vendor.create({
        data: { name: 'Gamma Labs', category: 'Reagents' },
      })
    ).id;

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
    http = request(app.getHttpServer() as Server);

    for (const [key, email] of [
      ['procurement', 'proc@rfq.test'],
      ['finance', 'finance@rfq.test'],
      ['volunteer', 'volunteer@rfq.test'],
    ]) {
      const res = await http
        .post('/auth/login')
        .send({ email, password: PASSWORD })
        .expect(201);
      token[key] = body<{ access_token: string }>(res).access_token;
    }
  }, 180_000);

  afterAll(async () => {
    await app?.close();
    await dropSchema(prisma, schema);
    await prisma.$disconnect();
  });

  const as = (key = 'procurement') => `Bearer ${token[key]}`;
  let rfqSeq = 0;

  /** A fresh RFQ each time, so one test's evaluation cannot affect another's. */
  const newRfq = async () => {
    rfqSeq += 1;
    const rfq = await prisma.rfq.create({
      data: {
        reference: `RFQ-TEST-${rfqSeq}`,
        description: 'VIA reagents, annual supply',
      },
    });
    return rfq.id;
  };

  const quote = (rfqId: string, vendorId: string, price: number) =>
    prisma.rfqQuote.create({ data: { rfqId, vendorId, price } });

  const setCriteria = (rfqId: string, payload: Record<string, unknown>) =>
    http
      .put(`/operations/rfqs/${rfqId}/criteria`)
      .set('Authorization', as())
      .send(payload);

  const mark = (quoteId: string, scores: Array<Record<string, unknown>>) =>
    http
      .put(`/operations/quotes/${quoteId}/scores`)
      .set('Authorization', as())
      .send({ scores });

  const evaluate = (rfqId: string, actor = 'procurement') =>
    http
      .post(`/operations/rfqs/${rfqId}/evaluate`)
      .set('Authorization', as(actor));

  /** Two criteria at 60/40, marked out of 10. */
  const standardCriteria = async (rfqId: string, technicalWeight?: number) => {
    const res = await setCriteria(rfqId, {
      criteria: [
        { label: 'Technical compliance', weight: 60, maxScore: 10 },
        { label: 'Delivery lead time', weight: 40, maxScore: 10 },
      ],
      ...(technicalWeight !== undefined ? { technicalWeight } : {}),
    }).expect(200);
    return body<Criterion[]>(res);
  };

  describe('the criteria', () => {
    it('must sum to 100', async () => {
      // Not tidiness: a technical score is meaningless if the denominator is
      // whatever the weights happened to add up to, and "out of 87" against
      // "out of 100" makes two bids incomparable without anyone noticing.
      const rfqId = await newRfq();
      const res = await setCriteria(rfqId, {
        criteria: [
          { label: 'Technical', weight: 60 },
          { label: 'Delivery', weight: 25 },
        ],
      }).expect(400);
      expect(JSON.stringify(body(res))).toContain('sum to 100');
    });

    it('are stored in the order they were given', async () => {
      const rfqId = await newRfq();
      const criteria = await standardCriteria(rfqId);
      expect(criteria.map((c) => c.label)).toEqual([
        'Technical compliance',
        'Delivery lead time',
      ]);
    });

    it('cannot be changed once the RFQ has been evaluated', async () => {
      // Rescoring against criteria nobody agreed to is how an award ends up
      // meaning something other than what was decided.
      const rfqId = await newRfq();
      const criteria = await standardCriteria(rfqId);
      const q = await quote(rfqId, vendorA, 1_000_000);
      await mark(
        q.id,
        criteria.map((c) => ({ criterionId: c.id, score: 8 })),
      );
      await evaluate(rfqId).expect(201);

      await setCriteria(rfqId, {
        criteria: [{ label: 'Price only', weight: 100 }],
      }).expect(409);
    });
  });

  describe('the marks', () => {
    it('refuses a mark above the criterion scale', async () => {
      // It would inflate the weighted total silently, and the recommendation
      // turns on that total.
      const rfqId = await newRfq();
      const criteria = await standardCriteria(rfqId);
      const q = await quote(rfqId, vendorA, 1_000_000);
      const res = await mark(q.id, [
        { criterionId: criteria[0].id, score: 40 },
      ]).expect(400);
      expect(JSON.stringify(body(res))).toContain('marked out of 10');
    });

    it('refuses a mark against another RFQ’s criterion', async () => {
      const first = await newRfq();
      const second = await newRfq();
      const otherCriteria = await standardCriteria(first);
      await standardCriteria(second);
      const q = await quote(second, vendorA, 1_000_000);
      await mark(q.id, [{ criterionId: otherCriteria[0].id, score: 5 }]).expect(
        400,
      );
    });

    it('replaces an earlier mark rather than adding a second', async () => {
      const rfqId = await newRfq();
      const criteria = await standardCriteria(rfqId);
      const q = await quote(rfqId, vendorA, 1_000_000);
      await mark(q.id, [{ criterionId: criteria[0].id, score: 4 }]).expect(200);
      await mark(q.id, [{ criterionId: criteria[0].id, score: 9 }]).expect(200);
      const stored = await prisma.quoteCriterionScore.findMany({
        where: { quoteId: q.id },
      });
      expect(stored).toHaveLength(1);
      expect(stored[0].score).toBe(9);
    });
  });

  describe('the arithmetic', () => {
    it('computes the technical score from the weighted marks', async () => {
      /*
       * Alpha: 10/10 on a 60-weight criterion and 5/10 on a 40-weight one
       *        = 60 + 20 = 80.
       * Beta:  5/10 and 10/10 = 30 + 40 = 70.
       * Both figures are checkable by hand, which is the whole point of
       * replacing a typed-in 84 with a derivation.
       */
      const rfqId = await newRfq();
      const criteria = await standardCriteria(rfqId, 100); // technical only
      const a = await quote(rfqId, vendorA, 1_000_000);
      const b = await quote(rfqId, vendorB, 1_000_000);

      await mark(a.id, [
        { criterionId: criteria[0].id, score: 10 },
        { criterionId: criteria[1].id, score: 5 },
      ]).expect(200);
      await mark(b.id, [
        { criterionId: criteria[0].id, score: 5 },
        { criterionId: criteria[1].id, score: 10 },
      ]).expect(200);

      const result = body<Evaluation>(await evaluate(rfqId).expect(201));
      const alpha = result.ranking.find((r) => r.quoteId === a.id)!;
      const beta = result.ranking.find((r) => r.quoteId === b.id)!;
      expect(alpha.technicalScore).toBe(80);
      expect(beta.technicalScore).toBe(70);
      expect(result.recommended.vendorName).toBe('Alpha Medical Supplies');
    });

    it('scores price against the cheapest bid', async () => {
      // The cheapest compliant quote scores 100 and the rest in proportion,
      // which is the ordinary public-procurement formula.
      const rfqId = await newRfq();
      const criteria = await standardCriteria(rfqId, 0); // price only
      const cheap = await quote(rfqId, vendorA, 1_000_000);
      const dear = await quote(rfqId, vendorB, 2_000_000);
      for (const q of [cheap, dear]) {
        await mark(
          q.id,
          criteria.map((c) => ({ criterionId: c.id, score: 5 })),
        ).expect(200);
      }

      const result = body<Evaluation>(await evaluate(rfqId).expect(201));
      expect(
        result.ranking.find((r) => r.quoteId === cheap.id)!.financialScore,
      ).toBe(100);
      expect(
        result.ranking.find((r) => r.quoteId === dear.id)!.financialScore,
      ).toBe(50);
      // On price alone, the cheaper bid wins even though both are equal on
      // technical merit.
      expect(result.recommended.quoteId).toBe(cheap.id);
    });

    it('lets a better bid beat a cheaper one under a 70/30 split', async () => {
      /*
       * The case the whole weighting exists for. Beta is half the price but
       * markedly worse technically; at 70/30 the better bid should still win,
       * and the numbers say why.
       *
       * Alpha: technical 100, financial 50  → 70 + 15 = 85
       * Beta:  technical 40,  financial 100 → 28 + 30 = 58
       */
      const rfqId = await newRfq();
      const criteria = await standardCriteria(rfqId, 70);
      const good = await quote(rfqId, vendorA, 2_000_000);
      const cheap = await quote(rfqId, vendorB, 1_000_000);

      await mark(
        good.id,
        criteria.map((c) => ({ criterionId: c.id, score: 10 })),
      ).expect(200);
      await mark(
        cheap.id,
        criteria.map((c) => ({ criterionId: c.id, score: 4 })),
      ).expect(200);

      const result = body<Evaluation>(await evaluate(rfqId).expect(201));
      expect(result.recommended.quoteId).toBe(good.id);
      expect(result.ranking[0].combinedScore).toBe(85);
      expect(result.ranking[1].combinedScore).toBe(58);
    });

    it('shows the working, criterion by criterion', async () => {
      // So a losing vendor can be told what they lost on, which is the part a
      // typed-in total could never supply.
      const rfqId = await newRfq();
      const criteria = await standardCriteria(rfqId, 100);
      const q = await quote(rfqId, vendorA, 1_000_000);
      await mark(q.id, [
        { criterionId: criteria[0].id, score: 10 },
        { criterionId: criteria[1].id, score: 5 },
      ]).expect(200);

      const result = body<Evaluation>(await evaluate(rfqId).expect(201));
      const breakdown = result.ranking[0].breakdown;
      expect(breakdown).toHaveLength(2);
      expect(breakdown[0]).toMatchObject({
        label: 'Technical compliance',
        mark: 10,
        contribution: 60,
      });
      expect(breakdown[1]).toMatchObject({ mark: 5, contribution: 20 });
    });
  });

  describe('what it refuses to guess', () => {
    it('will not evaluate an RFQ with no criteria', async () => {
      const rfqId = await newRfq();
      await quote(rfqId, vendorA, 1_000_000);
      const res = await evaluate(rfqId).expect(400);
      expect(JSON.stringify(body(res))).toContain('no evaluation criteria');
    });

    it('will not evaluate while any quote is unmarked', async () => {
      /*
       * An unscored bid would score zero on that line and lose for a reason
       * nobody decided — or, if unmarked counted as full marks, win for one.
       * The message names the vendor and the criterion so the gap can be
       * closed rather than hunted.
       */
      const rfqId = await newRfq();
      const criteria = await standardCriteria(rfqId);
      const a = await quote(rfqId, vendorA, 1_000_000);
      await quote(rfqId, vendorB, 900_000);
      await mark(
        a.id,
        criteria.map((c) => ({ criterionId: c.id, score: 7 })),
      ).expect(200);

      const res = await evaluate(rfqId).expect(400);
      const message = JSON.stringify(body(res));
      expect(message).toContain('Beta Diagnostics');
      expect(message).toContain('Technical compliance');
    });

    it('will not break a tie by itself', async () => {
      // Sort order is not a procurement decision.
      const rfqId = await newRfq();
      const criteria = await standardCriteria(rfqId);
      const a = await quote(rfqId, vendorA, 1_000_000);
      const b = await quote(rfqId, vendorB, 1_000_000);
      for (const q of [a, b]) {
        await mark(
          q.id,
          criteria.map((c) => ({ criterionId: c.id, score: 8 })),
        ).expect(200);
      }
      const res = await evaluate(rfqId).expect(409);
      expect(JSON.stringify(body(res))).toContain('tied');
    });

    it('leaves the RFQ open when it refuses', async () => {
      // A refusal that half-completes the award is worse than none.
      const rfqId = await newRfq();
      const criteria = await standardCriteria(rfqId);
      const a = await quote(rfqId, vendorA, 1_000_000);
      const b = await quote(rfqId, vendorB, 1_000_000);
      for (const q of [a, b]) {
        await mark(
          q.id,
          criteria.map((c) => ({ criterionId: c.id, score: 8 })),
        ).expect(200);
      }
      await evaluate(rfqId).expect(409);

      const rfq = await prisma.rfq.findUniqueOrThrow({ where: { id: rfqId } });
      expect(rfq.status).toBe('OPEN');
      const recommended = await prisma.rfqQuote.count({
        where: { rfqId, status: 'RECOMMENDED' },
      });
      expect(recommended).toBe(0);
    });
  });

  describe('the award', () => {
    it('recommends exactly one quote', async () => {
      const rfqId = await newRfq();
      const criteria = await standardCriteria(rfqId, 100);
      const a = await quote(rfqId, vendorA, 1_000_000);
      const b = await quote(rfqId, vendorB, 1_100_000);
      const c = await quote(rfqId, vendorC, 1_200_000);
      const marks = [10, 7, 4];
      for (const [i, q] of [a, b, c].entries()) {
        await mark(
          q.id,
          criteria.map((cr) => ({ criterionId: cr.id, score: marks[i] })),
        ).expect(200);
      }
      await evaluate(rfqId).expect(201);

      const recommended = await prisma.rfqQuote.findMany({
        where: { rfqId, status: 'RECOMMENDED' },
      });
      expect(recommended).toHaveLength(1);
      expect(recommended[0].id).toBe(a.id);
      const rfq = await prisma.rfq.findUniqueOrThrow({ where: { id: rfqId } });
      expect(rfq.status).toBe('COMPLETE');
    });

    it('records the ranking, because an award decides who gets public money', async () => {
      const rfqId = await newRfq();
      const criteria = await standardCriteria(rfqId, 100);
      const a = await quote(rfqId, vendorA, 1_000_000);
      const b = await quote(rfqId, vendorB, 1_000_000);
      await mark(
        a.id,
        criteria.map((c) => ({ criterionId: c.id, score: 9 })),
      ).expect(200);
      await mark(
        b.id,
        criteria.map((c) => ({ criterionId: c.id, score: 6 })),
      ).expect(200);
      await evaluate(rfqId).expect(201);

      const audit = await prisma.auditLog.findFirst({
        where: { action: 'RFQ_EVALUATED' },
        orderBy: { createdAt: 'desc' },
      });
      expect(audit?.userId).toBe(userId.procurement);
      expect(audit?.newData).toContain('Alpha Medical Supplies');
      // The runners-up too: an award is only reviewable against what it beat.
      expect(audit?.newData).toContain('Beta Diagnostics');
    });

    it('stores the computed scores on the quotes', async () => {
      const rfqId = await newRfq();
      const criteria = await standardCriteria(rfqId, 70);
      const a = await quote(rfqId, vendorA, 1_000_000);
      await mark(
        a.id,
        criteria.map((c) => ({ criterionId: c.id, score: 10 })),
      ).expect(200);
      await evaluate(rfqId).expect(201);

      const stored = await prisma.rfqQuote.findUniqueOrThrow({
        where: { id: a.id },
      });
      expect(stored.score).toBe(100);
      expect(stored.financialScore).toBe(100);
      expect(stored.combinedScore).toBe(100);
      expect(stored.evaluatedAt).not.toBeNull();
    });
  });

  describe('who may evaluate', () => {
    it('refuses a role outside procurement', async () => {
      const rfqId = await newRfq();
      await evaluate(rfqId, 'volunteer').expect(403);
      // Finance reads procurement; it does not award contracts.
      await evaluate(rfqId, 'finance').expect(403);
    });
  });
});
