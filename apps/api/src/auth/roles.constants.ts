/**
 * The single source of truth for role names the API will accept and enforce.
 *
 * DOCTOR and NURSE are distinct because the spec names both and because the
 * distinction is a clinical one, not cosmetic. See CLINICAL_* below for where
 * they diverge.
 *
 * CLINICIAN predates the split and is retained: existing accounts hold it, and
 * silently narrowing a working account's permissions is worse than a slightly
 * redundant role. It is treated as doctor-equivalent, which is what it granted
 * before, so nothing an account could do yesterday stops working today.
 *
 * Note: the web client also references 'SUPER_ADMIN' in its page gates. No API
 * guard honours it, so it stays out — issuing one would produce an account the
 * UI shows admin screens to while every endpoint rejects it.
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
  'DOCTOR',
  'NURSE',
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

/** Recruitment, training and volunteer rosters sit with HR. */
export const RECRUITMENT_ROLES: Role[] = [
  'HR',
  'ADMIN',
  'EXECUTIVE',
  'SYSTEM_ADMIN',
];
/** Procurement vendors and RFQs. */
export const PROCUREMENT_READ_ROLES: Role[] = [
  'PROCUREMENT',
  'FINANCE',
  'ADMIN',
  'EXECUTIVE',
  'SYSTEM_ADMIN',
  'BOARD',
];
export const PROCUREMENT_WRITE_ROLES: Role[] = [
  'PROCUREMENT',
  'ADMIN',
  'EXECUTIVE',
  'SYSTEM_ADMIN',
];

export const JOB_STATUSES = ['OPEN', 'CLOSED', 'FILLED'] as const;
export const APPLICANT_STAGES = [
  'APPLIED',
  'INTERVIEW',
  'OFFER',
  'ACCEPTED',
  'REJECTED',
] as const;
export const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT'] as const;
export const BOARD_ROLES = [
  'CHAIRPERSON',
  'VICE_CHAIRPERSON',
  'SECRETARY',
  'MEMBER',
  'PATRON',
] as const;
export const ACTION_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED'] as const;
export const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH'] as const;
export const RISK_STATUSES = ['OPEN', 'MITIGATING', 'CLOSED'] as const;
export const MOVEMENT_TYPES = [
  'STOCK_RECEIPT',
  'STOCK_ISSUE',
  'TRANSFER',
  'ADJUSTMENT',
  'DISPOSAL',
] as const;
export const DONOR_TYPES = [
  'MULTILATERAL',
  'BILATERAL',
  'FOUNDATION',
  'CORPORATE',
  'INDIVIDUAL',
] as const;
export const REPORT_TYPES = [
  'QUARTERLY',
  'SEMI_ANNUAL',
  'ANNUAL',
  'SPECIAL',
] as const;
export const REPORT_STATUSES = ['UPCOMING', 'SUBMITTED', 'LATE'] as const;
export const VENDOR_STATUSES = ['PENDING', 'VERIFIED', 'SUSPENDED'] as const;
export const RFQ_STATUSES = [
  'OPEN',
  'EVALUATION',
  'COMPLETE',
  'CANCELLED',
] as const;
export const QUOTE_STATUSES = ['SUBMITTED', 'RECOMMENDED', 'REJECTED'] as const;

/**
 * Who may resolve an approval. The spec says "executive board", and BOARD had no
 * approval rights at all. ADMIN and SYSTEM_ADMIN can see the queue but not
 * resolve it — administering the system is not the same as authorising spend.
 */
export const APPROVAL_VIEW_ROLES: Role[] = [
  'EXECUTIVE',
  'BOARD',
  'ADMIN',
  'SYSTEM_ADMIN',
];
export const APPROVER_ROLES: Role[] = ['EXECUTIVE', 'BOARD'];

/**
 * The decisions that resolve an approval request.
 *
 * Not RESOLUTION_STATUSES, which belongs to board resolutions and includes
 * PENDING — an approval request is created PENDING and this is the set it may
 * be moved *to*.
 */
export const APPROVAL_DECISIONS = ['APPROVED', 'REJECTED'] as const;

