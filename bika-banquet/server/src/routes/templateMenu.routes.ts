import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
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
router.get('/', requirePermission('view_templatemenu', 'manage_menu'), getTemplateMenus);
router.get('/:id', requirePermission('view_templatemenu', 'manage_menu'), getTemplateMenuById);
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
