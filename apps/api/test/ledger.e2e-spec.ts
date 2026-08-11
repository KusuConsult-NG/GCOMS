/**
 * The general ledger, and the rule that makes it one.
 *
 * The finance screen called itself a "Real-Time Double-Entry General Ledger"
 * over FinanceTransaction: one row, one amount, one type. There were no debit
 * and credit legs, nothing to post them against, and nothing that could fail to
 * balance — the name promised a control that did not exist, which tells an
 * auditor to expect something and find nothing.
 *
 * So the case that matters here is the refusal. Everything else in this file is
 * scaffolding around it: an entry whose sides differ does not post, and does not
 * post *partially*, because a ledger with one unbalanced entry in it has to be
 * reconciled by hand and the person doing that will not be the person who
 * wrote it.
 */
import type { Server } from 'node:http';
import { execSync } from 'child_process';
import { useThrowawaySchema, dropSchema } from './throwaway-schema';
import { join } from 'path';

const schema = useThrowawaySchema('ledger');
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
import { NORMAL_BALANCE_BY_TYPE } from '../src/auth/roles.constants';

const PASSWORD = 'e2e-test-password';

function body<T>(response: { body: unknown }): T {
  return response.body as T;
}

type Entry = {
  id: string;
  reference: string;
  description: string;
  lines: Array<{ debit: string; credit: string; accountId: string }>;
};

type TrialBalance = {
  rows: Array<{
    code: string;
    debit: number;
    credit: number;
    balance: number;
    normalBalance: string;
  }>;
  totalDebits: number;
  totalCredits: number;
  difference: number;
  inBalance: boolean;
};

