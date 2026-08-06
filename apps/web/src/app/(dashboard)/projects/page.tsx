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

  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[var(--muted)]">Loading Project Application...</div>}>
      <ProjectWorkspace user={user} />
    </Suspense>
  );
}
