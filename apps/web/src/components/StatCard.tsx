import React from 'react';

/**
 * One figure in a row of figures.
 *
 * These were written out by hand on every dashboard, which is why a row of six
 * had labels wrapping to one or two lines and the numbers landing at different
 * heights — the eye reads that as six unrelated boxes rather than one row. The
 * label reserves the height of three lines whether it needs them or not — three
 * because that is what the longest of them wraps to in a six-column row — so the
 * values sit on a line together.
 *
 * `tone` is deliberately narrow. Colour on a number should mean something is
 * wrong, not that a designer had six colours available: the old row rendered
 * one count teal, the next red and the next green with nothing behind the
 * choice, which leaves a genuine alert indistinguishable from decoration.
 */
export type StatTone = 'neutral' | 'warning' | 'critical';

const toneClass: Record<StatTone, string> = {
  neutral: 'text-[var(--on-background)]',
  warning: 'text-[var(--risk-mod-text)]',
  critical: 'text-[var(--risk-high-text)]',
};

export function StatCard({
  label,
  value,
  detail,
  tone = 'neutral',
}: {
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
  tone?: StatTone;
}) {
  return (
    <div className="flex flex-col rounded-lg border border-[var(--outline)] bg-[var(--surface)] p-4">
      <span className="min-h-[3.75em] text-[11px] font-semibold uppercase leading-[1.25] tracking-[0.08em] text-[var(--muted)]">
        {label}
      </span>
      <span className={`mt-1 text-2xl font-bold tabular-nums ${toneClass[tone]}`}>
        {value}
      </span>
      {detail ? (
        <span className="mt-1 text-[11px] text-[var(--on-surface-variant)]">{detail}</span>
      ) : null}
    </div>
  );
}
