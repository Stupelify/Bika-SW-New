'use client';

import { CalendarCheck, Plus, Search, Filter, Edit, Trash2, Download, FileText, PencilLine, Rows3, Rows4 } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import SortableHeader from '@/components/SortableHeader';
import TablePagination from '@/components/TablePagination';
import { BookingsTableSkeleton } from '@/components/Skeletons';
import MobileBookingCard from '@/components/MobileBookingCard';
import BookingCard from '@/components/BookingCard';
import StatusBadge, { getRowStatusClass } from '@/components/StatusBadge';
import { formatDateCompact } from '@/lib/date';
import { getNextSort, type SortState } from '@/lib/tableUtils';
import { resolveDueAmount } from '@bika/booking-core';
import { cn } from '@/lib/cn';
import {
  ChoiceFilter,
  ColumnFilter,
  DateRangeFilter,
  MultiSelectFilter,
  NumberRangeFilter,
  type FilterOption,
} from '@/components/data-table/filter-controls';
import { DUE_FILTER_OPTIONS, STATUS_FILTER_OPTIONS } from '@/components/bookings/BookingFilters';
import type { BookingFilters } from '@/lib/booking-list/booking-filters';
import {
  BOOKING_SAVED_VIEWS,
  BOOKINGS_PAGE_SIZE,
  formatInrCompact,
  pencilExpiryDays,
  type Booking,
} from '../_lib/types';

interface BookingsListSectionProps {
  canViewBooking: boolean;
  canAddBooking: boolean;
  canEditBooking: boolean;
  canDeleteBooking: boolean;
  canExportMenuPdf: boolean;
  loading: boolean;
  bookingPdfLoading: string | null;
  savedView: string;
  setSavedView: (id: string) => void;
  viewMode: 'table' | 'cards';
  setViewMode: (mode: 'table' | 'cards') => void;
  globalSearch: string;
  setGlobalSearch: (value: string) => void;
  filters: BookingFilters;
  onFilterChange: (patch: Partial<BookingFilters>) => void;
  activeFilterCount: number;
  venueOptions: FilterOption[];
  hallOptions: FilterOption[];
  density: 'compact' | 'comfortable';
  setDensity: React.Dispatch<React.SetStateAction<'compact' | 'comfortable'>>;
  clearSearch: () => void;
  sort: SortState;
  setSort: React.Dispatch<React.SetStateAction<SortState>>;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  totalBookingsCount: number;
  viewBookings: Booking[];
  openEditBooking: (bookingId: string) => void;
  stableOnEdit: (id: string) => void;
  stableOnDelete: (id: string) => void;
  handleDeleteBooking: (bookingId: string) => void;
  handleDownloadBookingPdf: (booking: Booking) => void;
  setMenuPdfBooking: (booking: Booking | null) => void;
  setShowCreateForm: (open: boolean) => void;
  setShowFilters: (open: boolean) => void;
}

/**
 * Saved-view bar, search/filter controls, and the bookings table / card list
 * with pagination. JSX moved verbatim from page.tsx; state stays in the page.
 */
