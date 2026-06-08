'use client';

import Link from 'next/link';
import { CalendarCheck, IndianRupee, X } from 'lucide-react';
import { CalendarSkeleton } from '@/components/Skeletons';
import StatusBadge from '@/components/StatusBadge';
import { formatDateDDMMYYYY } from '@/lib/date';
import type { BookingDetail } from '../_lib/types';
import { bookingTimeLabel, resolveBookingStatus, toSafeNumber } from '../_lib/calendar-helpers';

interface BookingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  bookingDetails: BookingDetail | null;
  hallBanquetLines: string[];
  packs: NonNullable<BookingDetail['packs']>;
  payments: NonNullable<BookingDetail['payments']>;
  additionalItems: string[];
}

export default function BookingDrawer({
  isOpen,
  onClose,
  loading,
  bookingDetails,
  hallBanquetLines,
  packs,
  payments,
  additionalItems,
}: BookingDrawerProps) {
  if (!isOpen) return null;

  return (
    <div
      className="calendar-booking-drawer fixed inset-0 z-50 bg-black/45"
      onClick={onClose}
    >
      <div
        className="calendar-booking-drawer-panel h-full w-full max-w-3xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 sm:px-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--text-4)]">Booking Details</p>
            <h3 className="text-base sm:text-lg font-semibold text-[var(--text-1)]">
              {bookingDetails?.functionName || 'Loading...'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--border)] p-2 text-[var(--text-2)] hover:bg-[var(--surface-2)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="h-[calc(100%-69px)] overflow-y-auto px-4 py-4 sm:px-5">
          {loading ? (
            <div className="py-8">
              <CalendarSkeleton />
            </div>
          ) : !bookingDetails ? (
            <p className="text-sm text-[var(--text-4)]">Unable to load booking details.</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                  <p className="text-xs uppercase tracking-wide text-[var(--text-4)]">Function</p>
                  <p className="text-sm font-semibold text-[var(--text-1)] mt-1">
                    {bookingDetails.functionType || '-'}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                  <p className="text-xs uppercase tracking-wide text-[var(--text-4)]">Date</p>
                  <p className="text-sm font-semibold text-[var(--text-1)] mt-1">
                    {formatDateDDMMYYYY(bookingDetails.functionDate)}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                  <p className="text-xs uppercase tracking-wide text-[var(--text-4)]">Time</p>
                  <p className="text-sm font-semibold text-[var(--text-1)] mt-1">
                    {bookingTimeLabel(bookingDetails)}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                  <p className="text-xs uppercase tracking-wide text-[var(--text-4)]">Status</p>
                  <div className="mt-1">
                    <StatusBadge
                      status={resolveBookingStatus(bookingDetails)}
                      size="sm"
                    />
                  </div>
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                  <p className="text-xs uppercase tracking-wide text-[var(--text-4)]">Customer</p>
                  <p className="text-sm font-semibold text-[var(--text-1)] mt-1">
                    {bookingDetails.customer?.name || '-'}
                  </p>
                  <p className="text-xs text-[var(--text-2)] mt-0.5">
                    {bookingDetails.customer?.phone || '-'}
                  </p>
                  {bookingDetails.customer?.email && (
                    <p className="text-xs text-[var(--text-2)] mt-0.5">
                      {bookingDetails.customer.email}
                    </p>
                  )}
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                  <p className="text-xs uppercase tracking-wide text-[var(--text-4)]">Halls</p>
                  <div className="mt-1 space-y-1">
                    {hallBanquetLines.map((line) => (
                      <p key={line} className="text-sm font-semibold text-[var(--text-1)]">
                        {line}
                      </p>
                    ))}
                  </div>
                  <p className="text-xs text-[var(--text-2)] mt-0.5">
                    {toSafeNumber(bookingDetails.expectedGuests)} guests • ₹
                    {toSafeNumber(bookingDetails.grandTotal).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                <p className="text-sm font-semibold text-[var(--text-1)]">Menu/Pack Details</p>
                {packs.length === 0 ? (
                  <div className="empty-state" style={{ padding: '16px 12px' }}>
                    <div className="empty-state-icon">
                      <CalendarCheck size={18} />
                    </div>
                    <p className="empty-state-title">No packs added</p>
                    <p className="empty-state-desc">Pack details will appear here.</p>
                  </div>
                ) : (
                  <div className="mt-2 space-y-2">
                    {packs.map((pack) => (
                      <div key={pack.id} className="rounded-lg bg-[var(--surface-2)] px-2.5 py-2">
                        <p className="text-xs font-semibold text-[var(--text-1)]">
                          {pack.mealSlot?.name || pack.packName || 'Pack'}
                        </p>
                        <p className="text-[11px] text-[var(--text-2)] mt-0.5">
                          {bookingTimeLabel(pack)} •{' '}
                          {toSafeNumber(pack.packCount ?? pack.noOfPack)} pax
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                <p className="text-sm font-semibold text-[var(--text-1)]">Payments</p>
                {payments.length === 0 ? (
                  <div className="empty-state" style={{ padding: '16px 12px' }}>
                    <div className="empty-state-icon">
                      <IndianRupee size={18} />
                    </div>
                    <p className="empty-state-title">No payments recorded</p>
                    <p className="empty-state-desc">Payments will appear here once logged.</p>
                  </div>
                ) : (
                  <div className="mt-2 space-y-2">
                    {payments.map((payment) => (
                      <div key={payment.id} className="rounded-lg bg-[var(--surface-2)] px-2.5 py-2">
                        <p className="text-xs font-semibold text-[var(--text-1)]">
                          {payment.method || 'Payment'} • ₹
                          {toSafeNumber(payment.amount).toLocaleString('en-IN')}
                        </p>
                        <p className="text-[11px] text-[var(--text-2)] mt-0.5">
                          {payment.paymentDate
                            ? formatDateDDMMYYYY(payment.paymentDate)
                            : 'No date'}{' '}
                          • {payment.receiver?.name || 'Receiver not set'}
                        </p>
                        {payment.narration && (
                          <p className="text-[11px] text-[var(--text-2)] mt-0.5">
                            {payment.narration}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {(additionalItems.length > 0 || bookingDetails.notes) && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 space-y-2">
                  {additionalItems.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-1)]">
                        Additional Requirements
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {additionalItems.map((item, index) => (
                          <span
                            key={`${item}-${index}`}
                            className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] text-sky-800"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {bookingDetails.notes && (
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-1)]">Notes</p>
                      <p className="text-xs text-[var(--text-2)] mt-1">{bookingDetails.notes}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end">
                <Link
                  href={
                    bookingDetails?.id
                      ? `/dashboard/bookings?section=edit&id=${bookingDetails.id}`
                      : '/dashboard/bookings'
                  }
                  className="btn btn-secondary"
                >
                  Open Booking Module
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
