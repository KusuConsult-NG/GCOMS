/**
 * That the client adds the ledger up the way the server does.
 *
 * The case that matters is the first one: a PENDING expense is in the ledger and
 * is not in the balance. Every screen that showed a balance had it the other way
 * round, so an executive reading "Financial balance" was reading a figure that
 * included spend nobody had approved — and, because REJECTED rows were counted
 * too, spend that had been explicitly refused and would never be approved.
 *
 * The scan at the bottom is the part that keeps it fixed. Three components each
 * wrote their own `filter(t => t.type === 'EXPENSE').reduce(...)`; a unit test of
 * this module says nothing about whether they still do.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { approvedOnly, ledgerTotals, naira } from './financeTotals';

const tx = (
  type: string,
  status: string,
  amount: string | number,
) => ({ type, status, amount });

describe('ledgerTotals', () => {
  it('counts approved income and approved expense', () => {
    const totals = ledgerTotals([
      tx('INCOME', 'APPROVED', 1_000_000),
      tx('EXPENSE', 'APPROVED', 250_000),
    ]);
    expect(totals.approvedIncome).toBe(1_000_000);
    expect(totals.approvedExpense).toBe(250_000);
    expect(totals.netPosition).toBe(750_000);
  });

  it('leaves a pending expense out of the balance', () => {
    // The defect, stated. A requisition awaiting an executive decision is not
    // money that has left the account.
    const totals = ledgerTotals([
      tx('INCOME', 'APPROVED', 1_000_000),
      tx('EXPENSE', 'PENDING', 400_000),
    ]);
    expect(totals.netPosition).toBe(1_000_000);
    expect(totals.approvedExpense).toBe(0);
  });

  it('leaves a rejected expense out of the balance', () => {
    // Worse than premature: a refused request counted against the balance
    // permanently, and no later event would ever remove it.
    const totals = ledgerTotals([
      tx('INCOME', 'APPROVED', 1_000_000),
      tx('EXPENSE', 'REJECTED', 400_000),
    ]);
    expect(totals.netPosition).toBe(1_000_000);
  });

  it('leaves pending income out too, in the direction that flatters', () => {
    // The same rule cuts both ways; a grant that has not been approved is not
    // an inflow, however much anyone would like it to be.
    expect(ledgerTotals([tx('INCOME', 'PENDING', 5_000_000)]).netPosition).toBe(
      0,
    );
  });

  it('reports what is waiting rather than discarding it', () => {
    // "Nothing pending" and "₦4.4m pending" are different situations, and a
    // screen showing only the approved figure cannot tell them apart.
    const totals = ledgerTotals([
      tx('EXPENSE', 'PENDING', 400_000),
      tx('INCOME', 'PENDING', 4_000_000),
      tx('EXPENSE', 'APPROVED', 100_000),
    ]);
    expect(totals.awaitingApproval).toEqual({ count: 2, amount: 4_400_000 });
  });

  it('does not count a rejected row as pending', () => {
    expect(ledgerTotals([tx('EXPENSE', 'REJECTED', 400_000)]).awaitingApproval)
      .toEqual({ count: 0, amount: 0 });
  });

  it('adds money that arrived as a Decimal string', () => {
    // Prisma serialises Decimal as a string, so every amount off the wire is
    // one. `sum + t.amount` would concatenate.
    const totals = ledgerTotals([
      tx('INCOME', 'APPROVED', '1500000.50'),
      tx('EXPENSE', 'APPROVED', '500000.25'),
    ]);
    expect(totals.approvedIncome).toBeCloseTo(1_500_000.5, 2);
    expect(totals.netPosition).toBeCloseTo(1_000_000.25, 2);
  });

  it('treats an unparseable amount as zero rather than NaN', () => {
    // One NaN turns the whole balance into NaN, which renders as "₦NaN".
    expect(ledgerTotals([tx('INCOME', 'APPROVED', 'n/a')]).netPosition).toBe(0);
  });

  it('ignores a type outside the vocabulary', () => {
    // The ledger has carried rows typed BUDGET_REQUEST and RETIREMENT. Neither
    // is an inflow or an outflow and neither belongs in a cash balance.
    const totals = ledgerTotals([
      tx('BUDGET_REQUEST', 'APPROVED', 9_000_000),
      tx('INCOME', 'APPROVED', 1_000),
    ]);
    expect(totals.netPosition).toBe(1_000);
  });

  it('is zero on an empty ledger, which is a real answer', () => {
    expect(ledgerTotals([])).toEqual({
      approvedIncome: 0,
      approvedExpense: 0,
      netPosition: 0,
      awaitingApproval: { count: 0, amount: 0 },
    });
  });
});

describe('approvedOnly', () => {
  it('keeps approved rows and nothing else', () => {
    const rows = [
      tx('INCOME', 'APPROVED', 1),
      tx('INCOME', 'PENDING', 2),
      tx('INCOME', 'REJECTED', 3),
    ];
    expect(approvedOnly(rows)).toEqual([rows[0]]);
  });
});

describe('naira', () => {
  it('groups and prefixes', () => {
    expect(naira(1_500_000)).toBe('₦1,500,000');
  });

  it('renders a negative balance as negative rather than hiding it', () => {
    expect(naira(-250_000)).toBe('₦-250,000');
  });
});

describe('no screen adds the ledger up on its own', () => {
  /*
   * The invariant. `ledgerTotals` being correct is worth nothing if the finance
   * page keeps its own `filter(...).reduce(...)` — which is exactly the state
   * this repository was in for the server-side fix: correct in the service,
   * covered by an e2e spec, and contradicted by three components that never
   * called it.
   *
   * So this reads the sources and fails the day a fourth appears.
   */
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.tsx')) files.push(full);
    }
  };
  walk(join(process.cwd(), 'src'));

  it('has no component summing INCOME or EXPENSE by hand', () => {
    // A filter on the transaction *type* followed by a reduce, which is the
    // shape every one of them had.
    const handRolled =
      /\.filter\(\s*\(?\w+\)?\s*=>\s*\w+\.type\s*===\s*'(INCOME|EXPENSE)'\s*\)\s*[\s\S]{0,40}?\.reduce\(/;
    const offenders = files
      .filter((f) => handRolled.test(readFileSync(f, 'utf8')))
      .map((f) => f.replace(`${process.cwd()}/`, ''));
    expect(offenders).toEqual([]);
  });
});
