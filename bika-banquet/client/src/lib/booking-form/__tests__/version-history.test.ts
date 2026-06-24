import { describe, expect, it } from 'vitest';
import {
  computeVersionDiff,
  histToSnapshot,
  type DiffSnapshot,
} from '../version-history';

describe('version-history', () => {
  const base: DiffSnapshot = {
    functionDate: '2026-06-01',
    functionType: 'Wedding',
    discountAmount: 1000,
    finalAmount: 9000,
    advanceRequired: 5000,
    dueAmount: 4000,
    packs: [],
  };

  it('detects due amount changes between versions', () => {
    const newer = { ...base, dueAmount: 2000 };
    const diff = computeVersionDiff(newer, base);
    expect(diff.dueAmountChange).toEqual({ from: 4000, to: 2000 });
  });

  it('normalizes history entries into diff snapshots', () => {
    const snap = histToSnapshot({
      functionDate: '2026-06-01',
      functionType: 'Wedding',
      dueAmountValue: 944500,
      finalAmountValue: 1444500,
      packs: [],
    });
    expect(snap.dueAmount).toBe(944500);
    expect(snap.finalAmount).toBe(1444500);
  });

  it('detects pack billing and menu changes for read-only version highlights', () => {
    const older: DiffSnapshot = {
      ...base,
      packs: [
        {
          packName: 'Lunch',
          pax: 120,
          ratePerPlate: 1100,
          hallRate: 50000,
          menuItemIds: ['starter', 'soup'],
        },
      ],
    };
    const newer: DiffSnapshot = {
      ...base,
      packs: [
        {
          packName: 'Lunch',
          pax: 150,
          ratePerPlate: 1200,
          hallRate: 75000,
          menuItemIds: ['starter', 'main', 'dessert'],
        },
      ],
    };

    const diff = computeVersionDiff(newer, older);

    expect(diff.packs.lunch).toEqual({
      paxChange: { from: 120, to: 150 },
      ratePerPlateChange: { from: 1100, to: 1200 },
      hallRateChange: { from: 50000, to: 75000 },
      addedItemIds: ['main', 'dessert'],
      removedItemIds: ['soup'],
    });
  });

  it('normalizes snapshotData packs with hall rate and menu item ids', () => {
    const snap = histToSnapshot({
      functionDate: '2026-06-02',
      functionType: 'Reception',
      finalAmountValue: 250000,
      snapshotData: {
        functionDate: '2026-06-03T18:30:00.000Z',
        functionType: 'Wedding',
        finalAmountValue: 300000,
        dueAmountValue: 125000,
        packs: [
          {
            mealSlot: { name: 'Dinner' },
            packCount: 80,
            ratePerPlate: 1500,
            hallRateValue: 45000,
            bookingMenu: {
              items: [
                { itemId: 'starter' },
                { item: { id: 'dessert' } },
                { itemId: '' },
              ],
            },
          },
        ],
      },
    });

    expect(snap.functionDate).toBe('2026-06-03');
    expect(snap.functionType).toBe('Wedding');
    expect(snap.finalAmount).toBe(300000);
    expect(snap.dueAmount).toBe(125000);
    expect(snap.packs).toEqual([
      {
        packName: 'Dinner',
        pax: 80,
        ratePerPlate: 1500,
        hallRate: 45000,
        menuItemIds: ['starter', 'dessert'],
      },
    ]);
  });
});
