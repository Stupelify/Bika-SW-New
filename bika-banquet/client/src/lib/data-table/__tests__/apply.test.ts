import { describe, it, expect } from 'vitest';
import {
  applyTableState,
  matchesFilter,
  paginateRows,
  tableStateToServerParams,
} from '../apply';
import type { TableColumnConfig } from '@/lib/tableUtils';
import type { TableState } from '../types';

interface Row {
  id: string;
  name: string;
  status: string;
  date: string; // ISO
  amount: number;
  paid: boolean;
}

const ROWS: Row[] = [
  { id: '1', name: 'Alice Sharma', status: 'pending', date: '2026-01-15T09:00:00Z', amount: 5000, paid: false },
  { id: '2', name: 'Bob Mehta', status: 'quoted', date: '2026-02-10T09:00:00Z', amount: 25000, paid: true },
  { id: '3', name: 'Carol Iyer', status: 'cancelled', date: '2026-03-05T09:00:00Z', amount: 12000, paid: false },
  { id: '4', name: 'Dev Kapoor', status: 'pending', date: '2026-04-20T09:00:00Z', amount: 80000, paid: true },
  { id: '5', name: 'Esha Roy', status: 'quoted', date: '2026-05-01T09:00:00Z', amount: 1500, paid: false },
];

const columns: TableColumnConfig<Row>[] = [
  { key: 'name', accessor: (r) => r.name, sortable: true, searchable: true },
  { key: 'status', accessor: (r) => r.status, sortable: true, searchable: true },
  { key: 'amount', accessor: (r) => r.amount, sortable: true, searchable: false },
  { key: 'date', accessor: (r) => r.date, sortable: true, searchable: false },
];

const filterDefs = [
  { id: 'status', accessor: (r: Row) => r.status },
  { id: 'date', accessor: (r: Row) => r.date },
  { id: 'amount', accessor: (r: Row) => r.amount },
  { id: 'paid', accessor: (r: Row) => r.paid },
];

const baseState: Omit<TableState, 'page' | 'pageSize'> = {
  search: '',
  filters: {
    status: { type: 'multiSelect', values: [] },
    date: { type: 'dateRange', from: null, to: null },
    amount: { type: 'numberRange', min: null, max: null },
    paid: { type: 'boolean', value: null },
  },
  sort: { key: 'name', direction: 'asc' },
};

describe('matchesFilter', () => {
  it('multiSelect: empty values matches everything', () => {
    expect(matchesFilter('pending', { type: 'multiSelect', values: [] })).toBe(true);
  });

  it('multiSelect: case-insensitive', () => {
    expect(matchesFilter('PENDING', { type: 'multiSelect', values: ['pending'] })).toBe(true);
    expect(matchesFilter('quoted', { type: 'multiSelect', values: ['pending'] })).toBe(false);
  });

  it('dateRange: inclusive bounds, ISO input', () => {
    const f = { type: 'dateRange' as const, from: '2026-01-01', to: '2026-01-31' };
    expect(matchesFilter('2026-01-15T09:00:00Z', f)).toBe(true);
    expect(matchesFilter('2026-01-01T00:00:00Z', f)).toBe(true);
    expect(matchesFilter('2026-01-31T23:59:00Z', f)).toBe(true);
    expect(matchesFilter('2026-02-01T00:00:00Z', f)).toBe(false);
  });

  it('dateRange: open-ended from', () => {
    const f = { type: 'dateRange' as const, from: null, to: '2026-01-31' };
    expect(matchesFilter('2025-12-31T00:00:00Z', f)).toBe(true);
    expect(matchesFilter('2026-02-01T00:00:00Z', f)).toBe(false);
  });

  it('numberRange: inclusive bounds', () => {
    expect(matchesFilter(100, { type: 'numberRange', min: 100, max: 200 })).toBe(true);
    expect(matchesFilter(99, { type: 'numberRange', min: 100, max: 200 })).toBe(false);
    expect(matchesFilter(201, { type: 'numberRange', min: 100, max: 200 })).toBe(false);
  });

  it('numberRange: parses currency-like strings', () => {
    expect(matchesFilter('₹1,500', { type: 'numberRange', min: 1000, max: 2000 })).toBe(true);
  });

  it('boolean: null matches everything', () => {
    expect(matchesFilter(true, { type: 'boolean', value: null })).toBe(true);
    expect(matchesFilter(true, { type: 'boolean', value: true })).toBe(true);
    expect(matchesFilter(false, { type: 'boolean', value: true })).toBe(false);
  });
});

