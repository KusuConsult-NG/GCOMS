/**
 * The shapes the API returns.
 *
 * Sixty-three `useState<any[]>([])` declarations held server data, which meant
 * every field read off a row was unchecked. That is how `{a.requestedBy}` came
 * to be rendered as an object and crash the executive dashboard, and how a
 * quote's `vendor` was read as a string when the API returns a relation.
 *
 * These are deliberately partial: they describe what the screens read, not
 * every column. Where a field is optional here it is because the API omits it
 * on some routes, not because it is unimportant.
 */

/** Money crosses the wire as a string from Prisma's Decimal. */
export type Money = string | number;
/** Dates cross as ISO strings. */
export type Timestamp = string;

export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  role?: string;
}

/**
 * The signed-in user, as the auth store holds it. Twelve workspace components
 * took this as `{ user: any }`, so `user.role` — which several of them use to
 * decide what to show — was an unchecked read on every one.
 */
export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface UserRecord extends UserSummary {
  email: string;
  role: string;
  isActive: boolean;
  createdAt?: Timestamp;
}

export interface Participant {
  id: string;
  registrationId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone?: string | null;
  nationalId?: string | null;
  address?: string | null;
  lga?: string | null;
  ward?: string | null;
  createdAt?: Timestamp;
  registeredBy?: UserSummary | null;
}

export interface Screening {
  id: string;
  cancerType: string;
  result: string;
  riskScore?: number | null;
  participantId: string;
  participant?: Participant | null;
  conductedBy?: UserSummary | null;
  createdAt: Timestamp;
}

export interface Referral {
  id: string;
  participantId: string;
  participant?: Participant | null;
  /** The receiving facility. The screen read `destination`, which is not sent. */
  referredTo: string;
  reason: string;
  status: string;
  referredBy?: UserSummary | null;
  createdAt: Timestamp;
}

export interface FollowUp {
  id: string;
  participantId: string;
  participant?: Participant | null;
  clinicianId: string;
  clinician?: UserSummary | null;
  scheduledDate: Timestamp;
  status: string;
  notes?: string | null;
}

export interface PatientAssignment {
  id: string;
  participantId: string;
  participant?: Participant | null;
  clinicianId: string;
  clinician?: UserSummary | null;
  status: string;
  assignedAt: Timestamp;
}

export interface ApprovalRequest {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  resourceType: string;
  resourceId?: string | null;
  /** A relation, not a name. Rendering it directly crashes React. */
  requestedBy?: UserSummary | null;
  approvedBy?: UserSummary | null;
  createdAt: Timestamp;
}

export interface FinanceTransaction {
  id: string;
  amount: Money;
  type: string;
  category: string;
  description: string;
  status: string;
  requestedBy?: UserSummary | null;
  createdAt: Timestamp;
}

export interface InventoryItem {
  id: string;
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  location: string;
  /** The item's own reorder point; the screen used to assume 10 for every item. */
  minThreshold: number;
  unitPrice?: Money | null;
  /** Fixed-asset register; only populated for equipment. */
  assetTag?: string | null;
  serialNumber?: string | null;
  currentLocation?: string | null;
  assignedTo?: string | null;
  condition?: string | null;
  status: string;
  managedBy?: UserSummary | null;
}

export interface StockMovement {
  id: string;
  inventoryItemId: string;
  inventoryItem?: Pick<InventoryItem, 'id' | 'itemName'> | null;
  type: string;
  quantity: number;
  fromLocation?: string | null;
  toLocation?: string | null;
  reference?: string | null;
  authorisedBy?: string | null;
  movementDate: Timestamp;
  remarks?: string | null;
}

export interface Grant {
  id: string;
  donorName: string;
  grantName: string;
  amount: Money;
  startDate: Timestamp;
  endDate: Timestamp;
  status: string;
  managedBy?: UserSummary | null;
}

export interface GrantMilestone {
  id: string;
  grantId: string;
  grant?: Pick<Grant, 'id' | 'grantName'> | null;
  title: string;
  description?: string | null;
  dueDate: Timestamp;
  metric?: string | null;
  progress: number;
  status: string;
}

