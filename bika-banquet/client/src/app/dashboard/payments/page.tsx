'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { buildListUrl } from '@/lib/urlListState';
import { useSSE } from '@/hooks/useSSE';
import { toast } from 'sonner';
import { CreditCard, Plus, Save, Search, Filter } from 'lucide-react';
import FormPromptModal from '@/components/FormPromptModal';
import FilterPanel from '@/components/FilterPanel';
import EmptyState from '@/components/EmptyState';
import SortableHeader from '@/components/SortableHeader';
import { ChoiceFilter, ColumnFilter, DateRangeFilter } from '@/components/data-table/filter-controls';
import { DUE_FILTER_OPTIONS } from '@/components/bookings/BookingFilters';
import { useAuthStore } from '@/store/authStore';
import { hasAnyPermission } from '@/lib/permissions';
import TablePagination from '@/components/TablePagination';
import Combobox from '@/components/Combobox';
import Toolbar from '@/components/Toolbar';
import { PaymentsTableSkeleton } from '@/components/Skeletons';
import {
  useAddPaymentMutation,
  useBookingsListQuery,
  useBookingsServerListQuery,
} from '@/lib/query/hooks';
import { usesServerPagination } from '@/lib/featureFlags';
import { normalizeSearchForServer, selectListData } from '@/lib/listQuery';
import { useDebounce } from '@/lib/useDebounce';
import { api } from '@/lib/api';
import {
  SortState,
  TableColumnConfig,
  filterAndSortRows,
  getNextSort,
} from '@/lib/tableUtils';
import { formatDateDDMMYYYY, formatDateCompact } from '@/lib/date';
import {
  resolveDueAmount,
  resolvePaymentReceivedGross,
} from '@bika/booking-core';

interface BookingRow {
  id: string;
  functionName: string;
  functionDate: string;
  status: string;
  customer?: {
    name: string;
    phone: string;
  };
  grandTotal?: number;
  paymentReceivedAmountValue?: number;
  paymentReceivedAmount?: string | number | null;
  dueAmountValue?: number;
  dueAmount?: string | number | null;
  _count?: {
    payments: number;
  };
}

const getInitialPaymentForm = () => ({
  bookingId: '',
  amount: '',
  method: 'cash',
  reference: '',
  narration: '',
  paymentDate: new Date().toISOString().split('T')[0],
});
const initialPaymentForm = getInitialPaymentForm();

const initialColumnSearch = {
  booking: '',
  eventDate: '',
  total: '',
  received: '',
  balance: '',
  entries: '',
};

const PAYMENTS_PAGE_SIZE = 100;

