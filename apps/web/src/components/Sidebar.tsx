'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { useAuthStore } from "@/store/authStore";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const normalizedRole = (user?.role || '').toUpperCase().trim();

  // Management & Administrative roles have cross-departmental oversight
  const isManagement = ['EXECUTIVE', 'BOARD', 'SUPER_ADMIN', 'ADMIN', 'SYSTEM_ADMIN'].includes(normalizedRole);

  const isFinance = normalizedRole === 'FINANCE' || isManagement;
  const isProcurement = normalizedRole === 'PROCUREMENT' || isManagement;
  const isHr = normalizedRole === 'HR' || isManagement;
  const isGrant = normalizedRole === 'GRANT_MANAGER' || isManagement;
  const isProject = normalizedRole === 'PROJECT_MANAGER' || isManagement;
  const isInventory = normalizedRole === 'INVENTORY_MANAGER' || isManagement;
  const isGovernance = normalizedRole === 'GOVERNANCE' || isManagement;
  const isClinician = ['CLINICIAN', 'DOCTOR', 'NURSE'].includes(normalizedRole) || isManagement;
  const isVolunteer = ['VOLUNTEER', 'FIELD_OFFICER', 'COMMUNITY_HEALTH_WORKER'].includes(normalizedRole) || isManagement;

  const exportAuditStatement = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ exportedAt: new Date(), role: normalizedRole }, null, 2));
    const anchor = document.createElement('a');
    anchor.setAttribute("href", dataStr);
    anchor.setAttribute("download", `GCOMS_Finance_Audit_Ledger_${Date.now()}.json`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  return (
    <aside className="w-64 bg-[var(--primary)] text-white h-screen flex flex-col fixed inset-y-0 left-0 z-50 overflow-y-auto border-r border-[var(--primary-container)]">
      {/* Brand Header */}
      <div className="bg-white p-3 border-b border-[var(--outline)] flex items-center justify-center">
        <img
          src="/georgel-logo.png"
          alt="Georgel Cancer Foundation Logo"
          className="w-full h-12 object-contain"
        />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-5 text-xs">
        {/* EXECUTIVE & ADMIN COMMAND CENTRE */}
        {isManagement && (
          <div>
            <h2 className="px-3 text-[10px] font-bold uppercase tracking-wider text-[var(--secondary-container)] mb-1.5">
              EXECUTIVE & ADMIN COMMAND
            </h2>
            <div className="space-y-1">
              <Link
                href="/"
                className={`flex items-center px-3 py-2 rounded font-medium transition-all ${
                  pathname === '/' ? 'bg-[var(--secondary)] text-white font-semibold shadow-sm' : 'text-slate-200 hover:bg-[var(--primary-container)]'
                }`}
              >
                👑 Executive Decision Support
              </Link>
              <Link
                href="/admin-mgmt"
                className={`flex items-center px-3 py-2 rounded font-medium transition-all ${
                  pathname === '/admin-mgmt' ? 'bg-[var(--secondary)] text-white font-semibold shadow-sm' : 'text-slate-200 hover:bg-[var(--primary-container)]'
                }`}
              >
                ⚙️ Admin System Management
              </Link>
            </div>
          </div>
        )}

        {/* 💳 FINANCE OFFICER APPLICATION */}
        {isFinance && (
          <div>
            <h2 className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#adc7f7] mb-1.5 flex items-center justify-between">
              <span>💳 FINANCE APPLICATION</span>
            </h2>
            <div className="space-y-1">
              <Link
                href="/finance?tab=ledger"
                className={`flex items-center px-3 py-1.5 rounded font-medium ${pathname === '/finance' ? 'bg-[var(--primary-container)] text-white font-semibold border-l-2 border-[var(--secondary)]' : 'text-slate-200 hover:bg-[var(--primary-container)]'}`}
              >
                💳 General Ledger Overview
              </Link>
              <button
                onClick={exportAuditStatement}
                className="w-full text-left flex items-center px-3 py-1.5 rounded font-semibold text-slate-300 hover:bg-[var(--primary-container)] hover:text-white bg-[var(--primary-dark)] border border-slate-700/50"
              >
                📄 Export Audit Trail
              </button>
              <Link
                href="/finance?tab=vouchers&action=requisition"
                className="flex items-center px-3 py-1.5 rounded font-semibold text-emerald-300 hover:bg-[var(--primary-container)] hover:text-white bg-[var(--primary-dark)] border border-emerald-800/40"
              >
                + Raise Payment Requisition
              </Link>
              <Link
                href="/finance?tab=advances&action=advance"
                className="flex items-center px-3 py-1.5 rounded font-semibold text-amber-300 hover:bg-[var(--primary-container)] hover:text-white bg-[var(--primary-dark)] border border-amber-800/40"
              >
                + Request Travel Advance
              </Link>
              <Link
                href="/finance?tab=ledger&action=inflow"
                className="flex items-center px-3 py-1.5 rounded font-semibold text-cyan-300 hover:bg-[var(--primary-container)] hover:text-white bg-[var(--primary-dark)] border border-cyan-800/40"
              >
                + Register Grant Inflow
              </Link>
              <Link
                href="/finance?tab=ledger&action=journal"
                className="flex items-center px-3 py-1.5 rounded font-semibold text-indigo-300 hover:bg-[var(--primary-container)] hover:text-white bg-[var(--primary-dark)] border border-indigo-800/40"
              >
                + Post Journal Entry
              </Link>
              <Link href="/finance?tab=accounts" className="flex items-center px-3 py-1.5 rounded text-slate-300 hover:bg-[var(--primary-container)]">
                🏛 Chart of Accounts (COA)
              </Link>
              <Link href="/finance?tab=vouchers" className="flex items-center px-3 py-1.5 rounded text-slate-300 hover:bg-[var(--primary-container)]">
                💸 Payment Vouchers (PV)
              </Link>
              <Link href="/finance?tab=advances" className="flex items-center px-3 py-1.5 rounded text-slate-300 hover:bg-[var(--primary-container)]">
                ✈️ Advances & Retirements
              </Link>
              <Link href="/finance?tab=statements" className="flex items-center px-3 py-1.5 rounded text-slate-300 hover:bg-[var(--primary-container)]">
                📑 Income & Balance Statements
              </Link>
            </div>
          </div>
        )}

        {/* 📦 PROCUREMENT APPLICATION */}
        {isProcurement && (
          <div>
            <h2 className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#adc7f7] mb-1.5">
              📦 PROCUREMENT SUITE
            </h2>
            <div className="space-y-1">
              <Link href="/procurement" className="flex items-center px-3 py-1.5 rounded font-medium text-slate-200 hover:bg-[var(--primary-container)]">
                📦 Annual Procurement Plan
              </Link>
              <Link href="/procurement?action=new-requisition" className="flex items-center px-3 py-1.5 rounded font-semibold text-emerald-300 bg-[var(--primary-dark)] border border-emerald-800/40">
                + New Purchase Requisition
              </Link>
              <Link href="/procurement?action=rfq" className="flex items-center px-3 py-1.5 rounded font-semibold text-cyan-300 bg-[var(--primary-dark)] border border-cyan-800/40">
                + Generate RFQ & Bid Matrix
              </Link>
              <Link href="/procurement?action=grn" className="flex items-center px-3 py-1.5 rounded font-semibold text-indigo-300 bg-[var(--primary-dark)] border border-indigo-800/40">
                + Goods Received Note (GRN)
              </Link>
              <Link href="/procurement?tab=vendors" className="flex items-center px-3 py-1.5 rounded text-slate-300 hover:bg-[var(--primary-container)]">
                🏢 Evaluated Vendor Directory
              </Link>
            </div>
          </div>
        )}

        {/* 👥 HR APPLICATION */}
        {isHr && (
          <div>
            <h2 className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#adc7f7] mb-1.5">
              👥 HR & TALENT SUITE
            </h2>
            <div className="space-y-1">
              <Link href="/hr" className="flex items-center px-3 py-1.5 rounded font-medium text-slate-200 hover:bg-[var(--primary-container)]">
                👥 Employee Directory
              </Link>
              <Link href="/hr?action=new-staff" className="flex items-center px-3 py-1.5 rounded font-semibold text-emerald-300 bg-[var(--primary-dark)] border border-emerald-800/40">
                + Create Staff Requisition
              </Link>
              <Link href="/hr?action=new-volunteer" className="flex items-center px-3 py-1.5 rounded font-semibold text-amber-300 bg-[var(--primary-dark)] border border-amber-800/40">
                + Register Volunteer / CHW
              </Link>
              <Link href="/hr?action=leave" className="flex items-center px-3 py-1.5 rounded font-semibold text-cyan-300 bg-[var(--primary-dark)] border border-cyan-800/40">
                + File Staff Leave Request
              </Link>
              <Link href="/hr?tab=recruitment" className="flex items-center px-3 py-1.5 rounded text-slate-300 hover:bg-[var(--primary-container)]">
                📋 Recruitment Pipeline
              </Link>
            </div>
          </div>
        )}

        {/* 📜 GRANT MANAGER APPLICATION */}
        {isGrant && (
          <div>
            <h2 className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#adc7f7] mb-1.5">
              📜 DONOR & GRANT SUITE
            </h2>
            <div className="space-y-1">
              <Link href="/grants" className="flex items-center px-3 py-1.5 rounded font-medium text-slate-200 hover:bg-[var(--primary-container)]">
                🏛 Donor CRM Directory
              </Link>
              <Link href="/grants?action=new-grant" className="flex items-center px-3 py-1.5 rounded font-semibold text-emerald-300 bg-[var(--primary-dark)] border border-emerald-800/40">
                + Register Grant Award
              </Link>
              <Link href="/grants?action=new-milestone" className="flex items-center px-3 py-1.5 rounded font-semibold text-cyan-300 bg-[var(--primary-dark)] border border-cyan-800/40">
                + Add Deliverable Milestone
              </Link>
              <Link href="/grants?tab=pipeline" className="flex items-center px-3 py-1.5 rounded text-slate-300 hover:bg-[var(--primary-container)]">
                📊 Grant Spend Pipeline
              </Link>
            </div>
          </div>
        )}

        {/* 🏗 PROJECT MANAGER APPLICATION */}
        {isProject && (
          <div>
            <h2 className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#adc7f7] mb-1.5">
              🏗 PROJECT MANAGEMENT
            </h2>
            <div className="space-y-1">
              <Link href="/projects" className="flex items-center px-3 py-1.5 rounded font-medium text-slate-200 hover:bg-[var(--primary-container)]">
                📁 Project Portfolio
              </Link>
              <Link href="/projects?action=new-project" className="flex items-center px-3 py-1.5 rounded font-semibold text-emerald-300 bg-[var(--primary-dark)] border border-emerald-800/40">
                + Initiate New Project
              </Link>
              <Link href="/projects?action=new-task" className="flex items-center px-3 py-1.5 rounded font-semibold text-amber-300 bg-[var(--primary-dark)] border border-amber-800/40">
                + Create Task Assignment
              </Link>
              <Link href="/projects?tab=kanban" className="flex items-center px-3 py-1.5 rounded text-slate-300 hover:bg-[var(--primary-container)]">
                📋 Task Kanban Board
              </Link>
              <Link href="/projects?tab=risks" className="flex items-center px-3 py-1.5 rounded text-slate-300 hover:bg-[var(--primary-container)]">
                ⚠️ Risk & Issue Register
              </Link>
            </div>
          </div>
        )}

        {/* 🏷 INVENTORY MANAGER APPLICATION */}
        {isInventory && (
          <div>
            <h2 className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#adc7f7] mb-1.5">
              🏷 INVENTORY & ASSETS
            </h2>
            <div className="space-y-1">
              <Link href="/inventory" className="flex items-center px-3 py-1.5 rounded font-medium text-slate-200 hover:bg-[var(--primary-container)]">
                📦 Stock Consumables Register
              </Link>
              <Link href="/inventory?action=issue-stock" className="flex items-center px-3 py-1.5 rounded font-semibold text-emerald-300 bg-[var(--primary-dark)] border border-emerald-800/40">
                + Log Stock Issue / Movement
              </Link>
              <Link href="/inventory?action=new-asset" className="flex items-center px-3 py-1.5 rounded font-semibold text-cyan-300 bg-[var(--primary-dark)] border border-cyan-800/40">
                + Create Barcode Asset Tag
              </Link>
              <Link href="/inventory?tab=assets" className="flex items-center px-3 py-1.5 rounded text-slate-300 hover:bg-[var(--primary-container)]">
                🏷 Equipment Asset Register
              </Link>
            </div>
          </div>
        )}

        {/* 🏛 GOVERNANCE APPLICATION */}
        {isGovernance && (
          <div>
            <h2 className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#adc7f7] mb-1.5">
              🏛 GOVERNANCE & BOARD
            </h2>
            <div className="space-y-1">
              <Link href="/governance" className="flex items-center px-3 py-1.5 rounded font-medium text-slate-200 hover:bg-[var(--primary-container)]">
                👥 Board Member Directory
              </Link>
              <Link href="/governance?action=new-meeting" className="flex items-center px-3 py-1.5 rounded font-semibold text-emerald-300 bg-[var(--primary-dark)] border border-emerald-800/40">
                + Schedule Convening
              </Link>
              <Link href="/governance?action=new-minutes" className="flex items-center px-3 py-1.5 rounded font-semibold text-cyan-300 bg-[var(--primary-dark)] border border-cyan-800/40">
                + Record Minutes & Voting
              </Link>
            </div>
          </div>
        )}

        {/* 🩺 CLINICAL CARE APPLICATION */}
        {isClinician && (
          <div>
            <h2 className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#adc7f7] mb-1.5">
              🩺 CLINICAL CARE
            </h2>
            <div className="space-y-1">
              <Link href="/clinical" className="flex items-center px-3 py-1.5 rounded font-medium text-slate-200 hover:bg-[var(--primary-container)]">
                🩺 Cancer Screening & Staging
              </Link>
              <Link href="/patients" className="flex items-center px-3 py-1.5 rounded text-slate-300 hover:bg-[var(--primary-container)]">
                👤 Master Patient Directory
              </Link>
            </div>
          </div>
        )}

        {/* 📝 VOLUNTEER FIELD OPERATIONS */}
        {isVolunteer && (
          <div>
            <h2 className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#adc7f7] mb-1.5">
              📝 FIELD VOLUNTEER OPERATIONS
            </h2>
            <div className="space-y-1">
              <Link href="/registration" className="flex items-center px-3 py-1.5 rounded font-medium text-slate-200 hover:bg-[var(--primary-container)]">
                📝 Field Intake & Consent
              </Link>
              <Link href="/volunteers" className="flex items-center px-3 py-1.5 rounded text-slate-300 hover:bg-[var(--primary-container)]">
                🩺 Field Volunteer Roster
              </Link>
            </div>
          </div>
        )}
      </nav>

      {user && (
        <div className="p-3 border-t border-[var(--primary-container)] bg-[#001b3c] flex items-center justify-between text-xs">
          <div className="truncate">
            <p className="font-semibold text-white truncate">{user.firstName} {user.lastName}</p>
            <p className="text-[10px] text-[var(--secondary-container)] capitalize">{user.role.replace('_', ' ')}</p>
          </div>
          <button
            onClick={() => {
              useAuthStore.getState().logout();
              window.location.href = '/login';
            }}
            className="text-slate-300 hover:text-white font-semibold text-xs ml-2"
          >
            Logout
          </button>
        </div>
      )}
    </aside>
  );
}
