import { describe, expect, it } from 'vitest';
import {
  MIN_CATERING_RATE_PER_PLATE,
  inferWithCateringFromPack,
  packRowHasCateringDataToClear,
  validatePackCateringForSave,
} from '../pack-catering';

describe('inferWithCateringFromPack', () => {
  it('is off when rate is below minimum', () => {
    expect(inferWithCateringFromPack({ ratePerPlate: 199 })).toBe(false);
    expect(inferWithCateringFromPack({ ratePerPlate: 0 })).toBe(false);
  });

  it('is on when rate meets minimum', () => {
    expect(inferWithCateringFromPack({ ratePerPlate: 200 })).toBe(true);
  });

  it('falls back to bookingMenu rate', () => {
    expect(
      inferWithCateringFromPack({
        ratePerPlate: 0,
        bookingMenu: { ratePerPlate: 250 },
      })
    ).toBe(true);
  });
});

describe('validatePackCateringForSave', () => {
  it('requires minimum rate when catering is on', () => {
    expect(
      validatePackCateringForSave({
        withCatering: true,
        ratePerPlate: '150',
        pax: '100',
        menuItemIds: [],
      })
    ).toMatch(new RegExp(`${MIN_CATERING_RATE_PER_PLATE}`));
  });

  it('allows catering off with zero rate', () => {
    expect(
      validatePackCateringForSave({
        withCatering: false,
        ratePerPlate: '',
        pax: '',
        menuItemIds: [],
      })
    ).toBeNull();
  });
});

describe('packRowHasCateringDataToClear', () => {
  it('detects populated catering fields', () => {
    expect(
      packRowHasCateringDataToClear({
        withCatering: true,
        menuItemIds: ['a'],
        pax: '',
        ratePerPlate: '',
      })
    ).toBe(true);
  });
});
