import { describe, expect, it } from 'vitest';
import {
  BILLING_CEILING_EPSILON,
  exceedsBillingCeiling,
  roundRupee,
  syncBillingAmounts,
  validateBillingCeiling,
} from '../financials';

describe('roundRupee / syncBillingAmounts', () => {
  it('rounds discount from percent to nearest rupee (22354 × 10%)', () => {
    const synced = syncBillingAmounts('discountPercent', '10', 22354);
    expect(synced.finalDiscountAmount).toBe('2235');
    expect(synced.finalAmount).toBe('20119');
    expect(synced.finalDiscountPercent).toBe('10.00');
  });

  it('keeps net authoritative when discount amount is entered', () => {
    const synced = syncBillingAmounts('finalAmount', '20000', 22354);
    expect(synced.finalAmount).toBe('20000');
    expect(synced.finalDiscountAmount).toBe('2354');
    expect(synced.finalDiscountPercent).toBe('10.53');
  });

  it('derives net from discount rupees without changing typed discount', () => {
    const synced = syncBillingAmounts('discountAmount', '2350', 22354);
    expect(synced.finalAmount).toBe('20004');
    expect(synced.finalDiscountAmount).toBe('2350');
  });
});

describe('validateBillingCeiling', () => {
  it('passes when net equals bill total', () => {
    const result = validateBillingCeiling({
      totalBillBase: 14300,
      discountAmount: 0,
      finalAmount: '14300',
    });
    expect(result.ok).toBe(true);
    expect(result.netAmount).toBe(14300);
  });

  it('passes with percentage discount using nearest rupee', () => {
    const result = validateBillingCeiling({
      totalBillBase: 10000,
      discountPercent: 10,
      finalAmount: '9000',
    });
    expect(result.ok).toBe(true);
    expect(result.netAmount).toBe(9000);
  });

  it('fails when net exceeds bill total', () => {
    const result = validateBillingCeiling({
      totalBillBase: 10000,
      discountAmount: 0,
      finalAmount: '15000',
    });
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/cannot exceed the bill total/i);
  });

  it('allows zero bill with zero net', () => {
    const result = validateBillingCeiling({
      totalBillBase: 0,
      finalAmount: '0',
    });
    expect(result.ok).toBe(true);
  });

  it('does not false-positive within epsilon for integer rupees', () => {
    expect(exceedsBillingCeiling(10000, 10000)).toBe(false);
    expect(exceedsBillingCeiling(10001, 10000)).toBe(true);
  });

  it('roundRupee uses nearest half-up', () => {
    expect(roundRupee(2235.4)).toBe(2235);
    expect(roundRupee(2235.5)).toBe(2236);
  });
});
