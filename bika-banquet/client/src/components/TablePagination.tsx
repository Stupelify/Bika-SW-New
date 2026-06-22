'use client';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
  /** Opt-in: enables the "Rows per page" selector. */
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

const DEFAULT_PAGE_SIZE_OPTIONS = [25, 50, 75, 100, 200];

export default function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  itemLabel,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: TablePaginationProps) {
  const fitsOnePage = totalItems <= pageSize;

  // Without a page-size selector there is nothing to show when everything fits
  // on one page (preserves the original behaviour). With the selector we keep
  // rendering so the user can always change the page size back.
  if (fitsOnePage && !onPageSizeChange) {
    return null;
  }

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const jumpToPage = (raw: string) => {
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    onPageChange(Math.min(totalPages, Math.max(1, Math.trunc(n))));
  };

  return (
    <div className="table-pagination flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <p className="text-sm text-[var(--text-2)]">
          Showing {startItem}-{endItem} of {totalItems} {itemLabel}
        </p>
        {onPageSizeChange && (
          <label className="flex items-center gap-1.5 text-sm text-[var(--text-2)]">
            <span className="hidden sm:inline">Rows</span>
            <select
              className="input h-9 py-0 w-[72px]"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label="Rows per page"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {!fitsOnePage && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          >
            Previous
          </button>
          <span className="flex items-center gap-1 text-sm text-[var(--text-2)]">
            Page
            <input
              type="number"
              min={1}
              max={totalPages}
              defaultValue={currentPage}
              key={currentPage}
              className="input h-9 py-0 w-[56px] text-center"
              aria-label="Go to page"
              onKeyDown={(e) => {
                if (e.key === 'Enter') jumpToPage((e.target as HTMLInputElement).value);
              }}
              onBlur={(e) => jumpToPage(e.target.value)}
            />
            of {totalPages}
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
