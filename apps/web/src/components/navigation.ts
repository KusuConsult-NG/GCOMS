import {
  Activity,
  BookOpen,
  CalendarCheck,
  Compass,
  FileArchive,
  Map,
  Send,
  Target,
  Banknote,
  BarChart3,
  Boxes,
  Building2,
  ClipboardList,
  Contact,
  CreditCard,
  FileSpreadsheet,
  FileText,
  FolderKanban,

  HeartPulse,
  Landmark,
  LayoutDashboard,
  ListChecks,
  Package,
  PlaneTakeoff,
  ScrollText,
  Settings,
  ShieldAlert,
  Stethoscope,
  Tags,
  UserPlus,
  Users,
  Warehouse,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * The sidebar, as data.
 *
 * It was 339 lines of hand-repeated JSX, which is how it ended up with three
 * different link styles, section headings that disagreed about colour, and
 * emoji standing in for icons. Emoji are the wrong tool for this: they render
 * differently on every platform, carry their own colour that no theme can
 * touch, and are announced by screen readers as their unicode name.
 *
 * `kind` is the distinction the old markup had but never expressed. Half these
 * entries navigate somewhere; the other half — the ones that were prefixed with
 * a bare "+" — deep-link into a screen with `?action=` to open a form. Treating
 * both as the same kind of link is why the list read as an undifferentiated
 * wall.
 */
export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  kind: 'nav' | 'action';
  /**
   * Narrower than the section, when the destination is.
   *
   * Command is a management section, but three of its entries are not open to
   * all of management: /system-admin is EXECUTIVE and SYSTEM_ADMIN on the API,
   * /admin-mgmt adds ADMIN, /strategy is EXECUTIVE and BOARD. Without this the
   * section offered all three to every management role, and the two that gate
   * by redirecting — rather than by rendering a refusal — bounced the others
   * back to the dashboard with no explanation at all.
   */
  audience?: NavSection['audience'];
};

export type NavSection = {
  title: string;
  /** Which access predicate gates this section; resolved by the Sidebar. */
  audience:
    | 'management'
    | 'finance'
    | 'procurement'
    | 'hr'
    | 'grant'
    | 'project'
    | 'inventory'
    | 'governance'
    | 'clinician'
    | 'volunteer'
    | 'research'
    | 'documents'
    | 'data'
    | 'systemConfig'
    | 'adminOps'
    | 'strategy';
  items: NavItem[];
};

const nav = (
  label: string,
  href: string,
  icon: LucideIcon,
  audience?: NavSection['audience'],
): NavItem => ({
  label,
  href,
  icon,
  kind: 'nav',
  ...(audience ? { audience } : {}),
});

const action = (label: string, href: string, icon: LucideIcon): NavItem => ({
  label,
  href,
  icon,
  kind: 'action',
});

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Command',
    audience: 'management',
    items: [
      nav('Executive decision support', '/', LayoutDashboard),
      nav('Strategic goals', '/strategy', Target, 'strategy'),
      nav('Admin system management', '/admin-mgmt', Settings, 'adminOps'),
      nav('System configuration', '/system-admin', Settings, 'systemConfig'),
    ],
  },
  {
    title: 'Finance',
    audience: 'finance',
    items: [
      nav('General ledger', '/finance?tab=ledger', Banknote),
      nav('Chart of accounts', '/finance?tab=accounts', Landmark),
      nav('Payment vouchers', '/finance?tab=vouchers', CreditCard),
      nav('Advances & retirements', '/finance?tab=advances', PlaneTakeoff),
      nav('Income & balance sheet', '/finance?tab=statements', FileSpreadsheet),
      action('Raise payment requisition', '/finance?tab=vouchers&action=requisition', UserPlus),
      action('Request travel advance', '/finance?tab=advances&action=advance', UserPlus),
      action('Register grant inflow', '/finance?tab=ledger&action=inflow', UserPlus),
      action('Post journal entry', '/finance?tab=ledger&action=journal', UserPlus),
    ],
  },
  {
    title: 'Procurement',
    audience: 'procurement',
    items: [
      nav('Annual procurement plan', '/procurement', Package),
      nav('Evaluated vendor directory', '/procurement?tab=vendors', Building2),
      action('New purchase requisition', '/procurement?action=new-requisition', UserPlus),
      action('Generate RFQ & bid matrix', '/procurement?action=rfq', UserPlus),
      action('Goods received note', '/procurement?action=grn', UserPlus),
    ],
  },
  {
    title: 'People',
    audience: 'hr',
    items: [
      nav('Employee directory', '/hr', Users),
      nav('Recruitment pipeline', '/hr?tab=recruitment', ClipboardList),
      action('Create staff requisition', '/hr?action=new-staff', UserPlus),
      action('Register volunteer / CHW', '/hr?action=new-volunteer', UserPlus),
      action('File staff leave request', '/hr?action=leave', UserPlus),
    ],
  },
  {
    title: 'Donors & grants',
    audience: 'grant',
    items: [
      nav('Donor directory', '/grants', Contact),
      nav('Grant spend pipeline', '/grants?tab=pipeline', BarChart3),
      action('Register grant award', '/grants?action=new-grant', UserPlus),
      action('Add deliverable milestone', '/grants?action=new-milestone', UserPlus),
    ],
  },
  {
    title: 'Projects',
    audience: 'project',
    items: [
      nav('Project portfolio', '/projects', FolderKanban),
      nav('Task board', '/projects?tab=kanban', ListChecks),
      nav('Risk & issue register', '/projects?tab=risks', ShieldAlert),
      action('Initiate new project', '/projects?action=new-project', UserPlus),
      action('Create task assignment', '/projects?action=new-task', UserPlus),
    ],
  },
  {
    title: 'Inventory & assets',
    audience: 'inventory',
    items: [
      nav('Stock consumables', '/inventory', Warehouse),
      nav('Equipment asset register', '/inventory?tab=assets', Tags),
      action('Log stock issue / movement', '/inventory?action=issue-stock', UserPlus),
      action('Create asset tag', '/inventory?action=new-asset', UserPlus),
    ],
  },
  {
    title: 'Governance',
    audience: 'governance',
    items: [
      nav('Board directory', '/governance', Landmark),
      action('Schedule convening', '/governance?action=new-meeting', UserPlus),
      action('Record minutes & voting', '/governance?action=new-minutes', UserPlus),
    ],
  },
  {
    title: 'Clinical care',
    audience: 'clinician',
    items: [
      nav('Screening & staging', '/clinical', Stethoscope),
      nav('Patient directory', '/patients', HeartPulse),
      nav('Screening results', '/screenings', Activity),
      nav('Referrals', '/referrals', Send),
      nav('Follow-up schedule', '/follow-ups', CalendarCheck),
      nav('Patient navigation', '/navigation', Compass),
    ],
  },
  {
    title: 'Field operations',
    audience: 'volunteer',
    items: [
      nav('Field intake & consent', '/registration', ScrollText),
      nav('Volunteer roster', '/volunteers', Boxes),
      nav('Outreach campaigns', '/outreach', Map),
      nav('Community register', '/communities', Building2),
    ],
  },
  {
    title: 'Research',
    audience: 'research',
    items: [nav('Research projects', '/research', BookOpen)],
  },
  {
    title: 'Documents',
    audience: 'documents',
    items: [nav('Document library', '/documents', FileArchive)],
  },
  {
    title: 'Reporting',
    audience: 'data',
    items: [nav('Reports & exports', '/reports', BarChart3)],
  },
];

