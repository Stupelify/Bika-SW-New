import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, fireEvent } from '@testing-library/react';

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

import { useTableState } from '@/hooks/useTableState';
import DataTableToolbar, { DataTableFooter } from '../DataTableToolbar';
import type { FilterSchema } from '@/lib/data-table/types';

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

function Harness({ filters = [] as FilterSchema[] }) {
  const state = useTableState({
    filters,
    defaultSort: { key: 'name', direction: 'asc' },
  });
  return (
    <div>
      <DataTableToolbar state={state} />
      <DataTableFooter
        state={state}
        totalItems={100}
        filteredCount={42}
        itemLabel="vendors"
      />
    </div>
  );
}

beforeEach(() => {
  urlState.search = '';
  mockReplace.mockClear();
});

describe('DataTableToolbar', () => {
  it('renders the search input', () => {
    render(<Harness />);
    expect(screen.getByRole('searchbox', { name: /search/i })).toBeInTheDocument();
  });

  it('renders a chip per schema', () => {
    render(<Harness filters={[STATUS_SCHEMA, DATE_SCHEMA]} />);
    expect(screen.getByRole('button', { name: /Status/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Date/i })).toBeInTheDocument();
  });

  it('debounces search input and writes URL once after typing settles', async () => {
    vi.useFakeTimers();
    render(<Harness />);
    const input = screen.getByRole('searchbox', { name: /search/i }) as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'hello' } });
    expect(mockReplace).not.toHaveBeenCalled(); // before debounce

    await act(async () => {
      vi.advanceTimersByTime(260);
    });

    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace.mock.calls[0][0]).toContain('q=hello');
    vi.useRealTimers();
  });

  it('does not infinite-loop after pushing search (toolbar effect must converge)', async () => {
    vi.useFakeTimers();
    render(<Harness />);
    const input = screen.getByRole('searchbox', { name: /search/i }) as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'abc' } });
    await act(async () => {
      vi.advanceTimersByTime(260);
    });
    const callsAfterSettle = mockReplace.mock.calls.length;
    // Let effects/re-renders propagate; no further pushes should fire.
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(mockReplace.mock.calls.length).toBe(callsAfterSettle);
    vi.useRealTimers();
  });

  it('typing again after settle pushes once more (no missed updates)', async () => {
    vi.useFakeTimers();
    render(<Harness />);
    const input = screen.getByRole('searchbox', { name: /search/i }) as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'foo' } });
    await act(async () => { vi.advanceTimersByTime(260); });
    expect(mockReplace).toHaveBeenCalledTimes(1);

    fireEvent.change(input, { target: { value: 'foobar' } });
    await act(async () => { vi.advanceTimersByTime(260); });
    expect(mockReplace).toHaveBeenCalledTimes(2);
    expect(mockReplace.mock.calls[1][0]).toContain('q=foobar');
    vi.useRealTimers();
  });

  it('shows Clear all only when search or any filter is active', () => {
    const { rerender } = render(<Harness filters={[STATUS_SCHEMA]} />);
    expect(screen.queryByRole('button', { name: /Clear all/i })).not.toBeInTheDocument();

    urlState.search = 'q=foo';
    rerender(<Harness filters={[STATUS_SCHEMA]} />);
    expect(screen.getByRole('button', { name: /Clear all/i })).toBeInTheDocument();
  });
});

describe('DataTableFooter', () => {
  it('shows result count and "filtered from" hint', () => {
    render(<Harness />);
    expect(screen.getByText(/of/)).toBeInTheDocument();
    expect(screen.getByText(/filtered from 100/)).toBeInTheDocument();
  });

  it('renders Per page selector with default 50', () => {
    render(<Harness />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('50');
  });

  it('shows empty-state copy when filtered count is 0', () => {
    function ZeroHarness() {
      const state = useTableState({
        filters: [],
        defaultSort: { key: 'name', direction: 'asc' },
      });
      return <DataTableFooter state={state} totalItems={100} filteredCount={0} itemLabel="vendors" />;
    }
    render(<ZeroHarness />);
    expect(screen.getByText(/No vendors match/)).toBeInTheDocument();
  });
});