export interface GrantProposal {
  id: string;
  title: string;
  donorName: string;
  requestedAmount: Money;
  submissionDeadline: Timestamp;
  status: string;
  leadAuthor: string;
}

export interface Donor {
  id: string;
  /** The organisation name. The screen read `org` and `name`, neither sent. */
  organisation: string;
  country?: string | null;
  type: string;
  contactName?: string | null;
  contactTitle?: string | null;
  email?: string | null;
  phone?: string | null;
  /** Comma-separated; SQLite has no array type. */
  interests?: string | null;
  lastContact?: Timestamp | null;
  notes?: string | null;
}

export interface Project {
  id: string;
  projectName: string;
  description: string;
  budget: Money;
  startDate: Timestamp;
  endDate: Timestamp;
  status: string;
  managedBy?: UserSummary | null;
  createdAt?: Timestamp;
  _count?: { tasks: number };
  /** Statuses only — enough to derive completion without a second request. */
  tasks?: Array<{ status: string }>;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  project?: Pick<Project, 'id' | 'projectName'> | null;
  title: string;
  description?: string | null;
  assignee?: string | null;
  dueDate?: Timestamp | null;
  priority: string;
  status: string;
}

export interface StaffRecord {
  id: string;
  userId: string;
  user?: UserSummary | null;
  department: string;
  employmentType: string;
  status: string;
  managedBy?: UserSummary | null;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: string;
  startDate: Timestamp;
  endDate: Timestamp;
  reason?: string | null;
  status: string;
}

export interface Appraisal {
  id: string;
  employeeId: string;
  employee?: UserSummary | null;
  period: string;
  score: number;
  comments?: string | null;
  createdAt: Timestamp;
}

export interface JobOpening {
  id: string;
  title: string;
  department: string;
  employmentType: string;
  location: string;
  deadline: Timestamp;
  status: string;
  applicants?: JobApplicant[];
}

export interface JobApplicant {
  id: string;
  jobOpeningId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  stage: string;
  notes?: string | null;
}

export interface TrainingRecord {
  id: string;
  staffName: string;
  title: string;
  provider?: string | null;
  type: string;
  trainingDate: Timestamp;
  certified: boolean;
  expiryDate?: Timestamp | null;
  status: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  userId: string;
  user?: UserSummary | null;
  oldData?: string | null;
  newData?: string | null;
  createdAt: Timestamp;
}

export interface BoardMember {
  id: string;
  name: string;
  title?: string | null;
  role: string;
  /** Comma-separated: SQLite has no array type. */
  committees?: string | null;
  phone?: string | null;
  email?: string | null;
  termStart: Timestamp;
  termEnd: Timestamp;
  status?: string;
}

export interface BoardAction {
  id: string;
  description: string;
  responsible: string;
  dueDate: Timestamp;
  priority: string;
  status: string;
  meeting?: { id: string; title: string } | null;
}

export interface GovernanceMeeting {
  id: string;
  title: string;
  meetingDate: Timestamp;
  minutesUrl?: string | null;
  status: string;
  organizedBy?: UserSummary | null;
}

export interface BoardResolution {
  id: string;
  /** Allocated with the record. The screen used to mint `RES-2026-001` itself. */
  resolutionNo: string;
  title: string;
  description: string;
  resolutionType: string;
  meetingDate?: Timestamp | null;
  proposedBy?: string | null;
  secondedBy?: string | null;
  votesFor: number;
  votesAgainst: number;
  abstentions: number;
  status: string;
  passedDate?: Timestamp | null;
}

export interface Risk {
  id: string;
  projectId: string;
  project?: Pick<Project, 'id' | 'projectName'> | null;
  title: string;
  category: string;
  likelihood: string;
  impact: string;
  /** Derived server-side from likelihood x impact. */
  score: number;
  mitigation?: string | null;
  owner?: string | null;
  status: string;
}

