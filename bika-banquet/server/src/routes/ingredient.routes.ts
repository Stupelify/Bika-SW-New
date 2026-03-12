import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  addIngredientSupplier,
  addIngredientSupplierSchema,
  createIngredient,
  createIngredientSchema,
  deleteIngredient,
  deleteIngredientSupplier,
  getIngredientById,
  getIngredients,
  updateIngredient,
  updateIngredientSchema,
  updateIngredientSupplier,
  updateIngredientSupplierSchema,
} from '../controllers/ingredient.controller';

const router = Router();

router.use(authenticate);

router.post('/', requirePermission('manage_menu', 'add_item'), validate(createIngredientSchema), createIngredient);
router.get('/', requirePermission('manage_menu', 'view_item'), getIngredients);
router.get('/:id', requirePermission('manage_menu', 'view_item'), getIngredientById);
router.put('/:id', requirePermission('manage_menu', 'edit_item'), validate(updateIngredientSchema), updateIngredient);
router.delete('/:id', requirePermission('manage_menu', 'delete_item'), deleteIngredient);

router.post(
  '/:id/vendors',
  requirePermission('manage_menu', 'edit_item'),
  validate(addIngredientSupplierSchema),
  addIngredientSupplier
);
router.put(
  '/:id/vendors/:supplyId',
  requirePermission('manage_menu', 'edit_item'),
  validate(updateIngredientSupplierSchema),
  updateIngredientSupplier
);
router.delete('/:id/vendors/:supplyId', requirePermission('manage_menu', 'delete_item'), deleteIngredientSupplier);

export default router;
