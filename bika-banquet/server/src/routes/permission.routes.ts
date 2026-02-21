import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createPermission,
  createPermissionSchema,
  deletePermission,
  getPermissionById,
  getPermissions,
  updatePermission,
  updatePermissionSchema,
} from '../controllers/permission.controller';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  requirePermission('add_permission', 'manage_permission'),
  validate(createPermissionSchema),
  createPermission
);
router.get(
  '/',
  requirePermission('view_permission', 'manage_permission', 'manage_roles'),
  getPermissions
);
router.get(
  '/:id',
  requirePermission('view_permission', 'manage_permission', 'manage_roles'),
  getPermissionById
);
router.put(
  '/:id',
  requirePermission('edit_permission', 'manage_permission'),
  validate(updatePermissionSchema),
  updatePermission
);
router.delete(
  '/:id',
  requirePermission('delete_permission', 'manage_permission'),
  deletePermission
);

export default router;
