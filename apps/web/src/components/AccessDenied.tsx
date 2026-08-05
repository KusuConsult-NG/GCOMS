'use client';

import React from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

export function AccessDenied({ requiredRole }: { requiredRole?: string }) {
  const { user } = useAuthStore();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 bg-[#f8f9ff]">
      <div className="max-w-md w-full bg-white p-8 rounded-lg border border-[#e2e8f0] shadow-sm text-center space-y-4">
        <div className="w-16 h-16 bg-[#ffdad6] text-[#ba1a1a] rounded-full flex items-center justify-center mx-auto font-bold text-2xl">
          🔒
        </div>
        <h1 className="text-xl font-bold text-[#002045]">Access Denied — RBAC Restricted</h1>
        <p className="text-xs text-[#43474e] leading-relaxed">
          Your current session role <strong className="text-[#ba1a1a] font-mono">({user?.role || 'UNAUTHENTICATED'})</strong> is not authorized to access this standalone application module.
        </p>
        <div className="p-3 bg-[#edf2f7] rounded text-[11px] font-mono text-[#0d1c2e] text-left space-y-1">
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
