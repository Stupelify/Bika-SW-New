import {
  syncBillingAmounts,
  type BillingAmountSyncMode,
  type SyncedBillingAmounts,
} from '@bika/booking-core';

export interface BillingFieldsSnapshot {
  finalDiscountPercent: string;
  finalDiscountAmount: string;
  finalAmount: string;
}

/**
 * When meals subtotal changes (pack rate/pax edit), retain discount % when set and
 * recompute discount ₹ and meals net — same rules as the live form auto-recalc.
 */
export function recalcBillingWhenMealsSubtotalChanges(
  prev: BillingFieldsSnapshot,
  mealsSubtotal: number,
  amountSyncMode: BillingAmountSyncMode
): SyncedBillingAmounts {
  const percentSource = prev.finalDiscountPercent?.trim() ?? '';
  const percentNum = Number(percentSource);
  const hasPercent =
    percentSource !== '' && Number.isFinite(percentNum) && percentNum > 0;

  const mode: BillingAmountSyncMode = hasPercent ? 'discountPercent' : amountSyncMode;
  const sourceValue =
    mode === 'discountPercent'
      ? prev.finalDiscountPercent
      : mode === 'discountAmount'
        ? prev.finalDiscountAmount
        : prev.finalAmount;

  return syncBillingAmounts(mode, sourceValue, mealsSubtotal);
}
