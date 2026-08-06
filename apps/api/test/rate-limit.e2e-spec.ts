/**
 * Login throttling, in its own spec file so it gets a fresh module registry and
 * a clean throttler store. Sharing an app with the other e2e tests would make
 * both order-sensitive: their setup logins would consume this budget, and this
 * test would exhaust theirs.
 */
import { execSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const workDir = mkdtempSync(join(tmpdir(), 'gcoms-e2e-rl-'));
process.env.DATABASE_URL = `file:${join(workDir, 'e2e.db')}`;
process.env.JWT_SECRET = 'e2e-only-secret-that-is-comfortably-long-enough';
process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
process.env.NODE_ENV = 'test';

import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../src/app.module';

const EMAIL = 'ratelimit@e2e.test';
const OTHER_EMAIL = 'bystander@e2e.test';
const PASSWORD = 'e2e-test-password';
const LOGIN_LIMIT = 5;

describe('login rate limiting (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    execSync('npx prisma migrate deploy', {
      cwd: join(__dirname, '..'),
      env: { ...process.env },
      stdio: 'ignore',
    });

    prisma = new PrismaClient();
    const hash = await bcrypt.hash(PASSWORD, 4);
    for (const email of [EMAIL, OTHER_EMAIL]) {
      await prisma.user.create({
        data: {
          email,
          password: hash,
          firstName: 'Rate',
          lastName: 'Limit',
          role: 'CLINICIAN',
        },
      });
    }

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  }, 120_000);

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
    rmSync(workDir, { recursive: true, force: true });
  });

  it('allows the first few attempts then returns 429', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < LOGIN_LIMIT + 1; i++) {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: EMAIL, password: 'wrong-password' });
      statuses.push(res.status);
    }

    expect(statuses.slice(0, LOGIN_LIMIT)).toEqual(
      Array(LOGIN_LIMIT).fill(401),
    );
    expect(statuses[LOGIN_LIMIT]).toBe(429);
  });

  // Otherwise an attacker could keep guessing simply by getting one right.
  it('keeps refusing even a correct password once tripped', () =>
    request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: EMAIL, password: PASSWORD })
      .expect(429));

  // The bug this guards against: with an IP-keyed bucket and a load balancer in
  // front, one account being guessed at locked out the whole organisation.
  it('does not lock out a bystander account from the same address', () =>
    request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: OTHER_EMAIL, password: PASSWORD })
      .expect(201));

  it('leaves health probes reachable', () =>
    request(app.getHttpServer()).get('/health').expect(200));
});
