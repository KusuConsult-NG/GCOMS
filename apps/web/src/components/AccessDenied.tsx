'use client';

import React from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

export function AccessDenied({ requiredRole }: { requiredRole?: string }) {
  const { user } = useAuthStore();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 bg-[var(--background)]">
      <div className="max-w-md w-full bg-white p-8 rounded-lg border border-[var(--outline)] shadow-sm text-center space-y-4">
        <div className="w-16 h-16 bg-[var(--risk-high-bg)] text-[var(--risk-high-text)] rounded-full flex items-center justify-center mx-auto font-bold text-2xl">
          🔒
        </div>
        <h1 className="text-xl font-bold text-[var(--primary)]">Access Denied — RBAC Restricted</h1>
        <p className="text-xs text-[var(--on-surface-variant)] leading-relaxed">
          Your current session role <strong className="text-[var(--risk-high-text)] font-mono">({user?.role || 'UNAUTHENTICATED'})</strong> is not authorized to access this standalone application module.
        </p>
        <div className="p-3 bg-[var(--surface-subtle)] rounded text-[11px] font-mono text-[var(--on-background)] text-left space-y-1">
          <p><strong>User Account:</strong> {user?.email || 'N/A'}</p>
          <p><strong>Assigned Role:</strong> {user?.role || 'N/A'}</p>
          <p><strong>Required Privilege:</strong> {requiredRole || 'Role-Specific Grant'}</p>
        </div>
        <div className="pt-2">
          <Link
            href="/"
            className="btn-primary inline-block text-xs py-2 px-4"
          >
            Return to My Authorized Workspace
          </Link>
        </div>
      </div>
    </div>
  );
}
