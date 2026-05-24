import {
  BILLING_CEILING_EPSILON,
  exceedsBillingCeiling,
  resolveBookingFinancials,
  sumBookingLines,
} from '../controllers/booking.financials';

describe('sumBookingLines', () => {
  it('sums hall, pack, and additional charges correctly', () => {
    const result = sumBookingLines({
      halls: [{ charges: 5000 }, { charges: 3000 }],
      packs: [
        { ratePerPlate: 100, packCount: 50, noOfPack: null, setupCost: 500, extraCharges: 200 },
      ],
      additionalItems: [{ charges: 150, quantity: 4 }],
    });
    // halls: 8000, pack: 100*50+500+200=5700, additional: 150*4=600 → 14300
    expect(result).toBe(14300);
  });

  it('defaults packCount to 1 when zero', () => {
    const result = sumBookingLines({
      halls: [],
      packs: [{ ratePerPlate: 200, packCount: 0, noOfPack: 0, setupCost: 0, extraCharges: 0 }],
      additionalItems: [],
    });
    expect(result).toBe(200);
  });

  it('defaults quantity to 1 for null additional items', () => {
    const result = sumBookingLines({
      halls: [],
      packs: [],
      additionalItems: [{ charges: 300, quantity: null }],
    });
    expect(result).toBe(300);
  });
});

describe('resolveBookingFinancials', () => {
  it('caps discount above subtotal and sets grandTotal to zero', () => {
    const result = resolveBookingFinancials({
      totalAmount: 10000,
      discountAmountInput: 15000,
    });
    expect(result.discountAmount).toBe(10000);
    expect(result.grandTotal).toBe(0);
    expect(result.finalAmountValue).toBe(0);
    expect(result.exceededCeiling).toBe(true);
  });

  it('applies percentage discount', () => {
    const result = resolveBookingFinancials({
      totalAmount: 10000,
      discountPercentage: 10,
      discountAmountInput: 999,
    });
    expect(result.discountAmount).toBe(1000);
    expect(result.grandTotal).toBe(9000);
    expect(result.finalAmountValue).toBe(9000);
    expect(result.exceededCeiling).toBe(false);
  });

  it('caps finalAmount above subtotal to grandTotal', () => {
    const result = resolveBookingFinancials({
      totalAmount: 10000,
      discountAmountInput: 0,
      finalAmountInput: 15000,
    });
    expect(result.grandTotal).toBe(10000);
    expect(result.finalAmountValue).toBe(10000);
    expect(result.exceededCeiling).toBe(true);
  });

  it('does not false-positive on epsilon boundary', () => {
    expect(exceedsBillingCeiling(10000.004, 10000)).toBe(false);
    expect(exceedsBillingCeiling(10000 + BILLING_CEILING_EPSILON + 0.001, 10000)).toBe(
      true
    );
  });
});
