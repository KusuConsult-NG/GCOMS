'use client';

import { useAuthStore } from '@/store/authStore';
import FinancePage from './finance/page';
import HrPage from './hr/page';
import ProcurementPage from './procurement/page';
import GrantsPage from './grants/page';
import ProjectsPage from './projects/page';
import InventoryPage from './inventory/page';
import GovernancePage from './governance/page';

// Import Dedicated Workspaces
import { VolunteerWorkspace } from '@/components/workspaces/VolunteerWorkspace';
import { ClinicalWorkspace } from '@/components/workspaces/ClinicalWorkspace';
import { ExecutiveWorkspace } from '@/components/workspaces/ExecutiveWorkspace';
import { AdminWorkspace } from '@/components/workspaces/AdminWorkspace';

export default function Dashboard() {
  const { user } = useAuthStore();

  if (!user) {
    return (
      <div className="p-8 text-center text-xs text-[var(--muted)]">
        Authenticating GCOMS session...
      </div>
    );
  }

  // Bind strictly to the exact standalone application per role per PRD directive
  switch (user.role) {
    case 'FINANCE':
      return <FinancePage />;

    case 'PROCUREMENT':
      return <ProcurementPage />;

    case 'HR':
      return <HrPage />;

    case 'GRANT_MANAGER':
      return <GrantsPage />;

    case 'PROJECT_MANAGER':
      return <ProjectsPage />;

    case 'INVENTORY_MANAGER':
      return <InventoryPage />;

    case 'GOVERNANCE':
      return <GovernancePage />;

    case 'VOLUNTEER':
    case 'FIELD_OFFICER':
    case 'COMMUNITY_HEALTH_WORKER':
      return <VolunteerWorkspace user={user} />;

    case 'CLINICIAN':
    case 'DOCTOR':
    case 'NURSE':
      return <ClinicalWorkspace user={user} />;

    case 'ADMIN':
    case 'SYSTEM_ADMIN':
      return <AdminWorkspace user={user} />;

    case 'EXECUTIVE':
    case 'BOARD':
    default:
      return <ExecutiveWorkspace user={user} />;
  }
}
