import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { getGoogleCalendarEvents } from '../controllers/calendar.controller';

const router = Router();

router.use(authenticate);

router.get(
  '/google-events',
  requirePermission(
    'view_calendar',
    'view_booking',
    'manage_bookings',
    'view_enquiry',
    'manage_enquiries'
  ),
  getGoogleCalendarEvents
);

export default router;
