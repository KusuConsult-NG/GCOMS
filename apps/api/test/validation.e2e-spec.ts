/**
 * The endpoints whose request bodies were typed but not validated.
 *
 * Twelve handlers took a bare annotation — `@Body() body: { status: string }` —
 * which TypeScript erases at compile time. Nest's ValidationPipe validates
 * against a DTO *class*: with no class there is no metatype, so it does not
 * merely skip the checks, it does not run at all, and `whitelist: true` strips
 * nothing either. Any JSON reached the service.
 *
 * For a status that is worse than untidy. Every list and count in these modules
 * selects on the column, so a follow-up written as 'BANANA' is in no list — not
 * scheduled, not completed, not missed, not cancelled. Nothing errors, nothing
 * appears, and the record simply stops being counted. Which is the failure this
 * repository has now met three times in different clothes: state that says one
 * thing while the system behaves as though it said another.
 *
 * These are grouped in one spec rather than spread across nine because they are
 * one defect with nine instances, and the thing worth defending is the rule.
 */
import { execSync } from 'child_process';
import { useThrowawaySchema, dropSchema } from './throwaway-schema';
import { join } from 'path';

const schema = useThrowawaySchema('validation');
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

describe('request body validation (e2e)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let prisma: PrismaClient;

  const token: Record<string, string> = {};
  let followUpId: string;
  let referralId: string;
  let researchId: string;

  beforeAll(async () => {
    execSync('npx prisma migrate deploy', {
      cwd: join(__dirname, '..'),
      env: { ...process.env },
      stdio: 'ignore',
    });

    prisma = new PrismaClient();
    const hash = await bcrypt.hash(PASSWORD, 4);
    for (const account of [
      { key: 'executive', email: 'exec@val.test', role: 'EXECUTIVE' },
      { key: 'clinician', email: 'clinician@val.test', role: 'CLINICIAN' },
    ]) {
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
    const exec = await prisma.user.findUniqueOrThrow({
      where: { email: 'exec@val.test' },
    });

    const participant = await prisma.participant.create({
      data: {
        registrationId: 'GC-VAL-1',
        firstName: 'Val',
        lastName: 'Patient',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'Female',
        consentGiven: true,
        registeredById: exec.id,
      },
    });
    followUpId = (
      await prisma.followUp.create({
        data: {
          participantId: participant.id,
          clinicianId: exec.id,
          scheduledDate: new Date('2030-01-01'),
        },
      })
    ).id;
    referralId = (
      await prisma.referral.create({
        data: {
          participantId: participant.id,
          referredById: exec.id,
          referredTo: 'JUTH',
          reason: 'Biopsy',
        },
      })
    ).id;
    researchId = (
      await prisma.researchProject.create({ data: { title: 'KAP survey' } })
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
      ['executive', 'exec@val.test'],
      ['clinician', 'clinician@val.test'],
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

  describe('a status outside its vocabulary is refused', () => {
    it('follow-up', async () => {
      await http
        .patch(`/follow-ups/${followUpId}/status`)
        .set('Authorization', as('executive'))
        .send({ status: 'BANANA' })
        .expect(400);

      // And the record is untouched. The point is not the response code — it is
      // that the row did not quietly acquire a status no query matches.
      const after = await prisma.followUp.findUniqueOrThrow({
        where: { id: followUpId },
      });
      expect(after.status).toBe('SCHEDULED');
    });

    it('referral', async () => {
      await http
        .put(`/referrals/${referralId}/status`)
        .set('Authorization', as('executive'))
        .send({ status: 'nonsense' })
        .expect(400);
      const after = await prisma.referral.findUniqueOrThrow({
        where: { id: referralId },
      });
      expect(after.status).toBe('PENDING');
    });

    it('accepts a status that is in the vocabulary', async () => {
      await http
        .patch(`/follow-ups/${followUpId}/status`)
        .set('Authorization', as('executive'))
        .send({ status: 'COMPLETED' })
        .expect(200);
      const after = await prisma.followUp.findUniqueOrThrow({
        where: { id: followUpId },
      });
      expect(after.status).toBe('COMPLETED');
    });

    it('is case-sensitive, rather than guessing', async () => {
      // 'completed' is not 'COMPLETED'. Coercing it here would mean the column
      // holds whichever spelling each caller happened to send, which is the
      // problem the dashboard's positive-screening count already has.
      await http
        .patch(`/follow-ups/${followUpId}/status`)
        .set('Authorization', as('executive'))
        .send({ status: 'completed' })
        .expect(400);
    });
  });

  describe('numbers are bounded, not merely numeric', () => {
    it('refuses research progress above 100', async () => {
      await http
        .patch(`/research/projects/${researchId}/progress`)
        .set('Authorization', as('executive'))
        .send({ progress: 900 })
        .expect(400);
    });

    it('refuses negative research progress', async () => {
      await http
        .patch(`/research/projects/${researchId}/progress`)
        .set('Authorization', as('executive'))
        .send({ progress: -40 })
        .expect(400);
    });

    it('accepts a real percentage', async () => {
      await http
        .patch(`/research/projects/${researchId}/progress`)
        .set('Authorization', as('executive'))
        .send({ progress: 45 })
        .expect(200);
      const after = await prisma.researchProject.findUniqueOrThrow({
        where: { id: researchId },
      });
      expect(after.progress).toBe(45);
    });
  });

  describe('required fields are required', () => {
    it('refuses a referral with no participant', async () => {
      await http
        .post('/referrals')
        .set('Authorization', as('clinician'))
        .send({ referredTo: 'JUTH', reason: 'Biopsy' })
        .expect(400);
    });

    it('refuses a referral for a participant that does not exist', async () => {
      // 404 rather than 400, and deliberately so: ParticipantAccessGuard runs
      // before the validation pipe, because Nest resolves guards first. That
      // ordering is worth keeping — an authorisation check should not be
      // reachable only after the body has been found acceptable — so what is
      // asserted here is that the request is refused, not which of the two
      // refusals wins.
      await http
        .post('/referrals')
        .set('Authorization', as('clinician'))
        .send({ participantId: 'not-a-uuid', referredTo: 'JUTH', reason: 'x' })
        .expect(404);
    });

    it('refuses a research project with an empty title', async () => {
      await http
        .post('/research/projects')
        .set('Authorization', as('executive'))
        .send({ title: '   ' })
        .expect(400);
    });
  });

  describe('unknown properties are stripped', () => {
    it('ignores a field the DTO does not declare', async () => {
      // whitelist: true only bites once there is a class to whitelist against.
      // Without one it was inert, which is how `status` reached Prisma beside
      // anything else the caller felt like sending.
      await http
        .patch(`/follow-ups/${followUpId}/status`)
        .set('Authorization', as('executive'))
        .send({ status: 'CANCELLED', clinicianId: 'someone-else' })
        .expect(200);
      const after = await prisma.followUp.findUniqueOrThrow({
        where: { id: followUpId },
      });
      expect(after.status).toBe('CANCELLED');
      expect(after.clinicianId).not.toBe('someone-else');
    });
  });
});
