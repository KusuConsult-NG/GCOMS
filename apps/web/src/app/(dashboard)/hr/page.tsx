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

  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#74777f]">Loading HR Application...</div>}>
      <HrWorkspace user={user} />
    </Suspense>
  );
}
