'use client';

import React from "react";
import { useAuthStore } from "@/store/authStore";

export function Topbar() {
  const { user } = useAuthStore();
  const userRole = user?.role || "EXECUTIVE";

  return (
    <header className="h-16 bg-[#002045] text-white border-b border-[#1a365d] flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          {/* Brand Badge */}
          <div className="h-10 px-2.5 bg-white rounded flex items-center justify-center border border-[#e2e8f0]">
            <img src="/georgel-logo.png" alt="Georgel Cancer Foundation Logo" className="h-7 w-auto object-contain" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              GCOMS
            </h2>
            <p className="text-[11px] text-[#a2eded] font-normal hidden sm:block">
              Enterprise Digital Operations Platform
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* User Profile Info */}
        <div className="flex items-center space-x-2 pl-3 border-l border-[#1a365d]">
          <div className="w-8 h-8 rounded-full bg-[#13696a] flex items-center justify-center text-white text-xs font-bold border border-[#a2eded]">
            {user?.firstName ? user.firstName[0] : 'U'}
          </div>
          <div className="hidden lg:block text-left text-xs">
            <p className="font-semibold text-white leading-tight">
              {user ? `${user.firstName} ${user.lastName}` : "User Account"}
            </p>
            <p className="text-[10px] text-[#a2eded] font-medium leading-tight">
              {userRole.replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
