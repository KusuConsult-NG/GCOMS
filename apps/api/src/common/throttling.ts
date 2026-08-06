import { createHash } from 'crypto';

/**
 * Rate-limit bucketing.
 *
 * The default @nestjs/throttler tracker is `req.ip`. That is wrong for this
 * deployment in both directions:
 *
 *   - Behind a load balancer without `trust proxy`, every request carries the
 *     proxy's address, so the whole organisation shares one bucket. Twenty
 *     concurrent users trip a 120/min limit between them, and five failed
 *     logins by anyone locks out everybody.
 *   - Turning `trust proxy` on unconditionally is worse: X-Forwarded-For is
 *     client-supplied, so an attacker rotates it and the limiter stops existing.
 *
 * So: trust the proxy only when explicitly configured (see parseTrustProxy),
 * and bucket authenticated traffic by credential rather than by address.
 */

/** Never log or store this — it is derived directly from a bearer token. */
function hashToken(header: string): string {
  return createHash('sha256').update(header).digest('base64url').slice(0, 32);
}

export function clientIp(req: Record<string, any>): string {
  return (req.ip as string) ?? req.socket?.remoteAddress ?? 'unknown';
}

/**
 * General traffic. Authenticated callers are bucketed per credential, so one
 * busy user cannot exhaust the allowance of everyone sharing their egress IP.
 *
 * The global guard runs before JwtAuthGuard, so `req.user` is not populated
 * yet — the raw Authorization header is hashed instead. Two requests bearing
 * the same token share a bucket, which is the property we actually want.
 */
export function requestTracker(req: Record<string, any>): string {
  const header = req.headers?.authorization;
  if (typeof header === 'string' && header.length > 0) {
    return `tok:${hashToken(header)}`;
  }
  return `ip:${clientIp(req)}`;
}

/** Login attempts against one account, wherever they come from. */
export function loginAccountTracker(req: Record<string, any>): string {
  const email = req.body?.email;
  const normalised =
    typeof email === 'string' ? email.trim().toLowerCase() : '<none>';
  return `acct:${normalised}`;
}

/** Login attempts from one source, whatever account they target. */
export function loginSourceTracker(req: Record<string, any>): string {
  return `ip:${clientIp(req)}`;
}

/**
 * Express `trust proxy` values. Unset means "not behind a proxy" — the safe
 * default, because getting this wrong in the permissive direction removes rate
 * limiting entirely rather than merely making it too strict.
 *
 * Accepts: a hop count ("1"), "true" (trust any hop — spoofable, avoid),
 * or a comma-separated list of proxy addresses/CIDRs.
 */
export function parseTrustProxy(
  raw: string | undefined,
): boolean | number | string[] | undefined {
  const value = raw?.trim();
  if (!value || value === 'false') return undefined;
  if (value === 'true') return true;

  const hops = Number(value);
  if (Number.isInteger(hops) && hops >= 0) return hops;

  const list = value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
  return list.length > 0 ? list : undefined;
}
