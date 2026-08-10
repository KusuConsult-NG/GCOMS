/**
 * Inventory: the stock status is derived, and who is allowed to move it.
 *
 * `status` is computed from the quantity and the item's own reorder point, and
 * is never taken from the client. That matters because the field drives the
 * low-stock alerts on the executive dashboard: an item that can declare itself
 * IN_STOCK while holding nothing is a reorder that never happens.
 *
 * The role assertions are here because the write routes carried a hardcoded
 * list that omitted INVENTORY_MANAGER — the role named for this module, which
 * the /inventory page admits and whose workspace posts to these endpoints. A
 * spec is the only thing that keeps a decorator and a page gate agreeing about
 * who may do what.
 */
import { execSync } from 'child_process';
import { useThrowawaySchema, dropSchema } from './throwaway-schema';
import { join } from 'path';

const schema = useThrowawaySchema('inventory');
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

type Item = {
  id: string;
  itemName: string;
  quantity: number;
  minThreshold: number;
  status: string;
};

describe('inventory (e2e)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let prisma: PrismaClient;

  const token: Record<string, string> = {};

  const ACCOUNTS = [
    { key: 'manager', email: 'manager@inv.test', role: 'INVENTORY_MANAGER' },
    { key: 'procurement', email: 'proc@inv.test', role: 'PROCUREMENT' },
    { key: 'clinician', email: 'clinician@inv.test', role: 'CLINICIAN' },
    { key: 'volunteer', email: 'volunteer@inv.test', role: 'VOLUNTEER' },
    { key: 'hr', email: 'hr@inv.test', role: 'HR' },
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
      await prisma.user.create({
        data: {
          email: account.email,
          password: hash,
          firstName: account.key,
          lastName: 'Test',
          role: account.role,
        },
      });
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

  const create = (as: string, data: Record<string, unknown>) =>
    http
      .post('/inventory')
      .set('Authorization', `Bearer ${token[as]}`)
      .send({
        itemName: 'Acetic acid 5%',
        category: 'Reagents',
        unit: 'bottle',
        location: 'Jos store',
        ...data,
      });

  describe('the stock status is computed, not accepted', () => {
    it('marks plenty as in stock', async () => {
      const res = await create('manager', {
        quantity: 100,
        minThreshold: 10,
      }).expect(201);
      expect(body<Item>(res).status).toBe('IN_STOCK');
    });

    it('marks a quantity at the reorder point as low', async () => {
      // At the threshold, not merely below it — a reorder point you have
      // reached is one you have reached.
      const res = await create('manager', {
        quantity: 10,
        minThreshold: 10,
      }).expect(201);
      expect(body<Item>(res).status).toBe('LOW_STOCK');
    });

    it('marks nothing left as out of stock', async () => {
      const res = await create('manager', {
        quantity: 0,
        minThreshold: 10,
      }).expect(201);
      expect(body<Item>(res).status).toBe('OUT_OF_STOCK');
    });

    it('ignores a status the client asserts', async () => {
      const res = await create('manager', {
        quantity: 0,
        minThreshold: 5,
        // Not a field the DTO accepts. An item that can declare itself stocked
        // while holding nothing is a reorder that never happens.
        status: 'IN_STOCK',
      }).expect(201);
      expect(body<Item>(res).status).toBe('OUT_OF_STOCK');
    });

    it('defaults the reorder point to 10 when none is given', async () => {
      const res = await create('manager', { quantity: 10 }).expect(201);
      expect(body<Item>(res).minThreshold).toBe(10);
      expect(body<Item>(res).status).toBe('LOW_STOCK');
    });

    it('recomputes the status when stock is drawn down', async () => {
      const created = body<Item>(
        await create('manager', { quantity: 50, minThreshold: 20 }).expect(201),
      );
      expect(created.status).toBe('IN_STOCK');

      const updated = await http
        .patch(`/inventory/${created.id}`)
        .set('Authorization', `Bearer ${token.clinician}`)
        .send({ quantity: 15 })
        .expect(200);
      expect(body<Item>(updated).status).toBe('LOW_STOCK');
    });

    it('recomputes the status when only the reorder point moves', async () => {
      const created = body<Item>(
        await create('manager', { quantity: 30, minThreshold: 10 }).expect(201),
      );
      expect(created.status).toBe('IN_STOCK');

      // The quantity has not changed; the definition of "low" has.
      const updated = await http
        .patch(`/inventory/${created.id}`)
        .set('Authorization', `Bearer ${token.manager}`)
        .send({ minThreshold: 40 })
        .expect(200);
      expect(body<Item>(updated).quantity).toBe(30);
      expect(body<Item>(updated).status).toBe('LOW_STOCK');
    });

    it('404s for an item that does not exist', async () => {
      await http
        .patch('/inventory/3f2504e0-4f89-11d3-9a0c-0305e82c3301')
        .set('Authorization', `Bearer ${token.manager}`)
        .send({ quantity: 1 })
        .expect(404);
    });

    it('400s on a malformed id rather than failing inside Prisma', async () => {
      await http
        .patch('/inventory/not-a-uuid')
        .set('Authorization', `Bearer ${token.manager}`)
        .send({ quantity: 1 })
        .expect(400);
    });
  });

  describe('who may write', () => {
    it('admits the inventory manager, whose own workspace posts here', async () => {
      await create('manager', { quantity: 1 }).expect(201);
    });

    it('admits procurement, which books received goods in as stock', async () => {
      await create('procurement', { quantity: 1 }).expect(201);
    });

    it('refuses a volunteer', async () => {
      await create('volunteer', { quantity: 1 }).expect(403);
    });

    it('refuses HR, which can neither read nor write here', async () => {
      await create('hr', { quantity: 1 }).expect(403);
      await http
        .get('/inventory')
        .set('Authorization', `Bearer ${token.hr}`)
        .expect(403);
    });

    it('lets a clinician draw stock down but not create an item', async () => {
      const created = body<Item>(
        await create('manager', { quantity: 5 }).expect(201),
      );
      await http
        .patch(`/inventory/${created.id}`)
        .set('Authorization', `Bearer ${token.clinician}`)
        .send({ quantity: 4 })
        .expect(200);
      await create('clinician', { quantity: 1 }).expect(403);
    });
  });
});
