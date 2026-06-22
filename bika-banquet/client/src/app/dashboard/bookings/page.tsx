'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Download,
  Filter,
  Plus,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import FilterPanel from '@/components/FilterPanel';
import { useBookingsListQuery, useBookingsServerListQuery } from '@/lib/query/hooks';
import { usesServerPagination } from '@/lib/featureFlags';
import { normalizeSearchForServer, selectListData } from '@/lib/listQuery';
import {
  SortState,
  TableColumnConfig,
  filterAndSortRows,
} from '@/lib/tableUtils';
import {
  BOOKING_FILTER_URL_KEYS,
  EMPTY_BOOKING_FILTERS,
  applyBookingFiltersClient,
  bookingFiltersFromParams,
  bookingFiltersToParams,
  countActiveFilters,
  toListParamsInput,
  type BookingFilters,
} from '@/lib/booking-list/booking-filters';
import { BookingFilterPanelBody } from '@/components/bookings/BookingFilters';
import type { FilterOption } from '@/components/data-table/filter-controls';
import { useDebounce } from '@/lib/useDebounce';
import { useAuthStore } from '@/store/authStore';
import { hasAnyPermission } from '@/lib/permissions';
import { buildSseEventStreamUrl } from '@/lib/dashboardNavigation';
import { customerSearchText } from '@/lib/customerSearch';
import { resolveDueAmount } from '@bika/booking-core';
import FloatingActionButton from '@/components/FloatingActionButton';
import Toolbar from '@/components/Toolbar';
import {
  BOOKING_SAVED_VIEWS,
  BOOKINGS_PAGE_SIZE,
  formatCustomerLabel,
  formatInrCompact,
  type Booking,
} from './_lib/types';
import BookingsListSection from './_components/BookingsListSection';
import BookingFormModal from './_components/BookingFormModal';
import { useBookingForm } from './_hooks/useBookingForm';

// Structured filters are applied via applyBookingFiltersClient on the legacy
// client path; filterAndSortRows only handles global search + sort here.
const EMPTY_CLIENT_COLUMN_SEARCH: Record<string, string> = {};

