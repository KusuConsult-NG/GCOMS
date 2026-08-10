/**
 * Which roles each gated page will render for.
 *
 * These lived as an `allowedRoles` array inside each page, six copies with no
 * relation to one another and none to the API. They drifted, and the drift was
 * invisible until something linked to the page: widening the sidebar to match
 * the API's *_READ_ROLES immediately produced three links that led to "Access
 * Denied", because the page gates had never been widened with it.
 *
 * So they are here, next to `visibleSections`, and a test asserts the two agree:
 * every destination the sidebar offers a role is a page that role can open. A
 * link to a refusal is worse than no link — it tells someone they have access
 * and then takes it away.
 *
 * Each list mirrors the corresponding *_READ_ROLES in the API's
 * auth/roles.constants.ts, which is the authority. These gates decide what to
 * render, never what is permitted; the API decides that, and does so again on
 * every request regardless of what happens here.
 *
 * SUPER_ADMIN appears throughout and no API guard honours it — noted in the
 * API's own constants. It is left alone rather than quietly dropped, because
 * removing it is a decision about existing accounts, not a tidy-up.
 */

/** PROJECT_READ_ROLES. Read is wider than write, so oversight can see delivery. */
export const PROJECT_PAGE_ROLES = [
  'EXECUTIVE',
  'BOARD',
  'SUPER_ADMIN',
  'SYSTEM_ADMIN',
  'ADMIN',
  'PROJECT_MANAGER',
  'PROGRAMME_MANAGER',
];

/** GRANT_READ_ROLES. Finance reads grants because grant money is finance's. */
export const GRANT_PAGE_ROLES = [
  'EXECUTIVE',
  'BOARD',
  'SUPER_ADMIN',
  'SYSTEM_ADMIN',
  'ADMIN',
  'GRANT_MANAGER',
  'PROGRAMME_MANAGER',
  'FINANCE',
];

/** HR_READ_ROLES, plus BOARD, which the page has always admitted. */
export const HR_PAGE_ROLES = [
  'EXECUTIVE',
  'BOARD',
  'SUPER_ADMIN',
  'SYSTEM_ADMIN',
  'ADMIN',
  'HR',
];

/**
 * Governance is management. The previous list ended in 'GOVERNANCE', which is
 * not a role this system issues — a comparison that could never be true, and
 * the same dead value that sat in the sidebar predicate.
 */
export const GOVERNANCE_PAGE_ROLES = [
  'EXECUTIVE',
  'BOARD',
  'SUPER_ADMIN',
  'SYSTEM_ADMIN',
  'ADMIN',
];

/** FINANCE_READ_ROLES. */
export const FINANCE_PAGE_ROLES = [
  'EXECUTIVE',
  'BOARD',
  'SYSTEM_ADMIN',
  'ADMIN',
  'FINANCE',
];

/** PROCUREMENT_READ_ROLES. Finance reads procurement because it pays for it. */
export const PROCUREMENT_PAGE_ROLES = [
  'EXECUTIVE',
  'BOARD',
  'SUPER_ADMIN',
  'SYSTEM_ADMIN',
  'ADMIN',
  'PROCUREMENT',
  'FINANCE',
];

/** INVENTORY_READ_ROLES. Procurement books received goods in as stock. */
export const INVENTORY_PAGE_ROLES = [
  'EXECUTIVE',
  'BOARD',
  'SUPER_ADMIN',
  'SYSTEM_ADMIN',
  'ADMIN',
  'INVENTORY_MANAGER',
  'PROCUREMENT',
];

/**
 * These three gate by redirecting rather than by rendering a refusal, which is
 * why `canOpen` did not know about them: the invariant test looked for an
 * `allowedRoles` array and they had an `if (user.role !== …) router.push('/')`.
 * A bounce back to the dashboard with no message is a worse outcome than an
 * Access Denied screen, not a better one, and it was invisible to every check.
 */
