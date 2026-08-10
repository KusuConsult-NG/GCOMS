/**
 * Approvals: who may resolve one, and what resolving one actually does.
 *
 * The role check here is the interesting part, and it is the reason this is an
 * end-to-end spec rather than a unit one. `@Roles(...APPROVER_ROLES)` names
 * EXECUTIVE and BOARD, but RolesGuard grants EXECUTIVE and SYSTEM_ADMIN every
 * route unconditionally — so the decorator cannot exclude a system admin, and
 * the separation between administering the system and authorising spend is only
 * expressible below the guard, inside the service. A unit test on the service
 * would assert the check exists; only a request through the real guard stack
 * shows that the guard does not quietly undo it.
 *
 * The second half is the cross-resource sync: an approval is not a row of its
 * own, it is the thing that lets a finance transaction count.
 */
import { execSync } from 'child_process';
import { useThrowawaySchema, dropSchema } from './throwaway-schema';
import { join } from 'path';

const schema = useThrowawaySchema('approvals');
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

function body<T>(response: { body: unknown }): T {
  return response.body as T;
}

type Approval = { id: string; status: string; approvedById: string | null };
type Summary = { approvedExpense: string | number };

describe('approvals (e2e)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let prisma: PrismaClient;

  const token: Record<string, string> = {};
  const userId: Record<string, string> = {};

  const ACCOUNTS = [
    { key: 'executive', email: 'executive@approvals.test', role: 'EXECUTIVE' },
    { key: 'board', email: 'board@approvals.test', role: 'BOARD' },
    { key: 'sysadmin', email: 'sysadmin@approvals.test', role: 'SYSTEM_ADMIN' },
    { key: 'finance', email: 'finance@approvals.test', role: 'FINANCE' },
  ] as const;

  beforeAll(async () => {
    execSync('npx prisma migrate deploy', {
      cwd: join(__dirname, '..'),
      env: { ...process.env },
      stdio: 'ignore',
    });

    prisma = new PrismaClient();
    const hash = await bcrypt.hash(PASSWORD, 4);
    for (const account of ACCOUNTS) {
      const user = await prisma.user.create({
        data: {
          email: account.email,
          password: hash,
          firstName: account.key,
          lastName: 'Test',
          role: account.role,
        },
      });
      userId[account.key] = user.id;
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

    for (const account of ACCOUNTS) {
      const res = await http
        .post('/auth/login')
        .send({ email: account.email, password: PASSWORD })
        .expect(201);
      token[account.key] = body<{ access_token: string }>(res).access_token;
    }
  }, 180_000);

  afterAll(async () => {
    await app?.close();
    await dropSchema(prisma, schema);
    await prisma.$disconnect();
  });

  /** A finance transaction and the approval request that gates it. */
  async function raiseSpend(amount: number) {
    const transaction = await prisma.financeTransaction.create({
      data: {
        amount,
        type: 'EXPENSE',
        category: 'Field logistics',
        description: 'Vehicle hire',
        requestedById: userId.finance,
      },
    });
    const approval = await prisma.approvalRequest.create({
      data: {
        title: `Finance EXPENSE: ${amount}`,
        description: 'Raised by the finance officer',
        resourceType: 'FINANCE',
        resourceId: transaction.id,
        requestedById: userId.finance,
      },
    });
    return { transaction, approval };
  }

  describe('who may resolve one', () => {
    it('lets an executive approve', async () => {
      const { approval } = await raiseSpend(100_000);
      const res = await http
        .patch(`/approvals/${approval.id}`)
        .set('Authorization', `Bearer ${token.executive}`)
        .send({ status: 'APPROVED' })
        .expect(200);
      expect(body<Approval>(res).status).toBe('APPROVED');
      expect(body<Approval>(res).approvedById).toBe(userId.executive);
    });

    it('lets a board member approve', async () => {
      const { approval } = await raiseSpend(110_000);
      await http
        .patch(`/approvals/${approval.id}`)
        .set('Authorization', `Bearer ${token.board}`)
        .send({ status: 'APPROVED' })
        .expect(200);
    });

    /**
     * The one that matters. A system admin passes RolesGuard on every route in
     * the application, so nothing in the decorator stops them here — and
     * administering the system is not authority to commit the organisation's
     * money. If this ever returns 200, the separation has been lost silently.
     */
    it('refuses a system admin, who passes the guard on every route', async () => {
      const { approval, transaction } = await raiseSpend(120_000);
      await http
        .patch(`/approvals/${approval.id}`)
        .set('Authorization', `Bearer ${token.sysadmin}`)
        .send({ status: 'APPROVED' })
        .expect(403);

      // And nothing moved underneath it.
      const after = await prisma.financeTransaction.findUnique({
        where: { id: transaction.id },
      });
      expect(after?.status).toBe('PENDING');
    });

    it('refuses the finance officer who raised it', async () => {
      const { approval } = await raiseSpend(130_000);
      await http
        .patch(`/approvals/${approval.id}`)
        .set('Authorization', `Bearer ${token.finance}`)
        .send({ status: 'APPROVED' })
        .expect(403);
    });

    it('refuses an unauthenticated request', async () => {
      const { approval } = await raiseSpend(140_000);
      await http
        .patch(`/approvals/${approval.id}`)
        .send({ status: 'APPROVED' })
        .expect(401);
    });
  });

  describe('what resolving one does', () => {
    it('approving lets the spend count in the ledger', async () => {
      const before = body<Summary>(
        await http
          .get('/finance/summary')
          .set('Authorization', `Bearer ${token.executive}`)
          .expect(200),
      );
      const { approval, transaction } = await raiseSpend(250_000);

      // Still not counted while the decision is outstanding.
      const during = body<Summary>(
        await http
          .get('/finance/summary')
          .set('Authorization', `Bearer ${token.executive}`)
          .expect(200),
      );
      expect(Number(during.approvedExpense)).toBe(
        Number(before.approvedExpense),
      );

      await http
        .patch(`/approvals/${approval.id}`)
        .set('Authorization', `Bearer ${token.executive}`)
        .send({ status: 'APPROVED' })
        .expect(200);

      const updated = await prisma.financeTransaction.findUnique({
        where: { id: transaction.id },
      });
      expect(updated?.status).toBe('APPROVED');

      const after = body<Summary>(
        await http
          .get('/finance/summary')
          .set('Authorization', `Bearer ${token.executive}`)
          .expect(200),
      );
      expect(Number(after.approvedExpense)).toBe(
        Number(before.approvedExpense) + 250_000,
      );
    });

    it('rejecting marks the underlying transaction rejected, and it never counts', async () => {
      const before = body<Summary>(
        await http
          .get('/finance/summary')
          .set('Authorization', `Bearer ${token.executive}`)
          .expect(200),
      );
      const { approval, transaction } = await raiseSpend(999_000);

      await http
        .patch(`/approvals/${approval.id}`)
        .set('Authorization', `Bearer ${token.executive}`)
        .send({ status: 'REJECTED' })
        .expect(200);

      const updated = await prisma.financeTransaction.findUnique({
        where: { id: transaction.id },
      });
      expect(updated?.status).toBe('REJECTED');

      const after = body<Summary>(
        await http
          .get('/finance/summary')
          .set('Authorization', `Bearer ${token.executive}`)
          .expect(200),
      );
      expect(Number(after.approvedExpense)).toBe(
        Number(before.approvedExpense),
      );
    });
  });

  describe('every accepted resource type is one the resolver acts on', () => {
    /*
     * APPROVAL_RESOURCE_TYPES constrains what `POST /approvals` will accept,
     * and it exists for one reason, stated in the DTO: "an unrecognised value
     * produces a request that can be approved but can never execute anything."
     *
     * It listed seven types of which the resolver handled two. HR, GRANT,
     * PROJECT, FACILITY and USER were accepted and executed nothing; ADMIN and
     * HR_LEAVE — the two the resolver does handle, and the two that
     * admin.service and hr.service actually write — were rejected. The
     * constraint that exists to prevent exactly this was producing exactly it.
     */
    it('accepts each type and moves the underlying record', async () => {
      const finance = await raiseSpend(500_000);
      await http
        .patch(`/approvals/${finance.approval.id}`)
        .set('Authorization', `Bearer ${token.executive}`)
        .send({ status: 'APPROVED' })
        .expect(200);
      expect(
        (
          await prisma.financeTransaction.findUnique({
            where: { id: finance.transaction.id },
          })
        )?.status,
      ).toBe('APPROVED');

      const order = await prisma.procurementOrder.create({
        data: {
          itemName: 'Acetic acid',
          quantity: 20,
          estimatedCost: 90_000,
          vendor: 'JUTH Reagents',
          requestedById: userId.finance,
        },
      });
      const procurement = await prisma.approvalRequest.create({
        data: {
          title: 'Procurement: 20x Acetic acid',
          resourceType: 'PROCUREMENT',
          resourceId: order.id,
          requestedById: userId.finance,
        },
      });
      await http
        .patch(`/approvals/${procurement.id}`)
        .set('Authorization', `Bearer ${token.executive}`)
        .send({ status: 'APPROVED' })
        .expect(200);
      expect(
        (await prisma.procurementOrder.findUnique({ where: { id: order.id } }))
          ?.status,
      ).toBe('APPROVED');
    });

    it('refuses a type the resolver has no branch for', async () => {
      // These were accepted before. An approval on one is a decision that
      // records itself and changes nothing.
      for (const resourceType of [
        'GRANT',
        'PROJECT',
        'USER',
        'FACILITY',
        'HR',
      ]) {
        await http
          .post('/approvals')
          .set('Authorization', `Bearer ${token.finance}`)
          .send({ title: 'Test', resourceType, resourceId: 'x' })
          .expect(400);
      }
    });

    it('accepts the two written by other services', async () => {
      for (const resourceType of ['ADMIN', 'HR_LEAVE']) {
        await http
          .post('/approvals')
          .set('Authorization', `Bearer ${token.finance}`)
          .send({ title: `Test ${resourceType}`, resourceType })
          .expect(201);
      }
    });
  });

  describe('the decision itself', () => {
    it('refuses a status outside the permitted set with a 400, not a 500', async () => {
      const { approval } = await raiseSpend(160_000);
      // This endpoint used to take an unvalidated `{ status: string }` and
      // throw a plain Error, which is not an HttpException — so bad client
      // input was reported as a server failure.
      await http
        .patch(`/approvals/${approval.id}`)
        .set('Authorization', `Bearer ${token.executive}`)
        .send({ status: 'BANANA' })
        .expect(400);
    });

    it('refuses a move back to PENDING', async () => {
      const { approval } = await raiseSpend(170_000);
      await http
        .patch(`/approvals/${approval.id}`)
        .set('Authorization', `Bearer ${token.executive}`)
        .send({ status: 'PENDING' })
        .expect(400);
    });

    it('404s for a request that does not exist', async () => {
      await http
        .patch('/approvals/3f2504e0-4f89-11d3-9a0c-0305e82c3301')
        .set('Authorization', `Bearer ${token.executive}`)
        .send({ status: 'APPROVED' })
        .expect(404);
    });

    it('lists only what is still pending', async () => {
      const { approval } = await raiseSpend(180_000);
      const listed = body<Approval[]>(
        await http
          .get('/approvals/pending')
          .set('Authorization', `Bearer ${token.executive}`)
          .expect(200),
      );
      expect(listed.map((a) => a.id)).toContain(approval.id);
      expect(listed.every((a) => a.status === 'PENDING')).toBe(true);

      await http
        .patch(`/approvals/${approval.id}`)
        .set('Authorization', `Bearer ${token.executive}`)
        .send({ status: 'APPROVED' })
        .expect(200);

      const afterwards = body<Approval[]>(
        await http
          .get('/approvals/pending')
          .set('Authorization', `Bearer ${token.executive}`)
          .expect(200),
      );
      expect(afterwards.map((a) => a.id)).not.toContain(approval.id);
    });
  });
});
