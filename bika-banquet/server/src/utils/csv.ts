/**
 * csv.ts — minimal RFC-4180 CSV builder for list exports.
 *
 * Fields containing a comma, double-quote, or newline are wrapped in quotes and
 * embedded quotes are doubled. A UTF-8 BOM is prepended by `csvDocument` so
 * Excel opens non-ASCII content (names, etc.) with the right encoding.
 */
const BOM = '﻿';

function escapeCsvField(value: unknown): string {
  const s = value == null ? '' : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildCsv(headers: string[], rows: Array<Array<unknown>>): string {
  return [headers, ...rows].map((cols) => cols.map(escapeCsvField).join(',')).join('\r\n');
}

/** CSV string with a UTF-8 BOM, ready to send as a download body. */
export function csvDocument(headers: string[], rows: Array<Array<unknown>>): string {
  return BOM + buildCsv(headers, rows);
}
