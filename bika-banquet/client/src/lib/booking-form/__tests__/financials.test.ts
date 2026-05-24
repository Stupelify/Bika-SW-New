import { describe, expect, it } from 'vitest';
import {
  BILLING_CEILING_EPSILON,
  exceedsBillingCeiling,
  validateBillingCeiling,
} from '../financials';

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

  it('passes with percentage discount', () => {
    const result = validateBillingCeiling({
      totalBillBase: 10000,
      discountPercent: 10,
      discountAmount: '999',
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

  it('does not false-positive within epsilon', () => {
    expect(exceedsBillingCeiling(10000.004, 10000)).toBe(false);
    expect(
      exceedsBillingCeiling(10000 + BILLING_CEILING_EPSILON + 0.001, 10000)
    ).toBe(true);
  });
});
