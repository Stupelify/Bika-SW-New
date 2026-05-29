import { describe, it, expect } from 'vitest';
import {
  applyPatch,
  encodeFilter,
  readFilters,
  readPage,
  readPageSize,
  readSearch,
  readSort,
} from '../url';
import type { FilterSchema, FilterValue } from '../types';

const STATUS_SCHEMA: FilterSchema = {
  id: 'status',
  type: 'multiSelect',
  label: 'Status',
  options: [
    { value: 'pending', label: 'Pending' },
    { value: 'quoted', label: 'Quoted' },
    { value: 'cancelled', label: 'Cancelled' },
  ],
};

const DATE_SCHEMA: FilterSchema = { id: 'date', type: 'dateRange', label: 'Date' };
const AMOUNT_SCHEMA: FilterSchema = { id: 'amount', type: 'numberRange', label: 'Amount' };
const FLAG_SCHEMA: FilterSchema = { id: 'paid', type: 'boolean', label: 'Paid?' };

describe('url helpers — read', () => {
  it('reads search/sort/page/size with defaults', () => {
    const p = new URLSearchParams('');
    expect(readSearch(p)).toBe('');
    expect(readSort(p, { key: 'name', direction: 'asc' })).toEqual({
      key: 'name',
      direction: 'asc',
    });
    expect(readPage(p)).toBe(1);
    expect(readPageSize(p)).toBe(50);
  });

  it('honors prefix when reading', () => {
    const p = new URLSearchParams('foo_q=hello&foo_page=3');
    expect(readSearch(p, 'foo')).toBe('hello');
    expect(readPage(p, 'foo')).toBe(3);
    expect(readSearch(p)).toBe(''); // unprefixed empty
  });

  it('falls back when sort is malformed', () => {
    const p = new URLSearchParams('sort=name:sideways');
    expect(readSort(p, { key: 'id', direction: 'desc' })).toEqual({
      key: 'id',
      direction: 'desc',
    });
  });

  it('clamps page to >= 1', () => {
    expect(readPage(new URLSearchParams('page=0'))).toBe(1);
    expect(readPage(new URLSearchParams('page=-5'))).toBe(1);
    expect(readPage(new URLSearchParams('page=abc'))).toBe(1);
  });

  it('rejects non-whitelisted page sizes', () => {
    expect(readPageSize(new URLSearchParams('size=77'))).toBe(50);
    expect(readPageSize(new URLSearchParams('size=200'))).toBe(200);
  });
});

describe('url helpers — readFilters', () => {
  it('decodes multiSelect, filtering unknown values', () => {
    const p = new URLSearchParams('status=pending,bogus,quoted');
    const filters = readFilters(p, [STATUS_SCHEMA]);
    expect(filters.status).toEqual({ type: 'multiSelect', values: ['pending', 'quoted'] });
  });

  it('decodes dateRange, validating ISO format', () => {
    const p = new URLSearchParams('date=2026-01-01~2026-01-31');
    expect(readFilters(p, [DATE_SCHEMA]).date).toEqual({
      type: 'dateRange',
      from: '2026-01-01',
      to: '2026-01-31',
    });
  });

  it('drops malformed dates', () => {
    const p = new URLSearchParams('date=jan-1~jan-31');
    expect(readFilters(p, [DATE_SCHEMA]).date).toEqual({
      type: 'dateRange',
      from: null,
      to: null,
    });
  });

  it('decodes open-ended date range', () => {
    const p = new URLSearchParams('date=2026-01-01~');
    expect(readFilters(p, [DATE_SCHEMA]).date).toEqual({
      type: 'dateRange',
      from: '2026-01-01',
      to: null,
    });
  });

  it('decodes numberRange', () => {
    const p = new URLSearchParams('amount=100~5000');
    expect(readFilters(p, [AMOUNT_SCHEMA]).amount).toEqual({
      type: 'numberRange',
      min: 100,
      max: 5000,
    });
  });

  it('decodes boolean', () => {
    expect(readFilters(new URLSearchParams('paid=true'), [FLAG_SCHEMA]).paid).toEqual({
      type: 'boolean',
      value: true,
    });
    expect(readFilters(new URLSearchParams('paid=false'), [FLAG_SCHEMA]).paid).toEqual({
      type: 'boolean',
      value: false,
    });
    expect(readFilters(new URLSearchParams('paid=maybe'), [FLAG_SCHEMA]).paid).toEqual({
      type: 'boolean',
      value: null,
    });
  });

  it('returns empty filter values when unset', () => {
    const filters = readFilters(new URLSearchParams(''), [
      STATUS_SCHEMA,
      DATE_SCHEMA,
      AMOUNT_SCHEMA,
      FLAG_SCHEMA,
    ]);
    expect(filters.status).toEqual({ type: 'multiSelect', values: [] });
    expect(filters.date).toEqual({ type: 'dateRange', from: null, to: null });
    expect(filters.amount).toEqual({ type: 'numberRange', min: null, max: null });
    expect(filters.paid).toEqual({ type: 'boolean', value: null });
  });
});

