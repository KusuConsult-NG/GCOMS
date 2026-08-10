/**
 * Follow-ups: whose patients a clinician can see in a list.
 *
 * Every read on this controller is narrowed by
 * `PhiAccessService.participantScope()`, which for a front-line role means
 * patients they registered or are assigned to. The failure mode is quiet and
 * serious — a missing `scope` on one query hands one clinician another's
 * caseload, and nothing about the response looks wrong. There are four such
 * queries here (list, upcoming, missed, dashboard counts) and the scope has to
 * be threaded through each one separately, which is exactly the shape of thing
 * that goes wrong on the fifth.
 *
 * Reaching a single record by id is deliberately *not* refused — a clinician
 * must not be blocked from a walk-in by missing paperwork — but it is written to
 * AuditLog as PHI_ACCESS_OVERRIDE. That accountability is asserted here too,
 * because an audit trail nobody checks is indistinguishable from none.
 */
import { execSync } from 'child_process';
import { useThrowawaySchema, dropSchema } from './throwaway-schema';
import { join } from 'path';

const schema = useThrowawaySchema('followup');
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

type FollowUp = {
  id: string;
  status: string;
  participant: { firstName: string; lastName: string };
};
type Stats = {
  scheduled: number;
  completed: number;
  missed: number;
  cancelled: number;
  upcoming: number;
};

const daysFromNow = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

