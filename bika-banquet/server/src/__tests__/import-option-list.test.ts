import { buildImportPayload } from '../scripts/importOptionList.helpers';

function sortItems<T extends { itemTypeKey: string; name: string }>(rows: T[]): T[] {
  return [...rows].sort((left, right) =>
    `${left.itemTypeKey}::${left.name}`.localeCompare(`${right.itemTypeKey}::${right.name}`)
  );
}

describe('buildImportPayload', () => {
  it('builds ordered item types, skips fruits counter, and remaps special live counters', () => {
    const result = buildImportPayload([
      {
        name: 'Item List',
        rows: [
          ['ENTRY REFRESHMENTS', null, 'SOUP', null],
          ['Mini Gulab Jamun', 1, 'Tomato Basil Soup', 0.5],
          ['COLD BEVERAGES', null, 'SALAD', null],
          ['Masala Chaas', 1, 'Fruit Salad', 1],
        ],
      },
      {
        name: 'Item List(2)',
        rows: [
          ['ASIAN COUNTER', null, 'MEXICAN COUNTER', null],
          ['Veg Hakka Noodles', 1, 'Burrito Wrap', 2],
          ['MONGOLIAN COUNTER (LIVE)', 3, 'FRUITS COUNTER', null],
          ['SIZZLER COUNTER (LIVE)', 3, 'Apple (Local/Imported)', null],
        ],
      },
    ]);

    expect(result.itemTypes).toEqual([
      { key: 'entry refreshments', name: 'Entry Refreshments', order: 10 },
      { key: 'soup', name: 'Soup', order: 20 },
      { key: 'cold beverages', name: 'Cold Beverages', order: 30 },
      { key: 'salad', name: 'Salad', order: 40 },
      { key: 'asian counter', name: 'Asian Counter', order: 50 },
      { key: 'mexican counter', name: 'Mexican Counter', order: 60 },
      { key: 'mongolian', name: 'Mongolian', order: 70 },
      { key: 'sizzler', name: 'Sizzler', order: 80 },
    ]);

    expect(sortItems(result.items)).toEqual(
      sortItems([
      { itemTypeKey: 'entry refreshments', name: 'Mini Gulab Jamun', points: 1 },
      { itemTypeKey: 'soup', name: 'Tomato Basil Soup', points: 0.5 },
      { itemTypeKey: 'cold beverages', name: 'Masala Chaas', points: 1 },
      { itemTypeKey: 'salad', name: 'Fruit Salad', points: 1 },
      { itemTypeKey: 'asian counter', name: 'Veg Hakka Noodles', points: 1 },
      { itemTypeKey: 'mexican counter', name: 'Burrito Wrap', points: 2 },
      { itemTypeKey: 'mongolian', name: 'Live Mongolian Counter', points: 3 },
      { itemTypeKey: 'sizzler', name: 'Live Sizzler Counter', points: 3 },
    ])
    );
  });

  it('merges wrapped item names split across consecutive rows in the same column pair', () => {
    const result = buildImportPayload([
      {
        name: 'Item List',
        rows: [
          ['STARTERS', null],
          ['Paneer Tikka (Tandoori/', 1],
          ['Malai/Hariyali/Achari)', 1],
        ],
      },
    ]);

    expect(result.items).toEqual([
      {
        itemTypeKey: 'starters',
        name: 'Paneer Tikka (Tandoori/Malai/Hariyali/Achari)',
        points: 1,
      },
    ]);
  });
});
