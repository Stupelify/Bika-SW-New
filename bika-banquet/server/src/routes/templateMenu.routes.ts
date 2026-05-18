import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { httpCache } from '../middleware/cache.middleware';
import {
  createTemplateMenu,
  createTemplateMenuSchema,
  deleteTemplateMenu,
  getTemplateMenuById,
  getTemplateMenus,
  updateTemplateMenu,
  updateTemplateMenuSchema,
} from '../controllers/templateMenu.controller';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  requirePermission('add_templatemenu', 'manage_menu'),
  validate(createTemplateMenuSchema),
  createTemplateMenu
);
router.get('/', httpCache(120), requirePermission('view_templatemenu', 'add_templatemenu', 'edit_templatemenu', 'add_booking', 'manage_menu'), getTemplateMenus);
router.get('/:id', httpCache(120), requirePermission('view_templatemenu', 'add_templatemenu', 'edit_templatemenu', 'manage_menu'), getTemplateMenuById);
router.put(
  '/:id',
  requirePermission('edit_templatemenu', 'manage_menu'),
  validate(updateTemplateMenuSchema),
  updateTemplateMenu
);
router.delete(
  '/:id',
  requirePermission('delete_templatemenu', 'manage_menu'),
  deleteTemplateMenu
);

export default router;
