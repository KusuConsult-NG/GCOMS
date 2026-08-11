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
import { readFileSync, readdirSync } from 'node:fs';
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

/**
 * That no controller declares its body shape inline.
 *
 * The first sweep of this found twelve and called it done. It found twelve
 * because the grep behind it was single-line — `@Body() body: {` — and six more
 * wrote the brace on the next line, including `vitals`, where the columns are
 * clinical observations a clinician reads and acts on.
 *
 * A pattern that has already missed a third of its subject once should not be
 * trusted to have found the rest. So this walks the sources instead of a
 * developer's memory, and it fails the day someone adds the nineteenth.
 */
describe('no controller validates by type annotation alone', () => {
  it('has no inline @Body() shape anywhere', () => {
    const root = 'src';
    const controllers: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = `${dir}/${entry.name}`;
        if (entry.isDirectory()) walk(full);
        else if (entry.name.endsWith('.controller.ts')) controllers.push(full);
      }
    };
    walk(root);
    expect(controllers.length).toBeGreaterThan(30);

    // Newline permitted between the decorator and the parameter, which is the
    // whole reason the single-line version missed six.
    const inlineBody = /@Body\(\)\s*\n?\s*\w+\s*:\s*\{/;
    const offenders = controllers.filter((f) =>
      inlineBody.test(readFileSync(f, 'utf8')),
    );
    expect(offenders).toEqual([]);
  });
});

describe('request body validation (e2e)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let prisma: PrismaClient;

  const token: Record<string, string> = {};
  let followUpId: string;
  let referralId: string;
  let researchId: string;
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

    const participant: { id: string } = await prisma.participant.create({
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
    participantId = participant.id;
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

  describe('clinical observations are bounded to what a patient produces', () => {
    /*
     * Vitals were entirely unvalidated — any number, or a string, reached the
     * column. That matters more here than elsewhere because nothing downstream
     * questions a vital sign: it is displayed as recorded, and it is what a
     * clinician reads when deciding what to do next. A systolic of 900 is not a
     * dangerous patient, it is a typo, and the two must not look alike.
     */
    const post = (payload: Record<string, unknown>) =>
      http
        .post('/vitals')
        .set('Authorization', as('clinician'))
        .send({ participantId, ...payload });

    it('refuses an impossible blood pressure', async () => {
      await post({ bpSystolic: 900 }).expect(400);
      await post({ bpSystolic: 5 }).expect(400);
    });

    it('refuses an impossible temperature', async () => {
      await post({ temperature: 250 }).expect(400);
      await post({ temperature: -40 }).expect(400);
    });

    it('refuses an oxygen saturation above 100 percent', async () => {
      await post({ oxygenSat: 150 }).expect(400);
    });

    it('refuses a height entered in metres', async () => {
      // 1.7 rather than 170. BMI divides by the square of this, so it lands as
      // a number ten thousand times too large and is stored like any other.
      await post({ heightCm: 1.7, weightKg: 70 }).expect(400);
    });

    it('accepts a genuine emergency, which is the point of the wide bounds', async () => {
      // Rejecting a real reading would be the worse failure, so where the two
      // trade off the bound is loose: this is a hypertensive crisis with a
      // fever, and it must record.
      await post({
        bpSystolic: 220,
        bpDiastolic: 130,
        pulseRate: 165,
        temperature: 41.2,
        oxygenSat: 82,
      }).expect(201);
    });

    it('computes BMI from a plausible height and weight', async () => {
      const res = await post({ weightKg: 70, heightCm: 170 }).expect(201);
      // 70 / 1.7^2 = 24.2
      expect(body<{ bmi: number }>(res).bmi).toBeCloseTo(24.2, 1);
    });
  });

  describe('a screening is classified from a fixed vocabulary', () => {
    /*
     * cancerType and result were `@IsString() @MaxLength(120)`, so the column
     * held whatever each screen sent — and two screens sent different things.
     * The clinical workspace offered the seventeen categories the spec names;
     * the screening form offered four, spelled differently. 'Cervical Cancer'
     * and 'Cervical Cancer (VIA / Pap)' both meant cervical cancer, nothing
     * could group on the column, and thirteen categories could not be recorded
     * from the screening form at all.
     *
     * The result mattered more. Every positive-case figure in this system is a
     * substring match — `LOWER(result) LIKE '%positive%'` in the LGA breakdown,
     * `.includes('POSITIVE')` in the risk score — because the column was
     * unconstrained. A result meaning positive and not containing the word is a
     * case that happened and appears in no count.
     */
    const screen = (payload: Record<string, unknown>) =>
      http
        .post('/screenings')
        .set('Authorization', as('clinician'))
        .send({ participantId, ...payload });

    it('accepts one of the seventeen categories', async () => {
      const res = await screen({
        cancerType: 'Cervical Cancer (VIA / Pap)',
        result: 'Positive (VIA+)',
      }).expect(201);
      expect(body<{ riskScore: number }>(res).riskScore).toBeGreaterThan(0);
    });

    it('refuses the short spelling the other screen used to send', async () => {
      await screen({
        cancerType: 'Cervical Cancer',
        result: 'Negative',
      }).expect(400);
    });

    it('accepts a category the screening form could not offer', async () => {
      // One of the thirteen. The point of the fix is that this now records.
      await screen({
        cancerType: 'Thyroid & Endocrine Cancers',
        result: 'Suspicious',
      }).expect(201);
    });

    it('refuses a result outside the vocabulary', async () => {
      await screen({
        cancerType: 'Colorectal Cancer',
        result: 'Inconclusive',
      }).expect(400);
    });

    it('leaves no row behind when it refuses', async () => {
      const before = await prisma.screening.count();
      await screen({ cancerType: 'Nonsense', result: 'Negative' }).expect(400);
      expect(await prisma.screening.count()).toBe(before);
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
