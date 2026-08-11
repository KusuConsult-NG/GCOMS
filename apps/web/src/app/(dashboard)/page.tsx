'use client';

import { useAuthStore } from '@/store/authStore';
import { landingFor } from '@/components/dashboardLanding';
import FinancePage from './finance/page';
import HrPage from './hr/page';
import ProcurementPage from './procurement/page';
import GrantsPage from './grants/page';
import ProjectsPage from './projects/page';
import InventoryPage from './inventory/page';

// Import Dedicated Workspaces
import { VolunteerWorkspace } from '@/components/workspaces/VolunteerWorkspace';
import { ClinicalWorkspace } from '@/components/workspaces/ClinicalWorkspace';
import { ExecutiveWorkspace } from '@/components/workspaces/ExecutiveWorkspace';
import { AdminWorkspace } from '@/components/workspaces/AdminWorkspace';
import { RoleLandingWorkspace } from '@/components/workspaces/RoleLandingWorkspace';

/**
 * What `/` renders, which is the first thing anyone sees after signing in.
 *
 * The role-to-landing decision lives in `dashboardLanding.ts` so it can be
 * asserted against the page gates. Two things were wrong with the switch that
 * used to be here.
 *
 * It ended in `default: return <ExecutiveWorkspace />`, so any role without a
 * case got the Executive Command Centre. Four roles were in that position —
 * DATA_OFFICER, DOCUMENT_OFFICER, PROGRAMME_MANAGER and RESEARCH_OFFICER — and
 * every request that dashboard makes is refused for them. They are the same four
 * that had no sidebar, so the whole application opened as an executive dashboard
 * of empty figures with no menu beside it.
 *
 * And it had a `case 'GOVERNANCE'`, which is not a role this system issues; the
 * same dead value the sidebar predicate and the governance page gate both
 * carried. It could never match, so `/governance` was reached only by
 * management, which is who GOVERNANCE_ROLES names anyway.
 */
export default function Dashboard() {
  const { user } = useAuthStore();

  if (!user) {
    return (
      <div className="p-8 text-center text-xs text-[var(--muted)]">
        Authenticating GCOMS session...
      </div>
    );
  }

  switch (landingFor(user.role)) {
    case 'finance':
      return <FinancePage />;
    case 'procurement':
      return <ProcurementPage />;
    case 'hr':
      return <HrPage />;
    case 'grants':
      return <GrantsPage />;
    case 'projects':
      return <ProjectsPage />;
    case 'inventory':
      return <InventoryPage />;
    case 'volunteer':
      return <VolunteerWorkspace user={user} />;
    case 'clinical':
      return <ClinicalWorkspace user={user} />;
    case 'admin':
      return <AdminWorkspace />;
    case 'executive':
      return <ExecutiveWorkspace />;
    case 'role':
      // Everything else lands on what it can actually reach, including a role
      // this system does not issue — which now says so instead of rendering a
      // command centre nobody can read.
      return <RoleLandingWorkspace user={user} />;
  }
}
