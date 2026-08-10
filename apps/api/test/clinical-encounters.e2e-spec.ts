/**
 * Clinical encounters: who may record what, and what is written down about it.
 *
 * roles.constants draws one line through this module and states the reasoning:
 * a nurse in a screening programme does the bulk of the work — triage, vitals,
 * screening, referral, follow-up — and what is reserved is "the interpretive
 * step: a prognosis, and the recommendation drawn from an investigation result".
 * It also warns which way to err: too restrictive "stops a nurse doing their job
 * and gets worked around".
 *
 * That line was drawn on two of the three routes. The edit route excluded
 * nurses and the investigation routes excluded nurses, and the create route did
 * not — so `prognosis`, the field the comment names first, was writable at
 * creation by the role it names as excluded.
 *
 * The other half of this file is the audit trail. An edit to a clinical note
 * replaces what a clinician wrote about a patient; the record of what it said
 * before is the only thing that makes that reversible or reviewable.
 */
import type { Server } from 'node:http';
import { execSync } from 'child_process';
import { useThrowawaySchema, dropSchema } from './throwaway-schema';
import { join } from 'path';

const schema = useThrowawaySchema('encounters');
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

type Encounter = { id: string; notes: string; prognosis: string | null };

describe('clinical encounters (e2e)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let prisma: PrismaClient;

  const token: Record<string, string> = {};
  const userId: Record<string, string> = {};
  let participantId: string;

  beforeAll(async () => {
    execSync('npx prisma migrate deploy', {
      cwd: join(__dirname, '..'),
      env: { ...process.env },
      stdio: 'ignore',
    });

    prisma = new PrismaClient();
    const hash = await bcrypt.hash(PASSWORD, 4);
    for (const account of [
      { key: 'doctor', email: 'doctor@enc.test', role: 'DOCTOR' },
      { key: 'nurse', email: 'nurse@enc.test', role: 'NURSE' },
      { key: 'clinician', email: 'clinician@enc.test', role: 'CLINICIAN' },
      { key: 'volunteer', email: 'volunteer@enc.test', role: 'VOLUNTEER' },
    ]) {
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
        registrationId: 'GC-ENC-1',
        firstName: 'Encounter',
        lastName: 'Patient',
        dateOfBirth: new Date('1980-01-01'),
        gender: 'Female',
        consentGiven: true,
        registeredById: userId.doctor,
      },
    });
    participantId = participant.id;
    // Both clinicians on the caseload, so PHI scope is not what is under test.
    for (const key of ['nurse', 'clinician']) {
      await prisma.patientAssignment.create({
        data: { participantId, clinicianId: userId[key] },
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

    for (const [key, email] of [
      ['doctor', 'doctor@enc.test'],
      ['nurse', 'nurse@enc.test'],
      ['clinician', 'clinician@enc.test'],
      ['volunteer', 'volunteer@enc.test'],
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

  const record = (as: string, payload: Record<string, unknown>) =>
    http
      .post('/clinical-encounters')
      .set('Authorization', `Bearer ${token[as]}`)
      .send({ participantId, ...payload });

  describe('recording an encounter', () => {
    it('lets a nurse record one', async () => {
      // The permissive half of the policy, and the one the comment is most
      // insistent about: a nurse doing their job must not be blocked.
      const res = await record('nurse', {
        notes: 'Patient attended for VIA screening. Tolerated well.',
      }).expect(201);
      expect(body<Encounter>(res).notes).toContain('VIA screening');
    });

    it('lets a doctor record one with a prognosis', async () => {
      const res = await record('doctor', {
        notes: 'Lesion observed at 3 o’clock.',
        prognosis: 'Suspicious. Refer for colposcopy within two weeks.',
      }).expect(201);
      expect(body<Encounter>(res).prognosis).toContain('colposcopy');
    });

    it('refuses a prognosis from a nurse', async () => {
      // The line roles.constants draws by name. It was enforced on the edit
      // route and on investigations, and not here.
      await record('nurse', {
        notes: 'Patient attended.',
        prognosis: 'Likely benign, no follow-up needed.',
      }).expect(403);
    });

    it('refuses it rather than dropping it', async () => {
      // Silently discarding the field would leave the nurse believing a
      // prognosis had been recorded and the record without one — the failure
      // this system produces in other forms and the reason this is a 403.
      const before = await prisma.clinicalEncounter.count();
      await record('nurse', {
        notes: 'Patient attended.',
        prognosis: 'Likely benign.',
      }).expect(403);
      expect(await prisma.clinicalEncounter.count()).toBe(before);
    });

    it('lets a nurse record one with an empty prognosis field', async () => {
      // A form that always sends the key must not be refused for sending it
      // blank. Only an actual conclusion is a diagnostic act.
      await record('nurse', {
        notes: 'Routine visit.',
        prognosis: '   ',
      }).expect(201);
    });

    it('refuses a volunteer entirely', async () => {
      await record('volunteer', { notes: 'Attended.' }).expect(403);
    });

    it('files the encounter against the clinician who recorded it', async () => {
      const res = await record('clinician', { notes: 'Reviewed.' }).expect(201);
      const stored = await prisma.clinicalEncounter.findUniqueOrThrow({
        where: { id: body<Encounter>(res).id },
      });
      // Taken from the token, never the body — the clinician on a clinical note
      // is who wrote it.
      expect(stored.clinicianId).toBe(userId.clinician);
    });
  });

  describe('editing a clinical note', () => {
    it('refuses a nurse, who may record but not reinterpret', async () => {
      const created = await record('nurse', { notes: 'Initial note.' }).expect(
        201,
      );
      await http
        .patch(`/clinical-encounters/${body<Encounter>(created).id}`)
        .set('Authorization', `Bearer ${token.nurse}`)
        .send({ notes: 'Rewritten.' })
        .expect(403);
    });

    it('keeps what the note said before, and who changed it', async () => {
      const created = body<Encounter>(
        await record('doctor', { notes: 'Original finding.' }).expect(201),
      );

      await http
        .patch(`/clinical-encounters/${created.id}`)
        .set('Authorization', `Bearer ${token.doctor}`)
        .send({ notes: 'Corrected finding after review.' })
        .expect(200);

      // An edit replaces what a clinician wrote about a patient. The audit row
      // is the only thing that makes that reviewable afterwards.
      const audit = await prisma.auditLog.findFirst({
        where: {
          action: 'EDIT_CLINICAL_NOTE',
          clinicalEncounterId: created.id,
        },
      });
      expect(audit?.oldData).toBe('Original finding.');
      expect(audit?.newData).toBe('Corrected finding after review.');
      expect(audit?.userId).toBe(userId.doctor);

      const stored = await prisma.clinicalEncounter.findUniqueOrThrow({
        where: { id: created.id },
      });
      expect(stored.notes).toBe('Corrected finding after review.');
    });

    it('writes no audit row when the edit is refused', async () => {
      const created = body<Encounter>(
        await record('doctor', { notes: 'Untouched.' }).expect(201),
      );
      await http
        .patch(`/clinical-encounters/${created.id}`)
        .set('Authorization', `Bearer ${token.nurse}`)
        .send({ notes: 'Attempted rewrite.' })
        .expect(403);

      expect(
        await prisma.auditLog.count({
          where: { clinicalEncounterId: created.id },
        }),
      ).toBe(0);
      const stored = await prisma.clinicalEncounter.findUniqueOrThrow({
        where: { id: created.id },
      });
      expect(stored.notes).toBe('Untouched.');
    });

    it('404s an encounter that does not exist', async () => {
      await http
        .patch('/clinical-encounters/3f2504e0-4f89-11d3-9a0c-0305e82c3301')
        .set('Authorization', `Bearer ${token.doctor}`)
        .send({ notes: 'x' })
        .expect(404);
    });
  });

  describe('putting a clinician on a caseload', () => {
    it('records who granted the access', async () => {
      // An assignment widens a clinician's PHI scope, and PatientAssignment has
      // no column for who did it — so the audit log is the only record.
      const other = await prisma.participant.create({
        data: {
          registrationId: 'GC-ENC-2',
          firstName: 'Second',
          lastName: 'Patient',
          dateOfBirth: new Date('1985-01-01'),
          gender: 'Female',
          consentGiven: true,
          registeredById: userId.doctor,
        },
      });

      await http
        .post('/clinical-encounters/assignments')
        .set('Authorization', `Bearer ${token.doctor}`)
        .send({ participantId: other.id, clinicianId: userId.nurse })
        .expect(201);

      const audit = await prisma.auditLog.findFirst({
        where: { action: 'ASSIGN_PATIENT', userId: userId.doctor },
        orderBy: { createdAt: 'desc' },
      });
      expect(audit?.newData).toContain(other.id);
      expect(audit?.newData).toContain(userId.nurse);
    });
  });
});
