import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

/**
 * Creates the first administrator on a freshly migrated database.
 *
 * A new deployment has an empty `User` table and there is no public sign-up
 * route, so without this there is no way in: the login page loads and no
 * credential on earth works. The seed cannot fill that role — it creates twenty
 * demo accounts that share one password, including SYSTEM_ADMIN, which is the
 * exact thing it refuses to do against a live database.
 *
 * So this creates exactly one account, with a password nobody else knows, and
 * nothing else. No sample programmes, no second role, no shared secret.
 */

const BCRYPT_ROUNDS = 12;
export const MIN_PASSWORD_LENGTH = 12;

/** Same shape the user-reset path generates: long, random, and printed once. */
export function generatePassword(): string {
  return `${randomBytes(12).toString('base64url')}Aa1!`;
}

export interface BootstrapEnv {
  BOOTSTRAP_ADMIN_EMAIL?: string;
  BOOTSTRAP_ADMIN_PASSWORD?: string;
  BOOTSTRAP_ADMIN_FIRST_NAME?: string;
  BOOTSTRAP_ADMIN_LAST_NAME?: string;
}

export interface BootstrapPassword {
  password: string;
  generated: boolean;
}

export function resolveBootstrapPassword(env: BootstrapEnv): BootstrapPassword {
  const supplied = env.BOOTSTRAP_ADMIN_PASSWORD?.trim();
  if (!supplied) {
    return { password: generatePassword(), generated: true };
  }
  if (supplied.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `BOOTSTRAP_ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters; got ${supplied.length}.`,
    );
  }
  return { password: supplied, generated: false };
}

/**
 * Login lowercases and trims before it looks an account up
 * (`AuthService.validateUser`), so an address stored with different casing is an
 * account that exists and cannot sign in.
 */
export function resolveBootstrapEmail(env: BootstrapEnv): string {
  const email = env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase() ?? '';
  if (!email) {
    throw new Error(
      'BOOTSTRAP_ADMIN_EMAIL is not set. Set it to the address of the first ' +
        'administrator, e.g. BOOTSTRAP_ADMIN_EMAIL=you@example.org.',
    );
  }
  // Deliberately minimal: the point is to catch a value that is obviously not
  // an address (a name, a URL, a shell expansion that did not expand), not to
  // adjudicate RFC 5322.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(
      `BOOTSTRAP_ADMIN_EMAIL does not look like an email address: ${email}`,
    );
  }
  return email;
}

export type BootstrapResult =
  | { created: true; email: string; password: BootstrapPassword }
  | { created: false; reason: 'users-exist'; userCount: number };

/** Just enough of PrismaClient to do this, so the tests need no database. */
export type BootstrapPrisma = Pick<PrismaClient, 'user'>;

export async function bootstrapAdmin(
  prisma: BootstrapPrisma,
  env: BootstrapEnv,
): Promise<BootstrapResult> {
  // Read the configuration before touching the database, so a missing address
  // fails immediately rather than after a round trip.
  const email = resolveBootstrapEmail(env);
  const password = resolveBootstrapPassword(env);

  // Any user at all, not just this address and not just administrators. This
  // runs on a deployment that may redeploy many times, and "there is already
  // somebody here" is the condition that makes creating an account wrong —
  // otherwise a redeploy after the address was renamed would quietly mint a
  // second administrator whose password sits in the environment.
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    return { created: false, reason: 'users-exist', userCount };
  }

  await prisma.user.create({
    data: {
      email,
      password: await bcrypt.hash(password.password, BCRYPT_ROUNDS),
      firstName: env.BOOTSTRAP_ADMIN_FIRST_NAME?.trim() || 'System',
      lastName: env.BOOTSTRAP_ADMIN_LAST_NAME?.trim() || 'Administrator',
      role: 'SYSTEM_ADMIN',
      isActive: true,
    },
  });

  return { created: true, email, password };
}

/* c8 ignore start -- the CLI wrapper; the behaviour above is what is tested. */
async function run(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    const result = await bootstrapAdmin(prisma, process.env);
    if (!result.created) {
      console.log(
        `Nothing to do: this database already has ${result.userCount} ` +
          `account(s). Bootstrap only runs against an empty user table.`,
      );
      return;
    }
    console.log(`\n✅ Created SYSTEM_ADMIN ${result.email}`);
    if (result.password.generated) {
      console.log(
        '\n   Password (shown once, not recoverable — store it now):\n' +
          `   ${result.password.password}\n`,
      );
    } else {
      console.log('   Password: the value of BOOTSTRAP_ADMIN_PASSWORD.\n');
    }
    console.log(
      '   Remove BOOTSTRAP_ADMIN_PASSWORD from the environment once you have ' +
        'signed in and changed it.\n',
    );
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  run().catch((error: unknown) => {
    console.error(
      `\n❌ Bootstrap failed: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });
}
/* c8 ignore stop */
