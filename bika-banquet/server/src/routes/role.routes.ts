import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createRole,
  createRoleSchema,
  deleteRole,
  getRoleById,
  getRoles,
  updateRole,
  updateRoleSchema,
} from '../controllers/role.controller';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  requirePermission('add_role', 'manage_roles'),
  validate(createRoleSchema),
  createRole
);
router.get('/', requirePermission('view_role', 'manage_roles'), getRoles);
router.get('/:id', requirePermission('view_role', 'manage_roles'), getRoleById);
router.put(
  '/:id',
  requirePermission('edit_role', 'manage_roles'),
  validate(updateRoleSchema),
  updateRole
);
router.delete('/:id', requirePermission('delete_role', 'manage_roles'), deleteRole);

export default router;
