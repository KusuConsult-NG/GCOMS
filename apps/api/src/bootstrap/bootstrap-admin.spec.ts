import * as bcrypt from 'bcrypt';
import {
  bootstrapAdmin,
  generatePassword,
  resolveBootstrapEmail,
  resolveBootstrapPassword,
  MIN_PASSWORD_LENGTH,
  type BootstrapPrisma,
} from './bootstrap-admin';

interface CreatedUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
}

/** No database: the only Prisma surface this uses is count and create. */
function fakePrisma(existingUsers = 0) {
  const created: CreatedUser[] = [];
  const prisma = {
    user: {
      count: () => Promise.resolve(existingUsers),
      create: ({ data }: { data: CreatedUser }) => {
        created.push(data);
        return Promise.resolve(data);
      },
    },
  } as unknown as BootstrapPrisma;
  return { prisma, created };
}

describe('resolveBootstrapEmail', () => {
  it('requires an address', () => {
    expect(() => resolveBootstrapEmail({})).toThrow(
      /BOOTSTRAP_ADMIN_EMAIL is not set/,
    );
    expect(() =>
      resolveBootstrapEmail({ BOOTSTRAP_ADMIN_EMAIL: '   ' }),
    ).toThrow(/BOOTSTRAP_ADMIN_EMAIL is not set/);
  });

  it('lowercases and trims, because that is what login does before it looks up', () => {
    // AuthService.validateUser does `email.trim().toLowerCase()`. An account
    // stored as Admin@Example.org is an account that exists and cannot sign in.
    expect(
      resolveBootstrapEmail({ BOOTSTRAP_ADMIN_EMAIL: '  Admin@Example.ORG ' }),
    ).toBe('admin@example.org');
  });

  it('rejects a value that is plainly not an address', () => {
    for (const value of [
      'System Administrator',
      'https://example.org',
      '@',
      'a@b',
    ]) {
      expect(() =>
        resolveBootstrapEmail({ BOOTSTRAP_ADMIN_EMAIL: value }),
      ).toThrow(/does not look like an email address/);
    }
  });
});

describe('resolveBootstrapPassword', () => {
  it('generates one when none is supplied, and says so', () => {
    const resolved = resolveBootstrapPassword({});
    expect(resolved.generated).toBe(true);
    expect(resolved.password.length).toBeGreaterThanOrEqual(
      MIN_PASSWORD_LENGTH,
    );
  });

  it('generates a different password each time', () => {
    const passwords = new Set(
      Array.from({ length: 20 }, () => generatePassword()),
    );
    expect(passwords.size).toBe(20);
  });

  it('takes a supplied password and reports it as not generated', () => {
    const resolved = resolveBootstrapPassword({
      BOOTSTRAP_ADMIN_PASSWORD: 'a-long-enough-password',
    });
    expect(resolved).toEqual({
      password: 'a-long-enough-password',
      generated: false,
    });
  });

  it('refuses a short one rather than quietly padding it', () => {
    expect(() =>
      resolveBootstrapPassword({ BOOTSTRAP_ADMIN_PASSWORD: 'short' }),
    ).toThrow(/at least 12 characters/);
  });
});

describe('bootstrapAdmin', () => {
  const env = { BOOTSTRAP_ADMIN_EMAIL: 'admin@gcoms.org' };

  it('creates exactly one SYSTEM_ADMIN on an empty database', async () => {
    const { prisma, created } = fakePrisma(0);
    const result = await bootstrapAdmin(prisma, env);

    expect(result.created).toBe(true);
    expect(created).toHaveLength(1);
    expect(created[0].email).toBe('admin@gcoms.org');
    expect(created[0].role).toBe('SYSTEM_ADMIN');
    expect(created[0].isActive).toBe(true);
  });

  it('stores a bcrypt hash, not the password', async () => {
    const { prisma, created } = fakePrisma(0);
    await bootstrapAdmin(prisma, {
      ...env,
      BOOTSTRAP_ADMIN_PASSWORD: 'a-long-enough-password',
    });

    expect(created[0].password).not.toBe('a-long-enough-password');
    expect(created[0].password).toMatch(/^\$2[aby]\$/);
    await expect(
      bcrypt.compare('a-long-enough-password', created[0].password),
    ).resolves.toBe(true);
  });

  it('does nothing when the database already has accounts', async () => {
    // This is what makes it safe as a repeated pre-deploy step: a redeploy must
    // not mint a second administrator whose password is sitting in the
    // environment.
    const { prisma, created } = fakePrisma(20);
    const result = await bootstrapAdmin(prisma, env);

    expect(result).toEqual({
      created: false,
      reason: 'users-exist',
      userCount: 20,
    });
    expect(created).toHaveLength(0);
  });

  it('checks the configuration before it touches the database', async () => {
    // A missing address should fail immediately rather than after a round trip
    // — and must never reach `create` with a blank email.
    const { prisma, created } = fakePrisma(0);
    await expect(bootstrapAdmin(prisma, {})).rejects.toThrow(
      /BOOTSTRAP_ADMIN_EMAIL is not set/,
    );
    expect(created).toHaveLength(0);
  });

  it('defaults the name, and takes one when given', async () => {
    const { prisma, created } = fakePrisma(0);
    await bootstrapAdmin(prisma, env);
    expect(created[0]).toMatchObject({
      firstName: 'System',
      lastName: 'Administrator',
    });

    const second = fakePrisma(0);
    await bootstrapAdmin(second.prisma, {
      ...env,
      BOOTSTRAP_ADMIN_FIRST_NAME: 'Retsum',
      BOOTSTRAP_ADMIN_LAST_NAME: 'Anzaku',
    });
    expect(second.created[0]).toMatchObject({
      firstName: 'Retsum',
      lastName: 'Anzaku',
    });
  });

  it('creates no demo data — one row, nothing else', async () => {
    // The distinction from the seed. If this ever starts creating programmes,
    // participants or a second account, it has become the thing it replaced.
    const { prisma, created } = fakePrisma(0);
    await bootstrapAdmin(prisma, env);
    expect(created).toHaveLength(1);
  });
});
