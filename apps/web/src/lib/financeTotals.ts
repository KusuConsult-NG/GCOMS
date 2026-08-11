/**
 * Ledger totals, computed the way the API computes them.
 *
 * `FinanceService.getSummary` counts APPROVED rows only, and its comment says
 * why: this is where "cannot be executed before approval" actually bites —
 * "previously PENDING was a label on a row that every report added up
 * regardless". That was fixed on the server, given an endpoint, covered by an
 * e2e spec, and then used by nothing: `/finance/summary` had no caller.
 *
 * Meanwhile three screens went on folding `GET /finance` into a balance
 * themselves. That route returns the whole ledger by design — a requester has to
 * be able to see their own pending entry in the list — so adding it up without
 * filtering reports money nobody has authorised as money already received or
 * spent. On the executive dashboard the figure is labelled "Financial balance",
 * which is the one place an unapproved expense must not appear as spent.
 *
 * Rejected rows made it worse than an early view of the truth: a request that
 * was refused stayed in the balance forever.
 *
 * So the rule lives here, once, phrased as the API phrases it. The pending total
 * is returned rather than discarded because "there is nothing pending" and
 * "there is ₦4m pending" are different situations and a screen that only ever
 * shows the approved figure cannot tell them apart.
 */

/** Matches FinanceTransaction.status; the API creates every row PENDING. */
export const APPROVED = 'APPROVED';
export const PENDING = 'PENDING';

/** Only what a transaction needs to be counted. */
export type CountableTransaction = {
  type: string;
  status: string;
  amount: string | number;
};

/** The shape of `GET /finance/summary`, which is the authority for these. */
export type FinanceSummary = {
  approvedIncome: number;
  approvedExpense: number;
  netPosition: number;
  awaitingApproval: { count: number; amount: number };
};

const amountOf = (t: CountableTransaction) => Number(t.amount) || 0;

/** The rows that count towards a balance. */
export function approvedOnly<T extends CountableTransaction>(rows: T[]): T[] {
  return rows.filter((t) => t.status === APPROVED);
}

/**
 * Approved income, approved expense, the net of the two, and what is still
 * waiting — the same four figures `/finance/summary` returns, so a screen
 * holding the ledger already does not need a second request to agree with it.
 */
export function ledgerTotals(rows: CountableTransaction[]): FinanceSummary {
  let approvedIncome = 0;
  let approvedExpense = 0;
  let pendingAmount = 0;
  let pendingCount = 0;

  for (const row of rows) {
    if (row.status === PENDING) {
      pendingCount += 1;
      pendingAmount += amountOf(row);
    }
    if (row.status !== APPROVED) continue;
    if (row.type === 'INCOME') approvedIncome += amountOf(row);
    else if (row.type === 'EXPENSE') approvedExpense += amountOf(row);
  }

  return {
    approvedIncome,
    approvedExpense,
    netPosition: approvedIncome - approvedExpense,
    awaitingApproval: { count: pendingCount, amount: pendingAmount },
  };
}

/** ₦, grouped, with no decimals — how every figure on these screens reads. */
export function naira(value: number): string {
  return `₦${value.toLocaleString()}`;
}
