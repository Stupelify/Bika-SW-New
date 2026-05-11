import { Router } from 'express';
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  createCustomerSchema,
  updateCustomerSchema,
} from '../controllers/customer.controller';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

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
