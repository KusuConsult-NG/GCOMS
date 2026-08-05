"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnv = validateEnv;
const common_1 = require("@nestjs/common");
const KNOWN_WEAK_SECRETS = new Set([
    'gcoms-fallback-secret-must-change-in-prod',
    'gcoms-secure-jwt-key-2026-change-in-production',
    'secret',
    'changeme',
]);
const MIN_SECRET_LENGTH = 32;
function validateEnv(config) {
    const logger = new common_1.Logger('EnvValidation');
    const isProduction = config.NODE_ENV === 'production';
    const errors = [];
    const weaknesses = [];
    const jwtSecret = typeof config.JWT_SECRET === 'string' ? config.JWT_SECRET.trim() : '';
    if (!jwtSecret) {
        errors.push('JWT_SECRET is not set. Generate one with `openssl rand -base64 48` and set it in the environment.');
    }
    else {
        if (KNOWN_WEAK_SECRETS.has(jwtSecret)) {
            weaknesses.push('it is a placeholder value that appears in this repository');
        }
        if (jwtSecret.length < MIN_SECRET_LENGTH) {
            weaknesses.push(`it is ${jwtSecret.length} characters, below the ${MIN_SECRET_LENGTH} minimum`);
        }
    }
    if (weaknesses.length > 0) {
        const detail = `JWT_SECRET is unsafe: ${weaknesses.join('; ')}.`;
        if (isProduction) {
            errors.push(`${detail} Refusing to start in production.`);
        }
        else {
            logger.warn(`${detail} This will abort startup when NODE_ENV=production.`);
        }
    }
    if (!config.DATABASE_URL) {
        errors.push('DATABASE_URL is not set.');
    }
    if (errors.length > 0) {
        throw new Error(`Invalid environment configuration:\n${errors.map((e) => `  - ${e}`).join('\n')}`);
    }
    return config;
}
//# sourceMappingURL=env.validation.js.map