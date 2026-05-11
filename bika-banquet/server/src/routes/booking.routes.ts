import { Router } from 'express';
import {
  createBooking,
  getBookings,
  getBookingById,
  getBookingCount,
  updateBooking,
  cancelBooking,
  deleteBooking,
  addPayment,
  updatePayment,
  downloadBookingMenuPdf,
  downloadBookingDetailsPdf,
  createBookingSchema,
  updateBookingSchema,
  addPaymentSchema,
  updatePaymentSchema,
  finalizeBookingVersion,
  partyOverBooking,
  getBookingHistory,
  checkHallAvailability,
} from '../controllers/booking.controller';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { idempotencyMiddleware } from '../middleware/idempotency.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post(
  '/',
  idempotencyMiddleware,
  requirePermission('add_booking', 'manage_bookings'),
  validate(createBookingSchema),
  createBooking
);
router.get('/', requirePermission('view_booking', 'manage_bookings'), getBookings);
// Must be before /:id routes
router.get('/count', requirePermission('view_booking', 'manage_bookings'), getBookingCount);
router.get('/check-availability', requirePermission('view_booking', 'manage_bookings'), checkHallAvailability);
router.get('/:id', requirePermission('view_booking', 'manage_bookings'), getBookingById);
router.get('/:id/menu-pdf', requirePermission('view_booking', 'manage_bookings'), downloadBookingMenuPdf);
router.get('/:id/booking-pdf', requirePermission('view_booking', 'manage_bookings'), downloadBookingDetailsPdf);
router.put(
  '/:id',
  requirePermission('edit_booking', 'manage_bookings'),
  validate(updateBookingSchema),
  updateBooking
);
router.delete('/:id', requirePermission('delete_booking', 'manage_bookings'), deleteBooking);
router.post('/:id/cancel', requirePermission('cancel_booking', 'edit_booking', 'manage_bookings'), cancelBooking);
router.post('/:id/payments', requirePermission('manage_payments', 'edit_booking', 'manage_bookings'), validate(addPaymentSchema), addPayment);
router.patch('/:id/payments/:paymentId', requirePermission('manage_payments', 'edit_booking', 'manage_bookings'), validate(updatePaymentSchema), updatePayment);
router.post('/:id/finalize', requirePermission('edit_booking', 'manage_bookings'), finalizeBookingVersion);
router.post('/:id/party-over', requirePermission('edit_booking', 'manage_bookings'), partyOverBooking);
router.get('/:id/history', requirePermission('view_booking', 'manage_bookings'), getBookingHistory);

export default router;
