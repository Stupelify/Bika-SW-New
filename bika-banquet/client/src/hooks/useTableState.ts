'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { SortState } from '@/lib/tableUtils';
import { getNextSort } from '@/lib/tableUtils';
import type {
  FilterSchema,
  FilterValue,
  FilterValues,
  PageSizeOption,
  TableState,
} from '@/lib/data-table/types';
import {
  DEFAULT_PAGE_SIZE,
  countActiveFilters,
  emptyFilterValue,
} from '@/lib/data-table/types';
import {
  applyPatch,
  readFilters,
  readPage,
  readPageSize,
  readSearch,
  readSort,
} from '@/lib/data-table/url';

interface UseTableStateOptions {
  prefix?: string;
  filters?: FilterSchema[];
  defaultSort: SortState;
  defaultPageSize?: PageSizeOption;
}

export interface UseTableStateReturn extends TableState {
  schemas: FilterSchema[];
  prefix?: string;
  defaultSort: SortState;
  defaultPageSize: PageSizeOption;
  activeFilterCount: number;

  setSearch: (value: string) => void;
  setFilter: (id: string, value: FilterValue) => void;
  clearFilter: (id: string) => void;
  toggleSort: (key: string) => void;
  setPage: (page: number) => void;
  setPageSize: (size: PageSizeOption) => void;
  clearAll: () => void;
  resetToFirstPage: () => void;
}

export function useTableState(options: UseTableStateOptions): UseTableStateReturn {
  const {
    prefix,
    filters: schemas = [],
    defaultSort,
    defaultPageSize = DEFAULT_PAGE_SIZE,
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const search = readSearch(params, prefix);
  const sort = readSort(params, defaultSort, prefix);
  const page = readPage(params, prefix);
  const pageSize = readPageSize(params, prefix, defaultPageSize);

  // schemas is captured by reference; memoize on schema *contents* so callers
  // can pass an inline array without thrashing downstream useMemo/useCallback.
  const schemaKey = useMemo(
    () =>
      schemas
        .map((s) => {
          if (s.type === 'multiSelect') {
            return `${s.id}:multi:${s.options.map((o) => o.value).join('|')}`;
          }
          return `${s.id}:${s.type}`;
        })
        .join(';'),
    [schemas]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableSchemas = useMemo(() => schemas, [schemaKey]);

  const filters = useMemo(
    () => readFilters(params, stableSchemas, prefix),
    [params, prefix, stableSchemas]
  );

  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

  const push = useCallback(
    (next: URLSearchParams) => {
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname]
  );

  const defaults = useMemo(
    () => ({ sort: defaultSort, pageSize: defaultPageSize }),
    [defaultSort.key, defaultSort.direction, defaultPageSize] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const setSearch = useCallback(
    (value: string) => {
      const next = applyPatch(params, { search: value, page: 1 }, prefix, defaults);
      push(next);
    },
    [params, prefix, push, defaults]
  );

  const setFilter = useCallback(
    (id: string, value: FilterValue) => {
      const next = applyPatch(
        params,
        { filters: { [id]: value }, page: 1 },
        prefix,
        defaults
      );
      push(next);
    },
    [params, prefix, push, defaults]
  );

  const clearFilter = useCallback(
    (id: string) => {
      const schema = stableSchemas.find((s) => s.id === id);
      if (!schema) return;
      setFilter(id, emptyFilterValue(schema));
    },
    [stableSchemas, setFilter]
  );

  const toggleSort = useCallback(
    (key: string) => {
      const nextSort = getNextSort(sort, key);
      const next = applyPatch(params, { sort: nextSort, page: 1 }, prefix, defaults);
      push(next);
    },
    [params, prefix, push, sort, defaults]
  );

  const setPage = useCallback(
    (nextPage: number) => {
      const next = applyPatch(params, { page: nextPage }, prefix, defaults);
      push(next);
    },
    [params, prefix, push, defaults]
  );

  const setPageSize = useCallback(
    (size: PageSizeOption) => {
      const next = applyPatch(params, { pageSize: size, page: 1 }, prefix, defaults);
      push(next);
    },
    [params, prefix, push, defaults]
  );

  const clearAll = useCallback(() => {
    const cleared: FilterValues = {};
    for (const schema of stableSchemas) {
      cleared[schema.id] = emptyFilterValue(schema);
    }
    const next = applyPatch(
      params,
      { search: '', filters: cleared, page: 1 },
      prefix,
      defaults
    );
    push(next);
  }, [stableSchemas, params, prefix, push, defaults]);

  const resetToFirstPage = useCallback(() => {
    const next = applyPatch(params, { page: 1 }, prefix, defaults);
    push(next);
  }, [params, prefix, push, defaults]);

  return {
    search,
    filters,
    sort,
    page,
    pageSize,
    schemas: stableSchemas,
    prefix,
    defaultSort,
    defaultPageSize,
    activeFilterCount,
    setSearch,
    setFilter,
    clearFilter,
    toggleSort,
    setPage,
    setPageSize,
    clearAll,
    resetToFirstPage,
  };
}
