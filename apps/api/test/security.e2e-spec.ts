/**
 * End-to-end checks for the access-control behaviour that was verified by hand
 * during remediation. These run against the real AppModule and a throwaway
 * SQLite database, so guards, pipes and filters are all in the path.
 *
 * DATABASE_URL is set before any import so Prisma's client picks it up — dotenv
 * will not override an env var that is already defined.
 */
import { execSync } from 'child_process';
import { useThrowawaySchema, dropSchema } from './throwaway-schema';
import { join } from 'path';

const schema = useThrowawaySchema('security');
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
import type { Server } from 'node:http';

const PASSWORD = 'e2e-test-password';

/**
 * supertest types `res.body` as `any`, so every assertion through it is an
 * unchecked one and the rules that would say so are drowned in the noise. The
 * newer specs funnel it through one cast; this one predates them, and CI lints
 * `src` only, so nothing ever asked.
 */
function body<T>(response: { body: unknown }): T {
  return response.body as T;
}

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
    http = request(app.getHttpServer() as Server);

    // Acquire every token up front — /auth/login is rate limited, so the
    // throttling test at the end must be the only thing still hitting it.
    for (const account of ACCOUNTS) {
      if ((account as { isActive?: boolean }).isActive === false) continue;
      const res = await request(app.getHttpServer() as Server)
        .post('/auth/login')
        .send({ email: account.email, password: PASSWORD });
      token[account.key] = body<{ access_token: string }>(res).access_token;
    }
  }, 120_000);

  afterAll(async () => {
    await app?.close();
    await dropSchema(prisma, schema);
    await prisma?.$disconnect();
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
      expect(body<{ message: string }>(res).message).toMatch(/deactivated/i);
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

  describe('password reset', () => {
    /*
     * There was no route for this. The administration screen's "Reset Pwd"
     * button sent `{ password: '...' }` to PATCH /users/:id, whose DTO declares
     * only `role`, so it was refused and the handler logged to the console —
     * a button that did nothing at all, silently, for as long as it existed.
     *
     * The interesting cases here are the two escalations. Resetting a password
     * is account takeover, so HR — which may create accounts and set their
     * passwords — must not be able to reset an executive's, and nobody may
     * reset their own from an administration screen.
     */
    it('lets an executive reset a password and returns it once', async () => {
      const res = await http
        .patch(`/users/${userId.volunteer}/password`)
        .set(auth('exec'))
        .send({})
        .expect(200);
      const issued = body<{ temporaryPassword: string }>(res).temporaryPassword;
      expect(issued).toHaveLength(20);

      // The point of the whole endpoint: the new password actually works and
      // the old one does not.
      await http
        .post('/auth/login')
        .send({ email: 'volunteer@e2e.test', password: issued })
        .expect(201);
      await http
        .post('/auth/login')
        .send({ email: 'volunteer@e2e.test', password: PASSWORD })
        .expect(401);
    });

    it('records who reset whose', async () => {
      await http
        .patch(`/users/${userId.finance}/password`)
        .set(auth('exec'))
        .send({})
        .expect(200);
      const audit = await prisma.auditLog.findFirst({
        where: { action: 'USER_PASSWORD_RESET', userId: userId.exec },
        orderBy: { createdAt: 'desc' },
      });
      expect(audit?.newData).toContain('finance@e2e.test');
      // Never the password itself.
      expect(audit?.newData).not.toContain('Aa1!');
    });

    it('stops HR resetting a privileged account', async () => {
      // HR may create accounts, so without this it could reset the executive's
      // password and sign in as them — the same escalation self-registration
      // was, one screen along.
      await http
        .patch(`/users/${userId.exec}/password`)
        .set(auth('hr'))
        .send({})
        .expect(403);
    });

    it('lets HR reset an ordinary staff account', async () => {
      await http
        .patch(`/users/${userId.clinician}/password`)
        .set(auth('hr'))
        .send({})
        .expect(200);
    });

    it('refuses a self reset', () =>
      http
        .patch(`/users/${userId.exec}/password`)
        .set(auth('exec'))
        .send({})
        .expect(403));

    it('refuses a role with no user-admin rights', () =>
      http
        .patch(`/users/${userId.volunteer}/password`)
        .set(auth('finance'))
        .send({})
        .expect(403));

    it('rejects a supplied password that is too short', () =>
      http
        .patch(`/users/${userId.volunteer}/password`)
        .set(auth('exec'))
        .send({ password: 'short' })
        .expect(400));

    it('404s a user that does not exist', () =>
      http
        .patch('/users/3f2504e0-4f89-11d3-9a0c-0305e82c3301/password')
        .set(auth('exec'))
        .send({})
        .expect(404));
  });

  describe('patient data', () => {
    it('refuses unauthenticated access', () =>
      http.get('/participants').expect(401));

    it.each(['finance', 'hr'])('denies %s outright', (role) =>
      http.get('/participants').set(auth(role)).expect(403),
    );

    it('gives oversight roles every patient', async () => {
      const res = await http.get('/participants').set(auth('exec')).expect(200);
      expect(body<unknown[]>(res).length).toBeGreaterThanOrEqual(2);
    });

    it('limits a clinician to their own caseload', async () => {
      const res = await http
        .get('/participants')
        .set(auth('clinician'))
        .expect(200);
      expect(body<{ id: string }[]>(res).map((p) => p.id)).toEqual([
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

        expect(body<{ registrationId: string }>(res).registrationId).not.toBe(
          'GC-CLIENT-SUPPLIED',
        );
        expect(body<{ registrationId: string }>(res).registrationId).toMatch(
          /^GC-\d{4}-/,
        );
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
      expect(body<{ reference: string }>(res).reference).toEqual(
        expect.any(String),
      );
      expect(body<{ path: string }>(res).path).toBe('/no-such-route');
    });
  });
});
