import { describe, expect, it } from 'vitest';
import { recalcBillingWhenMealsSubtotalChanges } from '../billing-recalc';

describe('recalcBillingWhenMealsSubtotalChanges', () => {
  it('retains discount % and recomputes net when meals subtotal changes', () => {
    const prev = {
      finalDiscountPercent: '10',
      finalDiscountAmount: '42900',
      finalAmount: '386100',
    };
    const next = recalcBillingWhenMealsSubtotalChanges(prev, 500000, 'finalAmount');
    expect(next.finalDiscountPercent).toBe('10');
    expect(next.finalDiscountAmount).toBe('50000');
    expect(next.finalAmount).toBe('450000');
  });

  it('does not clear discount when subtotal shifts (regression: 429k wipe)', () => {
    const prev = {
      finalDiscountPercent: '16.08',
      finalDiscountAmount: '69000',
      finalAmount: '360000',
    };
    const next = recalcBillingWhenMealsSubtotalChanges(prev, 429000, 'finalAmount');
    expect(next.finalAmount).not.toBe('429000');
    expect(Number(next.finalDiscountAmount)).toBeGreaterThan(0);
    expect(next.finalDiscountPercent).toBeTruthy();
  });

  it('falls back to amountSyncMode when no discount % is set', () => {
    const prev = {
      finalDiscountPercent: '0',
      finalDiscountAmount: '5000',
      finalAmount: '100000',
    };
    const next = recalcBillingWhenMealsSubtotalChanges(prev, 200000, 'discountAmount');
    expect(next.finalDiscountAmount).toBe('5000');
    expect(next.finalAmount).toBe('195000');
  });
});
