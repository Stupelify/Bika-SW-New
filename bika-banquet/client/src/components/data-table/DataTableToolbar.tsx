'use client';

import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useDebounce } from '@/lib/useDebounce';
import type { UseTableStateReturn } from '@/hooks/useTableState';
import type { FilterSchema, FilterValue, PageSizeOption } from '@/lib/data-table/types';
import { PAGE_SIZE_OPTIONS } from '@/lib/data-table/types';
import BooleanFilter from './BooleanFilter';
import DateRangeFilter from './DateRangeFilter';
import MultiSelectFilter from './MultiSelectFilter';
import NumberRangeFilter from './NumberRangeFilter';

interface DataTableToolbarProps {
  state: UseTableStateReturn;
  searchPlaceholder?: string;
  rightSlot?: React.ReactNode;
}

const SEARCH_DEBOUNCE_MS = 250;

export default function DataTableToolbar({
  state,
  searchPlaceholder = 'Search…',
  rightSlot,
}: DataTableToolbarProps) {
  const [input, setInput] = useState(state.search);
  const debounced = useDebounce(input, SEARCH_DEBOUNCE_MS);
  const lastPushed = useRef(state.search);

  // External URL changes (back/forward, clear-all) — sync into local input.
  useEffect(() => {
    if (state.search !== lastPushed.current) {
      setInput(state.search);
      lastPushed.current = state.search;
    }
  }, [state.search]);

  // Push debounced input to URL when it differs from URL.
  useEffect(() => {
    if (debounced !== state.search) {
      lastPushed.current = debounced;
      state.setSearch(debounced);
    }
  }, [debounced, state]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[14rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-4)]" />
          <input
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={searchPlaceholder}
            className="input w-full pl-9 pr-9"
            aria-label="Search"
          />
          {input ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setInput('')}
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[var(--text-4)] hover:bg-[var(--surface-2)]"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        {rightSlot}
      </div>

      {state.schemas.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {state.schemas.map((schema) => (
            <SchemaFilter
              key={schema.id}
              schema={schema}
              value={state.filters[schema.id]}
              onChange={(v) => state.setFilter(schema.id, v)}
            />
          ))}
          {state.activeFilterCount > 0 || state.search ? (
            <button
              type="button"
              onClick={state.clearAll}
              className="text-sm text-teal-600 hover:underline"
            >
              Clear all
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function SchemaFilter({
  schema,
  value,
  onChange,
}: {
  schema: FilterSchema;
  value: FilterValue | undefined;
  onChange: (next: FilterValue) => void;
}) {
  if (!value) return null;

  switch (schema.type) {
    case 'multiSelect':
      if (value.type !== 'multiSelect') return null;
      return (
        <MultiSelectFilter
          label={schema.label}
          options={schema.options}
          value={value}
          onChange={onChange}
          placeholder={schema.placeholder}
        />
      );
    case 'dateRange':
      if (value.type !== 'dateRange') return null;
      return <DateRangeFilter label={schema.label} value={value} onChange={onChange} />;
    case 'numberRange':
      if (value.type !== 'numberRange') return null;
      return (
        <NumberRangeFilter
          label={schema.label}
          value={value}
          onChange={onChange}
          format={schema.format}
          step={schema.step}
        />
      );
    case 'boolean':
      if (value.type !== 'boolean') return null;
      return (
        <BooleanFilter
          label={schema.label}
          value={value}
          onChange={onChange}
          trueLabel={schema.trueLabel}
          falseLabel={schema.falseLabel}
        />
      );
  }
}

/**
 * "Showing X of Y" + page-size selector. Always renders the count
 * (unlike TablePagination, which hides itself when totalItems ≤ pageSize).
 */
export function DataTableFooter({
  state,
  totalItems,
  filteredCount,
  itemLabel,
}: {
  state: UseTableStateReturn;
  totalItems: number;
  filteredCount: number;
  itemLabel: string;
}) {
  const totalPages = Math.max(1, Math.ceil(filteredCount / state.pageSize));
  const currentPage = Math.min(state.page, totalPages);
  const startItem = filteredCount === 0 ? 0 : (currentPage - 1) * state.pageSize + 1;
  const endItem = Math.min(currentPage * state.pageSize, filteredCount);
  const isFiltered = filteredCount !== totalItems;

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[var(--text-2)]">
        {filteredCount === 0 ? (
          <>
            No {itemLabel} match
            {isFiltered ? ' the current filters' : ''}
          </>
        ) : (
          <>
            Showing <span className="font-medium text-[var(--text-1)]">{startItem}</span>–
            <span className="font-medium text-[var(--text-1)]">{endItem}</span> of{' '}
            <span className="font-medium text-[var(--text-1)]">{filteredCount}</span>{' '}
            {itemLabel}
            {isFiltered ? ` (filtered from ${totalItems})` : ''}
          </>
        )}
      </p>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-[var(--text-2)]">
          <span>Per page</span>
          <select
            className="input min-h-9 py-1 pr-7"
            value={state.pageSize}
            onChange={(e) => state.setPageSize(Number(e.target.value) as PageSizeOption)}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        {totalPages > 1 ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={currentPage <= 1}
              onClick={() => state.setPage(Math.max(1, currentPage - 1))}
            >
              Previous
            </button>
            <span className="text-sm text-[var(--text-2)]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={currentPage >= totalPages}
              onClick={() => state.setPage(Math.min(totalPages, currentPage + 1))}
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
