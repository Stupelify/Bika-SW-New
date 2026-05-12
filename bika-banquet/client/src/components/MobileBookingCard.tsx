'use client';

import { Building2, CalendarDays, Download, Edit, FileText, Trash2, Users } from 'lucide-react';
import { formatDateDDMMYYYY } from '@/lib/date';
import StatusBadge from '@/components/StatusBadge';

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
    halls?: Array<{
        hall?: { id: string; name: string } | null;
    }>;
}

interface MobileBookingCardProps {
    booking: Booking;
    canExportMenuPdf: boolean;
    canEditBooking: boolean;
    canDeleteBooking: boolean;
    onExportPdf?: (booking: Booking) => void;
    onExportBookingPdf?: (booking: Booking) => void;
    bookingPdfLoading?: string | null;
    onEdit?: (bookingId: string) => void;
    onDelete?: (bookingId: string) => void;
}

export default function MobileBookingCard({
    booking,
    canExportMenuPdf,
    canEditBooking,
    canDeleteBooking,
    onExportPdf,
    onExportBookingPdf,
    bookingPdfLoading,
    onEdit,
    onDelete,
}: MobileBookingCardProps) {
    const hasActions = canExportMenuPdf || canEditBooking || canDeleteBooking;

    return (
        <div className="mobile-card">
            <div className="mobile-card-header">
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="mobile-card-title">{booking.functionName}</div>
                    <div className="mobile-card-subtitle">{booking.functionType}</div>
                </div>
                <StatusBadge status={booking.isQuotation ? 'quotation' : booking.status} />
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

            {(booking.halls || []).length > 0 && (
                <div className="mobile-card-row">
                    <span className="mobile-card-label">
                        <Building2 style={{ width: 12, height: 12, display: 'inline', marginRight: 3 }} />
                        Hall
                    </span>
                    <span className="mobile-card-value">
                        {(booking.halls || []).map((h) => h.hall?.name).filter(Boolean).join(', ')}
                    </span>
                </div>
            )}

            <div className="mobile-card-row" style={{ marginTop: 6 }}>
                <span className="mobile-card-label">Amount</span>
                <span className="mobile-card-amount">
                    ₹{(booking.grandTotal || 0).toLocaleString('en-IN')}
                </span>
            </div>

            {hasActions && (
                <div className="mobile-card-actions">
                    {canExportMenuPdf && onExportBookingPdf && (
                        <button
                            type="button"
                            className="mobile-card-action-btn"
                            onClick={() => onExportBookingPdf(booking)}
                            title="Booking details PDF"
                            disabled={bookingPdfLoading === booking.id}
                            style={{ opacity: bookingPdfLoading === booking.id ? 0.6 : 1 }}
                        >
                            <Download style={{ width: 14, height: 14 }} aria-hidden="true" />
                            Booking
                        </button>
                    )}
                    {canExportMenuPdf && onExportPdf && (
                        <button
                            type="button"
                            className="mobile-card-action-btn"
                            onClick={() => onExportPdf(booking)}
                            title="Menu PDF"
                        >
                            <FileText style={{ width: 14, height: 14 }} aria-hidden="true" />
                            Menu
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
