'use client';

import React from "react";
import { useAuthStore } from "@/store/authStore";
import { ThemeToggle } from '@/components/ThemeProvider';

export function Topbar() {
  const { user } = useAuthStore();
  const userRole = user?.role || "EXECUTIVE";

  return (
    <header className="h-16 bg-[var(--primary)] text-white border-b border-[var(--primary-container)] flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          {/* Brand Badge */}
          <div className="h-10 px-2.5 bg-white rounded flex items-center justify-center border border-[var(--outline)]">
            <img src="/georgel-logo.png" alt="Georgel Cancer Foundation Logo" className="h-7 w-auto object-contain" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              GCOMS
            </h2>
            <p className="text-[11px] text-[var(--secondary-container)] font-normal hidden sm:block">
              Enterprise Digital Operations Platform
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <ThemeToggle className="text-white hover:text-[var(--secondary-container)] hover:bg-white/10" />

        {/* User Profile Info */}
        <div className="flex items-center space-x-2 pl-3 border-l border-[var(--primary-container)]">
          <div className="w-8 h-8 rounded-full bg-[var(--secondary)] flex items-center justify-center text-white text-xs font-bold border border-[var(--secondary-container)]">
            {user?.firstName ? user.firstName[0] : 'U'}
          </div>
          <div className="hidden lg:block text-left text-xs">
            <p className="font-semibold text-white leading-tight">
              {user ? `${user.firstName} ${user.lastName}` : "User Account"}
            </p>
            <p className="text-[10px] text-[var(--secondary-container)] font-medium leading-tight">
              {userRole.replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
