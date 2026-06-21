import { resolvePaymentTotals } from '@bika/booking-core';

describe('resolvePaymentTotals (clone payment recompute)', () => {
  it('splits gross received vs credited due for future cheques', () => {
    const payable = 1_400_000;
    const futureClearing = new Date();
    futureClearing.setUTCDate(futureClearing.getUTCDate() + 30);

    const { grossReceived, credited, dueAmount } = resolvePaymentTotals(payable, [
      { method: 'cash', amount: 300_000, clearingDate: null },
      { method: 'cheque', amount: 200_000, clearingDate: futureClearing },
    ]);

    expect(grossReceived).toBe(500_000);
    expect(credited).toBe(300_000);
    expect(dueAmount).toBe(1_100_000);
  });

  it('sets due to zero when credited exceeds payable', () => {
    const { dueAmount } = resolvePaymentTotals(500_000, [
      { method: 'cash', amount: 600_000, clearingDate: null },
    ]);
    expect(dueAmount).toBe(0);
  });
});
