'use client';

import React, { Suspense } from 'react';
import { useAuthStore } from '@/store/authStore';
import { GovernanceWorkspace } from '@/components/workspaces/GovernanceWorkspace';
import { AccessDenied } from '@/components/AccessDenied';

export default function GovernancePage() {
  const { user } = useAuthStore();
  const allowedRoles = ['EXECUTIVE', 'BOARD', 'SUPER_ADMIN', 'SYSTEM_ADMIN', 'ADMIN', 'GOVERNANCE'];

  if (user && !allowedRoles.includes(user.role)) {
    return <AccessDenied requiredRole="Board / Governance / Executive" />;
  }

  // Until the store has hydrated there is no user, and the workspace reads
  // user.role. Passing null through type-checked only because the prop was
  // `any`.
  if (!user) {
    return (
      <div className="p-8 text-center text-xs text-[var(--muted)]">
        Loading…
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[var(--muted)]">Loading Governance Application...</div>}>
      <GovernanceWorkspace user={user} />
    </Suspense>
  );
}