describe('general ledger (e2e)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let prisma: PrismaClient;

  const token: Record<string, string> = {};
  const userId: Record<string, string> = {};
  const account: Record<string, string> = {};

  const ACCOUNTS = [
    { code: 'T1001', name: 'Cash', type: 'ASSET' as const },
    { code: 'T2001', name: 'Payables', type: 'LIABILITY' as const },
    { code: 'T4001', name: 'Grant income', type: 'REVENUE' as const },
    { code: 'T5001', name: 'Field logistics', type: 'EXPENSE' as const },
  ];

  beforeAll(async () => {
    execSync('npx prisma migrate deploy', {
      cwd: join(__dirname, '..'),
      env: { ...process.env },
      stdio: 'ignore',
    });

    prisma = new PrismaClient();
    const hash = await bcrypt.hash(PASSWORD, 4);
    for (const a of [
      { key: 'finance', email: 'finance@ledger.test', role: 'FINANCE' },
      { key: 'board', email: 'board@ledger.test', role: 'BOARD' },
      { key: 'volunteer', email: 'volunteer@ledger.test', role: 'VOLUNTEER' },
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

    for (const a of ACCOUNTS) {
      const created = await prisma.ledgerAccount.create({
        data: {
          code: a.code,
          name: a.name,
          type: a.type,
          normalBalance: NORMAL_BALANCE_BY_TYPE[a.type],
        },
      });
      account[a.code] = created.id;
    }

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
      ['finance', 'finance@ledger.test'],
      ['board', 'board@ledger.test'],
      ['volunteer', 'volunteer@ledger.test'],
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

  const as = (key: string) => `Bearer ${token[key]}`;

  const post = (payload: Record<string, unknown>, actor = 'finance') =>
    http
      .post('/finance/journal')
      .set('Authorization', as(actor))
      .send({
        entryDate: '2026-03-01T00:00:00.000Z',
        description: 'Test voucher',
        ...payload,
      });

  const line = (code: string, debit?: number, credit?: number) => ({
    accountId: account[code],
    ...(debit !== undefined ? { debit } : {}),
    ...(credit !== undefined ? { credit } : {}),
  });

  describe('balance validation', () => {
    it('refuses an entry whose sides differ', async () => {
      const res = await post({
        lines: [line('T5001', 100_000), line('T1001', undefined, 90_000)],
      }).expect(400);
      const message = JSON.stringify(body(res));
      // The difference is named, because "invalid entry" sends the person
      // posting it back to compare twelve lines by hand.
      expect(message).toContain('does not balance');
      expect(message).toContain('10000');
    });

    it('writes nothing when it refuses', async () => {
      /*
       * The point. A refusal that leaves half an entry behind is worse than no
       * validation at all — the ledger is then out by an amount nobody has a
       * record of choosing.
       */
      const before = await prisma.journalEntry.count();
      const linesBefore = await prisma.journalLine.count();
      await post({
        lines: [line('T5001', 100_000), line('T1001', undefined, 90_000)],
      }).expect(400);
      expect(await prisma.journalEntry.count()).toBe(before);
      expect(await prisma.journalLine.count()).toBe(linesBefore);
    });

    it('accepts an entry that balances', async () => {
      const res = await post({
        description: 'Fuel for the Barkin Ladi drive',
        lines: [line('T5001', 250_000), line('T1001', undefined, 250_000)],
      }).expect(201);
      const entry = body<Entry>(res);
      expect(entry.reference).toMatch(/^JV-2026-\d{5}$/);
      expect(entry.lines).toHaveLength(2);
    });

    it('balances across more than two lines', async () => {
      // A real voucher splits: one payment against two cost centres.
      await post({
        lines: [
          line('T5001', 60_000),
          line('T2001', 40_000),
          line('T1001', undefined, 100_000),
        ],
      }).expect(201);
    });

    it('refuses a line carrying both a debit and a credit', async () => {
      // Otherwise the entry's total is ambiguous: is 100/40 a debit of 60, or
      // two postings that happen to share a row?
      const res = await post({
        lines: [
          { accountId: account.T5001, debit: 100, credit: 40 },
          line('T1001', undefined, 60),
        ],
      }).expect(400);
      expect(JSON.stringify(body(res))).toContain('one or the other');
    });

    it('refuses a line carrying neither', async () => {
      const res = await post({
        lines: [line('T5001', 0), line('T1001', undefined, 0)],
      }).expect(400);
      expect(JSON.stringify(body(res))).toContain('no amount');
    });

    it('refuses a single-sided entry', async () => {
      await post({ lines: [line('T5001', 100)] }).expect(400);
    });

    it('balances in decimal, not in floating point', async () => {
      /*
       * 0.1 + 0.2 is 0.30000000000000004 in binary floating point, so an entry
       * of three tenths against 0.1 and 0.2 would be rejected by a naive
       * implementation — and, worse, entries that genuinely differ by a
       * fraction of a kobo would be accepted. Decimal all the way through is
       * what makes "balances" mean balances.
       */
      await post({
        lines: [
          line('T5001', 0.1),
          line('T2001', 0.2),
          line('T1001', undefined, 0.3),
        ],
      }).expect(201);
    });

    it('refuses a posting to an account that does not exist', async () => {
      await post({
        lines: [
          { accountId: '3f2504e0-4f89-11d3-9a0c-0305e82c3301', debit: 100 },
          line('T1001', undefined, 100),
        ],
      }).expect(400);
    });
  });

  describe('the trial balance', () => {
    it('has equal totals, and says so', async () => {
      const tb = body<TrialBalance>(
        await http
          .get('/finance/journal/trial-balance')
          .set('Authorization', as('finance'))
          .expect(200),
      );
      expect(tb.totalDebits).toBe(tb.totalCredits);
      expect(tb.difference).toBe(0);
      // The claim the system is willing to have checked, rather than one it
      // merely makes on a heading.
      expect(tb.inBalance).toBe(true);
    });

    it('presents each account on the side it grows on', async () => {
      const tb = body<TrialBalance>(
        await http
          .get('/finance/journal/trial-balance')
          .set('Authorization', as('finance'))
          .expect(200),
      );
      const expense = tb.rows.find((r) => r.code === 'T5001');
      const cash = tb.rows.find((r) => r.code === 'T1001');
      expect(expense?.normalBalance).toBe('DEBIT');
      // Expenses have only been debited here, so the balance is positive on
      // their own side; cash has only been credited, so it is negative on its.
      expect(expense!.balance).toBeGreaterThan(0);
      expect(cash!.balance).toBeLessThan(0);
    });
  });

  describe('who may do what', () => {
    it('lets the board read the books without posting to them', async () => {
      // A board member should be able to open the ledger; posting a voucher is
      // an accounting act, not an oversight one.
      await http
        .get('/finance/journal')
        .set('Authorization', as('board'))
        .expect(200);
      await post(
        { lines: [line('T5001', 10), line('T1001', undefined, 10)] },
        'board',
      ).expect(403);
    });

    it('refuses a role with no finance rights at all', async () => {
      await http
        .get('/finance/journal/trial-balance')
        .set('Authorization', as('volunteer'))
        .expect(403);
    });
  });

  describe('the record of a posting', () => {
    it('files the voucher against whoever posted it, and audits it', async () => {
      const created = body<Entry>(
        await post({
          description: 'Audited voucher',
          lines: [line('T5001', 500), line('T1001', undefined, 500)],
        }).expect(201),
      );

      const stored = await prisma.journalEntry.findUniqueOrThrow({
        where: { id: created.id },
      });
      // Taken from the token, never the body.
      expect(stored.postedById).toBe(userId.finance);

      const audit = await prisma.auditLog.findFirst({
        where: { action: 'JOURNAL_ENTRY_POSTED' },
        orderBy: { createdAt: 'desc' },
      });
      expect(audit?.newData).toContain(created.reference);
      expect(audit?.userId).toBe(userId.finance);
    });

    it('assigns the reference itself', async () => {
      // A voucher number a caller can choose is a voucher number two callers
      // can choose. The client does not get to send one.
      const first = body<Entry>(
        await post({
          lines: [line('T5001', 1), line('T1001', undefined, 1)],
        }).expect(201),
      );
      const second = body<Entry>(
        await post({
          lines: [line('T5001', 1), line('T1001', undefined, 1)],
        }).expect(201),
      );
      expect(first.reference).not.toBe(second.reference);
    });
  });
});
