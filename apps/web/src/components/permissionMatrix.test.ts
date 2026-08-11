/**
 * That the matrix an administrator reads describes the system they administer.
 *
 * The hand-written table it replaces was wrong in both directions — it withheld
 * access roles actually hold and granted access they do not — and left nine of
 * the twenty roles out entirely. Nothing about it was checkable, because it was
 * eleven rows of literals with no relation to anything.
 *
 * The cases below are the specific claims the old table made and got wrong. They
 * are worth naming rather than folding into "it is derived now", because each is
 * a real permission somebody could have granted or refused on the strength of
 * that screen.
 */
import { describe, expect, it } from 'vitest';
import {
  PERMISSION_MODULES,
  accessFor,
  permissionRows,
} from './permissionMatrix';
import { canOpen } from './pageAccess';
import { ROLES } from '@/lib/roles';

const moduleNamed = (label: string) => {
  const found = PERMISSION_MODULES.find((m) => m.label === label);
  if (!found) throw new Error(`no module ${label}`);
  return found;
};

const access = (label: string, role: string) =>
  accessFor(moduleNamed(label), role);

describe('permissionRows', () => {
  it('has a row for every role the system issues', () => {
    // Nine were missing, including the four that had no sidebar and no landing
    // page — so the screen that was supposed to explain them said nothing.
    expect(permissionRows().map((r) => r.role)).toEqual([...ROLES]);
  });

  it('gives every row a verdict per column', () => {
    for (const row of permissionRows()) {
      expect(row.access).toHaveLength(PERMISSION_MODULES.length);
    }
  });
});

describe('what the old table got wrong', () => {
  it('shows BOARD reading procurement, grants and projects', () => {
    // All three showed a dash. BOARD is in all three *_READ_ROLES.
    expect(access('Procurement', 'BOARD')).toBe('VIEW');
    expect(access('Grants', 'BOARD')).toBe('VIEW');
    expect(access('Projects', 'BOARD')).toBe('VIEW');
  });

  it('shows FINANCE reading procurement and grants', () => {
    // Grant money is finance's, and finance pays the procurement invoices.
    expect(access('Procurement', 'FINANCE')).toBe('VIEW');
    expect(access('Grants', 'FINANCE')).toBe('VIEW');
  });

  it('shows PROCUREMENT reading inventory but not writing it', () => {
    // The old table said YES. INVENTORY_WRITE_ROLES does not name it, so an
    // administrator reading that row would have expected stock adjustments to
    // work and they do not.
    expect(access('Inventory', 'PROCUREMENT')).toBe('VIEW');
  });

  it('shows CLINICIAN with no inventory access at all', () => {
    // The old table said VIEW. INVENTORY_READ_ROLES does not name it.
    expect(access('Inventory', 'CLINICIAN')).toBe('NONE');
  });

  it('separates seeing the approval queue from resolving it', () => {
    // The old "Executive" column collapsed the two. Administering the system is
    // not authority to commit money — the distinction the API draws in
    // APPROVAL_VIEW_ROLES versus APPROVER_ROLES.
    expect(access('Approvals', 'ADMIN')).toBe('VIEW');
    expect(access('Approvals', 'BOARD')).toBe('FULL');
  });

  it('gives ADMIN a row', () => {
    const admin = permissionRows().find((r) => r.role === 'ADMIN');
    expect(admin?.access).toContain('FULL');
  });
});

describe('the unconditional roles', () => {
  it('shows EXECUTIVE and SYSTEM_ADMIN full access to everything', () => {
    // RolesGuard admits both to every guarded route regardless of @Roles. A
    // matrix that showed them anything narrower would understate exactly the
    // accounts an administrator most needs to understand before issuing one.
    for (const role of ['EXECUTIVE', 'SYSTEM_ADMIN']) {
      for (const m of PERMISSION_MODULES) {
        expect(accessFor(m, role), `${role} / ${m.label}`).toBe('FULL');
      }
    }
  });
});

describe('the matrix agrees with the page gates', () => {
  /*
   * Both mirror the API's constants, so they must agree with each other. Where
   * a module has a gated page, "may open the page" and "not NONE in the matrix"
   * are the same claim — and if they ever diverge, one of the two is lying to
   * somebody.
   */
  const gated: [string, string][] = [
    ['Finance', '/finance'],
    ['Procurement', '/procurement'],
    ['People', '/hr'],
    ['Grants', '/grants'],
    ['Projects', '/projects'],
    ['Inventory', '/inventory'],
    ['Governance', '/governance'],
  ];

  it('says NONE exactly when the page would refuse', () => {
    const disagreements: string[] = [];
    for (const [label, route] of gated) {
      for (const role of ROLES) {
        const matrixAllows = access(label, role) !== 'NONE';
        if (matrixAllows !== canOpen(route, role)) {
          disagreements.push(`${role} / ${label}: matrix=${access(label, role)}, canOpen=${canOpen(route, role)}`);
        }
      }
    }
    expect(disagreements).toEqual([]);
  });
});

describe('accessFor', () => {
  it('normalises the role like every other gate', () => {
    expect(access('Finance', ' finance ')).toBe('FULL');
  });

  it('gives a role the system does not issue nothing', () => {
    for (const m of PERMISSION_MODULES) {
      expect(accessFor(m, 'MARKETING')).toBe('NONE');
    }
  });
});
