import { expect, test } from '@playwright/test';
import { filterAndSortRows, TableColumnConfig } from '../../src/lib/tableUtils';

type BookingRow = {
  id: string;
  customer: string;
  expectedGuests: number;
  grandTotal: number;
};

const columns: TableColumnConfig<BookingRow>[] = [
  {
    key: 'customer',
    accessor: (booking) => booking.customer,
  },
  {
    key: 'expectedGuests',
    accessor: (booking) => booking.expectedGuests,
    searchable: false,
  },
  {
    key: 'grandTotal',
    accessor: (booking) => booking.grandTotal,
    searchable: false,
  },
];

const rows: BookingRow[] = [
  { id: 'customer-match', customer: 'Babu Kumar', expectedGuests: 25, grandTotal: 50000 },
  { id: 'guest-count-noise', customer: 'Aarav Sharma', expectedGuests: 100, grandTotal: 45000 },
  { id: 'total-noise', customer: 'Meera Patel', expectedGuests: 60, grandTotal: 100000 },
];

test.describe('table filtering', () => {
  test('global search ignores columns marked as non-searchable', () => {
    const results = filterAndSortRows(rows, columns, '100', {}, { key: '', direction: 'asc' });

    expect(results).toEqual([]);
  });

  test('column-specific search still filters non-searchable columns', () => {
    const results = filterAndSortRows(
      rows,
      columns,
      '',
      { expectedGuests: '100' },
      { key: '', direction: 'asc' }
    );

    expect(results.map((row) => row.id)).toEqual(['guest-count-noise']);
  });
});
