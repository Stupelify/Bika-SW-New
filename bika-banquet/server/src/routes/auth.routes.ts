import { Router } from 'express';
import {
  register,
  login,
  logout,
  getCurrentUser,
  changePassword,
  registerSchema,
  loginSchema,
  changePasswordSchema,
} from '../controllers/auth.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// Public routes
router.post('/login', validate(loginSchema), login);

// Admin-only registration
router.post('/register', authenticate, requireRole('Admin'), validate(registerSchema), register);

// Protected routes
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getCurrentUser);
router.post('/change-password', authenticate, validate(changePasswordSchema), changePassword);

export default router;