describe('url helpers — encodeFilter', () => {
  it('returns null for empty values (so the key is deleted)', () => {
    expect(encodeFilter({ type: 'multiSelect', values: [] })).toBeNull();
    expect(encodeFilter({ type: 'dateRange', from: null, to: null })).toBeNull();
    expect(encodeFilter({ type: 'numberRange', min: null, max: null })).toBeNull();
    expect(encodeFilter({ type: 'boolean', value: null })).toBeNull();
  });

  it('encodes active multi-select', () => {
    expect(encodeFilter({ type: 'multiSelect', values: ['a', 'b'] })).toBe('a,b');
  });

  it('encodes partial date range', () => {
    expect(encodeFilter({ type: 'dateRange', from: '2026-01-01', to: null })).toBe('2026-01-01~');
    expect(encodeFilter({ type: 'dateRange', from: null, to: '2026-12-31' })).toBe('~2026-12-31');
  });

  it('encodes number range with zero', () => {
    expect(encodeFilter({ type: 'numberRange', min: 0, max: 100 })).toBe('0~100');
  });
});

describe('url helpers — applyPatch', () => {
  const defaults = { sort: { key: 'name', direction: 'asc' as const }, pageSize: 50 };

  it('sets and clears search', () => {
    let p = new URLSearchParams();
    p = applyPatch(p, { search: 'foo' }, undefined, defaults);
    expect(p.get('q')).toBe('foo');
    p = applyPatch(p, { search: '' }, undefined, defaults);
    expect(p.has('q')).toBe(false);
  });

  it('drops sort when it equals default', () => {
    let p = new URLSearchParams('sort=name:desc');
    p = applyPatch(p, { sort: { key: 'name', direction: 'asc' } }, undefined, defaults);
    expect(p.has('sort')).toBe(false);
  });

  it('serializes non-default sort', () => {
    const p = applyPatch(
      new URLSearchParams(),
      { sort: { key: 'date', direction: 'desc' } },
      undefined,
      defaults
    );
    expect(p.get('sort')).toBe('date:desc');
  });

  it('drops page=1, keeps higher', () => {
    let p = applyPatch(new URLSearchParams(), { page: 1 }, undefined, defaults);
    expect(p.has('page')).toBe(false);
    p = applyPatch(p, { page: 3 }, undefined, defaults);
    expect(p.get('page')).toBe('3');
  });

  it('drops pageSize when it equals default', () => {
    let p = applyPatch(new URLSearchParams('size=100'), { pageSize: 50 }, undefined, defaults);
    expect(p.has('size')).toBe(false);
    p = applyPatch(p, { pageSize: 200 }, undefined, defaults);
    expect(p.get('size')).toBe('200');
  });

  it('honors prefix on every key', () => {
    const p = applyPatch(
      new URLSearchParams(),
      {
        search: 'x',
        sort: { key: 'name', direction: 'desc' },
        page: 2,
        pageSize: 100,
        filters: { status: { type: 'multiSelect', values: ['a'] } },
      },
      'pre',
      defaults
    );
    expect(p.get('pre_q')).toBe('x');
    expect(p.get('pre_sort')).toBe('name:desc');
    expect(p.get('pre_page')).toBe('2');
    expect(p.get('pre_size')).toBe('100');
    expect(p.get('pre_status')).toBe('a');
  });

  it('removes a filter when its value is empty', () => {
    let p = new URLSearchParams('status=pending');
    p = applyPatch(
      p,
      { filters: { status: { type: 'multiSelect', values: [] } as FilterValue } },
      undefined,
      defaults
    );
    expect(p.has('status')).toBe(false);
  });
});
