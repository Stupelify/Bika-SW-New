import { filterAndSortRows } from '@/lib/tableUtils';
import type { SortState, TableColumnConfig } from '@/lib/tableUtils';
import type { FilterValue, FilterValues, TableState } from './types';
import { isFilterActive } from './types';

export interface ClientFilterDef<T> {
  id: string;
  accessor: (row: T) => unknown;
}

function normalizeString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  return String(value).trim();
}

function toDateYYYYMMDD(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      const d = new Date(parsed);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dd}`;
    }
  }
  return null;
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[,\s₹$€£]/g, '');
    const n = Number(cleaned);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export function matchesFilter(value: unknown, filter: FilterValue): boolean {
  switch (filter.type) {
    case 'multiSelect': {
      if (filter.values.length === 0) return true;
      const v = normalizeString(value).toLowerCase();
      return filter.values.some((option) => option.toLowerCase() === v);
    }
    case 'dateRange': {
      if (filter.from === null && filter.to === null) return true;
      const ymd = toDateYYYYMMDD(value);
      if (!ymd) return false;
      if (filter.from && ymd < filter.from) return false;
      if (filter.to && ymd > filter.to) return false;
      return true;
    }
    case 'numberRange': {
      if (filter.min === null && filter.max === null) return true;
      const n = toNumber(value);
      if (n === null) return false;
      if (filter.min !== null && n < filter.min) return false;
      if (filter.max !== null && n > filter.max) return false;
      return true;
    }
    case 'boolean': {
      if (filter.value === null) return true;
      return Boolean(value) === filter.value;
    }
  }
}

function applyFilters<T>(
  rows: T[],
  filterDefs: ClientFilterDef<T>[],
  values: FilterValues
): T[] {
  return rows.filter((row) => {
    for (const def of filterDefs) {
      const value = values[def.id];
      if (!value || !isFilterActive(value)) continue;
      if (!matchesFilter(def.accessor(row), value)) return false;
    }
    return true;
  });
}

/**
 * Client-side apply of a TableState to in-memory rows:
 * global search (via columns) → typed filters → sort.
 * Pagination is left to the caller.
 */
export function applyTableState<T>(
  rows: T[],
  columns: TableColumnConfig<T>[],
  filterDefs: ClientFilterDef<T>[],
  state: { search: string; filters: FilterValues; sort: SortState }
): T[] {
  const afterFilters = applyFilters(rows, filterDefs, state.filters);
  // Reuse the existing global-search + sort engine for back-compat behavior.
  return filterAndSortRows(afterFilters, columns, state.search, {}, state.sort);
}

export function paginateRows<T>(rows: T[], page: number, pageSize: number): T[] {
  const start = Math.max(0, (page - 1) * pageSize);
  return rows.slice(start, start + pageSize);
}

export function tableStateToServerParams(
  state: TableState
): Record<string, string | number | boolean> {
  const params: Record<string, string | number | boolean> = {
    page: state.page,
    limit: state.pageSize,
  };
  if (state.search) params.search = state.search;
  if (state.sort) params.sort = `${state.sort.key}:${state.sort.direction}`;
  for (const [id, value] of Object.entries(state.filters)) {
    if (!isFilterActive(value)) continue;
    switch (value.type) {
      case 'multiSelect':
        params[id] = value.values.join(',');
        break;
      case 'dateRange':
        if (value.from) params[`${id}From`] = value.from;
        if (value.to) params[`${id}To`] = value.to;
        break;
      case 'numberRange':
        if (value.min !== null) params[`${id}Min`] = value.min;
        if (value.max !== null) params[`${id}Max`] = value.max;
        break;
      case 'boolean':
        if (value.value !== null) params[id] = value.value;
        break;
    }
  }
  return params;
}
