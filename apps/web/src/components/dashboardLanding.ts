/**
 * Which workspace `/` renders for a role.
 *
 * Extracted from the switch in the dashboard page so it can be asserted against
 * the page gates, which is the check that would have caught what was there: the
 * switch ended in `default: <ExecutiveWorkspace />`, so four roles landed on a
 * dashboard that reads finance, procurement, grants, projects, inventory and the
 * approval queue — none of which they may read — and it carried a case for
 * 'GOVERNANCE', a role no account can hold.
 *
 * A landing page is not an authorisation decision; the API refuses what it
 * refuses regardless. It is the decision about what someone is shown first, and
 * showing someone a command centre they cannot read is a worse answer than
 * showing them a short list of what they can.
 */
import { canOpen } from './pageAccess';
import { normaliseRole } from '@/lib/roles';

export type Landing =
  | 'finance'
  | 'procurement'
  | 'hr'
  | 'grants'
  | 'projects'
  | 'inventory'
  | 'volunteer'
  | 'clinical'
  | 'admin'
  | 'executive'
  | 'role';

/**
 * The route a landing reads from, where it has one. Used to assert the role
 * being sent there could open that route directly — a landing page is reached
 * without clicking a link, so nothing else checks it.
 */
export const LANDING_ROUTE: Partial<Record<Landing, string>> = {
  finance: '/finance',
  procurement: '/procurement',
  hr: '/hr',
  grants: '/grants',
  projects: '/projects',
  inventory: '/inventory',
  /*
   * The executive dashboard has no route of its own — it renders at `/`. It is
   * mapped to /finance because that is the narrowest of the six modules it
   * reads and the one it puts a headline figure on, so a role that cannot open
   * /finance has no business landing on it. Without this entry the invariant
   * below passed for every role, since `canOpen` returns true for a route it
   * does not know.
   */
  executive: '/finance',
};

export function landingFor(role: string | undefined): Landing {
  switch (normaliseRole(role)) {
    case 'FINANCE':
      return 'finance';
    case 'PROCUREMENT':
      return 'procurement';
    case 'HR':
      return 'hr';
    case 'GRANT_MANAGER':
      return 'grants';
    case 'PROJECT_MANAGER':
      return 'projects';
    case 'INVENTORY_MANAGER':
      return 'inventory';
    case 'VOLUNTEER':
    case 'FIELD_OFFICER':
    case 'COMMUNITY_HEALTH_WORKER':
      return 'volunteer';
    case 'CLINICIAN':
    case 'DOCTOR':
    case 'NURSE':
      return 'clinical';
    case 'ADMIN':
    case 'SYSTEM_ADMIN':
      return 'admin';
    // Named rather than left to the default. The executive dashboard reads every
    // module in the organisation and only these two are entitled to all of it.
    case 'EXECUTIVE':
    case 'BOARD':
      return 'executive';
    default:
      return 'role';
  }
}

/** Whether the role could open the landing's route directly. */
export function landingIsOpenable(role: string): boolean {
  const route = LANDING_ROUTE[landingFor(role)];
  return route === undefined || canOpen(route, role);
}
