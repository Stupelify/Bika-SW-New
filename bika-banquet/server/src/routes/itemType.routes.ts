import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createItemType,
  createItemTypeSchema,
  deleteItemType,
  getItemTypeById,
  getItemTypes,
  updateItemType,
  updateItemTypeSchema,
} from '../controllers/itemType.controller';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  requirePermission('add_itemtype', 'manage_menu'),
  validate(createItemTypeSchema),
  createItemType
);
router.get('/', requirePermission('view_itemtype', 'manage_menu'), getItemTypes);
router.get('/:id', requirePermission('view_itemtype', 'manage_menu'), getItemTypeById);
router.put(
  '/:id',
  requirePermission('edit_itemtype', 'manage_menu'),
  validate(updateItemTypeSchema),
  updateItemType
);
router.delete('/:id', requirePermission('delete_itemtype', 'manage_menu'), deleteItemType);

export default router;
