'use client';

import React, { Suspense } from 'react';
import { useAuthStore } from '@/store/authStore';
import { InventoryWorkspace } from '@/components/workspaces/InventoryWorkspace';
import { AccessDenied } from '@/components/AccessDenied';

export default function InventoryPage() {
  const { user } = useAuthStore();
  const allowedRoles = ['EXECUTIVE', 'BOARD', 'SUPER_ADMIN', 'SYSTEM_ADMIN', 'ADMIN', 'INVENTORY_MANAGER'];

  if (user && !allowedRoles.includes(user.role)) {
    return <AccessDenied requiredRole="Inventory Manager / Executive" />;
  }

  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#74777f]">Loading Inventory Application...</div>}>
      <InventoryWorkspace user={user} />
    </Suspense>
  );
}
