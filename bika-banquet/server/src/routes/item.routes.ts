import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createItem,
  createItemSchema,
  deleteItem,
  getItemById,
  getItems,
  updateItem,
  updateItemSchema,
} from '../controllers/item.controller';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  requirePermission('add_item', 'manage_menu'),
  validate(createItemSchema),
  createItem
);
router.get('/', requirePermission('view_item', 'manage_menu'), getItems);
router.get('/:id', requirePermission('view_item', 'manage_menu'), getItemById);
router.put(
  '/:id',
  requirePermission('edit_item', 'manage_menu'),
  validate(updateItemSchema),
  updateItem
);
router.delete('/:id', requirePermission('delete_item', 'manage_menu'), deleteItem);

export default router;