describe('applyTableState', () => {
  it('returns everything when no filters or search', () => {
    const out = applyTableState(ROWS, columns, filterDefs, {
      ...baseState,
    });
    expect(out).toHaveLength(5);
  });

  it('applies global search across searchable columns only', () => {
    const out = applyTableState(ROWS, columns, filterDefs, {
      ...baseState,
      search: 'pending',
    });
    expect(out.map((r) => r.id).sort()).toEqual(['1', '4']);
  });

  it('global search does NOT match amount (searchable:false)', () => {
    const out = applyTableState(ROWS, columns, filterDefs, {
      ...baseState,
      search: '5000',
    });
    expect(out).toHaveLength(0);
  });

  it('applies multi-select filter (status)', () => {
    const out = applyTableState(ROWS, columns, filterDefs, {
      ...baseState,
      filters: {
        ...baseState.filters,
        status: { type: 'multiSelect', values: ['quoted', 'cancelled'] },
      },
    });
    expect(out.map((r) => r.id).sort()).toEqual(['2', '3', '5']);
  });

  it('applies number range filter (amount)', () => {
    const out = applyTableState(ROWS, columns, filterDefs, {
      ...baseState,
      filters: {
        ...baseState.filters,
        amount: { type: 'numberRange', min: 10000, max: 30000 },
      },
    });
    expect(out.map((r) => r.id).sort()).toEqual(['2', '3']);
  });

  it('applies date range filter', () => {
    const out = applyTableState(ROWS, columns, filterDefs, {
      ...baseState,
      filters: {
        ...baseState.filters,
        date: { type: 'dateRange', from: '2026-02-01', to: '2026-03-31' },
      },
    });
    expect(out.map((r) => r.id).sort()).toEqual(['2', '3']);
  });

  it('applies boolean filter', () => {
    const out = applyTableState(ROWS, columns, filterDefs, {
      ...baseState,
      filters: { ...baseState.filters, paid: { type: 'boolean', value: true } },
    });
    expect(out.map((r) => r.id).sort()).toEqual(['2', '4']);
  });

  it('combines filters AND search AND sort', () => {
    const out = applyTableState(ROWS, columns, filterDefs, {
      search: 'pending',
      filters: {
        ...baseState.filters,
        amount: { type: 'numberRange', min: 10000, max: null },
      },
      sort: { key: 'amount', direction: 'asc' },
    });
    expect(out.map((r) => r.id)).toEqual(['4']);
  });
});

describe('paginateRows', () => {
  it('returns first page slice', () => {
    expect(paginateRows([1, 2, 3, 4, 5], 1, 2)).toEqual([1, 2]);
  });

  it('returns mid page', () => {
    expect(paginateRows([1, 2, 3, 4, 5], 2, 2)).toEqual([3, 4]);
  });

  it('returns empty when page is past end', () => {
    expect(paginateRows([1, 2, 3], 99, 10)).toEqual([]);
  });
});

describe('tableStateToServerParams', () => {
  const state: TableState = {
    search: 'foo',
    filters: {
      status: { type: 'multiSelect', values: ['pending', 'quoted'] },
      date: { type: 'dateRange', from: '2026-01-01', to: '2026-12-31' },
      amount: { type: 'numberRange', min: 1000, max: 5000 },
      paid: { type: 'boolean', value: true },
      empty: { type: 'multiSelect', values: [] },
    },
    sort: { key: 'name', direction: 'desc' },
    page: 2,
    pageSize: 100,
  };

  it('serializes everything actionable', () => {
    const p = tableStateToServerParams(state);
    expect(p).toEqual({
      page: 2,
      limit: 100,
      search: 'foo',
      sort: 'name:desc',
      status: 'pending,quoted',
      dateFrom: '2026-01-01',
      dateTo: '2026-12-31',
      amountMin: 1000,
      amountMax: 5000,
      paid: true,
    });
  });

  it('drops empty filters', () => {
    const p = tableStateToServerParams({
      ...state,
      filters: { empty: { type: 'multiSelect', values: [] } },
    });
    expect(p).not.toHaveProperty('empty');
  });
});
