import prisma from '../config/database';
import logger from '../utils/logger';
import { emitBookingBroadcast, emitBookingCalendarCancel } from './booking.shared';

// ---------------------------------------------------------------------------
// Pure billing math now lives in @bika/booking-core (single source of truth
// shared with the client booking form). Re-exported here with the EXACT prior
// surface so booking.controller (export *), booking.helpers (named re-export),
// booking.shared (dynamic import) and the unit tests keep their import paths.
// ---------------------------------------------------------------------------
export {
  assertFinancialsWithinCeiling,
  BILLING_CEILING_EPSILON,
  computeMealsDiscountCarryForward,
  exceedsBillingCeiling,
  mapPackLineForSumBooking,
  resolveBookingFinancials,
  roundRupee,
  splitMealsAndExtrasSubtotals,
  sumBookingLines,
  sumExtrasSubtotal,
} from '@bika/booking-core';
export type {
  AdditionalLine,
  HallLine,
  PackLine,
  ResolveBookingFinancialsInput,
  ResolvedBookingFinancials,
} from '@bika/booking-core';

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
      where: { id: { in: expired.map((b: { id: string }) => b.id) } },
      data: { status: 'cancelled', isPencilBooking: false },
    });

    expired.forEach((b: { id: string }) => {
      emitBookingBroadcast('booking:updated', { id: b.id, status: 'cancelled' });
      emitBookingCalendarCancel(b.id);
    });
    logger.info(`Released ${expired.length} expired pencil booking(s)`);
  } catch (err) {
    logger.error('releasePencilBookings error:', err);
  }
}
