/**
 * The reporting module: who may read it, what it counts, and what it records.
 *
 * The screen this feeds was almost entirely literals — 1,845 people reached,
 * 184 under navigation, 51 referrals, a four-row impact breakdown with its own
 * percentages — so the endpoint behind it was barely exercised and nothing
 * noticed that its shape did not match what the client typed.
 *
 * Two things here are worth more than the shape.
 *
 * `reachStats.awareness` was `totalOutreaches * 50`, commented "Estimated
 * reach: 50 per outreach", and rendered as "Total Community Reach". Fifty is a
 * number somebody chose; multiplying by it turns a count of events into a claim
 * about people that no event recorded.
 *
 * And the export returns every screening with the participant's name and
 * national id — the largest PHI disclosure this system performs, in one
 * request. PhiAccessService writes an audit row when a clinician opens a single
 * record outside their caseload; downloading the whole register wrote nothing.
 */
import type { Server } from 'node:http';
import { execSync } from 'child_process';
import { useThrowawaySchema, dropSchema } from './throwaway-schema';
import { join } from 'path';

const schema = useThrowawaySchema('reports');
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

type Summary = {
  generatedAt: string;
  totalScreenings: number;
  positiveScreenings: number;
  totalPatients: number;
  totalOutreaches: number;
  totalReferrals: number;
  activeReferrals: number;
  totalNavigationEvents: number;
  communitiesCovered: number;
};

describe('reports (e2e)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let prisma: PrismaClient;

  const token: Record<string, string> = {};
  const userId: Record<string, string> = {};

  const ACCOUNTS = [
    { key: 'executive', email: 'exec@reports.test', role: 'EXECUTIVE' },
    { key: 'dataOfficer', email: 'data@reports.test', role: 'DATA_OFFICER' },
    {
      key: 'programme',
      email: 'programme@reports.test',
      role: 'PROGRAMME_MANAGER',
    },
    { key: 'volunteer', email: 'volunteer@reports.test', role: 'VOLUNTEER' },
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

    const participant = await prisma.participant.create({
      data: {
        registrationId: 'GC-REP-1',
        firstName: 'Report',
        lastName: 'Patient',
        dateOfBirth: new Date('1985-01-01'),
        gender: 'Female',
        nationalId: 'NIN-0000000001',
        consentGiven: true,
        registeredById: userId.executive,
      },
    });

    await prisma.screening.createMany({
      data: [
        {
          participantId: participant.id,
          conductedById: userId.executive,
          cancerType: 'Cervical Cancer (VIA / Pap)',
          result: 'Positive (VIA+)',
        },
        {
          participantId: participant.id,
          conductedById: userId.executive,
          cancerType: 'Cervical Cancer (VIA / Pap)',
          result: 'Negative',
        },
      ],
    });

    await prisma.referral.createMany({
      data: [
        {
          participantId: participant.id,
          referredById: userId.executive,
          referredTo: 'JUTH',
          reason: 'Biopsy',
          status: 'PENDING',
        },
        {
          participantId: participant.id,
          referredById: userId.executive,
          referredTo: 'JUTH',
          reason: 'Review',
          status: 'COMPLETED',
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

  const auth = (key: string) => ({ Authorization: `Bearer ${token[key]}` });

  describe('the summary', () => {
    it('counts what is actually recorded', async () => {
      const summary = body<Summary>(
        await http.get('/reports/summary').set(auth('executive')).expect(200),
      );
      expect(summary.totalScreenings).toBe(2);
      expect(summary.positiveScreenings).toBe(1);
      expect(summary.totalPatients).toBe(1);
      expect(summary.totalReferrals).toBe(2);
      // "Active" is what is still waiting on the receiving facility.
      expect(summary.activeReferrals).toBe(1);
    });

    it('estimates nothing', async () => {
      // The field this replaces was `totalOutreaches * 50`. No outreach here,
      // so the old shape would have returned an awareness reach of 0 — and,
      // with one outreach, fifty people nobody had met.
      const summary = body<Record<string, unknown>>(
        await http.get('/reports/summary').set(auth('executive')).expect(200),
      );
      expect(summary).not.toHaveProperty('reachStats');
      expect(JSON.stringify(summary)).not.toContain('awareness');
      expect(summary.totalOutreaches).toBe(0);
    });

    it('returns every field the reports screen reads', async () => {
      // The client typed this response as AnalyticsSummary, which is a
      // different endpoint's shape, so the fields it wanted were absent and it
      // fell back to literals. A missing key here is a screen showing an em
      // dash, or worse, a made-up number.
      const summary = body<Summary>(
        await http.get('/reports/summary').set(auth('executive')).expect(200),
      );
      for (const field of [
        'generatedAt',
        'totalScreenings',
        'positiveScreenings',
        'totalPatients',
        'totalOutreaches',
        'totalReferrals',
        'activeReferrals',
        'totalNavigationEvents',
        'communitiesCovered',
      ]) {
        expect(summary).toHaveProperty(field);
      }
    });

    it('is readable by the roles the reporting sidebar is offered to', async () => {
      // DATA_OFFICER and PROGRAMME_MANAGER are the two roles whose only
      // section is Reporting. A 403 here would leave them with a sidebar
      // entry and nothing behind it.
      await http.get('/reports/summary').set(auth('dataOfficer')).expect(200);
      await http.get('/reports/summary').set(auth('programme')).expect(200);
    });

    it('refuses a role with no reporting rights', async () => {
      await http.get('/reports/summary').set(auth('volunteer')).expect(403);
    });
  });

  describe('the export', () => {
    it('returns the identified register to a role permitted it', async () => {
      const rows = body<Array<Record<string, unknown>>>(
        await http.get('/reports/export').set(auth('dataOfficer')).expect(200),
      );
      expect(rows).toHaveLength(2);
      expect(rows[0].NationalID).toBe('NIN-0000000001');
    });

    it('records that it happened, and who did it', async () => {
      /*
       * The case this file exists for. One request returns every patient's
       * name and national id; a clinician opening a single off-caseload record
       * is audited, and this was not.
       */
      const before = await prisma.auditLog.count({
        where: { action: 'PHI_BULK_EXPORT' },
      });
      await http.get('/reports/export').set(auth('executive')).expect(200);

      expect(
        await prisma.auditLog.count({ where: { action: 'PHI_BULK_EXPORT' } }),
      ).toBe(before + 1);

      const audit = await prisma.auditLog.findFirst({
        where: { action: 'PHI_BULK_EXPORT' },
        orderBy: { createdAt: 'desc' },
      });
      expect(audit?.userId).toBe(userId.executive);
      expect(audit?.newData).toContain('nationalId');
    });

    it('records nothing when the export is refused', async () => {
      const before = await prisma.auditLog.count({
        where: { action: 'PHI_BULK_EXPORT' },
      });
      await http.get('/reports/export').set(auth('volunteer')).expect(403);
      // PROGRAMME_MANAGER may read the summary and not the register.
      await http.get('/reports/export').set(auth('programme')).expect(403);
      expect(
        await prisma.auditLog.count({ where: { action: 'PHI_BULK_EXPORT' } }),
      ).toBe(before);
    });
  });
});
