/**
 * The LGA coverage endpoint, end to end.
 *
 * These assertions need a real database rather than a mocked Prisma client:
 * the query is raw SQL with a three-table join, a FILTER clause and a
 * case-insensitive LIKE, and none of that is exercised by a stubbed return
 * value. A unit test here would assert that the mock returns what the mock was
 * told to return.
 *
 * DATABASE_URL is set before any import so Prisma's client picks it up — dotenv
 * will not override an env var that is already defined.
 */
import { execSync } from 'child_process';
import { useThrowawaySchema, dropSchema } from './throwaway-schema';
import { join } from 'path';

const schema = useThrowawaySchema('analytics');
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

type Coverage = {
  lga: string;
  participants: number;
  screenings: number;
  positiveScreenings: number;
  referrals: number;
  pendingReferrals: number;
  communities: number;
  lastRegistration: string | null;
};

describe('GET /analytics/lga (e2e)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let prisma: PrismaClient;
  let execToken: string;
  let volunteerToken: string;

  beforeAll(async () => {
    execSync('npx prisma migrate deploy', {
      cwd: join(__dirname, '..'),
      env: { ...process.env },
      stdio: 'ignore',
    });

    prisma = new PrismaClient();
    const hash = await bcrypt.hash(PASSWORD, 4);

    const exec = await prisma.user.create({
      data: {
        email: 'exec@analytics.test',
        password: hash,
        firstName: 'Exec',
        lastName: 'Test',
        role: 'EXECUTIVE',
      },
    });
    await prisma.user.create({
      data: {
        email: 'volunteer@analytics.test',
        password: hash,
        firstName: 'Volunteer',
        lastName: 'Test',
        role: 'VOLUNTEER',
      },
    });

    /**
     * Barkin Ladi: two participants. One screened twice — 'POSITIVE' and
     * 'negative' — the other once, 'Positive'. Three screenings, two positive,
     * and the two spellings are deliberate: the result column is free text and
     * three different screens write three different casings into it. An
     * equality test would report one positive here, which is the bug this
     * matching exists to avoid.
     */
    const first = await prisma.participant.create({
      data: {
        registrationId: 'GC-ANALYTICS-1',
        firstName: 'First',
        lastName: 'Patient',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'Female',
        lga: 'Barkin Ladi',
        consentGiven: true,
        registeredById: exec.id,
      },
    });
    const second = await prisma.participant.create({
      data: {
        registrationId: 'GC-ANALYTICS-2',
        firstName: 'Second',
        lastName: 'Patient',
        dateOfBirth: new Date('1992-02-02'),
        gender: 'Female',
        lga: 'Barkin Ladi',
        consentGiven: true,
        registeredById: exec.id,
      },
    });
    // Mangu: one participant, never screened, with two referrals — one still
    // pending. Proves the referral count is not conditional on a screening and
    // that the LEFT JOINs do not drop a row with no screenings.
    const third = await prisma.participant.create({
      data: {
        registrationId: 'GC-ANALYTICS-3',
        firstName: 'Third',
        lastName: 'Patient',
        dateOfBirth: new Date('1994-03-03'),
        gender: 'Female',
        lga: 'Mangu',
        consentGiven: true,
        registeredById: exec.id,
      },
    });
    // No LGA recorded. Must not appear as an empty-named row.
    await prisma.participant.create({
      data: {
        registrationId: 'GC-ANALYTICS-4',
        firstName: 'Fourth',
        lastName: 'Patient',
        dateOfBirth: new Date('1996-04-04'),
        gender: 'Female',
        consentGiven: true,
        registeredById: exec.id,
      },
    });

    await prisma.screening.createMany({
      data: [
        {
          participantId: first.id,
          conductedById: exec.id,
          cancerType: 'Cervical',
          result: 'POSITIVE',
        },
        {
          participantId: first.id,
          conductedById: exec.id,
          cancerType: 'Cervical',
          result: 'negative',
        },
        {
          participantId: second.id,
          conductedById: exec.id,
          cancerType: 'Breast',
          result: 'Positive',
        },
      ],
    });
    await prisma.referral.createMany({
      data: [
        {
          participantId: third.id,
          referredById: exec.id,
          referredTo: 'JUTH',
          reason: 'Biopsy',
          status: 'PENDING',
        },
        {
          participantId: third.id,
          referredById: exec.id,
          referredTo: 'JUTH',
          reason: 'Follow-up',
          status: 'COMPLETED',
        },
      ],
    });
    // Riyom has a community mapped and nobody registered. "Where are we not
    // working" is a real question and a missing row is not an answer to it.
    await prisma.community.create({
      data: { name: 'Riyom Central', lga: 'Riyom', population: 1200 },
    });

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
    http = request(app.getHttpServer());

    const login = async (email: string) => {
      const res = await http
        .post('/auth/login')
        .send({ email, password: PASSWORD })
        .expect(201);
      return res.body.access_token as string;
    };
    execToken = await login('exec@analytics.test');
    volunteerToken = await login('volunteer@analytics.test');
  }, 180_000);

  afterAll(async () => {
    await app?.close();
    await dropSchema(prisma, schema);
    await prisma.$disconnect();
  });

  const fetchCoverage = async (): Promise<Coverage[]> => {
    const res = await http
      .get('/analytics/lga')
      .set('Authorization', `Bearer ${execToken}`)
      .expect(200);
    return res.body as Coverage[];
  };

  it('refuses an unauthenticated request', async () => {
    await http.get('/analytics/lga').expect(401);
  });

  it('refuses a role without executive visibility', async () => {
    await http
      .get('/analytics/lga')
      .set('Authorization', `Bearer ${volunteerToken}`)
      .expect(403);
  });

  it('counts participants, screenings and referrals per LGA', async () => {
    const body = await fetchCoverage();
    const barkinLadi = body.find((r) => r.lga === 'Barkin Ladi');
    const mangu = body.find((r) => r.lga === 'Mangu');

    expect(barkinLadi).toMatchObject({
      participants: 2,
      screenings: 3,
      referrals: 0,
      pendingReferrals: 0,
    });
    expect(mangu).toMatchObject({
      participants: 1,
      screenings: 0,
      referrals: 2,
      pendingReferrals: 1,
    });
  });

  it('matches a positive result whatever its casing', async () => {
    const body = await fetchCoverage();
    // 'POSITIVE' and 'Positive' both count; 'negative' does not.
    expect(body.find((r) => r.lga === 'Barkin Ladi')?.positiveScreenings).toBe(2);
  });

  it('includes an LGA that has a community but no registrations', async () => {
    const body = await fetchCoverage();
    expect(body.find((r) => r.lga === 'Riyom')).toMatchObject({
      participants: 0,
      screenings: 0,
      referrals: 0,
      communities: 1,
      lastRegistration: null,
    });
  });

  it('leaves participants with no recorded LGA out entirely', async () => {
    const body = await fetchCoverage();
    expect(body.map((r) => r.lga)).toEqual(
      expect.not.arrayContaining(['', null, undefined]),
    );
    // Four participants were created; three carry an LGA.
    const counted = body.reduce((sum, r) => sum + r.participants, 0);
    expect(counted).toBe(3);
  });

  it('orders by participant count, busiest first', async () => {
    const body = await fetchCoverage();
    const counts = body.map((r) => r.participants);
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
  });

  it('reports the most recent registration for an LGA', async () => {
    const body = await fetchCoverage();
    const barkinLadi = body.find((r) => r.lga === 'Barkin Ladi');
    expect(barkinLadi?.lastRegistration).toEqual(expect.any(String));
    expect(Number.isNaN(Date.parse(barkinLadi!.lastRegistration!))).toBe(false);
  });
});
