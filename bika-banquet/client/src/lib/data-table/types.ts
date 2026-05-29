import type { SortState } from '@/lib/tableUtils';

export type FilterOption = {
  value: string;
  label: string;
};

export type FilterSchema =
  | {
      id: string;
      type: 'multiSelect';
      label: string;
      options: FilterOption[];
      placeholder?: string;
    }
  | {
      id: string;
      type: 'dateRange';
      label: string;
    }
  | {
      id: string;
      type: 'numberRange';
      label: string;
      format?: 'currency' | 'number';
      step?: number;
    }
  | {
      id: string;
      type: 'boolean';
      label: string;
      trueLabel?: string;
      falseLabel?: string;
    };

export type FilterValue =
  | { type: 'multiSelect'; values: string[] }
  | { type: 'dateRange'; from: string | null; to: string | null }
  | { type: 'numberRange'; min: number | null; max: number | null }
  | { type: 'boolean'; value: boolean | null };

export type FilterValues = Record<string, FilterValue>;

export interface TableState {
  search: string;
  filters: FilterValues;
  sort: SortState;
  page: number;
  pageSize: number;
}

export const PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const;
export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];
export const DEFAULT_PAGE_SIZE: PageSizeOption = 50;

export function isFilterActive(value: FilterValue | undefined | null): boolean {
  if (!value) return false;
  switch (value.type) {
    case 'multiSelect':
      return value.values.length > 0;
    case 'dateRange':
      return value.from !== null || value.to !== null;
    case 'numberRange':
      return value.min !== null || value.max !== null;
    case 'boolean':
      return value.value !== null;
  }
}

export function emptyFilterValue(schema: FilterSchema): FilterValue {
  switch (schema.type) {
    case 'multiSelect':
      return { type: 'multiSelect', values: [] };
    case 'dateRange':
      return { type: 'dateRange', from: null, to: null };
    case 'numberRange':
      return { type: 'numberRange', min: null, max: null };
    case 'boolean':
      return { type: 'boolean', value: null };
  }
}

export function countActiveFilters(values: FilterValues): number {
  return Object.values(values).filter(isFilterActive).length;
}
