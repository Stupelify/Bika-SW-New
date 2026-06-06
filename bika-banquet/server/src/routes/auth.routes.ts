import { Router } from 'express';
import type { Response } from 'express';
import crypto from 'crypto';
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
import { authenticate, requireRole, resolveTokenFromRequest } from '../middleware/auth.middleware';
import type { AuthRequest } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { getRedisClient } from '../config/redis';

const router = Router();

// Public routes
router.post('/login', validate(loginSchema), login);

// Admin-only registration
router.post('/register', authenticate, requireRole('Admin'), validate(registerSchema), register);

// Protected routes
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getCurrentUser);
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  changePassword
);

// One-time token for EventSource authentication (browser can't send headers)
router.get('/sse-token', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const redis = getRedisClient();
    if (!redis) {
      res.status(503).json({ error: 'SSE token service unavailable' });
      return;
    }

    const token = resolveTokenFromRequest(req);
    if (!token) {
      res.status(401).json({ error: 'No token' });
      return;
    }

    const sseToken = crypto.randomBytes(32).toString('hex');
    await redis.set(`sse-token:${sseToken}`, token, 'EX', 30); // 30s TTL, one-time use

    res.json({ token: sseToken });
  } catch {
    res.status(500).json({ error: 'Internal error' });
  }
});

export default router;