export interface Community {
  id: string;
  name: string;
  lga: string;
  state: string;
  population: number;
  leaderName?: string | null;
}

export interface OutreachEvent {
  id: string;
  title: string;
  locationId: string;
  /** A relation, not a string: the screen read `o.location.name`. */
  location?: LocationRecord | null;
  date: Timestamp;
  attendance: number;
  status: string;
}

export interface VolunteerProfile {
  id: string;
  userId: string;
  user?: UserSummary | null;
  lga: string;
  ward?: string | null;
  address?: string | null;
  stipend: Money;
  status: string;
}

export interface StrategicGoal {
  id: string;
  title: string;
  targetMetric: number;
  currentMetric: number;
  deadline: Timestamp;
  status: string;
}

export interface ReportSchedule {
  id: string;
  grantId: string;
  grant?: Pick<Grant, 'id' | 'grantName'> | null;
  title: string;
  type: string;
  dueDate: Timestamp;
  officer?: string | null;
  status: string;
  submittedAt?: Timestamp | null;
  reference?: string | null;
}

export interface ServiceLog {
  id: string;
  inventoryItemId: string;
  serviceType: string;
  performedBy: string;
  serviceDate: Timestamp;
  nextDueDate: Timestamp;
  cost: number;
  status: string;
  notes?: string | null;
}

/** GET /analytics/summary — the executive dashboard's headline counts. */
/**
 * `GET /reports/summary`, which is what the reports screen reads.
 *
 * It had no type, and the page did not use it: four KPI cards, a four-row
 * impact breakdown with its own percentages and progress bars, and a catalogue
 * of three published reports were all literals. The one figure that did come
 * from the API was written `summary?.totalScreenings || 462`, so a real zero
 * displayed as 462.
 */
export interface ReportsSummary {
  generatedAt: Timestamp;
  totalScreenings: number;
  positiveScreenings: number;
  totalPatients: number;
  totalOutreaches: number;
  totalReferrals: number;
  activeReferrals: number;
  totalNavigationEvents: number;
  communitiesCovered: number;
}

/**
 * `GET /research/projects`. This is not `Project` — the research module has its
 * own table with a `title` and a `progress` percentage, and the research screen
 * typed its list as the project-management `Project`, so it read `projectName`
 * (undefined on every row, rendering a blank heading) and derived completion
 * from `tasks` (also undefined, so every project showed 0%) while the real
 * `progress` column, which has its own endpoint, went unread.
 */
export interface ResearchProject {
  id: string;
  title: string;
  status: string;
  progress: number;
  createdAt?: Timestamp;
}

export interface AnalyticsSummary {
  totalScreenings: number;
  positiveScreenings: number;
  activeProjects: number;
  totalFunding: number;
  pendingApprovals: number;
  totalParticipants: number;
  activeReferrals: number;
  communitiesCovered: number;
  totalOutreaches: number;
  researchProjects: number;
  totalStaff: number;
  patientsUnderNavigation: number;
}

export interface Vitals {
  id: string;
  participantId: string;
  bpSystolic?: number | null;
  bpDiastolic?: number | null;
  pulseRate?: number | null;
  temperature?: number | null;
  weightKg?: number | null;
  heightCm?: number | null;
  bmi?: number | null;
  oxygenSat?: number | null;
  createdAt: Timestamp;
}

export interface LocationRecord {
  id: string;
  name: string;
  lga?: string | null;
  state?: string | null;
}

/**
 * Programme reach in one LGA, from GET /analytics/lga.
 *
 * Mirrors LgaCoverage in the API's analytics.service.ts. Counts only — the
 * table this feeds used to be six hardcoded rows carrying an "Outreach Status"
 * and a "Programme Score", neither of which the system records.
 */
export interface LgaCoverage {
  lga: string;
  participants: number;
  screenings: number;
  positiveScreenings: number;
  referrals: number;
  pendingReferrals: number;
  communities: number;
  /** Null where the LGA has communities mapped but no registrations yet. */
  lastRegistration: Timestamp | null;
}
