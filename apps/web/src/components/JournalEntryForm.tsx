'use client';

import type { LedgerAccount } from '@/types/api';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/errors';
import { naira } from '@/lib/financeTotals';

type Line = { accountId: string; side: 'DEBIT' | 'CREDIT'; amount: string; narration: string };

const emptyLine = (side: Line['side']): Line => ({
  accountId: '',
  side,
  amount: '',
  narration: '',
});

/**
 * A journal voucher, with both sides of it.
 *
 * What this replaces asked for a type, a cost centre, an amount and a
 * description, and posted a FinanceTransaction — one row with one amount. That
 * is a requisition, and the screen it sat on was headed "Post Double-Entry
 * Journal Entry", so the form promised two sides and collected one.
 *
 * The running total is the point of the layout. An unbalanced voucher is
 * refused by the API and should never get that far: the difference is shown
 * while it is being typed, and the submit button stays disabled until it is
 * zero. The server checks it again regardless — this is a convenience, not the
 * control.
 */
export function JournalEntryForm({
  accounts,
  onPosted,
  onCancel,
}: {
  accounts: LedgerAccount[];
  onPosted: () => void;
  onCancel: () => void;
}) {
  const [entryDate, setEntryDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<Line[]>([
    emptyLine('DEBIT'),
    emptyLine('CREDIT'),
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const amountOf = (l: Line) => Number(l.amount) || 0;
  const totalDebit = lines
    .filter((l) => l.side === 'DEBIT')
    .reduce((sum, l) => sum + amountOf(l), 0);
  const totalCredit = lines
    .filter((l) => l.side === 'CREDIT')
    .reduce((sum, l) => sum + amountOf(l), 0);
  // Compared in kobo, so a rounding difference in the tenths of a naira cannot
  // read as balanced on screen and unbalanced on the server.
  const difference = Math.round((totalDebit - totalCredit) * 100) / 100;
  const balanced = difference === 0 && totalDebit > 0;
  const complete = lines.every((l) => l.accountId && amountOf(l) > 0);

  const update = (index: number, patch: Partial<Line>) =>
    setLines(lines.map((l, i) => (i === index ? { ...l, ...patch } : l)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/finance/journal', {
        entryDate: new Date(entryDate).toISOString(),
        description,
        lines: lines.map((l) => ({
          accountId: l.accountId,
          ...(l.side === 'DEBIT'
            ? { debit: amountOf(l) }
            : { credit: amountOf(l) }),
          narration: l.narration || undefined,
        })),
      });
      onPosted();
    } catch (err) {
      setError(errorMessage(err, 'The voucher could not be posted.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3 text-xs">
      {error && (
        <p
          role="alert"
          className="rounded border border-[var(--risk-high-text)]/20 bg-[var(--risk-high-bg)] p-3 text-xs font-semibold text-[var(--risk-high-text)]"
        >
          {error}
        </p>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block font-semibold text-[var(--on-background)]">Entry date *</label>
          <input
            type="date"
            required
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            className="w-full rounded border border-[var(--outline)] bg-white px-3 py-2 text-xs"
          />
        </div>
        <div className="col-span-2">
          <label className="mb-1 block font-semibold text-[var(--on-background)]">Narrative *</label>
          <input
            type="text"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Global Fund tranche 1 received into the operating account"
            className="w-full rounded border border-[var(--outline)] bg-white px-3 py-2 text-xs"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-[var(--on-background)]">Lines</span>
          <button
            type="button"
            onClick={() => setLines([...lines, emptyLine('DEBIT')])}
            className="btn-secondary px-2 py-1 text-[11px]"
          >
            + Add line
          </button>
        </div>

        {lines.map((line, index) => (
          <div key={index} className="grid grid-cols-12 items-end gap-2">
            <div className="col-span-5">
              <select
                required
                value={line.accountId}
                onChange={(e) => update(index, { accountId: e.target.value })}
                className="w-full rounded border border-[var(--outline)] bg-white px-2 py-2 text-xs"
              >
                <option value="">Select account</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} — {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-3">
              <select
                value={line.side}
                onChange={(e) =>
                  update(index, { side: e.target.value as Line['side'] })
                }
                className="w-full rounded border border-[var(--outline)] bg-white px-2 py-2 text-xs"
              >
                <option value="DEBIT">Debit</option>
                <option value="CREDIT">Credit</option>
              </select>
            </div>
            <div className="col-span-3">
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={line.amount}
                onChange={(e) => update(index, { amount: e.target.value })}
                placeholder="Amount"
                className="w-full rounded border border-[var(--outline)] bg-white px-2 py-2 text-right text-xs tabular-nums"
              />
            </div>
            <div className="col-span-1">
              {lines.length > 2 && (
                <button
                  type="button"
                  onClick={() => setLines(lines.filter((_, i) => i !== index))}
                  className="w-full py-2 font-bold text-[var(--muted)]"
                  aria-label={`Remove line ${index + 1}`}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/*
        The difference, while it is being typed. The API refuses an unbalanced
        voucher — that is the control — but a person should not have to submit
        one to find out which way it is out and by how much.
      */}
      <div
        className={`flex items-center justify-between rounded border p-3 ${
          balanced
            ? 'border-[var(--risk-low-text)]/20 bg-[var(--risk-low-bg)] text-[var(--risk-low-text)]'
            : 'border-[var(--risk-mod-text)]/20 bg-[var(--risk-mod-bg)] text-[var(--risk-mod-text)]'
        }`}
      >
        <span className="font-semibold">
          Debits {naira(totalDebit)} · Credits {naira(totalCredit)}
        </span>
        <span className="font-bold tabular-nums">
          {balanced
            ? 'Balanced'
            : `Out by ${naira(Math.abs(difference))} ${difference > 0 ? '(debit)' : '(credit)'}`}
        </span>
      </div>

      <div className="flex justify-end gap-2 border-t border-[var(--outline)] pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary text-xs">
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || !balanced || !complete}
          className="btn-primary text-xs disabled:opacity-50"
          title={balanced ? undefined : 'An entry must balance before it can be posted'}
        >
          {submitting ? 'Posting…' : 'Post voucher'}
        </button>
      </div>
    </form>
  );
}
