import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  assignPermission,
  assignPermissionSchema,
  assignRole,
  assignRoleSchema,
  listUserPermissions,
  removePermission,
  removePermissionSchema,
  removeRole,
  removeRoleSchema,
  updateRolePermissions,
  updateRolePermissionsSchema,
  updateUserRoles,
  updateUserRolesSchema,
} from '../controllers/rbac.controller';

const router = Router();

router.use(authenticate);

router.post(
  '/assign-role',
  requirePermission('assign_role', 'manage_roles'),
  validate(assignRoleSchema),
  assignRole
);
router.post(
  '/remove-role',
  requirePermission('assign_role', 'manage_roles'),
  validate(removeRoleSchema),
  removeRole
);
router.post(
  '/update-roles',
  requirePermission('assign_role', 'manage_roles'),
  validate(updateUserRolesSchema),
  updateUserRoles
);
router.post(
  '/assign-permission',
  requirePermission('manage_permission', 'manage_roles'),
  validate(assignPermissionSchema),
  assignPermission
);
router.post(
  '/remove-permission',
  requirePermission('manage_permission', 'manage_roles'),
  validate(removePermissionSchema),
  removePermission
);
router.post(
  '/update-permissions',
  requirePermission('manage_permission', 'manage_roles'),
  validate(updateRolePermissionsSchema),
  updateRolePermissions
);
router.get(
  '/user-permissions/:userId',
  requirePermission('view_permission', 'manage_permission', 'manage_roles'),
  listUserPermissions
);

export default router;