/*
 * Clinical scheduling vocabularies.
 *
 * These endpoints took `@Body() body: { status: string }` — a bare type
 * annotation, which TypeScript erases and which therefore constrains nothing at
 * runtime. Nest's ValidationPipe validates against a DTO class; with no class
 * there is no metatype, so it does not merely fail to check the value, it does
 * not run at all — `whitelist: true` strips nothing either. Any string reached
 * the database.
 *
 * That is worse than untidy for a status. Every list and count in these modules
 * selects on it, so a follow-up written as anything outside this set is in no
 * list: not scheduled, not completed, not missed, not cancelled. It does not
 * error and it does not show up — it simply stops being counted.
 */
export const FOLLOW_UP_STATUSES = [
  'SCHEDULED',
  'COMPLETED',
  'MISSED',
  'CANCELLED',
] as const;

/**
 * Why a follow-up was scheduled.
 *
 * The clinical workspace's follow-up form marks "Follow-Up Type *" required and
 * offers these five. It had nowhere to go — no column, no DTO field — so the
 * whitelist dropped it and every follow-up was recorded as an undifferentiated
 * appointment. A biopsy result and a medication check are not the same visit,
 * and the person working the list is the one who needs to know which it is.
 */
export const FOLLOW_UP_TYPES = [
  'TREATMENT_REVIEW',
  'POST_CRYOTHERAPY',
  'BIOPSY_RESULT',
  'MEDICATION_CHECK',
  'REFERRAL_OUTCOME',
] as const;

/** Matches the comment on Appointment.status in schema.prisma. */
export const APPOINTMENT_STATUSES = [
  'SCHEDULED',
  'COMPLETED',
  'MISSED',
  'CANCELLED',
] as const;

export const REFERRAL_STATUSES = [
  'PENDING',
  'ACCEPTED',
  'COMPLETED',
  'CANCELLED',
] as const;

/**
 * The cancer categories a screening or an encounter may be classified under.
 *
 * The spec calls for a staging matrix across seventeen categories, and there
 * were two lists: the clinical workspace offered all seventeen, and the
 * screening form offered four — so thirteen of them could not be recorded from
 * the screen whose entire purpose is recording a screening.
 *
 * The two lists also disagreed on the values themselves. The workspace wrote
 * 'Cervical Cancer (VIA / Pap)' and the screening form wrote 'Cervical Cancer'
 * into the same column, which is why `calculateRiskScore` matches on a substring
 * and the LGA analytics query matches with LIKE: those are defences against a
 * column holding whichever spelling the caller happened to use. One vocabulary
 * removes the reason for them, and old rows keep working because the substring
 * matches are left alone.
 */
export const CANCER_TYPES = [
  'Cervical Cancer (VIA / Pap)',
  'Breast Cancer (CBE / Mammogram)',
  'Prostate Cancer (PSA)',
  'Colorectal Cancer',
  'Lung & Thoracic Cancer',
  'Ovarian & Gynecologic Cancer',
  'Liver & Hepatobiliary Cancer',
  'Pancreatic Cancer',
  'Skin & Melanoma',
  'Leukemia & Lymphoma (Blood Cancers)',
  'Pediatric & Childhood Cancers',
  'Head & Neck Cancers',
  'Brain & CNS Tumors',
  'Thyroid & Endocrine Cancers',
  'Renal / Kidney Cancers',
  'Bladder & Urologic Cancers',
  'Testicular Cancer',
] as const;

/**
 * What a screening can conclude.
 *
 * Every positive-case count in this system finds these with a case-insensitive
 * substring — `LOWER(result) LIKE '%positive%'` in the LGA breakdown,
 * `.includes('POSITIVE')` in the risk score and on the clinical dashboard. That
 * works, and it works because the column was unconstrained. Constraining the
 * write path means a new row cannot be spelled a way those counts miss.
 */
export const SCREENING_RESULTS = [
  'Negative',
  'Suspicious',
  'Positive (VIA+)',
  'Positive (Stage 1)',
  'Positive (Stage 2)',
] as const;

/**
 * The seventeen Local Government Areas of Plateau State.
 *
 * Mandatory on patient intake and on the volunteer register, and held as three
 * separate copies in the web client with nothing to check them against. It is
 * a fixed administrative fact, not configuration.
 */
