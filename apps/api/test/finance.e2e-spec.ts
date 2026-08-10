/**
 * The two pieces of finance logic that are load-bearing rather than CRUD.
 *
 * Both are about a figure the client must not be able to assert:
 *
 * - The ledger summary counts APPROVED rows only. "Cannot be executed before
 *   approval" is otherwise just a label on a row that every report adds up
 *   regardless, which is what it used to be.
 * - A bank reconciliation computes its own discrepancy and status. A
 *   reconciliation that can claim it balances while the figures disagree is
 *   worse than no reconciliation at all.
 *
 * Both need a real database: the summary is three Prisma `aggregate` calls over
 * a Decimal column, and a mocked client would only return whatever the mock was
 * told to return. Money is exactly where "the mock said so" is not evidence.
 */
import { execSync } from 'child_process';
import { useThrowawaySchema, dropSchema } from './throwaway-schema';
import { join } from 'path';

const schema = useThrowawaySchema('finance');
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
import type { Server } from 'node:http';

const PASSWORD = 'e2e-test-password';

/**
 * supertest types `res.body` as `any`, which turns every assertion in this file
 * into an unchecked one and trips no-unsafe-member-access. These are the shapes
 * the endpoints actually return; `body()` is the single place the cast happens.
 */
type Summary = {
  approvedIncome: string | number;
  approvedExpense: string | number;
  netPosition: string | number;
  awaitingApproval: { count: number; amount: string | number };
};

type Reconciliation = {
  id: string;
  bankBalance: string | number;
  ledgerBalance: string | number;
  discrepancy: string | number;
  status: string;
  notes: string | null;
};

type Transaction = { id: string };

function body<T>(response: { body: unknown }): T {
  return response.body as T;
}

