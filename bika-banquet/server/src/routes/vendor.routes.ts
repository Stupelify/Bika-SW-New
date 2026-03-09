import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  addVendorSupply,
  addVendorSupplySchema,
  createVendor,
  createVendorSchema,
  deleteVendor,
  deleteVendorSupply,
  getVendorById,
  getVendors,
  updateVendor,
  updateVendorSchema,
  updateVendorSupply,
  updateVendorSupplySchema,
} from '../controllers/vendor.controller';

const router = Router();

router.use(authenticate);

router.post('/', requirePermission('manage_menu', 'add_item'), validate(createVendorSchema), createVendor);
router.get('/', requirePermission('manage_menu', 'view_item'), getVendors);
router.get('/:id', requirePermission('manage_menu', 'view_item'), getVendorById);
router.put('/:id', requirePermission('manage_menu', 'edit_item'), validate(updateVendorSchema), updateVendor);
router.delete('/:id', requirePermission('manage_menu', 'delete_item'), deleteVendor);

router.post(
  '/:id/supplies',
  requirePermission('manage_menu', 'edit_item'),
  validate(addVendorSupplySchema),
  addVendorSupply
);
router.put(
  '/:id/supplies/:supplyId',
  requirePermission('manage_menu', 'edit_item'),
  validate(updateVendorSupplySchema),
  updateVendorSupply
);
router.delete('/:id/supplies/:supplyId', requirePermission('manage_menu', 'delete_item'), deleteVendorSupply);

export default router;