export const AUDIT_EXPORT_ICON = FileText;

/**
 * Which sections a role may see.
 *
 * Shared because two components need the same answer: the sidebar to decide
 * what to render, and the topbar to decide what it is allowed to name. When
 * only the sidebar knew, the topbar happily labelled a volunteer's landing page
 * "Executive decision support" — the entry that happens to sit at `/` in a
 * section that volunteer cannot open.
 */
export function visibleSections(role: string | undefined): NavSection[] {
  const normalized = (role || '').toUpperCase().trim();
  const isManagement = ['EXECUTIVE', 'BOARD', 'SUPER_ADMIN', 'ADMIN', 'SYSTEM_ADMIN'].includes(normalized);

  /*
   * Each predicate mirrors the *_READ_ROLES list guarding the module it opens,
   * in the API's auth/roles.constants.ts. They were narrower than those lists:
   * PROGRAMME_MANAGER holds project, grant and report reads and saw none of
   * them, FINANCE holds grant and procurement reads and saw neither, and
   * BOARD — already management here — is in most of them anyway.
   *
   * A sidebar narrower than the API is not a safety margin. It is a screen the
   * user is entitled to and cannot find.
   */
  const audiences: Record<NavSection['audience'], boolean> = {
    management: isManagement,
    finance: normalized === 'FINANCE' || isManagement,
    procurement: ['PROCUREMENT', 'FINANCE'].includes(normalized) || isManagement,
    hr: normalized === 'HR' || isManagement,
    grant:
      ['GRANT_MANAGER', 'PROGRAMME_MANAGER', 'FINANCE'].includes(normalized) ||
      isManagement,
    project:
      ['PROJECT_MANAGER', 'PROGRAMME_MANAGER'].includes(normalized) ||
      isManagement,
    inventory:
      ['INVENTORY_MANAGER', 'PROCUREMENT'].includes(normalized) || isManagement,
    // There is no GOVERNANCE role in the API's vocabulary — this compared
    // against a value no account can hold, so the section was management-only
    // in practice. BOARD is the role that belongs here, and it is management.
    governance: isManagement,
    clinician: ['CLINICIAN', 'DOCTOR', 'NURSE'].includes(normalized) || isManagement,
    volunteer: ['VOLUNTEER', 'FIELD_OFFICER', 'COMMUNITY_HEALTH_WORKER'].includes(normalized) || isManagement,
    // These three mirror the @Roles on the modules they open. Without them the
    // roles below had no sidebar at all — not a reduced one, an empty one —
    // while the API served them perfectly well.
    research: normalized === 'RESEARCH_OFFICER' || isManagement,
    documents:
      ['DOCUMENT_OFFICER', 'HR', 'FINANCE', 'PROCUREMENT', 'GRANT_MANAGER',
        'PROJECT_MANAGER', 'CLINICIAN', 'BOARD'].includes(normalized) ||
      isManagement,
    data: ['DATA_OFFICER', 'PROGRAMME_MANAGER'].includes(normalized) || isManagement,
    // Narrower than management, and each mirrors the @Roles on its own module.
    // BOARD is management here but holds neither of the admin surfaces; ADMIN
    // holds one of them and not the other.
    systemConfig: ['EXECUTIVE', 'SYSTEM_ADMIN', 'SUPER_ADMIN'].includes(normalized),
    adminOps: ['EXECUTIVE', 'SYSTEM_ADMIN', 'SUPER_ADMIN', 'ADMIN'].includes(normalized),
    strategy: ['EXECUTIVE', 'BOARD', 'SYSTEM_ADMIN', 'SUPER_ADMIN'].includes(normalized),
  };

  // An item may be narrower than its section; a section whose every item is
  // filtered out is not rendered as an empty heading.
  return NAV_SECTIONS.filter((section) => audiences[section.audience])
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => item.audience === undefined || audiences[item.audience],
      ),
    }))
    .filter((section) => section.items.length > 0);
}
