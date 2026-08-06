import { Prisma } from '@prisma/client';

/**
 * Money arithmetic, in one place.
 *
 * Money columns are `Decimal`, which is what stops 0.1 + 0.2 from becoming
 * 0.30000000000000004 in a reconciliation total. That guarantee only holds if
 * the arithmetic also happens in Decimal — folding a list of Decimals into a
 * float with `reduce((s, t) => s + t.amount, 0)` converts every value back to
 * binary floating point and throws the guarantee away at the last step.
 *
 * These helpers exist so no service has to decide how to add money. The reduce
 * form is also what TypeScript rejects outright once the column is Decimal, so
 * every such site is a compile error pointing here.
 */

/** Anything a money column or aggregate can hand back. */
export type MoneyLike = Prisma.Decimal | number | string | null | undefined;

export function toDecimal(value: MoneyLike): Prisma.Decimal {
  if (value === null || value === undefined) return new Prisma.Decimal(0);
  return value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value);
}

/** Adds money in Decimal, never through float. */
export function sumMoney(values: MoneyLike[]): Prisma.Decimal {
  return values.reduce<Prisma.Decimal>(
    (total, value) => total.add(toDecimal(value)),
    new Prisma.Decimal(0),
  );
}

/** Sums one field across a list of rows. */
export function sumBy<T>(rows: T[], pick: (row: T) => MoneyLike) {
  return sumMoney(rows.map(pick));
}

export function subtractMoney(a: MoneyLike, b: MoneyLike): Prisma.Decimal {
  return toDecimal(a).sub(toDecimal(b));
}

/**
 * Converts to a plain number at the API boundary.
 *
 * JSON has no decimal type, so a value has to become a number on the way out
 * regardless. Doing it here — once, at the edge, after all the arithmetic — is
 * the difference between one rounding step and one per addition.
 */
export function money(value: MoneyLike): number {
  return toDecimal(value).toNumber();
}
