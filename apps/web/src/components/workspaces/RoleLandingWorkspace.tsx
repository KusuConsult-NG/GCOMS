'use client';

import type { SessionUser } from '@/types/api';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { visibleSections } from '@/components/navigation';
import { isKnownRole, roleLabel, normaliseRole } from '@/lib/roles';

/**
 * Where a role lands when it has no workspace of its own.
 *
 * The dashboard router ended in `default: return <ExecutiveWorkspace />`, so
 * every role it had no case for got the Executive Command Centre — a header
 * reading "Enterprise-Wide Operations Dashboard", six KPI cards and an approval
 * queue, all of it fed by endpoints that refuse the viewer. DATA_OFFICER,
 * DOCUMENT_OFFICER, PROGRAMME_MANAGER and RESEARCH_OFFICER all landed there
 * after signing in. They are the same four roles that had no sidebar: the two
 * omissions came from the same missing list, and together they meant those
 * accounts opened onto an executive dashboard of dashes with no menu beside it.
 *
 * `/` is not in their sidebar either — "Executive decision support" sits in the
 * Command section — so this page is reachable only by signing in, which is
 * exactly when it is seen.
 *
 * What it shows is the work the viewer can actually reach, derived from the same
 * predicate the sidebar uses, so it cannot offer a destination the sidebar
 * hides or a page that would refuse them. It claims nothing about the
 * organisation, because a role that cannot read a module has no business being
 * shown a number about it.
 */
export function RoleLandingWorkspace({ user }: { user: SessionUser }) {
  const sections = visibleSections(user.role);
  const known = isKnownRole(user.role);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="border-b border-[var(--outline)] pb-5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          {known ? roleLabel(normaliseRole(user.role)) : 'Account'} • GCOMS
        </span>
        <h1 className="text-2xl font-bold tracking-tight mt-1 text-[var(--on-background)]">
          Welcome, {user.firstName} {user.lastName}
        </h1>
        <p className="text-[var(--muted)] text-xs mt-0.5">
          {sections.length > 0
            ? 'The modules your role opens. The same list is in the sidebar.'
            : 'Your account has no modules assigned.'}
        </p>
      </div>

      {sections.length === 0 ? (
        /*
         * A role the system does not issue, or one issued and never granted
         * anything. Saying so is the point: the previous behaviour was an
         * executive dashboard full of zeros, which reads as "the organisation
         * has nothing in it" rather than "this account cannot see anything".
         */
        <div
          role="status"
          className="rounded-lg border border-[var(--outline)] bg-[var(--surface)] p-6"
        >
          <p className="text-sm font-semibold text-[var(--on-background)]">
            There is nothing this account can open yet.
          </p>
          <p className="mt-2 text-xs text-[var(--muted)]">
            {known
              ? 'Your role is recognised but has not been given access to a module.'
              : `The role on this account (${user.role || 'none'}) is not one this system issues.`}{' '}
            An administrator can correct this from System Administration.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sections.map((section) => (
            <div
              key={section.title}
              className="rounded-lg border border-[var(--outline)] bg-[var(--surface)] p-5"
            >
              <h2 className="border-b border-[var(--outline)] pb-2 text-sm font-bold text-[var(--primary)]">
                {section.title}
              </h2>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-center justify-between rounded border border-[var(--outline)] bg-[var(--background)] p-3 transition-colors hover:border-[var(--secondary)] hover:bg-[var(--primary-surface)]"
                  >
                    <span className="flex items-center gap-2">
                      <item.icon
                        className="h-4 w-4 shrink-0 text-[var(--secondary)]"
                        aria-hidden
                      />
                      <span className="text-xs font-semibold text-[var(--on-background)]">
                        {item.label}
                      </span>
                    </span>
                    <ArrowRight
                      className="h-3.5 w-3.5 shrink-0 text-[var(--muted)] transition-colors group-hover:text-[var(--secondary)]"
                      aria-hidden
                    />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
