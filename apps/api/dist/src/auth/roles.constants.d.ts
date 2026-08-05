export declare const ROLES: readonly ["ADMIN", "BOARD", "CLINICIAN", "COMMUNITY_HEALTH_WORKER", "DATA_OFFICER", "EXECUTIVE", "FIELD_OFFICER", "FINANCE", "GRANT_MANAGER", "HR", "INVENTORY_MANAGER", "PROCUREMENT", "PROGRAMME_MANAGER", "PROJECT_MANAGER", "RESEARCH_OFFICER", "SYSTEM_ADMIN", "VOLUNTEER"];
export type Role = (typeof ROLES)[number];
export declare const DEFAULT_ROLE: Role;
export declare const USER_ADMIN_ROLES: Role[];
export declare const PRIVILEGED_ROLES: Role[];
export declare const GRANTOR_ROLES: Role[];
