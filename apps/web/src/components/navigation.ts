import {
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
    | 'volunteer';
  items: NavItem[];
};

const nav = (label: string, href: string, icon: LucideIcon): NavItem => ({
  label,
  href,
  icon,
  kind: 'nav',
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
      nav('Admin system management', '/admin-mgmt', Settings),
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
    ],
  },
  {
    title: 'Field operations',
    audience: 'volunteer',
    items: [
      nav('Field intake & consent', '/registration', ScrollText),
      nav('Volunteer roster', '/volunteers', Boxes),
    ],
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

  const audiences: Record<NavSection['audience'], boolean> = {
    management: isManagement,
    finance: normalized === 'FINANCE' || isManagement,
    procurement: normalized === 'PROCUREMENT' || isManagement,
    hr: normalized === 'HR' || isManagement,
    grant: normalized === 'GRANT_MANAGER' || isManagement,
    project: normalized === 'PROJECT_MANAGER' || isManagement,
    inventory: normalized === 'INVENTORY_MANAGER' || isManagement,
    governance: normalized === 'GOVERNANCE' || isManagement,
    clinician: ['CLINICIAN', 'DOCTOR', 'NURSE'].includes(normalized) || isManagement,
    volunteer: ['VOLUNTEER', 'FIELD_OFFICER', 'COMMUNITY_HEALTH_WORKER'].includes(normalized) || isManagement,
  };

  return NAV_SECTIONS.filter((section) => audiences[section.audience]);
}
