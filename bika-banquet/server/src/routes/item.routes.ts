import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createItemRecipe,
  createItemRecipeSchema,
  createItemVendorSupply,
  createItemVendorSupplySchema,
  createItem,
  createItemSchema,
  deleteItemRecipe,
  deleteItemVendorSupply,
  deleteItem,
  getItemRecipes,
  getItemVendorSupplies,
  getItemById,
  getItems,
  updateItemRecipe,
  updateItemRecipeSchema,
  updateItemVendorSupply,
  updateItemVendorSupplySchema,
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
router.get('/:id/recipes', requirePermission('view_item', 'manage_menu'), getItemRecipes);
router.post(
  '/:id/recipes',
  requirePermission('edit_item', 'manage_menu'),
  validate(createItemRecipeSchema),
  createItemRecipe
);
router.put(
  '/:id/recipes/:recipeId',
  requirePermission('edit_item', 'manage_menu'),
  validate(updateItemRecipeSchema),
  updateItemRecipe
);
router.delete(
  '/:id/recipes/:recipeId',
  requirePermission('delete_item', 'manage_menu'),
  deleteItemRecipe
);
router.get('/:id/vendors', requirePermission('view_item', 'manage_menu'), getItemVendorSupplies);
router.post(
  '/:id/vendors',
  requirePermission('edit_item', 'manage_menu'),
  validate(createItemVendorSupplySchema),
  createItemVendorSupply
);
router.put(
  '/:id/vendors/:supplyId',
  requirePermission('edit_item', 'manage_menu'),
  validate(updateItemVendorSupplySchema),
  updateItemVendorSupply
);
router.delete(
  '/:id/vendors/:supplyId',
  requirePermission('delete_item', 'manage_menu'),
  deleteItemVendorSupply
);
router.get('/:id', requirePermission('view_item', 'manage_menu'), getItemById);
router.put(
  '/:id',
  requirePermission('edit_item', 'manage_menu'),
  validate(updateItemSchema),
  updateItem
);
router.delete('/:id', requirePermission('delete_item', 'manage_menu'), deleteItem);

export default router;