export default function PaymentsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const permissionSet = useMemo(() => user?.permissions ?? [], [user?.permissions]);
  const canViewPayments = useMemo(
    () => hasAnyPermission(permissionSet, ['manage_payments', 'view_booking', 'manage_bookings']),
    [permissionSet]
  );
  const canAddPayment = useMemo(
    () => hasAnyPermission(permissionSet, ['manage_payments', 'edit_booking', 'manage_bookings']),
    [permissionSet]
  );

  const [useServer] = useState(() => usesServerPagination('payments'));
  const {
    data: legacyBookings = [],
    isLoading: legacyLoading,
    refetch: refetchLegacyBookings,
    isError: legacyLoadError,
  } = useBookingsListQuery<BookingRow[]>(canViewPayments && !useServer);
  const addPaymentMutation = useAddPaymentMutation();
  const saving = addPaymentMutation.isPending;
  const [showPaymentPrompt, setShowPaymentPrompt] = useState(false);
  // Filter/search/sort state is hydrated from the URL on mount and synced back
  // by the effect below, so reloads restore the view and links are shareable.
  const [globalSearch, setGlobalSearch] = useState(() => searchParams.get('q') ?? '');
  const [columnSearch, setColumnSearch] = useState(initialColumnSearch);
  const [dateFrom, setDateFrom] = useState(() => searchParams.get('from') ?? '');
  const [dateTo, setDateTo] = useState(() => searchParams.get('to') ?? '');
  const [due, setDue] = useState<'' | 'outstanding' | 'paid'>(() => {
    const d = searchParams.get('due');
    return d === 'outstanding' || d === 'paid' ? d : '';
  });
  const [sort, setSort] = useState<SortState>(() => {
    const key = searchParams.get('sort');
    return key
      ? { key, direction: searchParams.get('dir') === 'desc' ? 'desc' : 'asc' }
      : { key: 'booking', direction: 'asc' };
  });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [paymentForm, setPaymentForm] = useState(initialPaymentForm);
  // Pinned booking option for the Add-Payment picker (server mode): keeps the
  // chosen booking visible even when not in the searched batch.
  const [pinnedBooking, setPinnedBooking] = useState<BookingRow | null>(null);

  const debouncedGlobalSearch = useDebounce(globalSearch, useServer ? 300 : 0);

  const serverSearch = useMemo(() => {
    const parts = [debouncedGlobalSearch, columnSearch.booking, columnSearch.eventDate]
      .map((v) => (v ?? '').trim())
      .filter(Boolean);
    return normalizeSearchForServer(parts.join(' '));
  }, [debouncedGlobalSearch, columnSearch.booking, columnSearch.eventDate]);

  const {
    data: serverData,
    isLoading: serverLoading,
    isError: serverLoadError,
    refetch: refetchServerBookings,
  } = useBookingsServerListQuery<BookingRow>(canViewPayments && useServer, {
    page: currentPage,
    limit: PAYMENTS_PAGE_SIZE,
    search: serverSearch,
    sort: sort.key,
    order: sort.direction,
    fromDate: dateFrom || undefined,
    toDate: dateTo || undefined,
    due: due || undefined,
  });

  const serverPrevRef = useRef<BookingRow[] | undefined>(undefined);
  if (serverData?.rows) serverPrevRef.current = serverData.rows;
  const serverSelected = selectListData<BookingRow>(
    serverData?.rows,
    serverPrevRef.current,
    serverLoadError
  );

  const bookings: BookingRow[] = useServer ? serverSelected.rows : legacyBookings;
  const loading = useServer ? serverLoading : legacyLoading;
  const bookingsLoadError = useServer ? false : legacyLoadError;
  const refetchBookings = useServer ? refetchServerBookings : refetchLegacyBookings;

  useEffect(() => {
    if (useServer && serverLoadError) {
      toast.error('Failed to load payments. Showing last results.', {
        action: { label: 'Retry', onClick: () => void refetchServerBookings() },
      });
    }
  }, [useServer, serverLoadError, refetchServerBookings]);

  // Hybrid Add-Payment booking picker (server mode): search across ALL
  // bookings + pin the selected one so any booking is payable, not just the
  // current table page.
  const bookingToOption = useCallback(
    (b: BookingRow) => ({
      value: b.id,
      label: `${b.functionName} - ${b.customer?.name ?? ''}`.trim(),
      secondary: b.customer?.phone || undefined,
    }),
    []
  );
  const loadPaymentBookingsPage = useCallback(
    async (query: string, page: number) => {
      const trimmed = query.trim();
      // Starter batch on open, server search across ALL bookings on typing, and
      // append the next page as the dropdown is scrolled.
      const base =
        trimmed.length >= 2
          ? { search: normalizeSearchForServer(trimmed) }
          : {};
      const res = await api.getBookings({ ...base, limit: 50, page });
      const rows = (res?.data?.data?.bookings || []) as BookingRow[];
      const totalPages = Math.max(1, res?.data?.data?.pagination?.totalPages ?? 1);
      const merged =
        page === 1 && pinnedBooking
          ? [pinnedBooking, ...rows.filter((r) => r.id !== pinnedBooking.id)]
          : rows;
      return { options: merged.map(bookingToOption), hasMore: page < totalPages };
    },
    [pinnedBooking, bookingToOption]
  );
  useEffect(() => {
    if (!useServer) return;
    const id = paymentForm.bookingId;
    if (!id) {
      setPinnedBooking(null);
      return;
    }
    if (pinnedBooking?.id === id) return;
    const inPage = bookings.find((b) => b.id === id);
    if (inPage) {
      setPinnedBooking(inPage);
      return;
    }
    let cancelled = false;
    void api
      .getBooking(id)
      .then((res) => {
        const b = res?.data?.data?.booking;
        if (!cancelled && b) setPinnedBooking(b as BookingRow);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [useServer, paymentForm.bookingId, pinnedBooking?.id, bookings]);

  const tableColumns = useMemo<TableColumnConfig<BookingRow>[]>(
    () => [
      {
        key: 'booking',
        accessor: (booking) =>
          `${booking.functionName} ${booking.customer?.name ?? ''} ${booking.customer?.phone ?? ''
          }`,
      },
      { key: 'eventDate', accessor: (booking) => booking.functionDate },
      { key: 'total', accessor: (booking) => booking.grandTotal ?? 0 },
      { key: 'received', accessor: (booking) => resolvePaymentReceivedGross(booking) },
      { key: 'balance', accessor: (booking) => resolveDueAmount(booking) },
      { key: 'entries', accessor: (booking) => booking._count?.payments ?? 0 },
    ],
    []
  );

  const clientFiltered = useMemo(() => {
    let rows = filterAndSortRows(bookings, tableColumns, globalSearch, columnSearch, sort);
    if (dateFrom || dateTo) {
      rows = rows.filter((b) => {
        const day = (b.functionDate || '').slice(0, 10);
        if (dateFrom && day < dateFrom) return false;
        if (dateTo && day > dateTo) return false;
        return true;
      });
    }
    if (due) {
      rows = rows.filter((b) => {
        const balance = resolveDueAmount(b);
        return due === 'outstanding' ? balance > 0 : balance <= 0;
      });
    }
    return rows;
  }, [bookings, tableColumns, globalSearch, columnSearch, sort, dateFrom, dateTo, due]);

  const serverTotal = serverData?.pagination?.total ?? 0;
  const totalCount = useServer ? serverTotal : clientFiltered.length;

  const totalPages = useMemo(
    () =>
      useServer
        ? Math.max(1, serverData?.pagination?.totalPages ?? 1)
        : Math.max(1, Math.ceil(clientFiltered.length / PAYMENTS_PAGE_SIZE)),
    [useServer, serverData?.pagination?.totalPages, clientFiltered.length]
  );

  const filteredBookings = useServer ? bookings : clientFiltered;

  const paginatedBookings = useMemo(() => {
    if (useServer) return bookings; // already the current page
    const safePage = Math.min(Math.max(currentPage, 1), totalPages);
    const startIndex = (safePage - 1) * PAYMENTS_PAGE_SIZE;
    return clientFiltered.slice(startIndex, startIndex + PAYMENTS_PAGE_SIZE);
  }, [useServer, bookings, currentPage, clientFiltered, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [globalSearch, columnSearch, sort, dateFrom, dateTo, due]);

  // Sync filter/search/sort state -> URL (preserves any foreign params).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isDefaultSort = sort.key === 'booking' && sort.direction === 'asc';
    router.replace(
      buildListUrl(pathname, window.location.search, ['q', 'from', 'to', 'due', 'sort', 'dir'], {
        q: debouncedGlobalSearch,
        from: dateFrom,
        to: dateTo,
        due,
        sort: isDefaultSort ? undefined : sort.key,
        dir: isDefaultSort ? undefined : sort.direction,
      }),
      { scroll: false }
    );
  }, [debouncedGlobalSearch, dateFrom, dateTo, due, sort, pathname, router]);

  useEffect(() => {
    if (currentPage <= totalPages) return;
    setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (bookingsLoadError) {
      toast.error('Failed to load bookings');
    }
  }, [bookingsLoadError]);

  useEffect(() => {
    if (bookings.length > 0) {
      setPaymentForm((prev) => ({ ...prev, bookingId: prev.bookingId || bookings[0].id }));
    }
  }, [bookings]);

  const loadBookings = useCallback(async () => {
    await refetchBookings();
  }, [refetchBookings]);

  const paymentsDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedLoadBookings = useCallback(() => {
    if (paymentsDebounceTimerRef.current) clearTimeout(paymentsDebounceTimerRef.current);
    paymentsDebounceTimerRef.current = setTimeout(() => {
      void loadBookings();
    }, 300);
  }, [loadBookings]);
  useEffect(() => {
    return () => {
      if (paymentsDebounceTimerRef.current) clearTimeout(paymentsDebounceTimerRef.current);
    };
  }, []);
  useSSE(['booking:'], debouncedLoadBookings, canViewPayments);

  const submitPayment = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!paymentForm.bookingId || !paymentForm.amount) {
      toast.error('Booking and amount are required');
      return;
    }
    try {
      await addPaymentMutation.mutateAsync({
        bookingId: paymentForm.bookingId,
        amount: Number(paymentForm.amount),
        method: paymentForm.method,
        reference: paymentForm.reference.trim() || undefined,
        narration: paymentForm.narration.trim() || undefined,
        paymentDate: paymentForm.paymentDate || undefined,
      });
      setShowPaymentPrompt(false);
      setPaymentForm((prev) => ({
        ...getInitialPaymentForm(),
        bookingId: prev.bookingId,
        method: prev.method,
      }));
    } catch {
      // Error toast handled in mutation onError.
    }
  };

  return (
    <div className="ops-route ops-list-route">
      <Toolbar
        title="Payments"
        stats={[
          { label: 'In view', value: totalCount },
        ]}
        actions={
          canAddPayment ? (
            <button
              type="button"
              className="btn btn-primary inline-flex items-center gap-2 w-full sm:w-auto justify-center"
              onClick={() => setShowPaymentPrompt(true)}
              disabled={useServer ? totalCount === 0 : bookings.length === 0}
            >
              <Plus className="w-4 h-4" />
              Add Payment
            </button>
          ) : null
        }
      />

      <FormPromptModal
        open={showPaymentPrompt}
        title="Add Payment"
        onClose={() => setShowPaymentPrompt(false)}
        widthClass="max-w-5xl"
      >
        <form onSubmit={submitPayment} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <label className="label">Booking</label>
              {useServer ? (
                <Combobox
                  value={paymentForm.bookingId}
                  onChange={(val) =>
                    setPaymentForm((prev) => ({ ...prev, bookingId: val }))
                  }
                  options={pinnedBooking ? [bookingToOption(pinnedBooking)] : []}
                  loadPage={loadPaymentBookingsPage}
                  placeholder="Search booking or customer"
                  searchPlaceholder="Function, customer or phone"
                />
              ) : (
                <select
                  className="input"
                  value={paymentForm.bookingId}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({ ...prev, bookingId: e.target.value }))
                  }
                  required
                >
                  {bookings.map((booking) => (
                    <option key={booking.id} value={booking.id}>
                      {booking.functionName} - {booking.customer?.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="label">Amount</label>
              <input
                className="input"
                type="number"
                min={1}
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Method</label>
              <select
                className="input"
                value={paymentForm.method}
                onChange={(e) => setPaymentForm((prev) => ({ ...prev, method: e.target.value }))}
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="cheque">Cheque</option>
                <option value="bank_transfer">Bank transfer</option>
              </select>
            </div>
            <div>
              <label className="label">Reference</label>
              <input
                className="input"
                value={paymentForm.reference}
                onChange={(e) =>
                  setPaymentForm((prev) => ({ ...prev, reference: e.target.value }))
                }
                placeholder="Txn/cheque no."
              />
            </div>
            <div>
              <label className="label">Date</label>
              <input
                className="input"
                type="date"
                value={paymentForm.paymentDate}
                onChange={(e) =>
                  setPaymentForm((prev) => ({ ...prev, paymentDate: e.target.value }))
                }
              />
            </div>
            <div className="md:col-span-3 lg:col-span-5">
              <label className="label">Narration</label>
              <input
                className="input"
                value={paymentForm.narration}
                onChange={(e) =>
                  setPaymentForm((prev) => ({ ...prev, narration: e.target.value }))
                }
                placeholder="Notes for this collection"
              />
            </div>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowPaymentPrompt(false)}
            >
              Cancel
            </button>
            <button className="btn btn-primary" disabled={saving} type="submit">
              <span className="inline-flex items-center gap-2">
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Add Payment'}
              </span>
            </button>
          </div>
        </form>
      </FormPromptModal>

      <div className="card">
        <div className="page-head mb-4">
          <div className="flex items-center gap-2 text-[var(--text-1)]">
            <CreditCard className="w-4 h-4 text-primary-600" />
            <h2 className="text-lg font-semibold">Payments table</h2>
          </div>
        </div>
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-4)]" />
            <input
              className="input pl-10"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Overall search across all payment columns..."
            />
          </div>
          <button type="button" className="btn btn-secondary flex items-center justify-center h-[42px] px-3 md:px-4" onClick={() => setShowFilters(true)}>
            <Filter className="w-5 h-5 md:mr-2" />
            <span className="hidden md:inline">Filters</span>
            {Object.values(columnSearch).filter(Boolean).length > 0 && (
               <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-[11px] font-bold text-primary-700">
                 {Object.values(columnSearch).filter(Boolean).length}
               </span>
            )}
          </button>
        </div>

        {!canViewPayments ? (
          <EmptyState
            icon={CreditCard}
            variant="page"
            title="Access restricted"
            description="You don't have permission to view payments. Contact your administrator."
          />
        ) : loading ? (
          <div className="py-6">
            <PaymentsTableSkeleton rows={8} />
          </div>
        ) : totalCount === 0 ? (
          <EmptyState
            icon={globalSearch ? Search : CreditCard}
            variant={
              globalSearch
                ? 'search'
                : Object.values(columnSearch).some(Boolean)
                  ? 'filter'
                  : 'page'
            }
            title={
              globalSearch
                ? 'No payments match your search'
                : Object.values(columnSearch).some(Boolean)
                  ? 'No matches'
                  : 'No bookings found'
            }
            description={
              globalSearch || Object.values(columnSearch).some(Boolean)
                ? `"${globalSearch || Object.values(columnSearch).find(Boolean)}" returned no results.`
                : 'Try adjusting the filters or date range.'
            }
            action={
              globalSearch
                ? { label: 'Clear search', onClick: () => setGlobalSearch('') }
                : Object.values(columnSearch).some(Boolean)
                  ? { label: 'Clear filters', onClick: () => setColumnSearch(initialColumnSearch) }
                  : undefined
            }
          />
        ) : (
          <>
            {/* Mobile card view */}
            <div className="md:hidden">
              <div className="mobile-card-list">
                {paginatedBookings.map((booking) => (
                  <div key={booking.id} className="mobile-card">
                    <div className="mobile-card-header">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="mobile-card-title">{booking.functionName}</div>
                        <div className="mobile-card-subtitle">
                          {booking.customer?.name} • {booking.customer?.phone}
                        </div>
                      </div>
                    </div>
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">Event Date</span>
                      <span className="mobile-card-value">{formatDateDDMMYYYY(booking.functionDate)}</span>
                    </div>
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">Total</span>
                      <span className="mobile-card-value">₹{(booking.grandTotal || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">Received</span>
                      <span className="mobile-card-value" style={{ color: '#15803d' }}>₹{resolvePaymentReceivedGross(booking).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">Balance</span>
                      <span className="mobile-card-amount">₹{resolveDueAmount(booking).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">Entries</span>
                      <span className="mobile-card-value">{booking._count?.payments || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalCount}
                pageSize={PAYMENTS_PAGE_SIZE}
                itemLabel="bookings"
                onPageChange={setCurrentPage}
              />
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block table-shell">
              <table className="data-table">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <SortableHeader
                      label="Booking"
                      sortKey="booking"
                      sort={sort}
                      onSort={(key) => setSort((prev) => getNextSort(prev, key))}
                      className="text-left py-3 px-3 text-sm font-semibold text-[var(--text-2)]"
                    />
                    <SortableHeader
                      label="Event date"
                      sortKey="eventDate"
                      sort={sort}
                      onSort={(key) => setSort((prev) => getNextSort(prev, key))}
                      className="text-left py-3 px-3 text-sm font-semibold text-[var(--text-2)]"
                      filter={
                        <ColumnFilter active={Boolean(dateFrom || dateTo)} title="Event date">
                          <DateRangeFilter
                            from={dateFrom}
                            to={dateTo}
                            onChange={({ from, to }) => {
                              setDateFrom(from);
                              setDateTo(to);
                            }}
                          />
                        </ColumnFilter>
                      }
                    />
                    <SortableHeader
                      label="Total"
                      sortKey="total"
                      sort={sort}
                      onSort={(key) => setSort((prev) => getNextSort(prev, key))}
                      className="text-right py-3 px-3 text-sm font-semibold text-[var(--text-2)]"
                    />
                    <SortableHeader
                      label="Received"
                      sortKey="received"
                      sort={sort}
                      onSort={(key) => setSort((prev) => getNextSort(prev, key))}
                      className="text-right py-3 px-3 text-sm font-semibold text-[var(--text-2)]"
                    />
                    <SortableHeader
                      label="Balance"
                      sortKey="balance"
                      sort={sort}
                      onSort={(key) => setSort((prev) => getNextSort(prev, key))}
                      className="text-right py-3 px-3 text-sm font-semibold text-[var(--text-2)]"
                      filter={
                        <ColumnFilter active={Boolean(due)} title="Balance" align="end">
                          <ChoiceFilter
                            name="payments-due"
                            value={due}
                            options={DUE_FILTER_OPTIONS}
                            onChange={(v) => setDue(v as '' | 'outstanding' | 'paid')}
                          />
                        </ColumnFilter>
                      }
                    />
                    <SortableHeader
                      label="Entries"
                      sortKey="entries"
                      sort={sort}
                      onSort={(key) => setSort((prev) => getNextSort(prev, key))}
                      className="text-right py-3 px-3 text-sm font-semibold text-[var(--text-2)]"
                    />
                  </tr>
                </thead>
                <tbody>
                  {paginatedBookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="ops-click-row border-b border-[var(--border)]"
                      onClick={() => {
                        window.location.href = `/dashboard/bookings?section=edit&id=${booking.id}`;
                      }}
                    >
                      <td className="py-3 px-3 main">
                        <p className="text-sm text-[var(--text-1)]">{booking.functionName}</p>
                        <p className="text-xs text-[var(--text-4)] mt-1">
                          {booking.customer?.name} • {booking.customer?.phone}
                        </p>
                      </td>
                      <td className="py-3 px-3 text-sm text-[var(--text-2)] whitespace-nowrap">
                        {formatDateCompact(booking.functionDate)}
                      </td>
                      <td className="py-3 px-3 text-right text-sm text-[var(--text-2)] num">
                        ₹{(booking.grandTotal || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right text-sm text-emerald-600 dark:text-emerald-400 num">
                        ₹{resolvePaymentReceivedGross(booking).toLocaleString('en-IN')}
                      </td>
                      <td className={`py-3 px-3 text-right text-sm font-medium num ${resolveDueAmount(booking) > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {resolveDueAmount(booking) > 0 ? `₹${resolveDueAmount(booking).toLocaleString('en-IN')}` : 'Paid'}
                      </td>
                      <td className="py-3 px-3 text-right text-sm text-[var(--text-2)] num">
                        {booking._count?.payments || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalCount}
                pageSize={PAYMENTS_PAGE_SIZE}
                itemLabel="bookings"
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </div>

      <FilterPanel
        open={showFilters}
        onClose={() => setShowFilters(false)}
        activeCount={Object.values(columnSearch).filter(Boolean).length}
        onClearAll={() => setColumnSearch(initialColumnSearch)}
      >
        <div className="space-y-4">
          <div>
            <label className="label">Booking</label>
            <input className="input" placeholder="Search booking" value={columnSearch.booking} onChange={(e) => setColumnSearch((prev) => ({ ...prev, booking: e.target.value }))} />
          </div>
          <div>
            <label className="label">Event Date</label>
            <input className="input" type="date" value={columnSearch.eventDate} onChange={(e) => setColumnSearch((prev) => ({ ...prev, eventDate: e.target.value }))} />
          </div>
          <div>
            <label className="label">Total</label>
            <input className="input" placeholder="Search total" value={columnSearch.total} onChange={(e) => setColumnSearch((prev) => ({ ...prev, total: e.target.value }))} />
          </div>
          <div>
            <label className="label">Received</label>
            <input className="input" placeholder="Search received" value={columnSearch.received} onChange={(e) => setColumnSearch((prev) => ({ ...prev, received: e.target.value }))} />
          </div>
          <div>
            <label className="label">Balance</label>
            <input className="input" placeholder="Search balance" value={columnSearch.balance} onChange={(e) => setColumnSearch((prev) => ({ ...prev, balance: e.target.value }))} />
          </div>
          <div>
            <label className="label">Entries</label>
            <input className="input" placeholder="Search entries" value={columnSearch.entries} onChange={(e) => setColumnSearch((prev) => ({ ...prev, entries: e.target.value }))} />
          </div>
        </div>
      </FilterPanel>
    </div>
  );
}
