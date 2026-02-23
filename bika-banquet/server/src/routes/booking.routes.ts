import { Router } from 'express';
import {
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
  deleteBooking,
  addPayment,
  downloadBookingMenuPdf,
  createBookingSchema,
} from '../controllers/booking.controller';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post(
  '/',
  requirePermission('add_booking', 'manage_bookings'),
  validate(createBookingSchema),
  createBooking
);
router.get('/', requirePermission('view_booking', 'manage_bookings'), getBookings);
router.get('/:id', requirePermission('view_booking', 'manage_bookings'), getBookingById);
router.get('/:id/menu-pdf', requirePermission('view_booking', 'manage_bookings'), downloadBookingMenuPdf);
router.put('/:id', requirePermission('edit_booking', 'manage_bookings'), updateBooking);
router.delete('/:id', requirePermission('delete_booking', 'manage_bookings'), deleteBooking);
router.post('/:id/cancel', requirePermission('cancel_booking', 'edit_booking', 'manage_bookings'), cancelBooking);
router.post('/:id/payments', requirePermission('manage_payments', 'edit_booking', 'manage_bookings'), addPayment);

export default router;
