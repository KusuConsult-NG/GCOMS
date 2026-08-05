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

  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#74777f]">Loading Governance Application...</div>}>
      <GovernanceWorkspace user={user} />
    </Suspense>
  );
}
