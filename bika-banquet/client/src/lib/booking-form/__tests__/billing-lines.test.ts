import { describe, expect, it } from 'vitest';
import {
  buildBookingHallRows,
  computeMealsSubtotal,
  computePackRowAmount,
  computePreDiscountTotal,
} from '../billing-lines';
import type { PackBillingRow } from '../billing-lines';

const baseRow = (overrides: Partial<PackBillingRow> = {}): PackBillingRow => ({
  enabled: true,
  withCatering: true,
  withHall: true,
  ratePerPlate: '100',
  pax: '10',
  setupCost: '0',
  extraCharges: 0,
  hallRate: '50000',
  ...overrides,
});

const fourPacks = (patch: Partial<Record<string, Partial<PackBillingRow>>>) => ({
  breakfast: baseRow(patch.breakfast),
  lunch: baseRow(patch.lunch),
  hiTea: baseRow(patch.hiTea),
  dinner: baseRow(patch.dinner),
});

describe('computePackRowAmount', () => {
  it('does not multiply hall rate by number of halls', () => {
    const row = baseRow({ hallRate: '50000' });
    expect(computePackRowAmount(row)).toBe(10 * 100 + 50000);
  });

  it('returns 0 when pack disabled', () => {
    expect(computePackRowAmount(baseRow({ enabled: false }))).toBe(0);
  });
});

describe('computeMealsSubtotal', () => {
  it('sums only enabled packs', () => {
    const packs = fourPacks({
      breakfast: { enabled: true, hallRate: '1000' },
      lunch: { enabled: false, hallRate: '9000' },
      hiTea: { enabled: false },
      dinner: { enabled: false },
    });
    expect(computeMealsSubtotal(packs)).toBe(1000 + 1000);
  });

  it('sums hall rate per meal when same hall on two meals', () => {
    const packs = fourPacks({
      breakfast: { hallRate: '50000' },
      lunch: { hallRate: '50000' },
      hiTea: { enabled: false },
      dinner: { enabled: false },
    });
    const b = computePackRowAmount(packs.breakfast);
    const l = computePackRowAmount(packs.lunch);
    expect(computeMealsSubtotal(packs)).toBe(b + l);
  });
});

describe('computePreDiscountTotal', () => {
  it('includes extras', () => {
    const packs = fourPacks({
      lunch: { enabled: false },
      hiTea: { enabled: false },
      dinner: { enabled: false },
    });
    expect(computePreDiscountTotal(packs, [{ amount: '500' }])).toBe(
      computeMealsSubtotal(packs) + 500
    );
  });
});

describe('buildBookingHallRows', () => {
  it('lists unique halls with zero charges', () => {
    const rows = buildBookingHallRows([
      { validHallIds: ['h1', 'h2', 'h3'] },
      { validHallIds: ['h2'] },
    ]);
    expect(rows).toHaveLength(3);
    expect(rows.every((r) => r.charges === 0)).toBe(true);
  });
});
