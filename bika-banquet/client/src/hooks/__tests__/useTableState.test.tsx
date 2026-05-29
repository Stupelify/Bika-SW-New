import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';

// ---- next/navigation mock ----
const urlState = { search: '' };
const mockReplace = vi.fn((url: string) => {
  const q = url.includes('?') ? url.slice(url.indexOf('?') + 1) : '';
  urlState.search = q;
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace, push: vi.fn() }),
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams(urlState.search),
}));

// Import AFTER the mock is registered.
import { useTableState } from '../useTableState';
import type { FilterSchema } from '@/lib/data-table/types';

const STATUS_SCHEMA: FilterSchema = {
  id: 'status',
  type: 'multiSelect',
  label: 'Status',
  options: [
    { value: 'pending', label: 'Pending' },
    { value: 'quoted', label: 'Quoted' },
  ],
};

const DATE_SCHEMA: FilterSchema = { id: 'date', type: 'dateRange', label: 'Date' };

function wrapper({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

beforeEach(() => {
  urlState.search = '';
  mockReplace.mockClear();
});

describe('useTableState', () => {
  it('returns defaults when URL is empty', () => {
    const { result } = renderHook(
      () =>
        useTableState({
          filters: [STATUS_SCHEMA],
          defaultSort: { key: 'name', direction: 'asc' },
        }),
      { wrapper }
    );
    expect(result.current.search).toBe('');
    expect(result.current.sort).toEqual({ key: 'name', direction: 'asc' });
    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(50);
    expect(result.current.filters.status).toEqual({ type: 'multiSelect', values: [] });
    expect(result.current.activeFilterCount).toBe(0);
  });

  it('setSearch writes URL and resets page to 1', () => {
    urlState.search = 'page=3';
    const { result, rerender } = renderHook(
      () =>
        useTableState({
          filters: [],
          defaultSort: { key: 'name', direction: 'asc' },
        }),
      { wrapper }
    );
    expect(result.current.page).toBe(3);
    act(() => result.current.setSearch('foo'));
    expect(mockReplace).toHaveBeenCalledTimes(1);
    rerender();
    expect(result.current.search).toBe('foo');
    expect(result.current.page).toBe(1);
  });

  it('setFilter writes URL and resets page', () => {
    urlState.search = 'page=4';
    const { result, rerender } = renderHook(
      () =>
        useTableState({
          filters: [STATUS_SCHEMA],
          defaultSort: { key: 'name', direction: 'asc' },
        }),
      { wrapper }
    );
    act(() =>
      result.current.setFilter('status', { type: 'multiSelect', values: ['pending'] })
    );
    rerender();
    expect(result.current.filters.status).toEqual({
      type: 'multiSelect',
      values: ['pending'],
    });
    expect(result.current.page).toBe(1);
    expect(result.current.activeFilterCount).toBe(1);
  });

  it('toggleSort flips direction on second click', () => {
    const { result, rerender } = renderHook(
      () =>
        useTableState({
          filters: [],
          defaultSort: { key: 'name', direction: 'asc' },
        }),
      { wrapper }
    );
    act(() => result.current.toggleSort('date'));
    rerender();
    expect(result.current.sort).toEqual({ key: 'date', direction: 'asc' });
    act(() => result.current.toggleSort('date'));
    rerender();
    expect(result.current.sort).toEqual({ key: 'date', direction: 'desc' });
  });

  it('clearAll wipes search and all filters and resets page', () => {
    urlState.search = 'q=foo&status=pending&date=2026-01-01~2026-12-31&page=5';
    const { result, rerender } = renderHook(
      () =>
        useTableState({
          filters: [STATUS_SCHEMA, DATE_SCHEMA],
          defaultSort: { key: 'name', direction: 'asc' },
        }),
      { wrapper }
    );
    expect(result.current.search).toBe('foo');
    expect(result.current.activeFilterCount).toBe(2);

    act(() => result.current.clearAll());
    rerender();
    expect(result.current.search).toBe('');
    expect(result.current.activeFilterCount).toBe(0);
    expect(result.current.page).toBe(1);
  });

  it('honors prefix to avoid collisions', () => {
    urlState.search = 'banquet_q=hello&banquet_page=2&halls_q=other';
    const { result } = renderHook(
      () =>
        useTableState({
          prefix: 'banquet',
          filters: [],
          defaultSort: { key: 'name', direction: 'asc' },
        }),
      { wrapper }
    );
    expect(result.current.search).toBe('hello');
    expect(result.current.page).toBe(2);
  });

  it('setPageSize resets page', () => {
    urlState.search = 'page=5';
    const { result, rerender } = renderHook(
      () =>
        useTableState({
          filters: [],
          defaultSort: { key: 'name', direction: 'asc' },
        }),
      { wrapper }
    );
    act(() => result.current.setPageSize(100));
    rerender();
    expect(result.current.pageSize).toBe(100);
    expect(result.current.page).toBe(1);
  });

  it('clearFilter empties a single filter', () => {
    urlState.search = 'status=pending,quoted';
    const { result, rerender } = renderHook(
      () =>
        useTableState({
          filters: [STATUS_SCHEMA],
          defaultSort: { key: 'name', direction: 'asc' },
        }),
      { wrapper }
    );
    expect(result.current.activeFilterCount).toBe(1);
    act(() => result.current.clearFilter('status'));
    rerender();
    expect(result.current.activeFilterCount).toBe(0);
  });
});