export const PLATEAU_LGAS = [
  'Barkin Ladi LGA',
  'Bassa LGA',
  'Bokkos LGA',
  'Jos East LGA',
  'Jos North LGA',
  'Jos South LGA',
  'Kanam LGA',
  'Kanke LGA',
  'Langtang North LGA',
  'Langtang South LGA',
  'Mangu LGA',
  'Mikang LGA',
  'Pankshin LGA',
  "Quan'Pan LGA",
  'Riyom LGA',
  'Shendam LGA',
  'Wase LGA',
] as const;

/*
 * Clinical roles.
 *
 * The dividing line is medical judgement, not seniority. A nurse in a screening
 * programme does the bulk of the work — triage, vitals, screening, referral,
 * follow-up — and recording those is not a doctor-only act. What is reserved is
 * the interpretive step: a prognosis, and the recommendation drawn from an
 * investigation result. Those are diagnostic conclusions.
 *
 * Getting this wrong in the permissive direction lets unqualified staff record
 * a diagnosis; wrong in the restrictive direction stops a nurse doing their job
 * and gets worked around. The split below errs toward letting nurses work.
 */

/** Anyone who delivers care: triage, vitals, screening, referral, follow-up. */
export const CLINICAL_ROLES: Role[] = ['DOCTOR', 'NURSE', 'CLINICIAN'];

/** Medical judgement: prognosis, investigation recommendations, encounter edits. */
export const DIAGNOSING_ROLES: Role[] = ['DOCTOR', 'CLINICIAN'];

/** Clinical work plus the oversight roles that supervise it. */
export const CLINICAL_WRITE_ROLES: Role[] = [
  ...CLINICAL_ROLES,
  'FIELD_OFFICER',
  'EXECUTIVE',
  'ADMIN',
];

/** Diagnostic acts plus oversight. */
export const DIAGNOSING_WRITE_ROLES: Role[] = [
  ...DIAGNOSING_ROLES,
  'EXECUTIVE',
  'ADMIN',
];

/** Annual procurement plan, goods received notes and contracts. */
export const PLAN_QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const;
export const PLAN_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
export const PLAN_STATUSES = [
  'PLANNED',
  'APPROVED',
  'PROCURED',
  'CANCELLED',
] as const;
export const GRN_CONDITIONS = ['GOOD', 'DAMAGED', 'PARTIAL'] as const;
export const CONTRACT_STATUSES = [
  'DRAFT',
  'ACTIVE',
  'COMPLETED',
  'TERMINATED',
] as const;

/** Vocabularies for records whose routes previously accepted an untyped body. */
export const FACILITY_REQUEST_TYPES = [
  'MAINTENANCE',
  'BOOKING',
  'REPAIR',
] as const;
/**
 * The resources an approval decision can actually be applied to.
 *
 * This is the set ApprovalsService.resolveRequest has a branch for, and it must
 * stay that set. The previous list named seven types of which only two —
 * FINANCE and PROCUREMENT — the resolver handled: HR, GRANT, PROJECT, FACILITY
 * and USER were accepted by validation and executed nothing, while ADMIN and
 * HR_LEAVE, the two the resolver does handle and the two other services
 * actually write, were rejected.
 *
 * So the constraint that exists to stop exactly this was producing exactly
 * this. The DTO's own comment says it: "an unrecognised value produces a
 * request that can be approved but can never execute anything."
 */
export const APPROVAL_RESOURCE_TYPES = [
  'FINANCE',
  'PROCUREMENT',
  /** Facility requests — admin.service.ts. */
  'ADMIN',
  /** Staff leave — hr.service.ts. */
  'HR_LEAVE',
] as const;
export const TRANSACTION_TYPES = ['INCOME', 'EXPENSE'] as const;
export const DOCUMENT_TYPES = [
  'POLICY',
  'GUIDELINE',
  'REPORT',
  'CONTRACT',
  'CERTIFICATE',
  'OTHER',
] as const;
export const RESOLUTION_TYPES = [
  'POLICY',
  'FINANCIAL_APPROVAL',
  'PROGRAMME_APPROVAL',
  'PERSONNEL',
  'GOVERNANCE_AMENDMENT',
] as const;
export const ASSET_CONDITIONS = [
  'NEW',
  'GOOD',
  'FAIR',
  'NEEDS_REPAIR',
  'RETIRED',
] as const;
