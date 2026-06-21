import { describe, it, expect } from 'vitest';
import {
  EMPTY_BOOKING_FILTERS,
  countActiveFilters,
  hasAnyActiveFilter,
  toListParamsInput,
  applyBookingFiltersClient,
  type BookingFilters,
} from '../booking-list/booking-filters';
import { buildListParams } from '../listQuery';

function makeFilters(overrides: Partial<BookingFilters>): BookingFilters {
  return { ...EMPTY_BOOKING_FILTERS, ...overrides };
}

describe('toListParamsInput', () => {
  it('omits empty selections', () => {
    expect(toListParamsInput(EMPTY_BOOKING_FILTERS)).toEqual({
      search: undefined,
      status: undefined,
      banquetIds: undefined,
      hallIds: undefined,
      fromDate: undefined,
      toDate: undefined,
      guestsMin: undefined,
      guestsMax: undefined,
      amountMin: undefined,
      amountMax: undefined,
      due: undefined,
    });
  });

  it('joins multiselects as CSV and parses numeric bounds', () => {
    const params = toListParamsInput(
      makeFilters({
        status: ['confirmed', 'pencil'],
        banquetIds: ['b1', 'b2'],
        hallIds: ['h1'],
        dateFrom: '2026-07-01',
        dateTo: '2026-07-31',
        guestsMin: '100',
        amountMax: '500000',
        due: 'outstanding',
      })
    );
    expect(params.status).toBe('confirmed,pencil');
    expect(params.banquetIds).toBe('b1,b2');
    expect(params.hallIds).toBe('h1');
    expect(params.fromDate).toBe('2026-07-01');
    expect(params.toDate).toBe('2026-07-31');
    expect(params.guestsMin).toBe(100);
    expect(params.guestsMax).toBeUndefined();
    expect(params.amountMax).toBe(500000);
    expect(params.due).toBe('outstanding');
  });
});

describe('countActiveFilters / hasAnyActiveFilter', () => {
  it('counts non-search filter groups and ignores search', () => {
    const f = makeFilters({
      search: 'wedding',
      status: ['confirmed'],
      dateFrom: '2026-07-01',
      guestsMin: '50',
    });
    expect(countActiveFilters(f)).toBe(3); // status + date + guests (search excluded)
    expect(hasAnyActiveFilter(f)).toBe(true);
    expect(hasAnyActiveFilter(EMPTY_BOOKING_FILTERS)).toBe(false);
  });
});

describe('buildListParams (structured booking params)', () => {
  it('passes through new params and omits empties', () => {
    const params = buildListParams({
      page: 1,
      limit: 75,
      banquetIds: 'b1,b2',
      hallIds: '',
      guestsMin: 100,
      amountMax: 500000,
      due: 'paid',
    });
    expect(params.banquetIds).toBe('b1,b2');
    expect(params).not.toHaveProperty('hallIds');
    expect(params.guestsMin).toBe(100);
    expect(params).not.toHaveProperty('guestsMax');
    expect(params.amountMax).toBe(500000);
    expect(params.due).toBe('paid');
  });
});

describe('applyBookingFiltersClient', () => {
  const rows = [
    {
      status: 'confirmed',
      functionDate: '2026-07-10T00:00:00.000Z',
      expectedGuests: 200,
      grandTotal: 400000,
      dueAmountValue: 50000,
      halls: [{ hall: { id: 'h1', banquet: { id: 'b1' } } }],
    },
    {
      status: 'pencil',
      functionDate: '2026-08-05T00:00:00.000Z',
      expectedGuests: 80,
      grandTotal: 120000,
      dueAmountValue: 0,
      halls: [{ hall: { id: 'h2', banquet: { id: 'b2' } } }],
    },
  ];

  it('filters by status', () => {
    const out = applyBookingFiltersClient(rows, makeFilters({ status: ['pencil'] }));
    expect(out).toHaveLength(1);
    expect(out[0].status).toBe('pencil');
  });

  it('filters by inclusive date range on the day prefix', () => {
    const out = applyBookingFiltersClient(
      rows,
      makeFilters({ dateFrom: '2026-07-01', dateTo: '2026-07-31' })
    );
    expect(out).toHaveLength(1);
    expect(out[0].functionDate.startsWith('2026-07')).toBe(true);
  });

  it('filters by guest and amount ranges', () => {
    expect(applyBookingFiltersClient(rows, makeFilters({ guestsMin: '100' }))).toHaveLength(1);
    expect(applyBookingFiltersClient(rows, makeFilters({ amountMax: '200000' }))).toHaveLength(1);
  });

  it('filters by venue and hall', () => {
    expect(applyBookingFiltersClient(rows, makeFilters({ banquetIds: ['b1'] }))).toHaveLength(1);
    expect(applyBookingFiltersClient(rows, makeFilters({ hallIds: ['h2'] }))).toHaveLength(1);
  });

  it('filters by due preset', () => {
    expect(applyBookingFiltersClient(rows, makeFilters({ due: 'outstanding' }))).toHaveLength(1);
    expect(applyBookingFiltersClient(rows, makeFilters({ due: 'paid' }))).toHaveLength(1);
  });

  it('returns all rows when no filter is active', () => {
    expect(applyBookingFiltersClient(rows, EMPTY_BOOKING_FILTERS)).toHaveLength(2);
  });
});
