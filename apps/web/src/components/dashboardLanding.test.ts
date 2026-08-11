/**
 * That signing in does not land anyone on a screen they cannot read.
 *
 * `/` is reached without clicking a link, so none of the other checks in this
 * directory see it: the sidebar/page-gate invariant only covers destinations the
 * sidebar offers, and the sidebar does not offer `/` to anyone outside the
 * Command section. That is precisely where the defect was — the landing switch
 * fell through to the Executive Command Centre for every role it had no case
 * for, and four roles had no case.
 */
import { describe, expect, it } from 'vitest';
import {
  LANDING_ROUTE,
  landingFor,
  landingIsOpenable,
} from './dashboardLanding';
import { canOpen } from './pageAccess';
import { visibleSections } from './navigation';
import { ROLES } from '@/lib/roles';

describe('landingFor', () => {
  it('never lands a role on a page that page would refuse', () => {
    // The invariant. A landing that renders Access Denied is the same failure as
    // a sidebar link that does, one step earlier and with no link to blame.
    const broken = ROLES.filter((role) => !landingIsOpenable(role));
    expect(broken).toEqual([]);
  });

  it('gives the executive dashboard only to the two roles entitled to it', () => {
    // It reads finance, procurement, grants, projects, inventory and the
    // approval queue. Anyone else there is reading refusals.
    const executives = ROLES.filter((role) => landingFor(role) === 'executive');
    expect([...executives].sort()).toEqual(['BOARD', 'EXECUTIVE']);
  });

  it('lands the four roles that used to get it on their own page instead', () => {
    for (const role of [
      'DATA_OFFICER',
      'DOCUMENT_OFFICER',
      'PROGRAMME_MANAGER',
      'RESEARCH_OFFICER',
    ]) {
      expect(landingFor(role)).toBe('role');
    }
  });

  it('lands a role this system does not issue on the same page', () => {
    // Which says so, rather than rendering an enterprise dashboard of zeros.
    expect(landingFor('MARKETING')).toBe('role');
    expect(landingFor(undefined)).toBe('role');
    expect(landingFor('')).toBe('role');
  });

  it('has no case for GOVERNANCE, which is not a role', () => {
    // The dead value the switch carried. It falls through like any other
    // unissued role now rather than sitting there looking handled.
    expect(landingFor('GOVERNANCE')).toBe('role');
  });

  it('normalises the role the way every other gate does', () => {
    expect(landingFor(' finance ')).toBe('finance');
    expect(landingFor('Executive')).toBe('executive');
  });

  it('routes each module role to its own module', () => {
    expect(landingFor('FINANCE')).toBe('finance');
    expect(landingFor('PROCUREMENT')).toBe('procurement');
    expect(landingFor('HR')).toBe('hr');
    expect(landingFor('GRANT_MANAGER')).toBe('grants');
    expect(landingFor('PROJECT_MANAGER')).toBe('projects');
    expect(landingFor('INVENTORY_MANAGER')).toBe('inventory');
  });

  it('groups the front-line and clinical roles as the workspaces expect', () => {
    for (const role of ['VOLUNTEER', 'FIELD_OFFICER', 'COMMUNITY_HEALTH_WORKER'])
      expect(landingFor(role)).toBe('volunteer');
    for (const role of ['CLINICIAN', 'DOCTOR', 'NURSE'])
      expect(landingFor(role)).toBe('clinical');
    for (const role of ['ADMIN', 'SYSTEM_ADMIN'])
      expect(landingFor(role)).toBe('admin');
  });
});

describe('LANDING_ROUTE', () => {
  it('names routes the page-gate map knows about', () => {
    for (const route of Object.values(LANDING_ROUTE)) {
      // Otherwise `canOpen` returns true for a route it has never heard of and
      // the invariant above passes without checking anything.
      expect(canOpen(route!, 'VOLUNTEER')).toBe(false);
    }
  });
});

describe('the role landing page', () => {
  it('has something to show every role sent to it', () => {
    // It renders `visibleSections`. If a role lands there with no sections it
    // gets the "nothing assigned" notice, which is honest but should not be the
    // normal case for a role the API grants access to.
    const stranded = ROLES.filter(
      (role) => landingFor(role) === 'role' && visibleSections(role).length === 0,
    );
    expect(stranded).toEqual([]);
  });
});