export default function BookingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const permissionSet = useMemo(() => user?.permissions || [], [user?.permissions]);
  const canViewBooking = hasAnyPermission(permissionSet, ['view_booking', 'manage_bookings']);
  const canAddBooking = hasAnyPermission(permissionSet, ['add_booking', 'manage_bookings']);
  const canEditBooking = hasAnyPermission(permissionSet, ['edit_booking', 'manage_bookings']);
  const canDeleteBooking = hasAnyPermission(permissionSet, ['delete_booking', 'manage_bookings']);
  const canExportMenuPdf = canViewBooking;

  const [useServer] = useState(() => usesServerPagination('bookings'));
  const [savedView, setSavedView] = useState<string>(() => searchParams.get('view') ?? 'all');
  const {
    data: legacyBookings = [],
    isLoading: legacyLoading,
    refetch: refetchLegacyBookings,
    isError: legacyBookingsLoadError,
  } = useBookingsListQuery<Booking[]>(canViewBooking && !useServer);
  const [bookingPdfLoading, setBookingPdfLoading] = useState<string | null>(null);
  // State is lazily hydrated from the URL query string so a reload restores the
  // view and filtered links are shareable. Reading once on mount (App Router's
  // useSearchParams is consistent across SSR/CSR) avoids a hydration flash; a
  // single write effect below keeps the URL in sync without a feedback loop.
  const [globalSearch, setGlobalSearch] = useState(() => searchParams.get('q') ?? '');
  const debouncedGlobalSearch = useDebounce(globalSearch, useServer ? 300 : 150);
  const [filters, setFilters] = useState<BookingFilters>(() =>
    bookingFiltersFromParams((key) => searchParams.get(key))
  );
  const debouncedFilters = useDebounce(filters, useServer ? 300 : 150);
  const [showFilters, setShowFilters] = useState(false);
  const [density, setDensity] = useState<'compact' | 'comfortable'>('compact');
  const [sort, setSort] = useState<SortState>(() => {
    const key = searchParams.get('sort');
    return key
      ? { key, direction: searchParams.get('dir') === 'asc' ? 'asc' : 'desc' }
      : { key: 'functionDate', direction: 'desc' };
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(() =>
    searchParams.get('vm') === 'cards' ? 'cards' : 'table'
  );

  // Venue + hall options for the multiselect filters. Best-effort: if the
  // fetch fails the rest of the filters still work.
  const [venueOptions, setVenueOptions] = useState<FilterOption[]>([]);
  const [hallOptions, setHallOptions] = useState<FilterOption[]>([]);

  const updateFilters = useCallback((patch: Partial<BookingFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('bika_bookings_density');
      if (saved === 'comfortable' || saved === 'compact') setDensity(saved);
    } catch {
      // ignore storage access errors
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('bika_bookings_density', density);
    } catch {
      // ignore storage access errors
    }
  }, [density]);

  useEffect(() => {
    if (!canViewBooking) return;
    let cancelled = false;
    (async () => {
      try {
        const [banquetsRes, hallsRes] = await Promise.all([
          api.getBanquets({ page: 1, limit: 200 }),
          api.getHalls({ page: 1, limit: 500 }),
        ]);
        if (cancelled) return;
        const banquets = banquetsRes.data?.data?.banquets || [];
        setVenueOptions(banquets.map((b) => ({ value: b.id, label: b.name })));
        const halls = hallsRes.data?.data?.halls || [];
        setHallOptions(
          halls.map((h) => ({
            value: h.id,
            label: h.banquet?.name ? `${h.banquet.name} / ${h.name}` : h.name,
          }))
        );
      } catch {
        // Options unavailable — filters that don't need them still work.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canViewBooking]);

  const serverSearch = useMemo(
    () => normalizeSearchForServer(debouncedGlobalSearch),
    [debouncedGlobalSearch]
  );
  const serverFilterParams = useMemo(
    () => toListParamsInput(debouncedFilters),
    [debouncedFilters]
  );

  const {
    data: serverBookingsData,
    isLoading: serverBookingsLoading,
    isError: serverBookingsLoadError,
    refetch: refetchServerBookings,
  } = useBookingsServerListQuery<Booking>(canViewBooking && useServer, {
    page: currentPage,
    limit: BOOKINGS_PAGE_SIZE,
    sort: sort.key,
    order: sort.direction,
    ...serverFilterParams,
    search: serverSearch,
  });

  const serverBookingsPrevRef = useRef<Booking[] | undefined>(undefined);
  if (serverBookingsData?.rows) serverBookingsPrevRef.current = serverBookingsData.rows;
  const serverBookingsSelected = selectListData<Booking>(
    serverBookingsData?.rows,
    serverBookingsPrevRef.current,
    serverBookingsLoadError
  );

  const bookings: Booking[] = useServer ? serverBookingsSelected.rows : legacyBookings;
  const loading = useServer ? serverBookingsLoading : legacyLoading;
  const bookingsLoadError = useServer ? false : legacyBookingsLoadError;
  const refetchBookings = useServer ? refetchServerBookings : refetchLegacyBookings;

  useEffect(() => {
    if (useServer && serverBookingsLoadError) {
      toast.error('Failed to load bookings. Showing last results.', {
        action: { label: 'Retry', onClick: () => void refetchServerBookings() },
      });
    }
  }, [useServer, serverBookingsLoadError, refetchServerBookings]);

  const loadBookings = useCallback(async () => {
    await refetchBookings();
  }, [refetchBookings]);

  const clearSearch = () => {
    setGlobalSearch('');
    setFilters(EMPTY_BOOKING_FILTERS);
    setCurrentPage(1);
  };

  const bookingForm = useBookingForm({
    onDataChanged: loadBookings,
    bookingsForMenuPdf: bookings,
  });

  const {
    openCreateBooking,
    openEditBooking,
    refreshOpenBookingFinancialsRef,
    setShowCreateForm,
    setMenuPdfBooking,
  } = bookingForm;

  useEffect(() => {
    if (bookingsLoadError) {
      toast.error('Failed to load bookings');
    }
  }, [bookingsLoadError]);

  useEffect(() => {
    const section = searchParams.get('section');
    const id = searchParams.get('id');
    if (section === 'edit' && id) {
      void openEditBooking(id);
    } else if (section === 'new') {
      void openCreateBooking({
        date: searchParams.get('date') || undefined,
        hallId: searchParams.get('hall') || undefined,
        slot: searchParams.get('slot') || undefined,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!canViewBooking || typeof window === 'undefined') return;

    let eventSource: EventSource | null = null;
    let cancelled = false;

    const openSseConnection = async () => {
      try {
        const res = await api.getSseToken();
        if (cancelled) return;
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
        eventSource = new EventSource(buildSseEventStreamUrl(baseUrl, res.data.token));

        eventSource.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data) as { type?: string; id?: string };
            if (payload.type?.startsWith('booking:')) {
              void loadBookings();
              if (payload.id) {
                refreshOpenBookingFinancialsRef.current(payload.id);
              }
            }
          } catch {
            // Ignore malformed SSE payloads and keep the stream alive.
          }
        };
      } catch {
        // SSE token fetch failed — real-time updates unavailable, page still works.
      }
    };

    void openSseConnection();

    return () => {
      cancelled = true;
      eventSource?.close();
    };
  }, [canViewBooking, loadBookings, refreshOpenBookingFinancialsRef]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const payload = bookings.slice(0, 20).map((booking) => ({
      id: booking.id,
      name: booking.functionName || 'Booking',
      subtitle: formatCustomerLabel(booking.customer),
      href: `/dashboard/bookings?section=edit&id=${booking.id}`,
    }));
    window.localStorage.setItem('bika_palette_bookings', JSON.stringify(payload));
  }, [bookings]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedGlobalSearch, debouncedFilters, sort]);

  // Sync list state -> URL (debounced via debouncedFilters/Search). Foreign
  // params (the section/id/date/hall/slot deep-links) are preserved; only the
  // codec-owned keys are rewritten, so there is no read-back loop.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    for (const key of [...BOOKING_FILTER_URL_KEYS, 'q', 'sort', 'dir', 'view', 'vm']) {
      params.delete(key);
    }
    for (const [key, value] of Object.entries(bookingFiltersToParams(debouncedFilters))) {
      params.set(key, value);
    }
    const trimmedSearch = debouncedGlobalSearch.trim();
    if (trimmedSearch) params.set('q', trimmedSearch);
    if (!(sort.key === 'functionDate' && sort.direction === 'desc')) {
      params.set('sort', sort.key);
      params.set('dir', sort.direction);
    }
    if (savedView && savedView !== 'all') params.set('view', savedView);
    if (viewMode === 'cards') params.set('vm', 'cards');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [debouncedFilters, debouncedGlobalSearch, sort, savedView, viewMode, pathname, router]);

  const tableColumns = useMemo<TableColumnConfig<Booking>[]>(
    () => [
      {
        key: 'functionName',
        accessor: (booking) => `${booking.functionName} ${booking.functionType}`,
      },
      {
        key: 'customer',
        accessor: (booking) =>
          customerSearchText({
            name: booking.customer?.name,
            phone: booking.customer?.phone,
            email: booking.customer?.email,
          }),
      },
      {
        key: 'functionDate',
        accessor: (booking) => booking.functionDate,
      },
      {
        key: 'expectedGuests',
        accessor: (booking) => booking.expectedGuests,
        searchable: false,
      },
      {
        key: 'status',
        accessor: (booking) =>
          booking.isQuotation ? 'Quotation' : booking.status,
      },
      {
        key: 'grandTotal',
        accessor: (booking) => booking.grandTotal ?? 0,
        searchable: false,
      },
    ],
    []
  );

  const clientFilteredBookings = useMemo(
    () =>
      applyBookingFiltersClient(
        filterAndSortRows(bookings, tableColumns, debouncedGlobalSearch, EMPTY_CLIENT_COLUMN_SEARCH, sort),
        debouncedFilters
      ),
    [bookings, tableColumns, debouncedGlobalSearch, debouncedFilters, sort]
  );

  const serverBookingsTotal = serverBookingsData?.pagination?.total ?? 0;
  const totalBookingsCount = useServer
    ? serverBookingsTotal
    : clientFilteredBookings.length;

  const totalPages = useMemo(
    () =>
      useServer
        ? Math.max(1, serverBookingsData?.pagination?.totalPages ?? 1)
        : Math.max(1, Math.ceil(clientFilteredBookings.length / BOOKINGS_PAGE_SIZE)),
    [useServer, serverBookingsData?.pagination?.totalPages, clientFilteredBookings.length]
  );

  const filteredBookings = useServer ? bookings : clientFilteredBookings;

  const paginatedBookings = useMemo(() => {
    if (useServer) return bookings;
    const safePage = Math.min(Math.max(currentPage, 1), totalPages);
    const startIndex = (safePage - 1) * BOOKINGS_PAGE_SIZE;
    return clientFilteredBookings.slice(startIndex, startIndex + BOOKINGS_PAGE_SIZE);
  }, [useServer, bookings, currentPage, clientFilteredBookings, totalPages]);

  useEffect(() => {
    if (currentPage <= totalPages) return;
    setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const activeSavedView = useMemo(
    () => BOOKING_SAVED_VIEWS.find((v) => v.id === savedView) ?? BOOKING_SAVED_VIEWS[0],
    [savedView]
  );

  const viewBookings = useMemo(
    () => (activeSavedView.fn ? paginatedBookings.filter(activeSavedView.fn) : paginatedBookings),
    [paginatedBookings, activeSavedView]
  );

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Delete this booking?')) return;
    try {
      await api.deleteBooking(bookingId);
      toast.success('Booking deleted successfully');
      await loadBookings();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to delete booking');
    }
  };

  const openEditBookingRef = useRef(openEditBooking);
  openEditBookingRef.current = openEditBooking;
  const handleDeleteBookingRef = useRef(handleDeleteBooking);
  handleDeleteBookingRef.current = handleDeleteBooking;
  const stableOnEdit = useCallback((id: string) => {
    void openEditBookingRef.current(id);
  }, []);
  const stableOnDelete = useCallback((id: string) => {
    void handleDeleteBookingRef.current(id);
  }, []);

  const handleDownloadBookingPdf = useCallback(async (booking: Booking) => {
    if (bookingPdfLoading) return;
    try {
      setBookingPdfLoading(booking.id);
      const response = await api.getBookingPdf(booking.id);
      const blob =
        response.data instanceof Blob
          ? response.data
          : new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeName = (booking.functionName || booking.functionType || booking.customer?.name || 'booking')
        .trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'booking';
      link.href = url;
      link.download = `${safeName}-booking-details.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to generate booking PDF');
    } finally {
      setBookingPdfLoading(null);
    }
  }, [bookingPdfLoading]);

  const bookingsValueInView = useMemo(
    () => viewBookings.reduce((sum, b) => sum + (b.grandTotal || 0), 0),
    [viewBookings]
  );

  const bookingsOutstandingInView = useMemo(
    () => viewBookings.reduce((sum, b) => sum + resolveDueAmount(b), 0),
    [viewBookings]
  );

  return (
    <div className="ops-route ops-list-route">
      <Toolbar
        title="Bookings"
        stats={[
          { label: 'In view', value: viewBookings.length },
          { label: 'Value in view', value: formatInrCompact(bookingsValueInView) },
          {
            label: 'Outstanding',
            value: (
              <span
                className={
                  bookingsOutstandingInView > 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }
              >
                {formatInrCompact(bookingsOutstandingInView)}
              </span>
            ),
          },
        ]}
        actions={
          <>
            <div className="ops-toolbar-search">
              <Search className="w-4 h-4" aria-hidden="true" />
              <input
                type="search"
                value={globalSearch}
                onChange={(event) => setGlobalSearch(event.target.value)}
                placeholder="Search..."
                aria-label="Search bookings"
              />
            </div>
            <button
              type="button"
              className="btn btn-secondary ops-filter-button"
              onClick={() => setShowFilters(true)}
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ops-filter-count">{activeFilterCount}</span>
              )}
            </button>
            {canAddBooking ? (
              <button
                onClick={() => void openCreateBooking()}
                className="btn btn-primary inline-flex items-center gap-2 justify-center"
              >
                <Plus className="w-4 h-4" />
                New booking
              </button>
            ) : null}
          </>
        }
      />

      {!canViewBooking && (
        <div className="card border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200 text-sm">
          You do not have permission to view bookings.
        </div>
      )}

      <BookingFormModal {...bookingForm} />

      <BookingsListSection
        canViewBooking={canViewBooking}
        canAddBooking={canAddBooking}
        canEditBooking={canEditBooking}
        canDeleteBooking={canDeleteBooking}
        canExportMenuPdf={canExportMenuPdf}
        loading={loading}
        bookingPdfLoading={bookingPdfLoading}
        savedView={savedView}
        setSavedView={setSavedView}
        viewMode={viewMode}
        setViewMode={setViewMode}
        globalSearch={globalSearch}
        setGlobalSearch={setGlobalSearch}
        filters={filters}
        onFilterChange={updateFilters}
        activeFilterCount={activeFilterCount}
        venueOptions={venueOptions}
        hallOptions={hallOptions}
        density={density}
        setDensity={setDensity}
        clearSearch={clearSearch}
        sort={sort}
        setSort={setSort}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        totalBookingsCount={totalBookingsCount}
        viewBookings={viewBookings}
        openEditBooking={(id) => void openEditBooking(id)}
        stableOnEdit={stableOnEdit}
        stableOnDelete={stableOnDelete}
        handleDeleteBooking={(id) => void handleDeleteBooking(id)}
        handleDownloadBookingPdf={(b) => void handleDownloadBookingPdf(b)}
        setMenuPdfBooking={setMenuPdfBooking}
        setShowCreateForm={setShowCreateForm}
        setShowFilters={setShowFilters}
      />

      {canAddBooking && (
        <FloatingActionButton
          onClick={() => void openCreateBooking()}
          label="New Booking"
        />
      )}

      <FilterPanel
        open={showFilters}
        onClose={() => setShowFilters(false)}
        activeCount={activeFilterCount}
        onClearAll={() => setFilters(EMPTY_BOOKING_FILTERS)}
      >
        <BookingFilterPanelBody
          filters={filters}
          onChange={updateFilters}
          venueOptions={venueOptions}
          hallOptions={hallOptions}
        />
      </FilterPanel>
    </div>
  );
}
