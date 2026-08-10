/**
 * Which sections a role may see.
 *
 * This predicate is shared by the sidebar and the topbar precisely so the two
 * cannot disagree — when only the sidebar knew, the topbar labelled a
 * volunteer's landing page "Executive decision support", a section that role
 * cannot open. That fix is worth a test, but it is not the interesting one.
 *
 * The interesting one is coverage. The sidebar is the only way into most of this
 * application, so a role missing from every audience does not get a reduced
 * sidebar — it gets an empty one, signs in, and finds nothing to click while the
 * API serves it perfectly well. Four roles were in that position:
 * DATA_OFFICER, DOCUMENT_OFFICER, PROGRAMME_MANAGER and RESEARCH_OFFICER. The
 * browser sweep did not catch it because it drives thirteen roles and none of
 * them was one of these.
 *
 * So the case that matters below is the one asserting *every* role in the API's
 * vocabulary reaches something. It fails the day someone adds the twenty-first
 * role and stops there.
 */
import { describe, expect, it } from 'vitest';
import { NAV_SECTIONS, visibleSections } from './navigation';
import { canOpen } from './pageAccess';

/** Mirrors ROLES in the API's auth/roles.constants.ts. */
const ROLES = [
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
];

const titles = (role: string | undefined) =>
  visibleSections(role).map((s) => s.title);

