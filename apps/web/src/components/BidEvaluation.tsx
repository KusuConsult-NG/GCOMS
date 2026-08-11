'use client';

import type { Rfq, RfqCriterion, RfqQuote } from '@/types/procurement';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/errors';

/**
 * The bid matrix, scored against declared criteria.
 *
 * What this replaces was a "Technical Score / 100" column and a "Mark Winner"
 * button. The score was a number an officer typed in and the recommendation was
 * a separate act of will beside it — so nobody could see why a vendor scored
 * 84, or what the runner-up lost on, and "automated technical scoring" meant an
 * opinion recorded to two significant figures.
 *
 * Marks are still human — somebody has to read the bids — but each is against a
 * named criterion with a declared weight, and the totals are arithmetic the
 * server does and shows its working for.
 */
export function BidEvaluation({
  rfq,
  onEvaluated,
}: {
  rfq: Rfq;
  onEvaluated: () => void;
}) {
  const [criteria, setCriteria] = useState<RfqCriterion[]>([]);
  const [marks, setMarks] = useState<Record<string, Record<string, string>>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get(`/operations/rfqs/${rfq.id}/criteria`)
      .then((res) => setCriteria(res.data))
      .catch(() => setCriteria([]));
  }, [rfq.id]);

  const evaluated = rfq.status === 'COMPLETE';
  const weightTotal = criteria.reduce((sum, c) => sum + c.weight, 0);

  const setMark = (quoteId: string, criterionId: string, value: string) =>
    setMarks((prev) => ({
      ...prev,
      [quoteId]: { ...(prev[quoteId] ?? {}), [criterionId]: value },
    }));

  const saveMarks = async (quoteId: string) => {
    setBusy(true);
    setError('');
    try {
      const entered = marks[quoteId] ?? {};
      const scores = Object.entries(entered)
        .filter(([, v]) => v !== '')
        .map(([criterionId, v]) => ({ criterionId, score: Number(v) }));
      if (scores.length === 0) return;
      await api.put(`/operations/quotes/${quoteId}/scores`, { scores });
      onEvaluated();
    } catch (err) {
      setError(errorMessage(err, 'The marks could not be saved.'));
    } finally {
      setBusy(false);
    }
  };

  const evaluate = async () => {
    setBusy(true);
    setError('');
    try {
      await api.post(`/operations/rfqs/${rfq.id}/evaluate`, {});
      onEvaluated();
    } catch (err) {
      // The refusals carry the reason — an unmarked vendor and criterion by
      // name, or a tie — so they are shown rather than reduced to "failed".
      setError(errorMessage(err, 'The evaluation could not be completed.'));
    } finally {
      setBusy(false);
    }
  };

  if (criteria.length === 0) {
    return (
      <div className="rounded border border-[var(--outline)] bg-[var(--background)] p-3 text-[11px] text-[var(--muted)]">
        No evaluation criteria set for this RFQ, so its bids cannot be scored.
        Set them before the committee sits — the weights must add to 100.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <p
          role="alert"
          className="rounded border border-[var(--risk-high-text)]/20 bg-[var(--risk-high-bg)] p-2 text-[11px] font-semibold text-[var(--risk-high-text)]"
        >
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--muted)]">
        <span>
          Technical {rfq.technicalWeight ?? 70}% · Price{' '}
          {100 - (rfq.technicalWeight ?? 70)}% · criteria weighted to{' '}
          {weightTotal}
        </span>
        {!evaluated && (
          <button
            onClick={evaluate}
            disabled={busy}
            className="btn-primary px-2 py-1 text-[10px] disabled:opacity-50"
          >
            {busy ? 'Evaluating…' : 'Evaluate & recommend'}
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-[var(--surface-subtle)] uppercase text-[10px] text-[var(--on-surface-variant)]">
            <tr>
              <th className="p-2">Vendor</th>
              <th className="p-2 text-right">Price</th>
              {criteria.map((c) => (
                <th key={c.id} className="p-2 text-center">
                  {c.label}
                  <span className="block font-normal normal-case text-[var(--muted)]">
                    /{c.maxScore} · {c.weight}%
                  </span>
                </th>
              ))}
              <th className="p-2 text-right">Technical</th>
              <th className="p-2 text-right">Price score</th>
              <th className="p-2 text-right">Combined</th>
              <th className="p-2">Outcome</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--outline)]">
            {rfq.quotes.map((q: RfqQuote) => {
              const won = q.status === 'RECOMMENDED';
              return (
                <tr key={q.id} className={won ? 'bg-[var(--risk-low-bg)]' : ''}>
                  <td className="p-2 font-bold text-[var(--primary)]">
                    {q.vendor?.name ?? 'Unknown vendor'}
                  </td>
                  <td className="p-2 text-right font-mono tabular-nums">
                    ₦{Number(q.price).toLocaleString()}
                  </td>
                  {criteria.map((c) => {
                    const existing = q.criterionScores?.find(
                      (s) => s.criterionId === c.id,
                    );
                    return (
                      <td key={c.id} className="p-2 text-center">
                        {evaluated ? (
                          <span className="tabular-nums">
                            {existing ? `${existing.score}/${c.maxScore}` : '—'}
                          </span>
                        ) : (
                          <input
                            type="number"
                            min={0}
                            max={c.maxScore}
                            defaultValue={existing?.score ?? ''}
                            onChange={(e) => setMark(q.id, c.id, e.target.value)}
                            className="w-14 rounded border border-[var(--outline)] bg-white px-1 py-1 text-center text-[11px] tabular-nums"
                            aria-label={`${c.label} for ${q.vendor?.name ?? 'vendor'}`}
                          />
                        )}
                      </td>
                    );
                  })}
                  {/* Blank until the RFQ is evaluated — a score before the
                      arithmetic has run would be a number with nothing behind
                      it, which is what this screen used to show. */}
                  <td className="p-2 text-right font-bold tabular-nums">
                    {q.evaluatedAt ? `${q.score}` : '—'}
                  </td>
                  <td className="p-2 text-right tabular-nums">
                    {q.financialScore ?? '—'}
                  </td>
                  <td className="p-2 text-right font-bold tabular-nums">
                    {q.combinedScore ?? '—'}
                  </td>
                  <td className="p-2">
                    {won ? (
                      <span className="badge-low-risk">RECOMMENDED</span>
                    ) : evaluated ? (
                      <span className="text-[var(--muted)]">{q.status}</span>
                    ) : (
                      <button
                        onClick={() => saveMarks(q.id)}
                        disabled={busy}
                        className="btn-secondary px-2 py-1 text-[10px] disabled:opacity-50"
                      >
                        Save marks
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {rfq.quotes.length === 0 && (
              <tr>
                <td
                  colSpan={criteria.length + 6}
                  className="p-4 text-center text-[var(--muted)]"
                >
                  No quotes received yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
