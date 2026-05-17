import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { searchAll } from '../controllers/search.controller';

const router = Router();
router.use(authenticate);
router.get(
  '/',
  requirePermission(
    'view_booking',
    'manage_bookings',
    'view_customer',
    'manage_customers',
    'view_enquiry',
    'manage_enquiries'
  ),
  searchAll
);

export default router;
