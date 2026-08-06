import {
  CLINICAL_ROLES,
  DIAGNOSING_ROLES,
  DEFAULT_ROLE,
  DOCUMENT_ROLES,
  GRANTOR_ROLES,
  PHI_READ_ROLES,
  PHI_SCOPED_ROLES,
  PHI_UNSCOPED_ROLES,
  PRIVILEGED_ROLES,
  ROLES,
  USER_ADMIN_ROLES,
  Role,
} from './roles.constants';

/**
 * These are the invariants the access-control model rests on. A role list that
 * drifts is how a guard silently starts admitting the wrong people, and unlike
 * the guards themselves it produces no error when it happens.
 */
describe('role constants', () => {
  const everyList: Array<[string, Role[]]> = [
    ['PHI_UNSCOPED_ROLES', PHI_UNSCOPED_ROLES],
    ['PHI_SCOPED_ROLES', PHI_SCOPED_ROLES],
    ['PHI_READ_ROLES', PHI_READ_ROLES],
    ['PRIVILEGED_ROLES', PRIVILEGED_ROLES],
    ['GRANTOR_ROLES', GRANTOR_ROLES],
    ['USER_ADMIN_ROLES', USER_ADMIN_ROLES],
    ['DOCUMENT_ROLES', DOCUMENT_ROLES],
  ];

  it.each(everyList)('%s only contains known roles', (_name, list) => {
    for (const role of list) {
      expect(ROLES).toContain(role);
    }
  });

  it.each(everyList)('%s has no duplicates', (_name, list) => {
    expect(new Set(list).size).toBe(list.length);
  });

  it('has no duplicate role names', () => {
    expect(new Set(ROLES).size).toBe(ROLES.length);
  });

  it('uses a default role that exists', () => {
    expect(ROLES).toContain(DEFAULT_ROLE);
  });

  describe('PHI access', () => {
    it('is exactly the union of oversight and front-line roles', () => {
      expect([...PHI_READ_ROLES].sort()).toEqual(
        [...PHI_UNSCOPED_ROLES, ...PHI_SCOPED_ROLES].sort(),
      );
    });

    it('never lets a role be both scoped and unscoped', () => {
      const overlap = PHI_SCOPED_ROLES.filter((r) =>
        PHI_UNSCOPED_ROLES.includes(r),
      );
      expect(overlap).toEqual([]);
    });

    // The original finding: any authenticated account could read patient data.
    it.each([
      'FINANCE',
      'HR',
      'PROCUREMENT',
      'GRANT_MANAGER',
      'PROJECT_MANAGER',
      'INVENTORY_MANAGER',
      'BOARD',
      'RESEARCH_OFFICER',
    ])('denies patient data to %s', (role) => {
      expect(PHI_READ_ROLES).not.toContain(role as Role);
    });

    it.each([
      'CLINICIAN',
      'FIELD_OFFICER',
      'COMMUNITY_HEALTH_WORKER',
      'VOLUNTEER',
    ])(
      'scopes %s to its own caseload rather than denying it outright',
      (role) => {
        expect(PHI_SCOPED_ROLES).toContain(role as Role);
      },
    );
  });

  describe('privilege granting', () => {
    it('only lets grantors hand out broad access', () => {
      for (const role of GRANTOR_ROLES) {
        expect(PRIVILEGED_ROLES).toContain(role);
      }
    });

    // HR onboards staff but must not be able to mint itself an executive.
    it('excludes HR from granting privileged roles', () => {
      expect(USER_ADMIN_ROLES).toContain('HR');
      expect(GRANTOR_ROLES).not.toContain('HR');
    });

    it('keeps every grantor able to administer users at all', () => {
      for (const role of GRANTOR_ROLES) {
        expect(USER_ADMIN_ROLES).toContain(role);
      }
    });
  });

  // SUPER_ADMIN still appears in the web client's page gates while no API guard
  // honours it. Issuing one would create an account the UI shows admin screens
  // to while every endpoint rejects it. DOCTOR and NURSE used to be in this list
  // and are now real roles — see the clinical split below.
  it('does not accept the frontend-only role SUPER_ADMIN', () => {
    expect(ROLES).not.toContain('SUPER_ADMIN' as Role);
  });

  describe('the clinical split', () => {
    it.each(['DOCTOR', 'NURSE', 'CLINICIAN'])('%s can deliver care', (role) => {
      expect(CLINICAL_ROLES).toContain(role as Role);
    });

    // The dividing line is medical judgement. A nurse screens, refers and
    // follows up; a prognosis and an investigation recommendation are
    // diagnostic conclusions.
    it('excludes NURSE from diagnostic acts', () => {
      expect(CLINICAL_ROLES).toContain('NURSE');
      expect(DIAGNOSING_ROLES).not.toContain('NURSE');
    });

    it('keeps DOCTOR able to do both', () => {
      expect(CLINICAL_ROLES).toContain('DOCTOR');
      expect(DIAGNOSING_ROLES).toContain('DOCTOR');
    });

    // CLINICIAN predates the split. Narrowing it would silently strip
    // permissions from every existing clinical account.
    it('leaves the legacy CLINICIAN role doctor-equivalent', () => {
      expect(DIAGNOSING_ROLES).toContain('CLINICIAN');
    });

    it('scopes every clinical role to its own caseload', () => {
      for (const role of CLINICAL_ROLES) {
        expect(PHI_SCOPED_ROLES).toContain(role);
      }
    });

    it('never lets a diagnosing role sit outside the clinical set', () => {
      for (const role of DIAGNOSING_ROLES) {
        expect(CLINICAL_ROLES).toContain(role);
      }
    });
  });
});
