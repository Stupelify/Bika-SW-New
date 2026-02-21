import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createHall,
  createHallSchema,
  deleteHall,
  getHallById,
  getHalls,
  updateHall,
  updateHallSchema,
} from '../controllers/hall.controller';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  requirePermission('add_hall', 'manage_halls'),
  validate(createHallSchema),
  createHall
);
router.get('/', requirePermission('view_hall', 'manage_halls'), getHalls);
router.get('/:id', requirePermission('view_hall', 'manage_halls'), getHallById);
router.put(
  '/:id',
  requirePermission('edit_hall', 'manage_halls'),
  validate(updateHallSchema),
  updateHall
);
router.delete('/:id', requirePermission('delete_hall', 'manage_halls'), deleteHall);

export default router;
