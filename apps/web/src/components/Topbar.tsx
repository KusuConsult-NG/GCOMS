'use client';

import React from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeProvider';
import { useAuthStore } from '@/store/authStore';
import { visibleSections } from './navigation';

/**
 * Where you are, and the one control that belongs to the frame rather than the
 * page.
 *
 * It used to carry the logo, the product name and the signed-in user — all
 * three of which the sidebar already showed, so the same identity appeared
 * twice on every screen and the bar said nothing about the page under it.
 *
 * The label is derived from the nav data, so it cannot drift from the link that
 * got you here. It is deliberately not a heading element: every screen already
 * has its own h1, and a second one in the chrome makes the page announce two
 * different titles.
 */
function useCurrentLocation(): { section: string; page: string } {
  const pathname = usePathname();
  const tab = useSearchParams().get('tab');
  const { user } = useAuthStore();

  // Only sections this role can actually open. Matching against all of them
  // labelled a volunteer's landing page "Executive decision support", because
  // that is the entry sitting at `/` in a section they cannot see.
  const sections = visibleSections(user?.role);

  // `/` is a different workspace for each role, each with its own heading. The
  // chrome should not try to name it.
  if (pathname === '/') return { section: '', page: 'Dashboard' };

  for (const section of sections) {
    for (const item of section.items) {
      if (item.kind !== 'nav') continue;
      const [path, query = ''] = item.href.split('?');
      if (path !== pathname) continue;
      const itemTab = new URLSearchParams(query).get('tab');
      if (itemTab === tab) return { section: section.title, page: item.label };
    }
  }

  // A screen with no sidebar entry — /reports, /documents and the rest are
  // reachable from within other pages. Better a readable path than nothing.
  const slug = pathname.split('/').filter(Boolean).pop() ?? '';
  return {
    section: '',
    page: slug.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase()) || 'GCOMS',
  };
}

export function Topbar() {
  const { section, page } = useCurrentLocation();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[var(--outline)] bg-[var(--surface)] px-6">
      <div className="min-w-0">
        {section && (
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
            {section}
          </p>
        )}
        <p className="truncate text-sm font-semibold text-[var(--on-background)]">{page}</p>
      </div>

      <ThemeToggle className="text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--on-background)]" />
    </header>
  );
}
