/**
 * That the web app and the API agree on which roles exist.
 *
 * This reads the API's own source rather than a copy of it. Asserting a
 * hand-written list against another hand-written list proves the two were typed
 * by the same person on the same day, which is precisely the state that produced
 * four roles with no sidebar, no landing page and no way to create the account.
 *
 * It is a cross-package read, which is unusual. The alternative is a shared
 * package for one array, and the cost of that is higher than the cost of this.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ROLES, isKnownRole, normaliseRole, roleLabel } from './roles';

// Resolved from this file, not from the working directory: which package vitest
// is invoked in should not decide whether the check runs.
const API_CONSTANTS = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../api/src/auth/roles.constants.ts',
);

describe('the role vocabulary', () => {
  it('matches the API, which is the authority', () => {
    expect(
      existsSync(API_CONSTANTS),
      `expected the API constants at ${API_CONSTANTS}`,
    ).toBe(true);

    const source = readFileSync(API_CONSTANTS, 'utf8');
    const declaration = /export const ROLES = \[([\s\S]*?)\] as const;/.exec(
      source,
    );
    expect(declaration, 'could not find `export const ROLES` in the API').not.toBe(
      null,
    );

    const apiRoles = [...declaration![1].matchAll(/'([A-Z_]+)'/g)].map(
      (m) => m[1],
    );
    expect(apiRoles.length).toBeGreaterThan(15);
    // Sorted, because the order of a vocabulary is not part of it.
    expect([...ROLES].sort()).toEqual([...apiRoles].sort());
  });

  it('holds no duplicates', () => {
    expect(new Set(ROLES).size).toBe(ROLES.length);
  });

  it('does not include SUPER_ADMIN', () => {
    // The page gates reference it and no API guard honours it — issuing one
    // would produce an account the UI shows admin screens to and every
    // endpoint rejects. It stays out of the list accounts are created from.
    expect(ROLES).not.toContain('SUPER_ADMIN');
  });

  it('does not include GOVERNANCE', () => {
    // A value the dashboard router had a case for and no account can hold.
    expect(ROLES).not.toContain('GOVERNANCE');
  });
});

describe('normaliseRole', () => {
  it('matches what the sidebar and the page gates do', () => {
    expect(normaliseRole(' finance ')).toBe('FINANCE');
    expect(normaliseRole(undefined)).toBe('');
  });
});

describe('isKnownRole', () => {
  it('accepts a role the API issues', () => {
    expect(isKnownRole('research_officer')).toBe(true);
  });

  it('rejects one it does not', () => {
    expect(isKnownRole('MARKETING')).toBe(false);
    expect(isKnownRole('SUPER_ADMIN')).toBe(false);
    expect(isKnownRole(undefined)).toBe(false);
  });
});

describe('roleLabel', () => {
  it('reads as words without changing the value', () => {
    expect(roleLabel('COMMUNITY_HEALTH_WORKER')).toBe('Community Health Worker');
    expect(roleLabel('HR')).toBe('Hr');
  });
});
