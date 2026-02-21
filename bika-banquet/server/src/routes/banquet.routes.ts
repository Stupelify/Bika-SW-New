import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createBanquet,
  createBanquetSchema,
  deleteBanquet,
  getBanquetById,
  getBanquets,
  updateBanquet,
  updateBanquetSchema,
} from '../controllers/banquet.controller';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  requirePermission('add_banquet', 'manage_halls'),
  validate(createBanquetSchema),
  createBanquet
);
router.get('/', requirePermission('view_banquet', 'manage_halls'), getBanquets);
router.get('/:id', requirePermission('view_banquet', 'manage_halls'), getBanquetById);
router.put(
  '/:id',
  requirePermission('edit_banquet', 'manage_halls'),
  validate(updateBanquetSchema),
  updateBanquet
);
router.delete('/:id', requirePermission('delete_banquet', 'manage_halls'), deleteBanquet);

export default router;
