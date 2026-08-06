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

  // The role check above only denies once there is a user to check. Until the
  // store has hydrated there is none, so rendering on through would show the
  // workspace to whoever is waiting — briefly, but before anything has
  // established they are allowed to see it.
  if (!user) {
    return (
      <div className="p-8 text-center text-xs text-[var(--muted)]">
        Loading…
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[var(--muted)]">Loading Governance Application...</div>}>
      <GovernanceWorkspace />
    </Suspense>
  );
}
