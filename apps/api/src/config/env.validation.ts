import { Logger } from '@nestjs/common';

/**
 * Secrets that have shipped in this repository's scaffolding at some point. They
 * are public knowledge and must never be used to sign tokens.
 */
const KNOWN_WEAK_SECRETS = new Set([
  'gcoms-fallback-secret-must-change-in-prod',
  'gcoms-secure-jwt-key-2026-change-in-production',
  'secret',
  'changeme',
]);

const MIN_SECRET_LENGTH = 32;

/**
 * Validates process env at bootstrap. A missing JWT_SECRET or DATABASE_URL always
 * aborts startup — there are deliberately no in-code defaults, because a silent
 * fallback means tokens get signed with a value an attacker can read in the repo.
 * A weak-but-present secret aborts in production and warns elsewhere, so local
 * development keeps working with the checked-in .env.
 */
export function validateEnv(config: Record<string, unknown>) {
  const logger = new Logger('EnvValidation');
  const isProduction = config.NODE_ENV === 'production';

  const errors: string[] = [];
  const weaknesses: string[] = [];

  const jwtSecret =
    typeof config.JWT_SECRET === 'string' ? config.JWT_SECRET.trim() : '';

  if (!jwtSecret) {
    errors.push(
      'JWT_SECRET is not set. Generate one with `openssl rand -base64 48` and set it in the environment.',
    );
  } else {
    if (KNOWN_WEAK_SECRETS.has(jwtSecret)) {
      weaknesses.push(
        'it is a placeholder value that appears in this repository',
      );
    }
    if (jwtSecret.length < MIN_SECRET_LENGTH) {
      weaknesses.push(
        `it is ${jwtSecret.length} characters, below the ${MIN_SECRET_LENGTH} minimum`,
      );
    }
  }

  if (weaknesses.length > 0) {
    const detail = `JWT_SECRET is unsafe: ${weaknesses.join('; ')}.`;
    if (isProduction) {
      errors.push(`${detail} Refusing to start in production.`);
    } else {
      logger.warn(
        `${detail} This will abort startup when NODE_ENV=production.`,
      );
    }
  }

  if (!config.DATABASE_URL) {
    errors.push('DATABASE_URL is not set.');
  }

  if (errors.length > 0) {
    throw new Error(
      `Invalid environment configuration:\n${errors.map((e) => `  - ${e}`).join('\n')}`,
    );
  }

  return config;
}