describe('finance (e2e)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let prisma: PrismaClient;
  let financeToken: string;
  let boardToken: string;
  let volunteerToken: string;

  beforeAll(async () => {
    execSync('npx prisma migrate deploy', {
      cwd: join(__dirname, '..'),
      env: { ...process.env },
      stdio: 'ignore',
    });

    prisma = new PrismaClient();
    const hash = await bcrypt.hash(PASSWORD, 4);

    const finance = await prisma.user.create({
      data: {
        email: 'finance@finance.test',
        password: hash,
        firstName: 'Finance',
        lastName: 'Officer',
        role: 'FINANCE',
      },
    });
    await prisma.user.create({
      data: {
        email: 'board@finance.test',
        password: hash,
        firstName: 'Board',
        lastName: 'Member',
        role: 'BOARD',
      },
    });
    await prisma.user.create({
      data: {
        email: 'volunteer@finance.test',
        password: hash,
        firstName: 'Volunteer',
        lastName: 'Test',
        role: 'VOLUNTEER',
      },
    });

    /**
     * Approved: 5,000,000 in and 1,250,000 out, so a net of 3,750,000.
     * Pending: a further 9,000,000 of income and 400,000 of expense, which must
     * not move any of those three figures — if PENDING leaked into the totals,
     * approvedIncome would read 14,000,000 and the net would be positive by an
     * amount the organisation has not been granted.
     */
    await prisma.financeTransaction.createMany({
      data: [
        {
          amount: 5_000_000,
          type: 'INCOME',
          category: 'Grant inflow',
          description: 'Tranche 1',
          status: 'APPROVED',
          requestedById: finance.id,
        },
        {
          amount: 1_250_000,
          type: 'EXPENSE',
          category: 'Field logistics',
          description: 'Vehicle hire',
          status: 'APPROVED',
          requestedById: finance.id,
        },
        {
          amount: 9_000_000,
          type: 'INCOME',
          category: 'Grant inflow',
          description: 'Tranche 2, not yet approved',
          status: 'PENDING',
          requestedById: finance.id,
        },
        {
          amount: 400_000,
          type: 'EXPENSE',
          category: 'Consumables',
          description: 'Reagents, not yet approved',
          status: 'PENDING',
          requestedById: finance.id,
        },
        {
          amount: 2_000_000,
          type: 'EXPENSE',
          category: 'Rejected spend',
          description: 'Refused',
          status: 'REJECTED',
          requestedById: finance.id,
        },
      ],
    });

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

    const login = async (email: string) => {
      const res = await http
        .post('/auth/login')
        .send({ email, password: PASSWORD })
        .expect(201);
      return body<{ access_token: string }>(res).access_token;
    };
    financeToken = await login('finance@finance.test');
    boardToken = await login('board@finance.test');
    volunteerToken = await login('volunteer@finance.test');
  }, 180_000);

  afterAll(async () => {
    await app?.close();
    await dropSchema(prisma, schema);
    await prisma.$disconnect();
  });

  const summary = async (token: string): Promise<Summary> => {
    const res = await http
      .get('/finance/summary')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    return body<Summary>(res);
  };

  describe('the ledger summary', () => {
    it('counts approved transactions only', async () => {
      const body = await summary(financeToken);
      expect(Number(body.approvedIncome)).toBe(5_000_000);
      expect(Number(body.approvedExpense)).toBe(1_250_000);
      expect(Number(body.netPosition)).toBe(3_750_000);
    });

    it('reports what is awaiting approval separately, without adding it in', async () => {
      const body = await summary(financeToken);
      expect(body.awaitingApproval.count).toBe(2);
      expect(Number(body.awaitingApproval.amount)).toBe(9_400_000);
      // The point of the separation: the pending income is larger than every
      // approved figure, so a leak would be unmissable here and invisible on
      // the screen.
      expect(Number(body.approvedIncome)).toBeLessThan(
        Number(body.awaitingApproval.amount),
      );
    });

    it('ignores rejected transactions entirely', async () => {
      const body = await summary(financeToken);
      // The 2,000,000 REJECTED expense is in neither figure.
      expect(Number(body.approvedExpense)).toBe(1_250_000);
      expect(Number(body.awaitingApproval.amount)).toBe(9_400_000);
    });

    it('is readable by the board, and not by a volunteer', async () => {
      await expect(summary(boardToken)).resolves.toBeDefined();
      await http
        .get('/finance/summary')
        .set('Authorization', `Bearer ${volunteerToken}`)
        .expect(403);
    });
  });

  describe('bank reconciliation', () => {
    it('computes the discrepancy and marks a mismatch, whatever the client sends', async () => {
      const res = await http
        .post('/finance/reconciliations')
        .set('Authorization', `Bearer ${financeToken}`)
        .send({
          statementDate: '2026-08-01T00:00:00.000Z',
          bankBalance: 1_000_000,
          ledgerBalance: 950_000,
          // Not a field the DTO accepts. Sent deliberately: whitelist:true must
          // strip it, and the status must be derived from the figures rather
          // than asserted by the caller.
          status: 'RECONCILED',
          discrepancy: 0,
          notes: '  spaced  ',
        })
        .expect(201);

      expect(Number(body<Reconciliation>(res).discrepancy)).toBe(50_000);
      expect(body<Reconciliation>(res).status).toBe('DISCREPANCY');
      expect(body<Reconciliation>(res).notes).toBe('spaced');
    });

    it('marks a reconciliation that actually balances', async () => {
      const res = await http
        .post('/finance/reconciliations')
        .set('Authorization', `Bearer ${financeToken}`)
        .send({
          statementDate: '2026-08-02T00:00:00.000Z',
          bankBalance: 750_000,
          ledgerBalance: 750_000,
        })
        .expect(201);

      expect(Number(body<Reconciliation>(res).discrepancy)).toBe(0);
      expect(body<Reconciliation>(res).status).toBe('RECONCILED');
      expect(body<Reconciliation>(res).notes).toBeNull();
    });

    it('recomputes the discrepancy when only one balance is corrected', async () => {
      const created = await http
        .post('/finance/reconciliations')
        .set('Authorization', `Bearer ${financeToken}`)
        .send({
          statementDate: '2026-08-03T00:00:00.000Z',
          bankBalance: 500_000,
          ledgerBalance: 400_000,
        })
        .expect(201);
      expect(body<Reconciliation>(created).status).toBe('DISCREPANCY');

      // Only the ledger is corrected; the bank balance is left alone. The
      // discrepancy has to be recomputed from the stored value rather than
      // treated as zero because it was not sent.
      const updated = await http
        .patch(`/finance/reconciliations/${body<Reconciliation>(created).id}`)
        .set('Authorization', `Bearer ${financeToken}`)
        .send({ ledgerBalance: 500_000 })
        .expect(200);

      expect(Number(body<Reconciliation>(updated).bankBalance)).toBe(500_000);
      expect(Number(body<Reconciliation>(updated).discrepancy)).toBe(0);
      expect(body<Reconciliation>(updated).status).toBe('RECONCILED');
    });

    it('refuses a status outside the permitted set', async () => {
      const created = await http
        .post('/finance/reconciliations')
        .set('Authorization', `Bearer ${financeToken}`)
        .send({
          statementDate: '2026-08-04T00:00:00.000Z',
          bankBalance: 10,
          ledgerBalance: 20,
        })
        .expect(201);

      await http
        .patch(`/finance/reconciliations/${body<Reconciliation>(created).id}`)
        .set('Authorization', `Bearer ${financeToken}`)
        .send({ status: 'DEFINITELY_FINE' })
        .expect(400);
    });

    it('404s for a reconciliation that does not exist', async () => {
      await http
        .patch('/finance/reconciliations/3f2504e0-4f89-11d3-9a0c-0305e82c3301')
        .set('Authorization', `Bearer ${financeToken}`)
        .send({ ledgerBalance: 1 })
        .expect(404);
    });

    it('refuses a write from a role with read access only', async () => {
      await http
        .post('/finance/reconciliations')
        .set('Authorization', `Bearer ${boardToken}`)
        .send({
          statementDate: '2026-08-05T00:00:00.000Z',
          bankBalance: 1,
          ledgerBalance: 1,
        })
        .expect(403);
    });
  });

  describe('raising a transaction', () => {
    it('creates the approval request alongside it, and leaves it out of the totals', async () => {
      const before = await summary(financeToken);

      const created = await http
        .post('/finance')
        .set('Authorization', `Bearer ${financeToken}`)
        .send({
          amount: 123_456,
          type: 'EXPENSE',
          category: 'Fuel',
          description: 'Barkin Ladi drive',
        })
        .expect(201);

      // A finance transaction is not executable on its own; the approval
      // request is what someone acts on, and it is created in the same
      // transaction so neither can exist without the other.
      const approval = await prisma.approvalRequest.findFirst({
        where: {
          resourceType: 'FINANCE',
          resourceId: body<Transaction>(created).id,
        },
      });
      expect(approval).not.toBeNull();
      expect(approval?.status).toBe('PENDING');

      const after = await summary(financeToken);
      expect(Number(after.approvedExpense)).toBe(
        Number(before.approvedExpense),
      );
      expect(after.awaitingApproval.count).toBe(
        before.awaitingApproval.count + 1,
      );
    });

    it('refuses a transaction from a role that cannot raise one', async () => {
      await http
        .post('/finance')
        .set('Authorization', `Bearer ${volunteerToken}`)
        .send({
          amount: 1,
          type: 'EXPENSE',
          category: 'Test',
          description: 'Test',
        })
        .expect(403);
    });
  });
});
