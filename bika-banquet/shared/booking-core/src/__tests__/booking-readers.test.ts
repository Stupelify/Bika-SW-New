import { describe, expect, it } from 'vitest';
import {
  readPayableGrandTotalInput,
  resolveDueAmount,
  resolvePayableTotal,
  resolvePaymentReceivedGross,
} from '../booking-readers';

describe('resolvePayableTotal', () => {
  it('prefers finalAmountValue over grandTotal and legacy string', () => {
    expect(
      resolvePayableTotal({
        finalAmountValue: 1444500,
        grandTotal: 1400000,
        finalAmount: '1300000',
      })
    ).toBe(1444500);
  });

  it('falls back to grandTotal then finalAmount string', () => {
    expect(resolvePayableTotal({ grandTotal: 1400000, finalAmount: '1300000' })).toBe(1400000);
    expect(resolvePayableTotal({ finalAmount: '1300000' })).toBe(1300000);
  });
});

describe('resolvePaymentReceivedGross', () => {
  it('prefers paymentReceivedAmountValue over advanceReceived', () => {
    expect(
      resolvePaymentReceivedGross({
        paymentReceivedAmountValue: 900000,
        advanceReceived: 500000,
      })
    ).toBe(900000);
  });
});

describe('resolveDueAmount', () => {
  it('prefers dueAmountValue over balanceAmount', () => {
    expect(resolveDueAmount({ dueAmountValue: 944500, balanceAmount: 544500 })).toBe(944500);
  });
});

describe('readPayableGrandTotalInput', () => {
  it('reads payableGrandTotal before legacy finalAmount fields', () => {
    expect(
      readPayableGrandTotalInput({
        payableGrandTotal: 1444500,
        finalAmountValue: 999,
        finalAmount: '888',
      })
    ).toBe(1444500);
  });
});
