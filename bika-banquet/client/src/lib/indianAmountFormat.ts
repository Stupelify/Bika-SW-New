/**
 * Indian numbering (en-IN): last 3 digits, then groups of 2 — display only.
 * Stored values remain digit-only strings for billing.
 */

/** Strip to digits only (empty string if none). */
export function stripToDigits(raw: string): string {
  return raw.replace(/\D/g, '');
}

/** Format digit-only string for display; empty in → empty out. */
export function formatIndianAmountDisplay(digits: string): string {
  const d = stripToDigits(digits);
  if (d === '') return '';
  const n = Number(d);
  if (!Number.isFinite(n)) return '';
  return n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

/** Normalize user paste or raw input to digit-only storage. */
export function parseIndianAmountInput(raw: string): string {
  return stripToDigits(raw);
}

/**
 * Compact INR for tables/stats — mirrors the design system's inr():
 *   ₹1.20Cr, ₹2.50L, ₹75K, ₹999
 */
export function formatInrCompact(amount: number | null | undefined): string {
  const n = amount || 0;
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
}
