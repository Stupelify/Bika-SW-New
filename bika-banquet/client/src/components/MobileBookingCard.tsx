'use client';

import { CalendarDays, Edit, FileText, Trash2, Users } from 'lucide-react';
import { formatDateDDMMYYYY } from '@/lib/date';

interface Booking {
    id: string;
    functionName: string;
    functionType: string;
    functionDate: string;
    expectedGuests: number;
    status: string;
    isQuotation: boolean;
    grandTotal: number;
    customer: {
        name: string;
        phone: string;
    };
}

interface MobileBookingCardProps {
    booking: Booking;
    canExportMenuPdf: boolean;
    canEditBooking: boolean;
    canDeleteBooking: boolean;
    onExportPdf?: (booking: Booking) => void;
    onEdit?: (bookingId: string) => void;
    onDelete?: (bookingId: string) => void;
}

export default function MobileBookingCard({
    booking,
    canExportMenuPdf,
    canEditBooking,
    canDeleteBooking,
    onExportPdf,
    onEdit,
    onDelete,
}: MobileBookingCardProps) {
    const statusClass = booking.isQuotation
        ? 'status-quotation'
        : booking.status === 'cancelled'
            ? 'status-cancelled'
            : booking.status === 'pending'
                ? 'status-pending'
                : 'status-confirmed';

    const statusLabel = booking.isQuotation ? 'Quotation' : booking.status;
    const hasActions = canExportMenuPdf || canEditBooking || canDeleteBooking;

    return (
        <div className="mobile-card">
            <div className="mobile-card-header">
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="mobile-card-title">{booking.functionName}</div>
                    <div className="mobile-card-subtitle">{booking.functionType}</div>
                </div>
                <span className={`status-pill ${statusClass}`}>
                    <span className="status-dot" />
                    {statusLabel}
                </span>
            </div>

            <div className="mobile-card-row">
                <span className="mobile-card-label">Customer</span>
                <span className="mobile-card-value">
                    {booking.customer?.name || '—'}
                </span>
            </div>
            {booking.customer?.phone && (
                <div className="mobile-card-row">
                    <span className="mobile-card-label">Phone</span>
                    <span className="mobile-card-value">{booking.customer.phone}</span>
                </div>
            )}

            <div className="mobile-card-meta" style={{ marginTop: 8, marginBottom: 4 }}>
                <span className="mobile-card-meta-item">
                    <CalendarDays style={{ width: 14, height: 14 }} aria-hidden="true" />
                    {formatDateDDMMYYYY(booking.functionDate)}
                </span>
                <span className="mobile-card-meta-item">
                    <Users style={{ width: 14, height: 14 }} aria-hidden="true" />
                    {booking.expectedGuests} guests
                </span>
            </div>

            <div className="mobile-card-row" style={{ marginTop: 6 }}>
                <span className="mobile-card-label">Amount</span>
                <span className="mobile-card-amount">
                    ₹{(booking.grandTotal || 0).toLocaleString('en-IN')}
                </span>
            </div>

            {hasActions && (
                <div className="mobile-card-actions">
                    {canExportMenuPdf && onExportPdf && (
                        <button
                            type="button"
                            className="mobile-card-action-btn"
                            onClick={() => onExportPdf(booking)}
                            title="Menu PDF"
                        >
                            <FileText style={{ width: 14, height: 14 }} aria-hidden="true" />
                            PDF
                        </button>
                    )}
                    {canEditBooking && onEdit && (
                        <button
                            type="button"
                            className="mobile-card-action-btn"
                            onClick={() => onEdit(booking.id)}
                            title="Edit booking"
                        >
                            <Edit style={{ width: 14, height: 14 }} aria-hidden="true" />
                            Edit
                        </button>
                    )}
                    {canDeleteBooking && onDelete && (
                        <button
                            type="button"
                            className="mobile-card-action-btn"
                            onClick={() => onDelete(booking.id)}
                            title="Delete booking"
                            style={{ color: '#dc2626' }}
                        >
                            <Trash2 style={{ width: 14, height: 14 }} aria-hidden="true" />
                            Delete
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
