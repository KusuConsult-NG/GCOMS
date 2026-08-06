import { randomBytes } from 'crypto';

/**
 * A disposable Postgres schema for one e2e spec, standing in for the throwaway
 * SQLite file these specs used before the move to Postgres.
 *
 * The isolation matters as much as it did then: these specs create users,
 * patients and referrals, and an earlier version booted the AppModule against
 * whatever DATABASE_URL was in .env — which is to say, against the developer's
 * own database. A schema per spec keeps every run in a namespace of its own,
 * and `dropSchema` takes it away afterwards.
 *
 * TEST_DATABASE_URL is required rather than defaulted. A default is one typo
 * away from being the development database, and the failure mode is silent
 * until someone notices their data is gone.
 */
export function useThrowawaySchema(label: string): string {
  const base = process.env.TEST_DATABASE_URL;
  if (!base) {
    throw new Error(
      'TEST_DATABASE_URL must point at a Postgres database these tests may ' +
        'freely write to, e.g. postgresql://postgres@localhost:5432/gcoms_test. ' +
        'It is deliberately not defaulted: the default would eventually be ' +
        'someone’s development database.',
    );
  }
  if (base === process.env.DATABASE_URL) {
    throw new Error(
      'TEST_DATABASE_URL is the same as DATABASE_URL. These specs truncate and ' +
        'recreate what they touch; point them somewhere disposable.',
    );
  }

  const schema = `e2e_${label}_${randomBytes(4).toString('hex')}`;
  const separator = base.includes('?') ? '&' : '?';
  process.env.DATABASE_URL = `${base}${separator}schema=${schema}`;
  return schema;
}

/** Best-effort teardown: a leaked schema is clutter, not a failed test. */
export async function dropSchema(
  prisma: { $executeRawUnsafe: (sql: string) => Promise<unknown> },
  schema: string,
): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  } catch {
    // The run is over either way; a schema left behind in a scratch database
    // is not worth failing a green suite for.
  }
}