export default function BookingsListSection({
  canViewBooking,
  canAddBooking,
  canEditBooking,
  canDeleteBooking,
  canExportMenuPdf,
  loading,
  bookingPdfLoading,
  savedView,
  setSavedView,
  viewMode,
  setViewMode,
  globalSearch,
  setGlobalSearch,
  filters,
  onFilterChange,
  activeFilterCount,
  venueOptions,
  hallOptions,
  density,
  setDensity,
  clearSearch,
  sort,
  setSort,
  currentPage,
  setCurrentPage,
  totalPages,
  totalBookingsCount,
  viewBookings,
  openEditBooking,
  stableOnEdit,
  stableOnDelete,
  handleDeleteBooking,
  handleDownloadBookingPdf,
  setMenuPdfBooking,
  setShowCreateForm,
  setShowFilters,
}: BookingsListSectionProps) {
  return (
    <>
      {canViewBooking && (
        <div className="ops-view-bar">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-4)] flex-shrink-0">
            Views
          </span>
          {BOOKING_SAVED_VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setSavedView(v.id)}
              className={`flex-shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                savedView === v.id
                  ? 'border-teal-600 bg-teal-600 text-white'
                  : 'border-[var(--border-2)] bg-[var(--surface)] text-[var(--text-3)] hover:text-[var(--text-1)]'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}

      <div className="card ops-list-controls">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="relative" style={{ flex: 1 }}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-4)]" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search bookings…"
              className="input pl-10 pr-10"
            />
            {globalSearch && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={clearSearch}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-4)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 2,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
          <button type="button" className="btn btn-secondary flex items-center justify-center h-[42px] px-3 md:px-4" onClick={() => setShowFilters(true)}>
            <Filter className="w-5 h-5 md:mr-2" />
            <span className="hidden md:inline">Filters</span>
            {activeFilterCount > 0 && (
               <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-[11px] font-bold text-primary-700">
                 {activeFilterCount}
               </span>
            )}
          </button>
          {/* Density toggle — desktop table only */}
          {viewMode === 'table' && (
            <button
              type="button"
              onClick={() => setDensity((d) => (d === 'compact' ? 'comfortable' : 'compact'))}
              aria-pressed={density === 'compact'}
              title={density === 'compact' ? 'Compact rows' : 'Comfortable rows'}
              className="hidden md:inline-flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-[10px] border border-[var(--border)] text-[var(--text-3)] hover:text-[var(--text-1)]"
            >
              {density === 'compact' ? <Rows3 className="w-4 h-4" /> : <Rows4 className="w-4 h-4" />}
            </button>
          )}
          {/* View toggle — hidden on mobile where we always use cards */}
          <div
            aria-label="Toggle view"
            role="group"
            className="hidden md:flex"
            style={{
              border: '1px solid var(--border)',
              borderRadius: 10,
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {(['cards', 'table'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                aria-pressed={viewMode === mode}
                title={mode === 'cards' ? 'Card view' : 'Table view'}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  background: viewMode === mode ? 'var(--teal-600)' : 'transparent',
                  color: viewMode === mode ? 'white' : 'var(--text-3)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 700,
                  transition: 'all 0.15s',
                }}
              >
                {mode === 'cards' ? '⊞ Cards' : '≡ Table'}
              </button>
            ))}
          </div>
        </div>
        {/* Mobile date-range quick filter (the full set lives in the Filters panel) */}
        <div className="mt-3 grid grid-cols-2 gap-2 md:hidden">
          <label className="label col-span-2 mb-0">Function date</label>
          <input
            type="date"
            aria-label="From date"
            className="input"
            value={filters.dateFrom}
            onChange={(e) => onFilterChange({ dateFrom: e.target.value })}
          />
          <input
            type="date"
            aria-label="To date"
            className="input"
            value={filters.dateTo}
            onChange={(e) => onFilterChange({ dateTo: e.target.value })}
          />
        </div>
      </div>

      <div className="ops-table-card">
        {!canViewBooking ? (
          <div className="empty-state" style={{ padding: '32px 16px' }}>
            <div className="empty-state-icon">
              <CalendarCheck size={22} />
            </div>
            <p className="empty-state-title">No data available</p>
            <p className="empty-state-desc">You do not have access to view bookings.</p>
          </div>
        ) : loading ? (
          <div className="py-6">
            <BookingsTableSkeleton
              rows={8}
              showActions={canExportMenuPdf || canEditBooking || canDeleteBooking}
            />
          </div>
        ) : totalBookingsCount === 0 ? (
          <EmptyState
            icon={globalSearch ? Search : CalendarCheck}
            variant={
              globalSearch
                ? 'search'
                : activeFilterCount > 0
                  ? 'filter'
                  : 'page'
            }
            title={
              globalSearch
                ? 'No bookings match your search'
                : activeFilterCount > 0
                  ? 'No matches'
                  : 'No bookings found'
            }
            description={
              globalSearch
                ? `"${globalSearch}" returned no results.`
                : activeFilterCount > 0
                  ? 'No bookings match the active filters.'
                  : 'Create a booking to start tracking events.'
            }
            action={
              globalSearch
                ? { label: 'Clear search', onClick: () => setGlobalSearch('') }
                : activeFilterCount > 0
                  ? { label: 'Clear filters', onClick: clearSearch }
                  : canAddBooking
                    ? { label: 'New Booking', onClick: () => setShowCreateForm(true) }
                    : undefined
            }
          />
        ) : viewBookings.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px 16px' }}>
            <p className="empty-state-title">No bookings match this view</p>
            <p className="empty-state-desc">Try a different saved view or clear it to see all bookings.</p>
            {savedView !== 'all' && (
              <button type="button" className="btn btn-secondary mt-2" onClick={() => setSavedView('all')}>
                Clear view
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile card view — always shown on small screens */}
            <div className="md:hidden">
              <div className="mobile-card-list">
                    {viewBookings.map((booking) => (
                      <MobileBookingCard
                        key={booking.id}
                        booking={booking}
                        canExportMenuPdf={canExportMenuPdf && (booking._count?.packs ?? 1) > 0}
                        canEditBooking={canEditBooking}
                        canDeleteBooking={canDeleteBooking}
                        onExportPdf={setMenuPdfBooking}
                        onExportBookingPdf={handleDownloadBookingPdf}
                        bookingPdfLoading={bookingPdfLoading}
                        onEdit={stableOnEdit}
                        onDelete={stableOnDelete}
                      />
                    ))}
                  </div>
                  <TablePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalBookingsCount}
                    pageSize={BOOKINGS_PAGE_SIZE}
                    itemLabel="bookings"
                    onPageChange={setCurrentPage}
                  />
            </div>

            {/* Desktop card grid view */}
            {viewMode === 'cards' && (
              <div className="hidden md:block">
                <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: 16,
                        padding: '4px 0',
                      }}
                    >
                      {viewBookings.map((booking) => (
                        <BookingCard
                          key={booking.id}
                          booking={booking}
                          canExportMenuPdf={canExportMenuPdf && (booking._count?.packs ?? 1) > 0}
                          canEditBooking={canEditBooking}
                          canDeleteBooking={canDeleteBooking}
                          onExportPdf={setMenuPdfBooking}
                          onExportBookingPdf={handleDownloadBookingPdf}
                          bookingPdfLoading={bookingPdfLoading}
                          onEdit={stableOnEdit}
                          onDelete={stableOnDelete}
                        />
                      ))}
                    </div>
                    <TablePagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={totalBookingsCount}
                      pageSize={BOOKINGS_PAGE_SIZE}
                      itemLabel="bookings"
                      onPageChange={setCurrentPage}
                    />
              </div>
            )}

            {/* Desktop table view */}
            <div className={viewMode === 'table' ? 'hidden md:block table-shell' : 'hidden'}>
              <table className={cn('data-table', density === 'compact' && 'is-compact')}>
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="py-3 px-4 text-sm font-semibold text-[var(--text-2)]">Booking</th>
                    <SortableHeader
                      label="Function / Customer"
                      sortKey="functionName"
                      sort={sort}
                      onSort={(key) => setSort((prev) => getNextSort(prev, key))}
                    />
                    <SortableHeader
                      label="Date"
                      sortKey="functionDate"
                      sort={sort}
                      onSort={(key) => setSort((prev) => getNextSort(prev, key))}
                      filter={
                        <ColumnFilter active={Boolean(filters.dateFrom || filters.dateTo)} title="Date">
                          <DateRangeFilter
                            from={filters.dateFrom}
                            to={filters.dateTo}
                            onChange={({ from, to }) => onFilterChange({ dateFrom: from, dateTo: to })}
                          />
                        </ColumnFilter>
                      }
                    />
                    <th className="py-3 px-4 text-sm font-semibold text-[var(--text-2)]">
                      <span className="inline-flex items-center gap-1">
                        Hall
                        <ColumnFilter
                          active={filters.banquetIds.length > 0 || filters.hallIds.length > 0}
                          title="Venue & hall"
                        >
                          <div className="flex flex-col gap-3">
                            <div>
                              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-4)]">
                                Venue
                              </div>
                              <MultiSelectFilter
                                options={venueOptions}
                                selected={filters.banquetIds}
                                onChange={(banquetIds) => onFilterChange({ banquetIds })}
                                searchable
                                emptyLabel="No venues"
                              />
                            </div>
                            <div>
                              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-4)]">
                                Hall
                              </div>
                              <MultiSelectFilter
                                options={hallOptions}
                                selected={filters.hallIds}
                                onChange={(hallIds) => onFilterChange({ hallIds })}
                                searchable
                                emptyLabel="No halls"
                              />
                            </div>
                          </div>
                        </ColumnFilter>
                      </span>
                    </th>
                    <SortableHeader
                      label="Guests"
                      sortKey="expectedGuests"
                      sort={sort}
                      onSort={(key) => setSort((prev) => getNextSort(prev, key))}
                      className="text-right py-3 px-4 text-sm font-semibold text-[var(--text-2)]"
                      filter={
                        <ColumnFilter
                          active={Boolean(filters.guestsMin || filters.guestsMax)}
                          title="Guests"
                          align="end"
                        >
                          <NumberRangeFilter
                            min={filters.guestsMin}
                            max={filters.guestsMax}
                            onChange={({ min, max }) => onFilterChange({ guestsMin: min, guestsMax: max })}
                          />
                        </ColumnFilter>
                      }
                    />
                    <SortableHeader
                      label="Grand total"
                      sortKey="grandTotal"
                      sort={sort}
                      onSort={(key) => setSort((prev) => getNextSort(prev, key))}
                      className="text-right py-3 px-4 text-sm font-semibold text-[var(--text-2)]"
                      filter={
                        <ColumnFilter
                          active={Boolean(filters.amountMin || filters.amountMax)}
                          title="Amount (₹)"
                          align="end"
                        >
                          <NumberRangeFilter
                            min={filters.amountMin}
                            max={filters.amountMax}
                            onChange={({ min, max }) => onFilterChange({ amountMin: min, amountMax: max })}
                          />
                        </ColumnFilter>
                      }
                    />
                    <th aria-label="Due" className="text-right py-3 px-4 text-sm font-semibold text-[var(--text-2)]">
                      <span className="inline-flex items-center gap-1">
                        Due
                        <ColumnFilter active={Boolean(filters.due)} title="Balance" align="end">
                          <ChoiceFilter
                            name="due-header"
                            value={filters.due}
                            options={DUE_FILTER_OPTIONS}
                            onChange={(due) => onFilterChange({ due: due as BookingFilters['due'] })}
                          />
                        </ColumnFilter>
                      </span>
                    </th>
                    <SortableHeader
                      label="Status"
                      sortKey="status"
                      sort={sort}
                      onSort={(key) => setSort((prev) => getNextSort(prev, key))}
                      filter={
                        <ColumnFilter active={filters.status.length > 0} title="Status">
                          <MultiSelectFilter
                            options={STATUS_FILTER_OPTIONS}
                            selected={filters.status}
                            onChange={(status) => onFilterChange({ status })}
                          />
                        </ColumnFilter>
                      }
                    />
                    {(canExportMenuPdf || canEditBooking || canDeleteBooking) && (
                      <th className="ops-secondary-actions text-right py-3 px-4 text-sm font-semibold text-[var(--text-2)]">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {viewBookings.map((booking) => {
                    const rowStatus = booking.isQuotation ? 'quotation' : booking.status;
                    const expDays = booking.status === 'pencil' ? pencilExpiryDays(booking.pencilExpiresAt) : null;
                    const balanceDue = resolveDueAmount(booking);
                    return (
                      <tr
                        key={booking.id}
                        className={`ops-click-row cv-auto-row border-b border-[var(--border)] hover:bg-[var(--surface-2)] ${getRowStatusClass(rowStatus)}`}
                        onClick={() => openEditBooking(booking.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            openEditBooking(booking.id);
                          }
                        }}
                        tabIndex={0}
                      >
                      <td className="py-4 px-4 id whitespace-nowrap">
                        {booking.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="py-4 px-4 main">
                        <p className="font-medium text-[var(--text-1)]">{booking.functionName}</p>
                        <p className="text-xs text-[var(--text-4)] mt-1">{booking.customer?.name}</p>
                      </td>
                      <td className="py-4 px-4 text-sm text-[var(--text-2)] whitespace-nowrap">
                        {formatDateCompact(booking.functionDate)}
                        {expDays != null && (
                          <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                            exp {expDays}d
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-sm text-[var(--text-2)]">
                        {(booking.halls || []).length > 0
                          ? (booking.halls || []).map((h) => h.hall ? [h.hall.banquet?.name, h.hall.name].filter(Boolean).join(' / ') : null).filter(Boolean).join(', ')
                          : <span className="text-[var(--text-4)]">—</span>}
                      </td>
                      <td className="py-4 px-4 text-right text-sm text-[var(--text-2)] num">
                        {booking.expectedGuests}
                      </td>
                      <td className="py-4 px-4 text-right text-sm font-medium text-[var(--text-1)] num" title={`₹${(booking.grandTotal || 0).toLocaleString('en-IN')}`}>
                        {formatInrCompact(booking.grandTotal || 0)}
                      </td>
                      <td
                        className={`py-4 px-4 text-right text-sm font-medium num ${balanceDue > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}
                        title={`₹${balanceDue.toLocaleString('en-IN')}`}
                      >
                        {balanceDue > 0 ? formatInrCompact(balanceDue) : 'Paid'}
                      </td>
                      <td className="py-4 px-4">
                        <StatusBadge status={rowStatus} />
                      </td>
                      {(canExportMenuPdf || canEditBooking || canDeleteBooking) && (
                        <td className="ops-secondary-actions py-4 px-4 text-right" onClick={(event) => event.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            {canExportMenuPdf && (
                              <button
                                type="button"
                                className="p-2 text-[var(--text-4)] hover:text-teal-700 dark:text-teal-200 hover:bg-teal-50 dark:bg-teal-500/10 rounded-lg disabled:opacity-50"
                                onClick={() => handleDownloadBookingPdf(booking)}
                                title="Download booking details PDF"
                                disabled={bookingPdfLoading === booking.id}
                              >
                                {bookingPdfLoading === booking.id
                                  ? <span className="w-4 h-4 block border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                                  : <Download className="w-4 h-4" />}
                              </button>
                            )}
                            {canExportMenuPdf && (booking._count?.packs ?? 1) > 0 && (
                              <button
                                type="button"
                                className="p-2 text-[var(--text-4)] hover:text-emerald-700 hover:bg-emerald-50 rounded-lg"
                                onClick={() => setMenuPdfBooking(booking)}
                                title="Preview menu PDF"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                            )}
                            {canEditBooking && (
                              <button
                                type="button"
                                className="p-2 text-[var(--text-4)] hover:text-blue-700 dark:text-blue-200 hover:bg-blue-50 dark:bg-blue-500/10 rounded-lg"
                                onClick={() => openEditBooking(booking.id)}
                                title="Edit booking"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            {canDeleteBooking && (
                              <button
                                type="button"
                                className="p-2 text-[var(--text-4)] hover:text-red-700 dark:text-red-200 hover:bg-red-50 dark:bg-red-500/10 rounded-lg"
                                onClick={() => handleDeleteBooking(booking.id)}
                                title="Delete booking"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalBookingsCount}
                pageSize={BOOKINGS_PAGE_SIZE}
                itemLabel="bookings"
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </div>
    </>
  );
}
