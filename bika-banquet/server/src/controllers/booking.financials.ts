/**
 * booking.financials.ts
 * Scheduled financial operations: release pencil bookings.
 */
import prisma from '../config/database';
import logger from '../utils/logger';
import { emitBookingBroadcast, emitBookingCalendarCancel } from './booking.shared';

/**
 * Cancel all pencil bookings whose pencilExpiresAt has passed.
 * Called on a schedule and before hall availability checks.
 */
export async function releasePencilBookings(): Promise<void> {
  try {
    const now = new Date();
    const expired = await prisma.booking.findMany({
      where: {
        isPencilBooking: true,
        pencilExpiresAt: { lt: now },
        status: { notIn: ['cancelled'] },
        isLatest: true,
      },
      select: { id: true },
    });
    if (expired.length === 0) return;

    await prisma.booking.updateMany({
      where: { id: { in: expired.map((b) => b.id) } },
      data: { status: 'cancelled', isPencilBooking: false },
    });

    expired.forEach((b) => {
      emitBookingBroadcast('booking:updated', { id: b.id, status: 'cancelled' });
      emitBookingCalendarCancel(b.id);
    });
    logger.info(`Released ${expired.length} expired pencil booking(s)`);
  } catch (err) {
    logger.error('releasePencilBookings error:', err);
  }
}
