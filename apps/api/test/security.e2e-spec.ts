/**
 * End-to-end checks for the access-control behaviour that was verified by hand
 * during remediation. These run against the real AppModule and a throwaway
 * SQLite database, so guards, pipes and filters are all in the path.
 *
 * DATABASE_URL is set before any import so Prisma's client picks it up — dotenv
 * will not override an env var that is already defined.
 */
import { execSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const workDir = mkdtempSync(join(tmpdir(), 'gcoms-e2e-'));
const dbPath = join(workDir, 'e2e.db');
process.env.DATABASE_URL = `file:${dbPath}`;
process.env.JWT_SECRET = 'e2e-only-secret-that-is-comfortably-long-enough';
process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
process.env.NODE_ENV = 'test';
// Throttling is asserted in rate-limit.e2e-spec.ts. Here it is raised out of the
// way so login-dependent assertions are not order-sensitive. Set before the
// AppModule import, since @Throttle is evaluated when the class is defined.
process.env.LOGIN_RATE_LIMIT = '10000';

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/all-exceptions.filter';

const PASSWORD = 'e2e-test-password';

const ACCOUNTS = [
  { key: 'exec', email: 'exec@e2e.test', role: 'EXECUTIVE' },
  { key: 'hr', email: 'hr@e2e.test', role: 'HR' },
  { key: 'clinician', email: 'clinician@e2e.test', role: 'CLINICIAN' },
  { key: 'volunteer', email: 'volunteer@e2e.test', role: 'VOLUNTEER' },
  { key: 'finance', email: 'finance@e2e.test', role: 'FINANCE' },
  {
    key: 'disabled',
    email: 'disabled@e2e.test',
    role: 'CLINICIAN',
    isActive: false,
  },
] as const;

describe('access control (e2e)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let prisma: PrismaClient;

  const token: Record<string, string> = {};
  const userId: Record<string, string> = {};
  let assignedPatientId: string;
  let otherPatientId: string;

  beforeAll(async () => {
    execSync('npx prisma migrate deploy', {
      cwd: join(__dirname, '..'),
      env: { ...process.env },
      stdio: 'ignore',
    });

    prisma = new PrismaClient();
    const hash = await bcrypt.hash(PASSWORD, 4); // low cost: speed over strength in tests

    for (const account of ACCOUNTS) {
      const user = await prisma.user.create({
        data: {
          email: account.email,
          password: hash,
          firstName: account.key,
          lastName: 'Test',
          role: account.role,
          isActive: (account as { isActive?: boolean }).isActive ?? true,
        },
      });
      userId[account.key] = user.id;
    }

    // One patient assigned to the clinician, one belonging to nobody they know.
    const assigned = await prisma.participant.create({
      data: {
        registrationId: 'GC-TEST-ASSIGN',
        firstName: 'Assigned',
        lastName: 'Patient',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'Female',
        consentGiven: true,
        registeredById: userId.exec,
      },
    });
    assignedPatientId = assigned.id;
    await prisma.patientAssignment.create({
      data: { participantId: assigned.id, clinicianId: userId.clinician },
    });

    const other = await prisma.participant.create({
      data: {
        registrationId: 'GC-TEST-OTHER',
        firstName: 'Unrelated',
        lastName: 'Patient',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'Female',
        consentGiven: true,
        registeredById: userId.exec,
      },
    });
    otherPatientId = other.id;

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
    http = request(app.getHttpServer());

    // Acquire every token up front — /auth/login is rate limited, so the
    // throttling test at the end must be the only thing still hitting it.
    for (const account of ACCOUNTS) {
      if ((account as { isActive?: boolean }).isActive === false) continue;
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: account.email, password: PASSWORD });
      token[account.key] = res.body.access_token;
    }
  }, 120_000);

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
    rmSync(workDir, { recursive: true, force: true });
  });

  const auth = (key: string) => ({ Authorization: `Bearer ${token[key]}` });

  it('issues a token for valid credentials', () => {
    expect(token.exec).toEqual(expect.any(String));
  });

  describe('self-registration', () => {
    // Was unauthenticated and spread its body into prisma.user.create, so
    // anyone could self-assign SYSTEM_ADMIN.
    it('no longer exists', () =>
      http
        .post('/auth/register')
        .send({
          email: 'attacker@e2e.test',
          password: 'whatever-long-enough',
          firstName: 'A',
          lastName: 'B',
          role: 'SYSTEM_ADMIN',
        })
        .expect(404));
  });

  describe('login', () => {
    it('rejects a wrong password', () =>
      http
        .post('/auth/login')
        .send({ email: ACCOUNTS[0].email, password: 'wrong' })
        .expect(401));

    it('rejects a deactivated account with an explanation', async () => {
      const res = await http
        .post('/auth/login')
        .send({ email: 'disabled@e2e.test', password: PASSWORD })
        .expect(403);
      expect(res.body.message).toMatch(/deactivated/i);
    });
  });

  describe('account administration', () => {
    it('refuses unauthenticated creation', () =>
      http.post('/users').send({ email: 'x@e2e.test' }).expect(401));

    it('refuses a role with no user-admin rights', () =>
      http
        .post('/users')
        .set(auth('clinician'))
        .send({
          email: 'nope@e2e.test',
          password: 'a-long-enough-password',
          firstName: 'A',
          lastName: 'B',
        })
        .expect(403));

    it('lets HR onboard clinical staff', () =>
      http
        .post('/users')
        .set(auth('hr'))
        .send({
          email: 'newclinician@e2e.test',
          password: 'a-long-enough-password',
          firstName: 'New',
          lastName: 'Clinician',
          role: 'CLINICIAN',
          department: 'ignored-by-whitelist',
        })
        .expect(201));

    it('stops HR minting a system admin', () =>
      http
        .post('/users')
        .set(auth('hr'))
        .send({
          email: 'escalated@e2e.test',
          password: 'a-long-enough-password',
          firstName: 'E',
          lastName: 'S',
          role: 'SYSTEM_ADMIN',
        })
        .expect(403));

    it('never returns a password hash', async () => {
      const res = await http.get('/users').set(auth('exec')).expect(200);
      expect(JSON.stringify(res.body)).not.toContain('$2b$');
    });

    it('refuses a self role change', () =>
      http
        .patch(`/users/${userId.exec}`)
        .set(auth('exec'))
        .send({ role: 'VOLUNTEER' })
        .expect(403));

    it('rejects a role outside the allowlist', () =>
      http
        .patch(`/users/${userId.volunteer}`)
        .set(auth('exec'))
        .send({ role: 'SUPER_ADMIN' })
        .expect(400));
  });

  describe('patient data', () => {
    it('refuses unauthenticated access', () =>
      http.get('/participants').expect(401));

    it.each(['finance', 'hr'])('denies %s outright', (role) =>
      http.get('/participants').set(auth(role)).expect(403),
    );

    it('gives oversight roles every patient', async () => {
      const res = await http.get('/participants').set(auth('exec')).expect(200);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
    });

    it('limits a clinician to their own caseload', async () => {
      const res = await http
        .get('/participants')
        .set(auth('clinician'))
        .expect(200);
      expect(res.body.map((p: { id: string }) => p.id)).toEqual([
        assignedPatientId,
      ]);
    });

    it('gives a volunteer who registered nobody an empty list', async () => {
      const res = await http
        .get('/participants')
        .set(auth('volunteer'))
        .expect(200);
      expect(res.body).toEqual([]);
    });

    // Searching must not become a way around the scope.
    it('scopes search as well as listing', async () => {
      const res = await http
        .get('/participants?search=Unrelated')
        .set(auth('clinician'))
        .expect(200);
      expect(res.body).toEqual([]);
    });

    it('honours limit and offset', async () => {
      const res = await http
        .get('/participants?limit=1')
        .set(auth('exec'))
        .expect(200);
      expect(res.body).toHaveLength(1);
    });

    it('rejects an over-large limit', () =>
      http.get('/participants?limit=99999').set(auth('exec')).expect(400));

    describe('break-glass', () => {
      it('allows an off-caseload record and records an override', async () => {
        const before = await prisma.auditLog.count({
          where: { action: 'PHI_ACCESS_OVERRIDE' },
        });

        await http
          .get(`/participants/${otherPatientId}`)
          .set(auth('clinician'))
          .expect(200);

        const after = await prisma.auditLog.count({
          where: { action: 'PHI_ACCESS_OVERRIDE' },
        });
        expect(after).toBe(before + 1);
      });

      it('does not log an override for a patient in the caseload', async () => {
        const before = await prisma.auditLog.count({
          where: { action: 'PHI_ACCESS_OVERRIDE' },
        });
        await http
          .get(`/participants/${assignedPatientId}`)
          .set(auth('clinician'))
          .expect(200);
        const after = await prisma.auditLog.count({
          where: { action: 'PHI_ACCESS_OVERRIDE' },
        });
        expect(after).toBe(before);
      });

      it('404s an unknown id rather than logging one', () =>
        http
          .get('/participants/11111111-1111-4111-8111-111111111111')
          .set(auth('clinician'))
          .expect(404));
    });

    describe('registration', () => {
      it('assigns the registration id server-side', async () => {
        const res = await http
          .post('/participants')
          .set(auth('volunteer'))
          .send({
            firstName: 'Server',
            lastName: 'Assigned',
            dateOfBirth: '1990-01-01',
            gender: 'Female',
            lga: 'Barkin Ladi LGA',
            ward: 'Gwol Ward',
            gpsCoordinates: '9.5 N, 8.9 E',
            consentGiven: true,
            registrationId: 'GC-CLIENT-SUPPLIED',
          })
          .expect(201);

        expect(res.body.registrationId).not.toBe('GC-CLIENT-SUPPLIED');
        expect(res.body.registrationId).toMatch(/^GC-\d{4}-/);
        expect(res.body).toMatchObject({
          lga: 'Barkin Ladi LGA',
          ward: 'Gwol Ward',
          gpsCoordinates: '9.5 N, 8.9 E',
        });
      });

      it('refuses registration without consent', () =>
        http
          .post('/participants')
          .set(auth('volunteer'))
          .send({
            firstName: 'No',
            lastName: 'Consent',
            dateOfBirth: '1990-01-01',
            gender: 'Female',
            consentGiven: false,
          })
          .expect(400));
    });
  });

  describe('health', () => {
    it('reports liveness without a token', () =>
      http.get('/health').expect(200));

    it('reports readiness with the database up', async () => {
      const res = await http.get('/health/ready').expect(200);
      expect(res.body).toMatchObject({ status: 'ok', database: 'up' });
    });
  });

  describe('error envelope', () => {
    it('carries a reference id for correlation', async () => {
      const res = await http.get('/no-such-route').expect(404);
      expect(res.body.reference).toEqual(expect.any(String));
      expect(res.body.path).toBe('/no-such-route');
    });
  });
});
