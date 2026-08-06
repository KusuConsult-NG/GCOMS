/**
 * Points at a throwaway database before importing anything. Previously this
 * booted the whole AppModule against whatever DATABASE_URL was in .env — i.e.
 * the developer's dev.db — while BackgroundSchedulerService writes on startup
 * (marking follow-ups MISSED and queueing notifications). Running the tests
 * could silently mutate real development data.
 */
import { execSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const workDir = mkdtempSync(join(tmpdir(), 'gcoms-e2e-app-'));
process.env.DATABASE_URL = `file:${join(workDir, 'e2e.db')}`;
process.env.JWT_SECRET = 'e2e-only-secret-that-is-comfortably-long-enough';
process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
process.env.NODE_ENV = 'test';

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    execSync('npx prisma migrate deploy', {
      cwd: join(__dirname, '..'),
      env: { ...process.env },
      stdio: 'ignore',
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 120_000);

  afterAll(async () => {
    await app?.close();
    rmSync(workDir, { recursive: true, force: true });
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
