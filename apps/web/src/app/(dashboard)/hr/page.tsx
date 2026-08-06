'use client';

import React, { Suspense } from 'react';
import { useAuthStore } from '@/store/authStore';
import { HrWorkspace } from '@/components/workspaces/HrWorkspace';
import { AccessDenied } from '@/components/AccessDenied';

export default function HrPage() {
  const { user } = useAuthStore();
  const allowedRoles = ['EXECUTIVE', 'BOARD', 'SUPER_ADMIN', 'SYSTEM_ADMIN', 'ADMIN', 'HR'];

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
