import { describe, expect, it } from 'vitest';
import {
  computePayableGrandTotal,
  exceedsBillingCeiling,
  formatPercentFieldOnBlur,
  roundRupee,
  syncBillingAmounts,
  validateBillingCeiling,
} from '../financials';

describe('roundRupee / syncBillingAmounts', () => {
  it('rounds discount from percent to nearest rupee on meals only (22354 × 10%)', () => {
    const synced = syncBillingAmounts('discountPercent', '10', 22354);
    expect(synced.finalDiscountAmount).toBe('2235');
    expect(synced.finalAmount).toBe('20119');
    expect(synced.finalDiscountPercent).toBe('10');
    expect(computePayableGrandTotal(20119, 100)).toBe(20219);
  });

  it('preserves partial percent while typing (1 → 10, not 1.00)', () => {
    const step1 = syncBillingAmounts('discountPercent', '1', 10000);
    expect(step1.finalDiscountPercent).toBe('1');
    expect(step1.finalDiscountAmount).toBe('100');

    const step2 = syncBillingAmounts('discountPercent', '10', 10000);
    expect(step2.finalDiscountPercent).toBe('10');
    expect(step2.finalDiscountAmount).toBe('1000');
  });

  it('allows empty percent field without forcing 0.00', () => {
    const synced = syncBillingAmounts('discountPercent', '', 10000);
    expect(synced.finalDiscountPercent).toBe('');
    expect(synced.finalDiscountAmount).toBe('0');
  });

  it('formats percent on blur', () => {
    expect(formatPercentFieldOnBlur('10')).toBe('10.00');
    expect(formatPercentFieldOnBlur('10.5')).toBe('10.50');
  });

  it('keeps meals net authoritative when typed', () => {
    const synced = syncBillingAmounts('finalAmount', '20000', 22354);
    expect(synced.finalAmount).toBe('20000');
    expect(computePayableGrandTotal(20000, 500)).toBe(20500);
  });

  it('parses en-IN grouped discount amount (display paste safety)', () => {
    const synced = syncBillingAmounts('discountAmount', '2,235', 22354);
    expect(synced.finalDiscountAmount).toBe('2235');
    expect(synced.finalAmount).toBe('20119');
  });

  it('derives meals net from discount rupees', () => {
    const synced = syncBillingAmounts('discountAmount', '2350', 22354);
    expect(synced.finalAmount).toBe('20004');
    expect(synced.finalDiscountAmount).toBe('2350');
  });
});

describe('validateBillingCeiling', () => {
  it('passes when payable equals full bill', () => {
    const result = validateBillingCeiling({
      mealsSubtotal: 10000,
      extrasSubtotal: 0,
      finalAmount: '10000',
    });
    expect(result.ok).toBe(true);
    expect(result.payableGrandTotal).toBe(10000);
  });

  it('passes with percentage discount and extras', () => {
    const result = validateBillingCeiling({
      mealsSubtotal: 10000,
      extrasSubtotal: 500,
      discountPercent: 10,
      finalAmount: '9000',
    });
    expect(result.ok).toBe(true);
    expect(result.payableGrandTotal).toBe(9500);
  });

  it('fails when payable exceeds bill total', () => {
    const result = validateBillingCeiling({
      mealsSubtotal: 10000,
      extrasSubtotal: 500,
      finalAmount: '10600',
    });
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/Grand total/i);
  });

  it('allows zero bill with zero payable', () => {
    const result = validateBillingCeiling({
      mealsSubtotal: 0,
      extrasSubtotal: 0,
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
