import { Router } from 'express';
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  sendOTP,
  verifyOTP,
  createCustomerSchema,
  updateCustomerSchema,
} from '../controllers/customer.controller';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// OTP routes (public for customer verification)
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);

// Protected routes
router.use(authenticate);

router.post(
  '/',
  requirePermission('add_customer', 'manage_customers'),
  validate(createCustomerSchema),
  createCustomer
);
router.get('/', requirePermission('view_customer', 'manage_customers'), getCustomers);
router.get('/:id', requirePermission('view_customer', 'manage_customers'), getCustomerById);
router.put(
  '/:id',
  requirePermission('edit_customer', 'manage_customers'),
  validate(updateCustomerSchema),
  updateCustomer
);
router.delete('/:id', requirePermission('delete_customer', 'manage_customers'), deleteCustomer);

export default router;
