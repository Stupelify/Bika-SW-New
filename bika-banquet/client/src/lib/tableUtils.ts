export type SortDirection = 'asc' | 'desc';

export interface SortState {
  key: string;
  direction: SortDirection;
}

export interface TableColumnConfig<T> {
  key: string;
  accessor: (row: T) => unknown;
  searchable?: boolean;
  sortable?: boolean;
}

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

function normalizeValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeValue(entry)).join(' ');
  }
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>)
      .map((entry) => normalizeValue(entry))
      .join(' ');
  }
  return String(value).trim();
}

function toComparable(value: unknown): string | number {
  const normalized = normalizeValue(value);
  if (!normalized) return '';

  const numericCandidate = normalized.replace(/,/g, '');
  if (/^-?\d+(\.\d+)?$/.test(numericCandidate)) {
    return Number(numericCandidate);
  }

  const timestamp = Date.parse(normalized);
  if (!Number.isNaN(timestamp) && /\d/.test(normalized)) {
    return timestamp;
  }

  return normalized.toLowerCase();
}

function includesQuery(value: unknown, query: string): boolean {
  if (!query) return true;
  return normalizeValue(value).toLowerCase().includes(query.toLowerCase());
}

export function getNextSort(
  currentSort: SortState,
  key: string
): SortState {
  if (currentSort.key !== key) {
    return { key, direction: 'asc' };
  }

  return {
    key,
    direction: currentSort.direction === 'asc' ? 'desc' : 'asc',
  };
}

export function filterAndSortRows<T>(
  rows: T[],
  columns: TableColumnConfig<T>[],
  globalSearch: string,
  columnSearch: Record<string, string>,
  sort: SortState
): T[] {
  const searchableColumns = columns.filter((column) => column.searchable !== false);
  const sortableColumn = columns.find(
    (column) => column.key === sort.key && column.sortable !== false
  );

  const filtered = rows.filter((row) => {
    if (globalSearch) {
      const globalMatch = searchableColumns.some((column) =>
        includesQuery(column.accessor(row), globalSearch)
      );
      if (!globalMatch) return false;
    }

    for (const [key, query] of Object.entries(columnSearch)) {
      if (!query) continue;
      const column = columns.find((entry) => entry.key === key);
      if (!column) continue;
      if (!includesQuery(column.accessor(row), query)) return false;
    }

    return true;
  });

  if (!sortableColumn) return filtered;

  return [...filtered].sort((a, b) => {
    const aValue = toComparable(sortableColumn.accessor(a));
    const bValue = toComparable(sortableColumn.accessor(b));

    let comparison = 0;
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      comparison = aValue - bValue;
    } else {
      comparison = collator.compare(String(aValue), String(bValue));
    }

    return sort.direction === 'asc' ? comparison : -comparison;
  });
}
