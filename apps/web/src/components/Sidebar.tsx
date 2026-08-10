'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import React from 'react';
import Image from 'next/image';
import { LogOut, Plus } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { AUDIT_EXPORT_ICON, visibleSections, type NavItem } from './navigation';
import { LOGO_SRC } from '@/lib/deployment';

/**
 * Whether a nav entry is the page currently open.
 *
 * Most of these links carry a `?tab=`, and half of one screen's entries point
 * at the same pathname with different tabs. Comparing pathname alone lit up
 * four Finance entries at once; comparing the whole href fails the other way,
 * because a `?action=` link leaves the URL somewhere it will never match.
 */
function useIsCurrent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab');

  return (item: NavItem) => {
    if (item.kind === 'action') return false;
    const [path, query = ''] = item.href.split('?');
    if (path !== pathname) return false;
    const tab = new URLSearchParams(query).get('tab');
    return tab === currentTab;
  };
}

export function Sidebar() {
  const { user } = useAuthStore();
  const isCurrent = useIsCurrent();
  const normalizedRole = (user?.role || '').toUpperCase().trim();
  const sections = visibleSections(user?.role);

  const exportAuditStatement = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify({ exportedAt: new Date(), role: normalizedRole }, null, 2));
    const anchor = document.createElement('a');
    anchor.setAttribute('href', dataStr);
    anchor.setAttribute('download', `GCOMS_Finance_Audit_Ledger_${Date.now()}.json`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const AuditIcon = AUDIT_EXPORT_ICON;

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col overflow-y-auto border-r border-white/5 bg-[var(--nav-surface)] text-white">
      {/* The logo carries its own white background, so it gets a white chip
          rather than a full-width white band butting against the navy. */}
      <div className="flex items-center gap-3 px-4 py-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white p-1.5">
          <Image
            src={LOGO_SRC}
            alt=""
            width={32}
            height={32}
            className="h-full w-full object-contain"
          />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold leading-tight text-white">GCOMS</span>
          <span className="block truncate text-[11px] leading-tight text-white/50">
            Georgel Cancer Foundation
          </span>
        </span>
      </div>

      <nav className="flex-1 space-y-6 px-3 pb-4">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
              {section.title}
            </h2>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const current = isCurrent(item);

                if (item.kind === 'action') {
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="group flex items-center gap-2.5 rounded-md px-3 py-1.5 text-[13px] text-white/50 transition-colors hover:bg-white/5 hover:text-white/90"
                      >
                        <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                }

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={current ? 'page' : undefined}
                      className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] transition-colors ${
                        current
                          ? 'bg-white/10 font-semibold text-white shadow-[inset_2px_0_0_0_var(--secondary)]'
                          : 'text-white/75 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 ${current ? 'text-[var(--secondary)]' : 'text-white/45'}`}
                        aria-hidden
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}

              {section.audience === 'finance' && (
                <li>
                  <button
                    type="button"
                    onClick={exportAuditStatement}
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-left text-[13px] text-white/50 transition-colors hover:bg-white/5 hover:text-white/90"
                  >
                    <AuditIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span className="truncate">Export audit trail</span>
                  </button>
                </li>
              )}
            </ul>
          </div>
        ))}
      </nav>

      {user && (
        <div className="flex items-center gap-3 border-t border-white/5 px-4 py-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--secondary)] text-xs font-semibold text-[var(--on-secondary)]">
            {(user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? '') || '?'}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-white">
              {user.firstName} {user.lastName}
            </span>
            <span className="block truncate text-[11px] capitalize text-white/45">
              {user.role.replace(/_/g, ' ').toLowerCase()}
            </span>
          </span>
          <button
            type="button"
            onClick={() => {
              useAuthStore.getState().logout();
              // A hard navigation, deliberately. router.push() keeps the SPA
              // alive, so every component that already fetched patient data
              // holds it in memory across the logout.
              // eslint-disable-next-line @next/next/no-location-assign-relative-destination
              window.location.href = '/login';
            }}
            className="rounded-md p-1.5 text-white/50 transition-colors hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" aria-hidden />
          </button>
        </div>
      )}
    </aside>
  );
}
