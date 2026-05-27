/**
 * Booking form billing — integer rupees, nearest-rupee discount, net authority on save.
 * Keep rules aligned with server resolveBookingFinancials in booking.financials.ts.
 */

export const BILLING_CEILING_EPSILON = 0.01;

/** Nearest whole rupee (half-up). */
export function roundRupee(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value);
}

export function formatRupeeAmount(amount: number): string {
  return String(roundRupee(amount));
}

/** Display-only; does not drive stored money after sync. */
export function formatDiscountPercentDisplay(percent: number): string {
  if (!Number.isFinite(percent)) return '0';
  return (Math.round(percent * 100) / 100).toFixed(2);
}

export type BillingAmountSyncMode = 'discountPercent' | 'discountAmount' | 'finalAmount';

export interface SyncedBillingAmounts {
  finalDiscountAmount: string;
  finalDiscountPercent: string;
  finalAmount: string;
}

function parseNonNegative(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, parsed);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Sync discount ₹, discount %, and net for integer rupee billing.
 * % is rounded to 2 decimals for display; money fields are whole rupees.
 */
export function syncBillingAmounts(
  mode: BillingAmountSyncMode,
  sourceValue: string,
  totalAmount: number
): SyncedBillingAmounts {
  const total = roundRupee(Math.max(0, totalAmount));

  if (mode === 'discountPercent') {
    const enteredPercent = clamp(parseNonNegative(sourceValue), 0, 100);
    const discountAmount = roundRupee((total * enteredPercent) / 100);
    const finalAmount = roundRupee(Math.max(0, total - discountAmount));
    return {
      finalDiscountPercent: formatDiscountPercentDisplay(enteredPercent),
      finalDiscountAmount: formatRupeeAmount(discountAmount),
      finalAmount: formatRupeeAmount(finalAmount),
    };
  }

  if (mode === 'discountAmount') {
    const discountAmount = roundRupee(clamp(parseNonNegative(sourceValue), 0, total));
    const finalAmount = roundRupee(Math.max(0, total - discountAmount));
    const displayPercent = total > 0 ? (discountAmount / total) * 100 : 0;
    return {
      finalDiscountPercent: formatDiscountPercentDisplay(displayPercent),
      finalDiscountAmount: formatRupeeAmount(discountAmount),
      finalAmount: formatRupeeAmount(finalAmount),
    };
  }

  const finalAmount = roundRupee(clamp(parseNonNegative(sourceValue), 0, total));
  const discountAmount = roundRupee(Math.max(0, total - finalAmount));
  const displayPercent = total > 0 ? (discountAmount / total) * 100 : 0;
  return {
    finalDiscountPercent: formatDiscountPercentDisplay(displayPercent),
    finalDiscountAmount: formatRupeeAmount(discountAmount),
    finalAmount: formatRupeeAmount(finalAmount),
  };
}

export function exceedsBillingCeiling(value: number, ceiling: number): boolean {
  return roundRupee(value) > roundRupee(ceiling);
}

export interface ValidateBillingCeilingInput {
  totalBillBase: number;
  discountAmount?: string | number;
  discountPercent?: string | number;
  finalAmount?: string | number;
}

export interface ValidateBillingCeilingResult {
  ok: boolean;
  ceiling: number;
  netAmount: number;
  message?: string;
}

export function validateBillingCeiling(
  input: ValidateBillingCeilingInput
): ValidateBillingCeilingResult {
  const ceiling = roundRupee(Math.max(0, Number(input.totalBillBase) || 0));

  const hasNet =
    input.finalAmount !== undefined &&
    input.finalAmount !== '' &&
    Number.isFinite(Number(input.finalAmount));

  let netAmount: number;
  if (hasNet) {
    const rawNet = roundRupee(Number(input.finalAmount));
    netAmount = roundRupee(Math.min(rawNet, ceiling));
    const ok = rawNet <= ceiling;
    const message = ok
      ? undefined
      : `Net amount (₹${rawNet.toLocaleString('en-IN')}) cannot exceed the bill total (₹${ceiling.toLocaleString('en-IN')}) from halls, meals, and extra items. Adjust discount or line items and try again.`;
    return { ok, ceiling, netAmount, message };
  } else if (Number(input.discountPercent ?? 0) > 0) {
    const synced = syncBillingAmounts(
      'discountPercent',
      String(input.discountPercent),
      ceiling
    );
    netAmount = roundRupee(Number(synced.finalAmount));
  } else {
    const synced = syncBillingAmounts(
      'discountAmount',
      String(input.discountAmount ?? 0),
      ceiling
    );
    netAmount = roundRupee(Number(synced.finalAmount));
  }

  const ok = !exceedsBillingCeiling(netAmount, ceiling);
  const message = ok
    ? undefined
    : `Net amount (₹${netAmount.toLocaleString('en-IN')}) cannot exceed the bill total (₹${ceiling.toLocaleString('en-IN')}) from halls, meals, and extra items. Adjust discount or line items and try again.`;

  return { ok, ceiling, netAmount, message };
}
