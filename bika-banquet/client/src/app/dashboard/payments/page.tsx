'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { CreditCard, Plus, Save, Search } from 'lucide-react';
import FormPromptModal from '@/components/FormPromptModal';
import SortableHeader from '@/components/SortableHeader';
import TablePagination from '@/components/TablePagination';
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

const initialPaymentForm = {
  bookingId: '',
  amount: '',
  method: 'cash',
  reference: '',
  narration: '',
  paymentDate: '',
};

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
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPaymentPrompt, setShowPaymentPrompt] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [columnSearch, setColumnSearch] = useState(initialColumnSearch);
  const [sort, setSort] = useState<SortState>({ key: 'booking', direction: 'asc' });
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
    void loadBookings();
  }, []);

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
        ...initialPaymentForm,
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
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-1">
            Record collections and track balance against each booking.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary inline-flex items-center gap-2 w-full sm:w-auto justify-center"
          onClick={() => setShowPaymentPrompt(true)}
          disabled={bookings.length === 0}
        >
          <Plus className="w-4 h-4" />
          Add Payment
        </button>
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
          <div className="flex items-center gap-2 text-gray-900">
            <CreditCard className="w-4 h-4 text-primary-600" />
            <h2 className="text-lg font-semibold">Payments table</h2>
          </div>
        </div>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            className="input pl-10"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Overall search across all payment columns..."
          />
        </div>

        {loading ? (
          <div className="py-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-sm text-gray-500 py-8 text-center">No bookings found.</div>
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
                      <span className="mobile-card-value">₹{(booking.grandTotal || 0).toLocaleString()}</span>
                    </div>
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">Received</span>
                      <span className="mobile-card-value" style={{ color: '#15803d' }}>₹{(booking.advanceReceived || 0).toLocaleString()}</span>
                    </div>
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">Balance</span>
                      <span className="mobile-card-amount">₹{(booking.balanceAmount || 0).toLocaleString()}</span>
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
                  <tr className="border-b border-gray-200">
                    <SortableHeader
                      label="Booking"
                      sortKey="booking"
                      sort={sort}
                      onSort={(key) => setSort((prev) => getNextSort(prev, key))}
                      className="text-left py-3 px-3 text-sm font-semibold text-gray-700"
                    />
                    <SortableHeader
                      label="Event date"
                      sortKey="eventDate"
                      sort={sort}
                      onSort={(key) => setSort((prev) => getNextSort(prev, key))}
                      className="text-left py-3 px-3 text-sm font-semibold text-gray-700"
                    />
                    <SortableHeader
                      label="Total"
                      sortKey="total"
                      sort={sort}
                      onSort={(key) => setSort((prev) => getNextSort(prev, key))}
                      className="text-right py-3 px-3 text-sm font-semibold text-gray-700"
                    />
                    <SortableHeader
                      label="Received"
                      sortKey="received"
                      sort={sort}
                      onSort={(key) => setSort((prev) => getNextSort(prev, key))}
                      className="text-right py-3 px-3 text-sm font-semibold text-gray-700"
                    />
                    <SortableHeader
                      label="Balance"
                      sortKey="balance"
                      sort={sort}
                      onSort={(key) => setSort((prev) => getNextSort(prev, key))}
                      className="text-right py-3 px-3 text-sm font-semibold text-gray-700"
                    />
                    <SortableHeader
                      label="Entries"
                      sortKey="entries"
                      sort={sort}
                      onSort={(key) => setSort((prev) => getNextSort(prev, key))}
                      className="text-right py-3 px-3 text-sm font-semibold text-gray-700"
                    />
                  </tr>
                  <tr className="table-search-row border-b border-gray-100 bg-gray-50">
                    <th className="py-2 px-3">
                      <input
                        className="input h-9"
                        placeholder="Search booking"
                        value={columnSearch.booking}
                        onChange={(e) =>
                          setColumnSearch((prev) => ({ ...prev, booking: e.target.value }))
                        }
                      />
                    </th>
                    <th className="py-2 px-3">
                      <input
                        type="date"
                        className="input h-9"
                        placeholder="Search date"
                        value={columnSearch.eventDate}
                        onChange={(e) =>
                          setColumnSearch((prev) => ({ ...prev, eventDate: e.target.value }))
                        }
                      />
                    </th>
                    <th className="py-2 px-3">
                      <input
                        className="input h-9 text-right"
                        placeholder="Search total"
                        value={columnSearch.total}
                        onChange={(e) =>
                          setColumnSearch((prev) => ({ ...prev, total: e.target.value }))
                        }
                      />
                    </th>
                    <th className="py-2 px-3">
                      <input
                        className="input h-9 text-right"
                        placeholder="Search received"
                        value={columnSearch.received}
                        onChange={(e) =>
                          setColumnSearch((prev) => ({ ...prev, received: e.target.value }))
                        }
                      />
                    </th>
                    <th className="py-2 px-3">
                      <input
                        className="input h-9 text-right"
                        placeholder="Search balance"
                        value={columnSearch.balance}
                        onChange={(e) =>
                          setColumnSearch((prev) => ({ ...prev, balance: e.target.value }))
                        }
                      />
                    </th>
                    <th className="py-2 px-3">
                      <input
                        className="input h-9 text-right"
                        placeholder="Search entries"
                        value={columnSearch.entries}
                        onChange={(e) =>
                          setColumnSearch((prev) => ({ ...prev, entries: e.target.value }))
                        }
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-gray-100">
                      <td className="py-3 px-3">
                        <p className="text-sm text-gray-900">{booking.functionName}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {booking.customer?.name} • {booking.customer?.phone}
                        </p>
                      </td>
                      <td className="py-3 px-3 text-sm text-gray-700">
                        {formatDateDDMMYYYY(booking.functionDate)}
                      </td>
                      <td className="py-3 px-3 text-right text-sm text-gray-700">
                        INR {(booking.grandTotal || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right text-sm text-gray-700">
                        INR {(booking.advanceReceived || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right text-sm font-medium text-gray-900">
                        INR {(booking.balanceAmount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right text-sm text-gray-700">
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
    </div>
  );
}
