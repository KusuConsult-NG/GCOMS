import { Logger } from '@nestjs/common';
import { validateEnv } from './env.validation';

const STRONG = 'x'.repeat(48);
const PLACEHOLDER = 'gcoms-secure-jwt-key-2026-change-in-production';

describe('validateEnv', () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
  });
  afterEach(() => warn.mockRestore());

  const base = { DATABASE_URL: 'file:./test.db', JWT_SECRET: STRONG };

  it('accepts a strong secret', () => {
    expect(() => validateEnv({ ...base })).not.toThrow();
  });

  it('returns the config so ConfigModule keeps the values', () => {
    expect(validateEnv({ ...base })).toMatchObject(base);
  });

  // The whole point of this file: there is no in-code fallback, so a missing
  // secret must stop the process rather than silently signing tokens with a
  // value that is readable in the repository.
  it('throws when JWT_SECRET is absent', () => {
    expect(() => validateEnv({ DATABASE_URL: base.DATABASE_URL })).toThrow(
      /JWT_SECRET is not set/,
    );
  });

  it('throws when JWT_SECRET is blank', () => {
    expect(() => validateEnv({ ...base, JWT_SECRET: '   ' })).toThrow(
      /JWT_SECRET is not set/,
    );
  });

  it('throws when DATABASE_URL is absent', () => {
    expect(() => validateEnv({ JWT_SECRET: STRONG })).toThrow(
      /DATABASE_URL is not set/,
    );
  });

  describe('a placeholder secret', () => {
    it('aborts startup in production', () => {
      expect(() =>
        validateEnv({
          ...base,
          JWT_SECRET: PLACEHOLDER,
          NODE_ENV: 'production',
        }),
      ).toThrow(/placeholder value/);
    });

    it('only warns outside production, so local dev still runs', () => {
      expect(() =>
        validateEnv({ ...base, JWT_SECRET: PLACEHOLDER }),
      ).not.toThrow();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('placeholder'));
    });
  });

  describe('a short secret', () => {
    it('aborts startup in production', () => {
      expect(() =>
        validateEnv({
          ...base,
          JWT_SECRET: 'tooshort',
          NODE_ENV: 'production',
        }),
      ).toThrow(/below the 32/);
    });

    it('only warns outside production', () => {
      expect(() =>
        validateEnv({ ...base, JWT_SECRET: 'tooshort' }),
      ).not.toThrow();
      expect(warn).toHaveBeenCalled();
    });
  });

  it('reports every problem at once rather than one per restart', () => {
    expect(() => validateEnv({ NODE_ENV: 'production' })).toThrow(
      /JWT_SECRET[\s\S]*DATABASE_URL/,
    );
  });
});
