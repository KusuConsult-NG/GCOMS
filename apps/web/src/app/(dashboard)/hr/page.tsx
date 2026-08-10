'use client';

import React, { Suspense } from 'react';
import { useAuthStore } from '@/store/authStore';
import { HrWorkspace } from '@/components/workspaces/HrWorkspace';
import { AccessDenied } from '@/components/AccessDenied';
import { HR_PAGE_ROLES } from '@/components/pageAccess';

export default function HrPage() {
  const { user } = useAuthStore();
  const allowedRoles = HR_PAGE_ROLES;

  if (user && !allowedRoles.includes(user.role)) {
    return <AccessDenied requiredRole="HR Manager / Executive" />;
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
    <Suspense fallback={<div className="p-8 text-center text-xs text-[var(--muted)]">Loading HR Application...</div>}>
      <HrWorkspace />
    </Suspense>
  );
}
