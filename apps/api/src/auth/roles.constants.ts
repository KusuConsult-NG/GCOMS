/**
 * The single source of truth for role names the API will accept and enforce.
 *
 * Note: the web client also references 'SUPER_ADMIN', 'DOCTOR' and 'NURSE' in its
 * client-side page gates. No API guard honours those, so they are deliberately not
 * listed here — issuing one would produce an account the frontend shows admin
 * screens to while every backend endpoint rejects it.
 */
export const ROLES = [
  'ADMIN',
  'BOARD',
  'CLINICIAN',
  'COMMUNITY_HEALTH_WORKER',
  'DATA_OFFICER',
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

/** Matches the `role` default on the User model in schema.prisma. */
export const DEFAULT_ROLE: Role = 'COMMUNITY_HEALTH_WORKER';

/** Roles allowed to create accounts at all. */
export const USER_ADMIN_ROLES: Role[] = [
  'HR',
  'ADMIN',
  'EXECUTIVE',
  'SYSTEM_ADMIN',
];

/**
 * Roles that confer broad access — RolesGuard grants EXECUTIVE and SYSTEM_ADMIN
 * every route unconditionally. Only the roles in GRANTOR_ROLES may hand these out,
 * so that e.g. HR creating staff accounts cannot mint itself an executive.
 */
export const PRIVILEGED_ROLES: Role[] = ['ADMIN', 'EXECUTIVE', 'SYSTEM_ADMIN'];

/** Roles allowed to assign a PRIVILEGED_ROLE to someone else. */
export const GRANTOR_ROLES: Role[] = ['EXECUTIVE', 'SYSTEM_ADMIN'];
