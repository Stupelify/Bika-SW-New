import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import {
  createUser,
  createUserSchema,
  deleteUser,
  getUserBanquets,
  getUserById,
  getUserDirectPermissions,
  getUsers,
  getUsersSimple,
  resetUserPassword,
  resetUserPasswordSchema,
  setUserAllVenues,
  setUserAllVenuesSchema,
  setUserBanquets,
  setUserDirectPermissions,
  setUserDirectPermissionsSchema,
  setUserStatus,
  setUserStatusSchema,
  updateUser,
  updateUserSchema,
} from '../controllers/user.controller';
import { validate } from '../middleware/validate.middleware';

const router = Router();

router.use(authenticate);

router.get('/simple', requirePermission('view_user', 'manage_users'), getUsersSimple);
router.get('/', requirePermission('view_user', 'manage_users'), getUsers);
router.get('/:id', requirePermission('view_user', 'manage_users'), getUserById);
router.post(
  '/',
  requirePermission('add_user', 'manage_users'),
  validate(createUserSchema),
  createUser
);
router.put(
  '/:id',
  requirePermission('edit_user', 'manage_users'),
  validate(updateUserSchema),
  updateUser
);
router.delete('/:id', requirePermission('delete_user', 'manage_users'), deleteUser);
router.patch(
  '/:id/status',
  requirePermission('manage_users'),
  validate(setUserStatusSchema),
  setUserStatus
);
router.post(
  '/:id/reset-password',
  requirePermission('manage_users'),
  validate(resetUserPasswordSchema),
  resetUserPassword
);
router.get('/:id/banquets', requirePermission('view_user', 'manage_users'), getUserBanquets);
router.put('/:id/banquets', requirePermission('manage_users'), setUserBanquets);
router.put(
  '/:id/all-venues',
  requirePermission('manage_users'),
  validate(setUserAllVenuesSchema),
  setUserAllVenues
);
router.get(
  '/:id/direct-permissions',
  requirePermission('view_permission', 'manage_permission', 'manage_roles', 'manage_users'),
  getUserDirectPermissions
);
router.put(
  '/:id/direct-permissions',
  requirePermission('manage_permission', 'manage_roles'),
  validate(setUserDirectPermissionsSchema),
  setUserDirectPermissions
);

export default router;
