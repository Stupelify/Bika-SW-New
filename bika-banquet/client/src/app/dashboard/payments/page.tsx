'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useSSE } from '@/hooks/useSSE';
import { toast } from 'sonner';
import { CreditCard, Plus, Save, Search } from 'lucide-react';
import FormPromptModal from '@/components/FormPromptModal';
import EmptyState from '@/components/EmptyState';
import SortableHeader from '@/components/SortableHeader';
import { useAuthStore } from '@/store/authStore';
import { hasAnyPermission } from '@/lib/permissions';
import { TableSkeleton } from '@/components/Skeletons';
import DataTableToolbar, { DataTableFooter } from '@/components/data-table/DataTableToolbar';
import { useTableState } from '@/hooks/useTableState';
import { applyTableState, paginateRows } from '@/lib/data-table/apply';
import type { TableColumnConfig } from '@/lib/tableUtils';
import type { FilterSchema } from '@/lib/data-table/types';
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
  const [paymentForm, setPaymentForm] = useState(initialPaymentForm);

  const tableColumns = useMemo<TableColumnConfig<BookingRow>[]>(
    () => [
      {
        key: 'booking',
        accessor: (booking) =>
          `${booking.functionName} ${booking.customer?.name ?? ''} ${booking.customer?.phone ?? ''}`,
        sortable: true,
        searchable: true,
      },
      { key: 'eventDate', accessor: (b) => b.functionDate, sortable: true, searchable: false },
      { key: 'total', accessor: (b) => b.grandTotal ?? 0, sortable: true, searchable: false },
      { key: 'received', accessor: (b) => b.advanceReceived ?? 0, sortable: true, searchable: false },
      { key: 'balance', accessor: (b) => b.balanceAmount ?? 0, sortable: true, searchable: false },
      { key: 'entries', accessor: (b) => b._count?.payments ?? 0, sortable: true, searchable: false },
    ],
    []
  );

  const filterSchemas = useMemo<FilterSchema[]>(
    () => [
      { id: 'eventDate', type: 'dateRange', label: 'Event date' },
      { id: 'total', type: 'numberRange', label: 'Total', format: 'currency' },
      { id: 'balance', type: 'numberRange', label: 'Balance', format: 'currency' },
      {
        id: 'paidStatus',
        type: 'multiSelect',
        label: 'Paid status',
        options: [
          { value: 'fully_paid', label: 'Fully paid' },
          { value: 'partially_paid', label: 'Partially paid' },
          { value: 'unpaid', label: 'Unpaid' },
        ],
      },
    ],
    []
  );

  const filterDefs = useMemo(
    () => [
      { id: 'eventDate', accessor: (b: BookingRow) => b.functionDate },
      { id: 'total', accessor: (b: BookingRow) => b.grandTotal ?? 0 },
      { id: 'balance', accessor: (b: BookingRow) => b.balanceAmount ?? 0 },
      {
        id: 'paidStatus',
        accessor: (b: BookingRow) => {
          const total = b.grandTotal ?? 0;
          const balance = b.balanceAmount ?? 0;
          const received = b.advanceReceived ?? 0;
          if (received <= 0 && total > 0) return 'unpaid';
          if (balance <= 0 && total > 0) return 'fully_paid';
          return 'partially_paid';
        },
      },
    ],
    []
  );

  const tableState = useTableState({
    prefix: 'payments',
    filters: filterSchemas,
    defaultSort: { key: 'booking', direction: 'asc' },
  });

  const filteredBookings = useMemo(
    () => applyTableState(bookings, tableColumns, filterDefs, tableState),
    [bookings, tableColumns, filterDefs, tableState]
  );

  const paginatedBookings = useMemo(
    () => paginateRows(filteredBookings, tableState.page, tableState.pageSize),
    [filteredBookings, tableState.page, tableState.pageSize]
  );

  const loadBookings = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (!canViewPayments) {
      setLoading(false);
      return;
    }
    void loadBookings();
  }, [canViewPayments, loadBookings]);

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
        <div className="mb-4">
          <DataTableToolbar
            state={tableState}
            searchPlaceholder="Search by function, customer name, or phone…"
          />
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
            icon={tableState.search ? Search : CreditCard}
            variant={
              tableState.search ? 'search' : tableState.activeFilterCount > 0 ? 'filter' : 'page'
            }
            title={
              tableState.search
                ? 'No payments match your search'
                : tableState.activeFilterCount > 0
                  ? 'No matches'
                  : 'No bookings found'
            }
            description={
              tableState.search || tableState.activeFilterCount > 0
                ? 'Try adjusting the search or active filters.'
                : 'Bookings will appear here once created.'
            }
            action={
              tableState.search || tableState.activeFilterCount > 0
                ? { label: 'Clear all', onClick: tableState.clearAll }
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
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block table-shell">
              <table className="data-table">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <SortableHeader label="Booking" sortKey="booking" sort={tableState.sort} onSort={tableState.toggleSort} className="text-left py-3 px-3 text-sm font-semibold text-[var(--text-2)]" />
                    <SortableHeader label="Event date" sortKey="eventDate" sort={tableState.sort} onSort={tableState.toggleSort} className="text-left py-3 px-3 text-sm font-semibold text-[var(--text-2)]" />
                    <SortableHeader label="Total" sortKey="total" sort={tableState.sort} onSort={tableState.toggleSort} className="text-right py-3 px-3 text-sm font-semibold text-[var(--text-2)]" />
                    <SortableHeader label="Received" sortKey="received" sort={tableState.sort} onSort={tableState.toggleSort} className="text-right py-3 px-3 text-sm font-semibold text-[var(--text-2)]" />
                    <SortableHeader label="Balance" sortKey="balance" sort={tableState.sort} onSort={tableState.toggleSort} className="text-right py-3 px-3 text-sm font-semibold text-[var(--text-2)]" />
                    <SortableHeader label="Entries" sortKey="entries" sort={tableState.sort} onSort={tableState.toggleSort} className="text-right py-3 px-3 text-sm font-semibold text-[var(--text-2)]" />
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
            </div>
            <DataTableFooter
              state={tableState}
              totalItems={bookings.length}
              filteredCount={filteredBookings.length}
              itemLabel="bookings"
            />
          </>
        )}
      </div>
    </div>
  );
}
