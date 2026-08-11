/**
 * The production guard for `prisma/seed.ts`.
 *
 * It lives here rather than in the seed because the seed calls `main()` at
 * module scope: importing it to test the guard would run the whole seed against
 * whatever DATABASE_URL the test environment happens to hold, which is the
 * accident this guard exists to prevent.
 */

/**
 * The one accepted value. Exported so the seed, the error message and the tests
 * all read the same constant — the guard used to be duplicated with two
 * different sentinels ('yes-i-mean-it' and 'true'), each rejecting the value the
 * other required, so the documented override could not be used at all.
 */
export const PRODUCTION_SEED_OVERRIDE = 'yes-i-mean-it';

/**
 * The seeded accounts all share one password, including SYSTEM_ADMIN. That is
 * fine for a laptop and catastrophic against a live database, and the only
 * thing standing between the two is which DATABASE_URL happens to be in the
 * environment.
 *
 * So it refuses to run in production. The override exists because a first
 * deployment sometimes does want demo data, but it has to be a deliberate act
 * with the reason visible in the shell history — not something a deploy script
 * inherits by accident.
 *
 * To stand up a real deployment, use `npm run db:bootstrap` instead: one
 * administrator, one password nobody else knows, no demo records.
 *
 * No account count in these messages on purpose. There used to be one, it said
 * "thirteen", the list had grown to twenty, and a number kept in step with a
 * list somewhere else is a number that will be wrong again.
 */
export function assertSafeToSeed(
  env: NodeJS.ProcessEnv = process.env,
  warn: (message: string) => void = console.warn,
): void {
  if (env.NODE_ENV !== 'production') return;

  if (env.ALLOW_PRODUCTION_SEED === PRODUCTION_SEED_OVERRIDE) {
    warn(
      '\n⚠️  Seeding a production environment because ALLOW_PRODUCTION_SEED is set.\n' +
        '   Every seeded account is about to share one password. Change them.\n',
    );
    return;
  }

  throw new Error(
    'Refusing to seed: NODE_ENV=production. Every account this creates shares ' +
      'one password, including SYSTEM_ADMIN. To stand up a deployment use ' +
      '`npm run db:bootstrap`, which creates a single administrator. If you ' +
      'genuinely want the demo data, set ' +
      `ALLOW_PRODUCTION_SEED=${PRODUCTION_SEED_OVERRIDE}.`,
  );
}