/** system-admin.controller: EXECUTIVE, SYSTEM_ADMIN. */
export const SYSTEM_CONFIG_PAGE_ROLES = [
  'EXECUTIVE',
  'SYSTEM_ADMIN',
  'SUPER_ADMIN',
];

/** admin.controller: ADMIN, EXECUTIVE — plus SYSTEM_ADMIN, which RolesGuard
 *  admits to every route and which the page was bouncing. */
export const ADMIN_OPS_PAGE_ROLES = [
  'EXECUTIVE',
  'SYSTEM_ADMIN',
  'SUPER_ADMIN',
  'ADMIN',
];

/** strategy.controller: EXECUTIVE, BOARD, and SYSTEM_ADMIN on the read. */
export const STRATEGY_PAGE_ROLES = [
  'EXECUTIVE',
  'BOARD',
  'SYSTEM_ADMIN',
  'SUPER_ADMIN',
];

/*
 * Not every role list gates a page. These two decide whether an action is
 * offered — the button that schedules an outreach campaign, the button that
 * sets a strategic goal — and they were written inline in the pages as
 * `user?.role === 'ADMIN' || …`. That is the same duplication with the same
 * drift, one screen further in: a button offered to someone the API refuses is
 * a click that fails, and a button withheld from someone it allows is a feature
 * they cannot find.
 */

/** POST /outreach: ADMIN, SYSTEM_ADMIN, EXECUTIVE. */
export const OUTREACH_WRITE_ROLES = ['ADMIN', 'SYSTEM_ADMIN', 'EXECUTIVE'];

/** POST /strategy/goals: EXECUTIVE, BOARD — plus SYSTEM_ADMIN via RolesGuard. */
export const STRATEGY_WRITE_ROLES = ['EXECUTIVE', 'BOARD', 'SYSTEM_ADMIN'];

/**
 * DOCUMENT_ROLES, which is what POST /documents and /documents/upload require.
 *
 * The page decided this with `user.role !== 'VOLUNTEER'` — an allowlist written
 * as a single denial. Eight roles fell in the gap between the two: a doctor, a
 * nurse, a community health worker, a field officer, a data officer, an
 * inventory manager, a programme manager and a research officer were all shown
 * the upload control and refused by the API when they used it.
 */
export const DOCUMENT_WRITE_ROLES = [
  'DOCUMENT_OFFICER',
  'ADMIN',
  'EXECUTIVE',
  'SYSTEM_ADMIN',
  'SUPER_ADMIN',
  'BOARD',
  'HR',
  'FINANCE',
  'PROCUREMENT',
  'GRANT_MANAGER',
  'PROJECT_MANAGER',
  'CLINICIAN',
];

/**
 * Route to gate, for the pages that carry one. A route absent from this map
 * renders for any signed-in role and relies on the API to refuse what it
 * should — which is the majority, and is fine: these gates are about not
 * showing someone a screen with nothing on it.
 */
export const PAGE_ACCESS: Record<string, string[]> = {
  '/projects': PROJECT_PAGE_ROLES,
  '/grants': GRANT_PAGE_ROLES,
  '/hr': HR_PAGE_ROLES,
  '/governance': GOVERNANCE_PAGE_ROLES,
  '/finance': FINANCE_PAGE_ROLES,
  '/procurement': PROCUREMENT_PAGE_ROLES,
  '/inventory': INVENTORY_PAGE_ROLES,
  '/system-admin': SYSTEM_CONFIG_PAGE_ROLES,
  '/admin-mgmt': ADMIN_OPS_PAGE_ROLES,
  '/strategy': STRATEGY_PAGE_ROLES,
};

/** Whether a role may open a route. Unlisted routes are open to any session. */
export function canOpen(route: string, role: string | undefined): boolean {
  const allowed = PAGE_ACCESS[route];
  if (!allowed) return true;
  return allowed.includes((role || '').toUpperCase().trim());
}
