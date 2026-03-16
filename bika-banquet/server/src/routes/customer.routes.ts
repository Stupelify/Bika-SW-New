import { Router } from 'express';
import rateLimit from 'express-rate-limit';
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

const otpWindowMinutes = Number.parseInt(
  process.env.AUTH_RATE_LIMIT_WINDOW || '15',
  10
);
const otpMax = Number.parseInt(process.env.AUTH_RATE_LIMIT_MAX || '50', 10);
const otpLimiter = rateLimit({
  windowMs: otpWindowMinutes * 60 * 1000,
  max: otpMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many OTP attempts. Please try again shortly.',
});

// OTP routes (public for customer verification)
router.post('/send-otp', otpLimiter, sendOTP);
router.post('/verify-otp', otpLimiter, verifyOTP);

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
