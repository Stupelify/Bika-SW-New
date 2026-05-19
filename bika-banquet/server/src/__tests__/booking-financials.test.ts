import { sumBookingLines } from '../controllers/booking.helpers';

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