describe('follow-ups (e2e)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let prisma: PrismaClient;

  const token: Record<string, string> = {};
  const userId: Record<string, string> = {};
  const followUpId: Record<string, string> = {};
  let othersParticipantId: string;

  beforeAll(async () => {
    execSync('npx prisma migrate deploy', {
      cwd: join(__dirname, '..'),
      env: { ...process.env },
      stdio: 'ignore',
    });

    prisma = new PrismaClient();
    const hash = await bcrypt.hash(PASSWORD, 4);

    for (const account of [
      { key: 'mine', email: 'mine@fu.test', role: 'CLINICIAN' },
      { key: 'other', email: 'other@fu.test', role: 'CLINICIAN' },
      { key: 'executive', email: 'exec@fu.test', role: 'EXECUTIVE' },
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

    const participant = async (tag: string, registeredBy: string) =>
      prisma.participant.create({
        data: {
          registrationId: `GC-FU-${tag}`,
          firstName: tag,
          lastName: 'Patient',
          dateOfBirth: new Date('1990-01-01'),
          gender: 'Female',
          consentGiven: true,
          registeredById: registeredBy,
        },
      });

    // Two routes into scope: registered by the clinician, and assigned to them.
    // Both must work, because a clinician who only ever sees assigned patients
    // would lose everyone they registered themselves.
    const registered = await participant('REGISTERED', userId.mine);
    const assigned = await participant('ASSIGNED', userId.executive);
    await prisma.patientAssignment.create({
      data: { participantId: assigned.id, clinicianId: userId.mine },
    });
    // Neither registered by nor assigned to `mine`.
    const foreign = await participant('FOREIGN', userId.other);
    othersParticipantId = foreign.id;

    const schedule = async (
      key: string,
      participantId: string,
      clinicianId: string,
      when: Date,
      status = 'SCHEDULED',
    ) => {
      const created = await prisma.followUp.create({
        data: { participantId, clinicianId, scheduledDate: when, status },
      });
      followUpId[key] = created.id;
    };

    // In scope for `mine`: one due in three days (upcoming), one overdue
    // (missed), one far out (scheduled but not upcoming), one completed.
    await schedule('upcoming', registered.id, userId.mine, daysFromNow(3));
    await schedule('missed', registered.id, userId.mine, daysFromNow(-5));
    await schedule('distant', assigned.id, userId.mine, daysFromNow(60));
    await schedule(
      'completed',
      assigned.id,
      userId.mine,
      daysFromNow(-30),
      'COMPLETED',
    );
    // Out of scope for `mine`, and deliberately in the same date windows so a
    // missing scope filter would show up in every list rather than none.
    await schedule('foreignUpcoming', foreign.id, userId.other, daysFromNow(2));
    await schedule('foreignMissed', foreign.id, userId.other, daysFromNow(-4));

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
      ['mine', 'mine@fu.test'],
      ['other', 'other@fu.test'],
      ['executive', 'exec@fu.test'],
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

  const list = async (path: string, as: string) =>
    body<FollowUp[]>(
      await http
        .get(path)
        .set('Authorization', `Bearer ${token[as]}`)
        .expect(200),
    );

  describe('a clinician sees their own caseload only', () => {
    it('lists patients they registered and patients assigned to them', async () => {
      const ids = (await list('/follow-ups', 'mine')).map((f) => f.id);
      expect(ids).toEqual(
        expect.arrayContaining([
          followUpId.upcoming,
          followUpId.missed,
          followUpId.distant,
          followUpId.completed,
        ]),
      );
      expect(ids).toHaveLength(4);
    });

    it('does not list another clinician’s patient', async () => {
      const ids = (await list('/follow-ups', 'mine')).map((f) => f.id);
      expect(ids).not.toContain(followUpId.foreignUpcoming);
      expect(ids).not.toContain(followUpId.foreignMissed);
    });

    it('scopes the upcoming list, and keeps it to the next seven days', async () => {
      const ids = (await list('/follow-ups/upcoming', 'mine')).map((f) => f.id);
      expect(ids).toEqual([followUpId.upcoming]);
      // The one 60 days out is scheduled but not upcoming; the other
      // clinician's is inside the window and still must not appear.
      expect(ids).not.toContain(followUpId.distant);
      expect(ids).not.toContain(followUpId.foreignUpcoming);
    });

    it('scopes the missed list, and finds one the scheduler has already swept', async () => {
      const ids = (await list('/follow-ups/missed', 'mine')).map((f) => f.id);
      expect(ids).toEqual([followUpId.missed]);
      // This one has status MISSED by now rather than an overdue SCHEDULED —
      // the sweep runs on boot — so finding it at all is the regression test.
      // Overdue but COMPLETED is not missed; overdue but someone else's is not
      // this clinician's to chase.
      expect(ids).not.toContain(followUpId.completed);
      expect(ids).not.toContain(followUpId.foreignMissed);
    });

    it('scopes the dashboard counts', async () => {
      const stats = body<Stats>(
        await http
          .get('/follow-ups/dashboard-stats')
          .set('Authorization', `Bearer ${token.mine}`)
          .expect(200),
      );
      // Two still SCHEDULED in scope (upcoming, distant) — the overdue one has
      // been swept to MISSED by the background scheduler, which runs on boot.
      // That sweep is precisely why `missed` counts both states.
      expect(stats).toMatchObject({
        scheduled: 2,
        completed: 1,
        missed: 1,
        upcoming: 1,
        cancelled: 0,
      });
    });
  });

  describe('an oversight role sees everything', () => {
    it('lists every follow-up, both clinicians’', async () => {
      const ids = (await list('/follow-ups', 'executive')).map((f) => f.id);
      expect(ids).toHaveLength(6);
      expect(ids).toEqual(
        expect.arrayContaining([
          followUpId.foreignUpcoming,
          followUpId.foreignMissed,
        ]),
      );
    });

    it('counts every follow-up', async () => {
      const stats = body<Stats>(
        await http
          .get('/follow-ups/dashboard-stats')
          .set('Authorization', `Bearer ${token.executive}`)
          .expect(200),
      );
      // Three still SCHEDULED across both clinicians (two upcoming, one
      // distant); the two overdue ones have been swept to MISSED.
      expect(stats.scheduled).toBe(3);
      expect(stats.completed).toBe(1);
      expect(stats.missed).toBe(2);
    });
  });

  describe('reaching a record outside the caseload', () => {
    it('404s a scoped read of another clinician’s follow-up by id', async () => {
      await http
        .get(`/follow-ups/${followUpId.foreignUpcoming}`)
        .set('Authorization', `Bearer ${token.mine}`)
        .expect(404);
    });

    it('allows a status change on it, and records the override', async () => {
      // Deliberately permitted: a clinician must not be blocked from a walk-in
      // or an emergency by missing paperwork. The accountability is the audit
      // row, so that is what is asserted.
      const before = await prisma.auditLog.count({
        where: { action: 'PHI_ACCESS_OVERRIDE', userId: userId.mine },
      });

      await http
        .patch(`/follow-ups/${followUpId.foreignMissed}/status`)
        .set('Authorization', `Bearer ${token.mine}`)
        .send({ status: 'COMPLETED' })
        .expect(200);

      const after = await prisma.auditLog.count({
        where: { action: 'PHI_ACCESS_OVERRIDE', userId: userId.mine },
      });
      expect(after).toBe(before + 1);

      const logged = await prisma.auditLog.findFirst({
        where: { action: 'PHI_ACCESS_OVERRIDE', userId: userId.mine },
        orderBy: { createdAt: 'desc' },
      });
      expect(logged?.newData).toContain(othersParticipantId);
      expect(logged?.newData).toContain('PATCH /follow-ups/:id/status');
    });

    it('does not record an override for a patient in the caseload', async () => {
      const before = await prisma.auditLog.count({
        where: { action: 'PHI_ACCESS_OVERRIDE', userId: userId.mine },
      });
      await http
        .patch(`/follow-ups/${followUpId.distant}/status`)
        .set('Authorization', `Bearer ${token.mine}`)
        .send({ status: 'CANCELLED' })
        .expect(200);
      const after = await prisma.auditLog.count({
        where: { action: 'PHI_ACCESS_OVERRIDE', userId: userId.mine },
      });
      expect(after).toBe(before);
    });

    it('404s a follow-up that does not exist', async () => {
      await http
        .get('/follow-ups/3f2504e0-4f89-11d3-9a0c-0305e82c3301')
        .set('Authorization', `Bearer ${token.mine}`)
        .expect(404);
    });
  });
});
