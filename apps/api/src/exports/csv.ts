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
  if (value instanceof Date) text = value.toISOString();
  else if (typeof value === 'object') text = JSON.stringify(value);
  else text = String(value);

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
