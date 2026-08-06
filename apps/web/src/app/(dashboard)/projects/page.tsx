'use client';

import React, { Suspense } from 'react';
import { useAuthStore } from '@/store/authStore';
import { ProjectWorkspace } from '@/components/workspaces/ProjectWorkspace';
import { AccessDenied } from '@/components/AccessDenied';

export default function ProjectsPage() {
  const { user } = useAuthStore();
  const allowedRoles = ['EXECUTIVE', 'BOARD', 'SUPER_ADMIN', 'SYSTEM_ADMIN', 'ADMIN', 'PROJECT_MANAGER'];

  if (user && !allowedRoles.includes(user.role)) {
    return <AccessDenied requiredRole="Project Manager / Executive" />;
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
    <Suspense fallback={<div className="p-8 text-center text-xs text-[var(--muted)]">Loading Project Application...</div>}>
      <ProjectWorkspace user={user} />
    </Suspense>
  );
}
