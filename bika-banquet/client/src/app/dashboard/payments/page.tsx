'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { CreditCard, Plus, Save, Search, Filter } from 'lucide-react';
import FormPromptModal from '@/components/FormPromptModal';
import FilterPanel from '@/components/FilterPanel';
import EmptyState from '@/components/EmptyState';
import SortableHeader from '@/components/SortableHeader';
import { useAuthStore } from '@/store/authStore';
import { hasAnyPermission } from '@/lib/permissions';
import TablePagination from '@/components/TablePagination';
import { TableSkeleton } from '@/components/Skeletons';
import {
  SortState,
  TableColumnConfig,
  filterAndSortRows,
  getNextSort,
} from '@/lib/tableUtils';
import { formatDateDDMMYYYY } from '@/lib/date';

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
  advanceReceived?: number;
  balanceAmount?: number;
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

  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPaymentPrompt, setShowPaymentPrompt] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [columnSearch, setColumnSearch] = useState(initialColumnSearch);
  const [sort, setSort] = useState<SortState>({ key: 'booking', direction: 'asc' });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [paymentForm, setPaymentForm] = useState(initialPaymentForm);

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
      { key: 'received', accessor: (booking) => booking.advanceReceived ?? 0 },
      { key: 'balance', accessor: (booking) => booking.balanceAmount ?? 0 },
      { key: 'entries', accessor: (booking) => booking._count?.payments ?? 0 },
    ],
    []
  );

  const filteredBookings = useMemo(
    () => filterAndSortRows(bookings, tableColumns, globalSearch, columnSearch, sort),
    [bookings, tableColumns, globalSearch, columnSearch, sort]
  );

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredBookings.length / PAYMENTS_PAGE_SIZE)),
    [filteredBookings.length]
  );

  const paginatedBookings = useMemo(() => {
    const safePage = Math.min(Math.max(currentPage, 1), totalPages);
    const startIndex = (safePage - 1) * PAYMENTS_PAGE_SIZE;
    return filteredBookings.slice(startIndex, startIndex + PAYMENTS_PAGE_SIZE);
  }, [currentPage, filteredBookings, totalPages]);

  useEffect(() => {
    if (!canViewPayments) {
      setLoading(false);
      return;
    }
    void loadBookings();
  }, [canViewPayments]);

  useEffect(() => {
    setCurrentPage(1);
  }, [globalSearch, columnSearch, sort]);

  useEffect(() => {
    if (currentPage <= totalPages) return;
    setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await api.getBookings({
        page: 1,
        limit: 5000,
      });
      const rows = response.data?.data?.bookings || [];
      setBookings(rows);
      if (rows.length > 0) {
        setPaymentForm((prev) => ({ ...prev, bookingId: prev.bookingId || rows[0].id }));
      }
    } catch (error) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const submitPayment = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!paymentForm.bookingId || !paymentForm.amount) {
      toast.error('Booking and amount are required');
      return;
    }
    try {
      setSaving(true);
      await api.addPayment(paymentForm.bookingId, {
        amount: Number(paymentForm.amount),
        method: paymentForm.method,
        reference: paymentForm.reference.trim() || undefined,
        narration: paymentForm.narration.trim() || undefined,
        paymentDate: paymentForm.paymentDate || undefined,
      });
      toast.success('Payment added');
      setShowPaymentPrompt(false);
      setPaymentForm((prev) => ({
        ...getInitialPaymentForm(),
        bookingId: prev.bookingId,
        method: prev.method,
      }));
      await loadBookings();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to add payment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-head gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-1)]">Payments</h1>
          <p className="text-[var(--text-2)] mt-1">
            Record collections and track balance against each booking.
          </p>
        </div>
        {canAddPayment && (
          <button
            type="button"
            className="btn btn-primary inline-flex items-center gap-2 w-full sm:w-auto justify-center"
            onClick={() => setShowPaymentPrompt(true)}
            disabled={bookings.length === 0}
          >
            <Plus className="w-4 h-4" />
            Add Payment
          </button>
        )}
      </div>

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
            <TableSkeleton rows={8} />
          </div>
        ) : filteredBookings.length === 0 ? (
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
                      <span className="mobile-card-value" style={{ color: '#15803d' }}>₹{(booking.advanceReceived || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">Balance</span>
                      <span className="mobile-card-amount">₹{(booking.balanceAmount || 0).toLocaleString('en-IN')}</span>
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
                totalItems={filteredBookings.length}
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
                    <tr key={booking.id} className="border-b border-[var(--border)]">
                      <td className="py-3 px-3">
                        <p className="text-sm text-[var(--text-1)]">{booking.functionName}</p>
                        <p className="text-xs text-[var(--text-4)] mt-1">
                          {booking.customer?.name} • {booking.customer?.phone}
                        </p>
                      </td>
                      <td className="py-3 px-3 text-sm text-[var(--text-2)]">
                        {formatDateDDMMYYYY(booking.functionDate)}
                      </td>
                      <td className="py-3 px-3 text-right text-sm text-[var(--text-2)]">
                        INR {(booking.grandTotal || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right text-sm text-[var(--text-2)]">
                        INR {(booking.advanceReceived || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right text-sm font-medium text-[var(--text-1)]">
                        INR {(booking.balanceAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right text-sm text-[var(--text-2)]">
                        {booking._count?.payments || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredBookings.length}
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
