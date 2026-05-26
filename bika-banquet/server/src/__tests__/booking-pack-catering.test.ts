import {
  MIN_CATERING_RATE_PER_PLATE,
  assertPackCateringRates,
  validatePackCateringRates,
} from '../controllers/booking.pack-catering';

describe('validatePackCateringRates', () => {
  it('allows hall-only packs', () => {
    expect(
      validatePackCateringRates([
        { packName: 'Lunch', ratePerPlate: 0, menu: { items: [] } },
      ])
    ).toBeNull();
  });

  it('rejects menu with sub-minimum rate', () => {
    expect(
      validatePackCateringRates([
        {
          packName: 'Dinner',
          ratePerPlate: 0,
          menu: { items: [{ itemId: 'x' }] },
        },
      ])
    ).toContain(String(MIN_CATERING_RATE_PER_PLATE));
  });

  it('passes at minimum rate', () => {
    expect(
      validatePackCateringRates([
        { packName: 'Breakfast', ratePerPlate: MIN_CATERING_RATE_PER_PLATE },
      ])
    ).toBeNull();
  });
});

describe('assertPackCateringRates', () => {
  it('throws with readable message', () => {
    expect(() =>
      assertPackCateringRates([{ packName: 'Lunch', ratePerPlate: 1 }])
    ).toThrow(/at least/);
  });
});
