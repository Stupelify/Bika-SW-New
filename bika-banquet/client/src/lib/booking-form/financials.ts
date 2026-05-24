/**
 * Booking form billing ceiling — keep discount/net rules aligned with server
 * resolveBookingFinancials in booking.helpers.ts.
 */

export const BILLING_CEILING_EPSILON = 0.01;

export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

export function exceedsBillingCeiling(value: number, ceiling: number): boolean {
  return roundMoney(value) - roundMoney(ceiling) > BILLING_CEILING_EPSILON;
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
  const ceiling = roundMoney(Math.max(0, Number(input.totalBillBase) || 0));
  const discountPercent = Math.min(
    100,
    Math.max(0, Number(input.discountPercent ?? 0) || 0)
  );
  let discountAmount = roundMoney(Math.max(0, Number(input.discountAmount ?? 0) || 0));
  if (discountPercent > 0) {
    discountAmount = roundMoney((ceiling * discountPercent) / 100);
  }
  discountAmount = Math.min(discountAmount, ceiling);
  const computedNet = roundMoney(Math.max(0, ceiling - discountAmount));

  const finalRaw =
    input.finalAmount !== undefined && input.finalAmount !== ''
      ? Number(input.finalAmount)
      : computedNet;
  const netAmount = Number.isFinite(finalRaw) ? roundMoney(finalRaw) : computedNet;

  const ok = !exceedsBillingCeiling(netAmount, ceiling);
  const message = ok
    ? undefined
    : `Net amount (₹${netAmount.toLocaleString('en-IN')}) cannot exceed the bill total (₹${ceiling.toLocaleString('en-IN')}) from halls, meals, and extra items. Adjust discount or line items and try again.`;

  return { ok, ceiling, netAmount, message };
}
