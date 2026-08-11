/**
 * The role and permission matrix, derived rather than drawn.
 *
 * The System Administration screen carries a table headed "Role & Permission
 * Matrix". It was eleven rows of hand-written 'YES' / 'VIEW' / '-' and it
 * disagreed with the API in both directions:
 *
 *   - BOARD showed a dash under Procurement, Grants and Projects, and is in all
 *     three *_READ_ROLES.
 *   - FINANCE showed a dash under Procurement and Grants, and reads both —
 *     grant money is finance's, and finance pays the procurement invoices.
 *   - PROCUREMENT showed YES under Inventory. It reads inventory; it does not
 *     write it. INVENTORY_WRITE_ROLES does not name it.
 *   - CLINICIAN showed VIEW under Inventory, which it cannot read at all.
 *   - ADMIN had no row, and nine of the twenty roles had no row.
 *
 * A wrong matrix on an administration screen is not cosmetic: it is what someone
 * reads when deciding which role to give a new member of staff. So the table is
 * now computed from the same lists the page gates use, which mirror the API's
 * constants, and the roles come from the shared vocabulary — meaning it grows a
 * row by itself when a role is added, rather than silently omitting it.
 */
import {
  FINANCE_PAGE_ROLES,
  GOVERNANCE_PAGE_ROLES,
  GRANT_PAGE_ROLES,
  HR_PAGE_ROLES,
  INVENTORY_PAGE_ROLES,
  PROCUREMENT_PAGE_ROLES,
  PROJECT_PAGE_ROLES,
  ADMIN_OPS_PAGE_ROLES,
} from './pageAccess';
import { ROLES, normaliseRole } from '@/lib/roles';

/*
 * The write halves, mirroring the *_WRITE_ROLES in the API's roles.constants.ts.
 * The read halves are the page-gate lists above, which mirror *_READ_ROLES.
 */

/** FINANCE_WRITE_ROLES. */
const FINANCE_WRITE = ['FINANCE', 'ADMIN', 'EXECUTIVE', 'SYSTEM_ADMIN'];
/** PROCUREMENT_WRITE_ROLES. */
const PROCUREMENT_WRITE = ['PROCUREMENT', 'ADMIN', 'EXECUTIVE', 'SYSTEM_ADMIN'];
/** HR_WRITE_ROLES. */
const HR_WRITE = ['HR', 'ADMIN', 'EXECUTIVE', 'SYSTEM_ADMIN'];
/** GRANT_WRITE_ROLES. */
const GRANT_WRITE = ['GRANT_MANAGER', 'ADMIN', 'EXECUTIVE', 'SYSTEM_ADMIN'];
/** PROJECT_WRITE_ROLES. */
const PROJECT_WRITE = ['PROJECT_MANAGER', 'ADMIN', 'EXECUTIVE', 'SYSTEM_ADMIN'];
/** INVENTORY_WRITE_ROLES. Procurement reads stock; it does not adjust it. */
const INVENTORY_WRITE = [
  'INVENTORY_MANAGER',
  'ADMIN',
  'EXECUTIVE',
  'SYSTEM_ADMIN',
];
/** PHI_READ_ROLES — who may see a patient record at all. */
const CLINICAL_READ = [
  'ADMIN',
  'EXECUTIVE',
  'SYSTEM_ADMIN',
  'DATA_OFFICER',
  'PROGRAMME_MANAGER',
  'CLINICIAN',
  'DOCTOR',
  'NURSE',
  'FIELD_OFFICER',
  'COMMUNITY_HEALTH_WORKER',
  'VOLUNTEER',
];
/** CLINICAL_WRITE_ROLES. */
const CLINICAL_WRITE = [
  'DOCTOR',
  'NURSE',
  'CLINICIAN',
  'FIELD_OFFICER',
  'EXECUTIVE',
  'ADMIN',
];
/** GOVERNANCE_ROLES; read and write are the same list. */
const GOVERNANCE_WRITE = GOVERNANCE_PAGE_ROLES;
/** APPROVAL_VIEW_ROLES / APPROVER_ROLES. Administering the system is not
 *  authority to commit money, which is why ADMIN sees the queue and cannot
 *  resolve it — the distinction the old matrix's "Executive" column lost. */
const APPROVAL_READ = ['EXECUTIVE', 'BOARD', 'ADMIN', 'SYSTEM_ADMIN'];
const APPROVAL_WRITE = ['EXECUTIVE', 'BOARD'];
/** system-admin.controller. */
const SYSTEM_CONFIG = ['EXECUTIVE', 'SYSTEM_ADMIN', 'SUPER_ADMIN'];

export type Access = 'FULL' | 'VIEW' | 'NONE';

export type PermissionModule = {
  /** Column heading. */
  label: string;
  read: readonly string[];
  write: readonly string[];
};

export const PERMISSION_MODULES: PermissionModule[] = [
  { label: 'Finance', read: FINANCE_PAGE_ROLES, write: FINANCE_WRITE },
  {
    label: 'Procurement',
    read: PROCUREMENT_PAGE_ROLES,
    write: PROCUREMENT_WRITE,
  },
  { label: 'People', read: HR_PAGE_ROLES, write: HR_WRITE },
  { label: 'Grants', read: GRANT_PAGE_ROLES, write: GRANT_WRITE },
  { label: 'Projects', read: PROJECT_PAGE_ROLES, write: PROJECT_WRITE },
  { label: 'Inventory', read: INVENTORY_PAGE_ROLES, write: INVENTORY_WRITE },
  { label: 'Clinical', read: CLINICAL_READ, write: CLINICAL_WRITE },
  { label: 'Governance', read: GOVERNANCE_PAGE_ROLES, write: GOVERNANCE_WRITE },
  { label: 'Approvals', read: APPROVAL_READ, write: APPROVAL_WRITE },
  { label: 'Admin ops', read: ADMIN_OPS_PAGE_ROLES, write: ADMIN_OPS_PAGE_ROLES },
  { label: 'System config', read: SYSTEM_CONFIG, write: SYSTEM_CONFIG },
];

/**
 * RolesGuard admits these two to every route it guards, unconditionally. The
 * matrix has to say so or it understates what those accounts can do, which is
 * the thing an administrator most needs to know before issuing one.
 */
const UNCONDITIONAL = ['EXECUTIVE', 'SYSTEM_ADMIN'];

export function accessFor(module: PermissionModule, role: string): Access {
  const normalised = normaliseRole(role);
  if (UNCONDITIONAL.includes(normalised)) return 'FULL';
  if (module.write.includes(normalised)) return 'FULL';
  if (module.read.includes(normalised)) return 'VIEW';
  return 'NONE';
}

/** One row per role the system issues, in the order the vocabulary lists them. */
export function permissionRows(): { role: string; access: Access[] }[] {
  return ROLES.map((role) => ({
    role,
    access: PERMISSION_MODULES.map((module) => accessFor(module, role)),
  }));
}
