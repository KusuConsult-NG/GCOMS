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

/*
 * Patient data (PHI) access.
 *
 * Every role NOT listed in PHI_READ_ROLES is denied patient data outright —
 * FINANCE, HR, PROCUREMENT, GRANT_MANAGER, PROJECT_MANAGER, INVENTORY_MANAGER,
 * BOARD and RESEARCH_OFFICER have no clinical need for identified records.
 * (Research works from the research module, which holds no participant data.)
 */

/** Oversight roles: see every patient record, unfiltered. */
export const PHI_UNSCOPED_ROLES: Role[] = [
  'ADMIN',
  'EXECUTIVE',
  'SYSTEM_ADMIN',
  'DATA_OFFICER',
  'PROGRAMME_MANAGER',
];

/**
 * Front-line roles: see only their own caseload — patients they registered, or
 * patients assigned to them via PatientAssignment. They can still reach a
 * record outside that set by id (a walk-in, a referral, a scanned ID pass),
 * which is allowed but written to AuditLog as PHI_ACCESS_OVERRIDE.
 */
export const PHI_SCOPED_ROLES: Role[] = [
  'CLINICIAN',
  'FIELD_OFFICER',
  'COMMUNITY_HEALTH_WORKER',
  'VOLUNTEER',
];

/** Every role permitted to read patient data at all. */
export const PHI_READ_ROLES: Role[] = [
  ...PHI_UNSCOPED_ROLES,
  ...PHI_SCOPED_ROLES,
];

/**
 * Documents were previously readable by an explicit list of ten roles — every
 * role except the one that should own them, because no document role existed.
 */
export const DOCUMENT_ROLES: Role[] = [
  'DOCUMENT_OFFICER',
  'ADMIN',
  'EXECUTIVE',
  'SYSTEM_ADMIN',
  'BOARD',
  'HR',
  'FINANCE',
  'PROCUREMENT',
  'GRANT_MANAGER',
  'PROJECT_MANAGER',
  'CLINICIAN',
];
