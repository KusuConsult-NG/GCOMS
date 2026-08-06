/**
 * CSV serialisation.
 *
 * Escaping is the whole job: a patient address containing a comma, a clinical
 * note containing a quote or a newline, all silently corrupt a naive join. Every
 * field is quoted and internal quotes doubled, per RFC 4180.
 *
 * Values are also prefixed when they begin with a formula character. Excel
 * evaluates a cell starting with =, +, - or @ on open, which turns an exported
 * note into code execution on the reviewer's machine.
 */
const FORMULA_TRIGGERS = ['=', '+', '-', '@', '\t', '\r'];

function cell(value: unknown): string {
  if (value === null || value === undefined) return '""';

  let text: string;
  if (value instanceof Date) {
    text = value.toISOString();
  } else if (typeof value === 'object') {
    // Prisma.Decimal and similar value objects carry a meaningful toString(),
    // and it is the right rendering: JSON.stringify would wrap a money value in
    // its own quotes, which then get escaped again and land in the file as
    // """0.20""". A plain object has no such method — only the inherited one
    // that returns "[object Object]" — so those fall back to JSON.
    //
    // This used to stringify first and compare the result against the literal
    // "[object Object]". Same outcome, but it asked the value what it was after
    // the fact; this asks before.
    const own = (value as { toString?: unknown }).toString;
    text =
      typeof own === 'function' && own !== Object.prototype.toString
        ? (value as { toString(): string }).toString()
        : JSON.stringify(value);
  } else if (
    // Narrowed positively. Ruling out `object` and `function` does not narrow
    // `unknown` in TypeScript, so the remaining branch was still `unknown` and
    // String() on it was no safer than it had been at the top.
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    text = String(value);
  } else {
    // A symbol or a function. Neither belongs in an exported row, and putting
    // function source into a spreadsheet is worse than putting nothing.
    text = '';
  }

  if (text.length > 0 && FORMULA_TRIGGERS.includes(text[0])) {
    text = `'${text}`;
  }
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(
  rows: Array<Record<string, unknown>>,
  columns?: string[],
): string {
  const headers = columns ?? (rows.length > 0 ? Object.keys(rows[0]) : []);
  const lines = [headers.map(cell).join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => cell(row[h])).join(','));
  }
  // CRLF per RFC 4180; a BOM so Excel reads UTF-8 rather than mangling
  // Nigerian names and the naira sign.
  return '﻿' + lines.join('\r\n');
}

export function csvFilename(dataset: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `gcoms-${dataset}-${stamp}.csv`;
}
