/**
 * That every page gate is one this module knows about.
 *
 * The sidebar/page-gate invariant in navigation.test.ts is only as good as
 * PAGE_ACCESS is complete: `canOpen` returns true for a route it has never
 * heard of, so a gate defined somewhere it does not know about is not a failing
 * test, it is a silently passing one.
 *
 * That is not hypothetical. Six pages declared `const allowedRoles = [...]` and
 * a seventh — procurement — declared `const ALLOWED_ROLES = [...]`. A grep for
 * the first name found six, the invariant test was written against those six
 * and passed, and the browser still found a dead link into /procurement,
 * because the route defaulted to open in a map that had never included it.
 *
 * So this reads the page sources. It is an unusual thing for a unit test to do,
 * and it is the only way to assert the absence of something: no page may hold a
 * role list of its own, because a list of its own is exactly what nothing can
 * see.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PAGE_ACCESS, canOpen } from './pageAccess';

const DASHBOARD = join(process.cwd(), 'src/app/(dashboard)');

/** Every route directory with a page in it. */
const routes = readdirSync(DASHBOARD, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name);

describe('page access', () => {
  it('declares no role list inside a page', () => {
    // Matches a const bound to an array literal whose first entry is an
    // ALL_CAPS string — which is what every one of these looked like.
    //
    // The optional group is a type annotation. Written as `[:=][^=]*=` it
    // required a second `=` and therefore matched nothing at all: the first
    // version of this test passed against a deliberately reintroduced inline
    // gate, which is the same way of being wrong it was written to catch.
    const inlineGate =
      /const\s+\w*(?:allowedRoles|ALLOWED_ROLES)\w*\s*(?::[^=]+)?=\s*\[\s*'[A-Z_]+'/;
    const offenders = routes.filter((route) => {
      const source = readFileSync(join(DASHBOARD, route, 'page.tsx'), 'utf8');
      return inlineGate.test(source);
    });
    expect(offenders).toEqual([]);
  });

  it('gates no page by comparing the role inline', () => {
    /*
     * The other shape, and the one that got past the check above.
     *
     * /admin-mgmt and /system-admin did not declare an `allowedRoles` array —
     * they wrote `if (user.role !== 'ADMIN' && user.role !== 'EXECUTIVE')` and
     * redirected. So they were gated, they disagreed with the sidebar, and no
     * assertion here could see them, because the scan was looking for the one
     * shape it already knew about. A bounce to the dashboard with no message is
     * a worse outcome than an Access Denied screen, and it was invisible.
     */
    const inlineComparison = /user\??\.role\s*(===|!==)\s*'[A-Z_]+'/;
    const offenders = routes.filter((route) => {
      const source = readFileSync(join(DASHBOARD, route, 'page.tsx'), 'utf8');
      return inlineComparison.test(source);
    });
    expect(offenders).toEqual([]);
  });

  it('every route it gates actually exists', () => {
    for (const route of Object.keys(PAGE_ACCESS)) {
      expect(routes).toContain(route.replace(/^\//, ''));
    }
  });

  it('admits nobody a role list does not name', () => {
    expect(canOpen('/finance', 'VOLUNTEER')).toBe(false);
    expect(canOpen('/hr', 'CLINICIAN')).toBe(false);
    expect(canOpen('/grants', 'NURSE')).toBe(false);
  });

  it('admits the roles the API grants a read to', () => {
    expect(canOpen('/grants', 'PROGRAMME_MANAGER')).toBe(true);
    expect(canOpen('/grants', 'FINANCE')).toBe(true);
    expect(canOpen('/projects', 'PROGRAMME_MANAGER')).toBe(true);
    expect(canOpen('/inventory', 'PROCUREMENT')).toBe(true);
    expect(canOpen('/procurement', 'FINANCE')).toBe(true);
  });

  it('leaves an ungated route open, and says so by returning true', () => {
    // The majority of routes. They render for any signed-in role and rely on
    // the API to refuse what it should, which it does on every request.
    expect(canOpen('/patients', 'VOLUNTEER')).toBe(true);
    expect(canOpen('/research', 'RESEARCH_OFFICER')).toBe(true);
  });

  it('normalises the role the way the sidebar does', () => {
    expect(canOpen('/finance', ' finance ')).toBe(true);
    expect(canOpen('/finance', 'Finance')).toBe(true);
    expect(canOpen('/finance', undefined)).toBe(false);
  });
});
