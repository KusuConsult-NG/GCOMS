'use client';

import React, { Suspense } from 'react';
import { useAuthStore } from '@/store/authStore';
import { ProjectWorkspace } from '@/components/workspaces/ProjectWorkspace';
import { AccessDenied } from '@/components/AccessDenied';
import { PROJECT_PAGE_ROLES } from '@/components/pageAccess';

export default function ProjectsPage() {
  const { user } = useAuthStore();
  const allowedRoles = PROJECT_PAGE_ROLES;

  if (user && !allowedRoles.includes(user.role)) {
    return <AccessDenied requiredRole="Project Manager / Executive" />;
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
    <Suspense fallback={<div className="p-8 text-center text-xs text-[var(--muted)]">Loading Project Application...</div>}>
      <ProjectWorkspace />
    </Suspense>
  );
}
