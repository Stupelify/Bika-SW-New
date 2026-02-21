import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import {
  createUser,
  createUserSchema,
  deleteUser,
  getUserById,
  getUsers,
  getUsersSimple,
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
router.delete('/:id', requirePermission('delete_user', 'manage_users'), deleteUser);

export default router;
