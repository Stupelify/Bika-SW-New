import type { SortState } from '@/lib/tableUtils';
import type {
  FilterSchema,
  FilterValue,
  FilterValues,
  PageSizeOption,
} from './types';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, emptyFilterValue } from './types';

const SEARCH_KEY = 'q';
const SORT_KEY = 'sort';
const PAGE_KEY = 'page';
const SIZE_KEY = 'size';

export function paramKey(prefix: string | undefined, key: string): string {
  return prefix ? `${prefix}_${key}` : key;
}

export function readSearch(params: URLSearchParams, prefix?: string): string {
  return params.get(paramKey(prefix, SEARCH_KEY)) ?? '';
}

export function readSort(
  params: URLSearchParams,
  defaultSort: SortState,
  prefix?: string
): SortState {
  const raw = params.get(paramKey(prefix, SORT_KEY));
  if (!raw) return defaultSort;
  const [key, direction] = raw.split(':');
  if (!key || (direction !== 'asc' && direction !== 'desc')) return defaultSort;
  return { key, direction };
}

export function readPage(params: URLSearchParams, prefix?: string): number {
  const raw = params.get(paramKey(prefix, PAGE_KEY));
  const parsed = raw ? Number(raw) : 1;
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 1;
}

export function readPageSize(
  params: URLSearchParams,
  prefix?: string,
  fallback: PageSizeOption = DEFAULT_PAGE_SIZE
): PageSizeOption {
  const raw = params.get(paramKey(prefix, SIZE_KEY));
  const parsed = raw ? Number(raw) : fallback;
  if (PAGE_SIZE_OPTIONS.includes(parsed as PageSizeOption)) {
    return parsed as PageSizeOption;
  }
  return fallback;
}

function decodeFilter(raw: string | null, schema: FilterSchema): FilterValue {
  if (!raw) return emptyFilterValue(schema);
  switch (schema.type) {
    case 'multiSelect': {
      const values = raw
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
      const valid = new Set(schema.options.map((o) => o.value));
      return { type: 'multiSelect', values: values.filter((v) => valid.has(v)) };
    }
    case 'dateRange': {
      const [from, to] = raw.split('~');
      const normalize = (s: string | undefined) => {
        if (!s) return null;
        return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
      };
      return { type: 'dateRange', from: normalize(from), to: normalize(to) };
    }
    case 'numberRange': {
      const [min, max] = raw.split('~');
      const num = (s: string | undefined) => {
        if (!s) return null;
        const n = Number(s);
        return Number.isFinite(n) ? n : null;
      };
      return { type: 'numberRange', min: num(min), max: num(max) };
    }
    case 'boolean': {
      if (raw === 'true') return { type: 'boolean', value: true };
      if (raw === 'false') return { type: 'boolean', value: false };
      return { type: 'boolean', value: null };
    }
  }
}

export function readFilters(
  params: URLSearchParams,
  schemas: FilterSchema[],
  prefix?: string
): FilterValues {
  const result: FilterValues = {};
  for (const schema of schemas) {
    const raw = params.get(paramKey(prefix, schema.id));
    result[schema.id] = decodeFilter(raw, schema);
  }
  return result;
}

export function encodeFilter(value: FilterValue): string | null {
  switch (value.type) {
    case 'multiSelect':
      return value.values.length ? value.values.join(',') : null;
    case 'dateRange':
      if (!value.from && !value.to) return null;
      return `${value.from ?? ''}~${value.to ?? ''}`;
    case 'numberRange':
      if (value.min === null && value.max === null) return null;
      return `${value.min ?? ''}~${value.max ?? ''}`;
    case 'boolean':
      if (value.value === null) return null;
      return value.value ? 'true' : 'false';
  }
}

export interface TableUrlPatch {
  search?: string;
  sort?: SortState;
  page?: number;
  pageSize?: number;
  filters?: FilterValues;
}

export function applyPatch(
  params: URLSearchParams,
  patch: TableUrlPatch,
  prefix?: string,
  defaults?: { sort?: SortState; pageSize?: number }
): URLSearchParams {
  const next = new URLSearchParams(params);

  if (patch.search !== undefined) {
    const key = paramKey(prefix, SEARCH_KEY);
    if (patch.search) next.set(key, patch.search);
    else next.delete(key);
  }

  if (patch.sort !== undefined) {
    const key = paramKey(prefix, SORT_KEY);
    const defaultSort = defaults?.sort;
    const isDefault =
      defaultSort &&
      patch.sort.key === defaultSort.key &&
      patch.sort.direction === defaultSort.direction;
    if (isDefault) {
      next.delete(key);
    } else {
      next.set(key, `${patch.sort.key}:${patch.sort.direction}`);
    }
  }

  if (patch.page !== undefined) {
    const key = paramKey(prefix, PAGE_KEY);
    if (patch.page <= 1) next.delete(key);
    else next.set(key, String(patch.page));
  }

  if (patch.pageSize !== undefined) {
    const key = paramKey(prefix, SIZE_KEY);
    const defaultSize = defaults?.pageSize ?? DEFAULT_PAGE_SIZE;
    if (patch.pageSize === defaultSize) next.delete(key);
    else next.set(key, String(patch.pageSize));
  }

  if (patch.filters) {
    for (const [id, value] of Object.entries(patch.filters)) {
      const key = paramKey(prefix, id);
      const encoded = encodeFilter(value);
      if (encoded === null) next.delete(key);
      else next.set(key, encoded);
    }
  }

  return next;
}