describe('visibleSections', () => {
  it('gives every role in the API vocabulary somewhere to go', () => {
    const stranded = ROLES.filter((role) => visibleSections(role).length === 0);
    expect(stranded).toEqual([]);
  });

  it('gives an unknown role nothing', () => {
    // Not the same case as above. A role the system does not issue should not
    // be quietly handed a menu; the page gates would refuse it anyway.
    expect(visibleSections('MARKETING')).toEqual([]);
    expect(visibleSections(undefined)).toEqual([]);
    expect(visibleSections('')).toEqual([]);
  });

  it('shows an executive everything', () => {
    expect(visibleSections('EXECUTIVE')).toHaveLength(NAV_SECTIONS.length);
  });

  describe('scoping', () => {
    it('keeps finance out of a volunteer sidebar', () => {
      const seen = titles('VOLUNTEER');
      expect(seen).toContain('Field operations');
      expect(seen).not.toContain('Finance');
      expect(seen).not.toContain('Command');
    });

    it('keeps clinical care out of a finance sidebar', () => {
      const seen = titles('FINANCE');
      expect(seen).toContain('Finance');
      expect(seen).not.toContain('Clinical care');
    });

    it('does not show a volunteer the command section', () => {
      // The specific mislabelling this predicate was extracted to prevent: `/`
      // renders a different workspace per role, and the topbar must not name it
      // from a section the viewer cannot open.
      expect(titles('VOLUNTEER')).not.toContain('Command');
    });
  });

  describe('the roles that had no sidebar at all', () => {
    it('research officer reaches research', () => {
      expect(titles('RESEARCH_OFFICER')).toContain('Research');
    });

    it('document officer reaches the document library', () => {
      expect(titles('DOCUMENT_OFFICER')).toContain('Documents');
    });

    it('data officer reaches reporting', () => {
      expect(titles('DATA_OFFICER')).toContain('Reporting');
    });

    it('programme manager reaches reporting', () => {
      expect(titles('PROGRAMME_MANAGER')).toContain('Reporting');
    });
  });

  describe('matching the API rather than being narrower than it', () => {
    // Each of these holds the corresponding *_READ_ROLES grant on the API. A
    // sidebar narrower than the API is not a safety margin — it is a screen the
    // user is entitled to and cannot find.
    it('programme manager sees projects and grants, which it can read', () => {
      const seen = titles('PROGRAMME_MANAGER');
      expect(seen).toContain('Projects');
      expect(seen).toContain('Donors & grants');
    });

    it('finance sees grants and procurement, which it can read', () => {
      const seen = titles('FINANCE');
      expect(seen).toContain('Donors & grants');
      expect(seen).toContain('Procurement');
    });

    it('procurement sees inventory, which it can read and write', () => {
      expect(titles('PROCUREMENT')).toContain('Inventory & assets');
    });

    it('still does not hand anyone a section the API would refuse', () => {
      // The counterpart: finance reads grants, and does not administer people.
      expect(titles('FINANCE')).not.toContain('People');
      expect(titles('PROJECT_MANAGER')).not.toContain('Finance');
      expect(titles('RESEARCH_OFFICER')).not.toContain('Clinical care');
    });
  });

  describe('role names as they actually arrive', () => {
    it('is case-insensitive and tolerates surrounding space', () => {
      // The role comes off a JWT and through a store; being strict here would
      // empty someone's sidebar over a stray space.
      expect(titles(' finance ')).toEqual(titles('FINANCE'));
      expect(titles('Executive')).toEqual(titles('EXECUTIVE'));
    });
  });

  describe('the sidebar agrees with the page gates', () => {
    /*
     * The invariant the other cases missed.
     *
     * Widening the audiences to match the API produced three links that led
     * straight to "Access Denied" — /grants and /projects for PROGRAMME_MANAGER,
     * /inventory for PROCUREMENT — because the page gates were separate arrays
     * inside six page files and had never been widened with anything. Every
     * assertion about the sidebar passed. Only a browser caught it.
     *
     * A link to a refusal is worse than no link: it tells someone they have
     * access and then takes it away.
     */
    it('never offers a role a destination its page will refuse', () => {
      const broken: string[] = [];
      for (const role of ROLES) {
        for (const section of visibleSections(role)) {
          for (const item of section.items) {
            const route = item.href.split('?')[0];
            if (!canOpen(route, role)) broken.push(`${role} -> ${route}`);
          }
        }
      }
      expect(broken).toEqual([]);
    });

    it('does not gate a page against a role that cannot see the link either', () => {
      // The other direction, which is merely untidy rather than broken: a page
      // admitting a role the sidebar never offers it is dead configuration.
      // Asserted for the roles that have a sidebar at all.
      for (const role of ROLES) {
        const offered = new Set(
          visibleSections(role).flatMap((s) =>
            s.items.map((i) => i.href.split('?')[0]),
          ),
        );
        for (const route of ['/finance', '/hr', '/grants', '/projects', '/inventory']) {
          if (canOpen(route, role) && visibleSections(role).length > 0) {
            expect(offered.has(route)).toBe(true);
          }
        }
      }
    });
  });

  describe('items narrower than their section', () => {
    /*
     * Command is a management section, but three of its entries are not open to
     * all of management. Two of those gate by redirecting rather than by
     * rendering a refusal, so offering them to the wrong role bounced someone
     * back to the dashboard with no message — the least legible failure of the
     * three, and the one no check could see.
     */
    it('offers system configuration only to the two roles the API allows', () => {
      const named = (role: string) =>
        visibleSections(role).flatMap((s) => s.items.map((i) => i.href));
      expect(named('SYSTEM_ADMIN')).toContain('/system-admin');
      expect(named('EXECUTIVE')).toContain('/system-admin');
      expect(named('BOARD')).not.toContain('/system-admin');
      expect(named('ADMIN')).not.toContain('/system-admin');
    });

    it('offers admin operations to ADMIN as well, and not to the board', () => {
      const named = (role: string) =>
        visibleSections(role).flatMap((s) => s.items.map((i) => i.href));
      expect(named('ADMIN')).toContain('/admin-mgmt');
      expect(named('BOARD')).not.toContain('/admin-mgmt');
    });

    it('offers strategy to the board, which sets it, and not to ADMIN', () => {
      const named = (role: string) =>
        visibleSections(role).flatMap((s) => s.items.map((i) => i.href));
      expect(named('BOARD')).toContain('/strategy');
      expect(named('ADMIN')).not.toContain('/strategy');
    });

    it('renders no section left empty by item filtering', () => {
      for (const role of ROLES) {
        for (const section of visibleSections(role)) {
          expect(section.items.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('the sections themselves', () => {
    it('gives every item a destination and a kind', () => {
      for (const section of NAV_SECTIONS) {
        for (const item of section.items) {
          expect(item.href.startsWith('/')).toBe(true);
          expect(['nav', 'action']).toContain(item.kind);
          expect(item.label.trim()).not.toBe('');
        }
      }
    });

    it('does not link the same destination twice', () => {
      const hrefs = NAV_SECTIONS.flatMap((s) => s.items.map((i) => i.href));
      expect(new Set(hrefs).size).toBe(hrefs.length);
    });

    it('reaches every dashboard route that is not opened from a workspace', () => {
      // /mobile-preview is a development-only mockup and deliberately unlinked.
      // /registration and the rest are covered by the sections above; this
      // pins the five that were reachable from nowhere at all — no sidebar
      // entry, no button, no link anywhere in the application.
      const reachable = new Set(
        NAV_SECTIONS.flatMap((s) => s.items.map((i) => i.href.split('?')[0])),
      );
      for (const route of [
        '/research',
        '/documents',
        '/communities',
        '/navigation',
        '/system-admin',
      ]) {
        expect(reachable).toContain(route);
      }
    });
  });
});
