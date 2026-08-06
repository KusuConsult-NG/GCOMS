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

/** Project management. Read is wider than write, so oversight can see delivery. */
export const PROJECT_READ_ROLES: Role[] = [
  'PROJECT_MANAGER',
  'PROGRAMME_MANAGER',
  'ADMIN',
  'EXECUTIVE',
  'SYSTEM_ADMIN',
  'BOARD',
];
export const PROJECT_WRITE_ROLES: Role[] = [
  'PROJECT_MANAGER',
  'ADMIN',
  'EXECUTIVE',
  'SYSTEM_ADMIN',
];

/** Grant and donor management. */
export const GRANT_READ_ROLES: Role[] = [
  'GRANT_MANAGER',
  'PROGRAMME_MANAGER',
  'FINANCE',
  'ADMIN',
  'EXECUTIVE',
  'SYSTEM_ADMIN',
  'BOARD',
];
export const GRANT_WRITE_ROLES: Role[] = [
  'GRANT_MANAGER',
  'ADMIN',
  'EXECUTIVE',
  'SYSTEM_ADMIN',
];

/** Shared vocabularies, so the API and UI cannot drift apart on status strings. */
export const TASK_STATUSES = [
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'BLOCKED',
] as const;
export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
export const MILESTONE_STATUSES = [
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
] as const;

/** HR records: leave, appraisals, onboarding. */
export const HR_READ_ROLES: Role[] = [
  'HR',
  'ADMIN',
  'EXECUTIVE',
  'SYSTEM_ADMIN',
];
export const HR_WRITE_ROLES: Role[] = [
  'HR',
  'ADMIN',
  'EXECUTIVE',
  'SYSTEM_ADMIN',
];

/** Board and governance records. */
export const GOVERNANCE_ROLES: Role[] = [
  'BOARD',
  'EXECUTIVE',
  'ADMIN',
  'SYSTEM_ADMIN',
];

/** Finance records beyond the transaction ledger. */
export const FINANCE_READ_ROLES: Role[] = [
  'FINANCE',
  'ADMIN',
  'EXECUTIVE',
  'SYSTEM_ADMIN',
  'BOARD',
];
export const FINANCE_WRITE_ROLES: Role[] = [
  'FINANCE',
  'ADMIN',
  'EXECUTIVE',
  'SYSTEM_ADMIN',
];

/** Inventory and equipment servicing. */
export const INVENTORY_READ_ROLES: Role[] = [
  'INVENTORY_MANAGER',
  'PROCUREMENT',
  'ADMIN',
  'EXECUTIVE',
  'SYSTEM_ADMIN',
];
export const INVENTORY_WRITE_ROLES: Role[] = [
  'INVENTORY_MANAGER',
  'ADMIN',
  'EXECUTIVE',
  'SYSTEM_ADMIN',
];

/** Status vocabularies shared with the UI. */
export const LEAVE_TYPES = [
  'ANNUAL',
  'SICK',
  'MATERNITY',
  'PATERNITY',
  'COMPASSIONATE',
  'UNPAID',
] as const;
export const LEAVE_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
] as const;
export const RESOLUTION_STATUSES = ['PENDING', 'PASSED', 'REJECTED'] as const;
export const RECONCILIATION_STATUSES = [
  'PENDING',
  'RECONCILED',
  'DISCREPANCY',
] as const;
export const SERVICE_TYPES = [
  'CALIBRATION',
  'PREVENTIVE_MAINTENANCE',
  'REPAIR',
] as const;
export const SERVICE_STATUSES = ['SCHEDULED', 'COMPLETED', 'OVERDUE'] as const;
export const PROPOSAL_STATUSES = [
  'DRAFT',
  'UNDER_REVIEW',
  'SUBMITTED',
  'AWARDED',
  'REJECTED',
] as const;
