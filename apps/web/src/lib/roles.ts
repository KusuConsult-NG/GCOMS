/**
 * The roles this system issues.
 *
 * A copy of `ROLES` in the API's `auth/roles.constants.ts`, which is the
 * authority — the API validates against it on every account it creates and every
 * request it serves. This is here because the web app needs the same list in
 * three places and had it in none: the sidebar predicate, the dashboard router
 * and the account-creation form each carried a different partial version.
 *
 * The partial versions all omitted the same roles, and the omissions compounded.
 * DATA_OFFICER, DOCUMENT_OFFICER, PROGRAMME_MANAGER and RESEARCH_OFFICER were
 * missing from the sidebar (so those accounts had no menu), missing from the
 * dashboard router (so they landed on the executive command centre, where every
 * request they make is refused), and missing from the role dropdown on the
 * system administration screen — which means the four accounts nothing worked
 * for were also four accounts an administrator could not create. INVENTORY_MANAGER
 * was missing from that dropdown too, the same role whose own module had locked
 * it out.
 *
 * `roles.test.ts` reads the API's constants file and asserts these agree, so the
 * twenty-first role cannot be added on one side alone.
 */
export const ROLES = [
  'ADMIN',
  'BOARD',
  'CLINICIAN',
  'COMMUNITY_HEALTH_WORKER',
  'DOCTOR',
  'NURSE',
  'DATA_OFFICER',
  'DOCUMENT_OFFICER',
  'EXECUTIVE',
  'FIELD_OFFICER',
  'FINANCE',
  'GRANT_MANAGER',
  'HR',
  'INVENTORY_MANAGER',
  'PROCUREMENT',
  'PROGRAMME_MANAGER',
  'PROJECT_MANAGER',
  'RESEARCH_OFFICER',
  'SYSTEM_ADMIN',
  'VOLUNTEER',
] as const;

export type Role = (typeof ROLES)[number];

/**
 * How a role reads on screen. The raw constant is what the API stores and what
 * every gate compares against, so it is never rewritten — only labelled.
 */
export function roleLabel(role: string): string {
  return role
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

/** The form every gate in this app compares against. */
export function normaliseRole(role: string | undefined): string {
  return (role || '').toUpperCase().trim();
}

export function isKnownRole(role: string | undefined): role is Role {
  return (ROLES as readonly string[]).includes(normaliseRole(role));
}
