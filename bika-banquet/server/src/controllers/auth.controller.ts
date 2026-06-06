import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import {
  generateToken,
  hashPassword,
  comparePassword,
  generateRandomToken,
} from '../utils/auth';
import { sendSuccess, sendError, sendUnauthorized } from '../utils/response';
import { AuthRequest, invalidateSessionCacheByToken } from '../middleware/auth.middleware';
import { toEntryCase } from '../utils/textCase';
import { passwordSchema } from '../utils/passwordPolicy';
import { resolveEffectivePermissions } from '../utils/permissions';
import { revokeUserSessions } from '../utils/sessions';
import { createAuditLog } from '../utils/auditLog';
import logger from '../utils/logger';

// Validation schemas
export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: passwordSchema,
    name: z.string().min(2, 'Name must be at least 2 characters'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
  }),
});

/**
 * Register new user
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, name } = req.body;
    const normalizedEmail =
      typeof email === 'string' ? email.trim().toLowerCase() : email;
    const normalizedName =
      typeof name === 'string' ? toEntryCase(name) : name;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      sendError(res, 'User already exists', 409);
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate verification token
    const verificationToken = generateRandomToken();

    // Create user
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name: normalizedName,
        verificationToken,
      },
      select: {
        id: true,
        email: true,
        name: true,
        isVerified: true,
        createdAt: true,
      },
    });

    // TODO: Send verification email

    sendSuccess(
      res,
      { user },
      'User registered successfully. Please verify your email.',
      201
    );
  } catch (error) {
    sendError(res, 'Registration failed');
  }
}

/**
 * Login user
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    const normalizedEmail =
      typeof email === 'string' ? email.trim().toLowerCase() : email;

    // Find user with roles
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        userBanquets: { select: { banquetId: true } },
        userPermissions: { include: { permission: true } },
      },
    });

    if (!user) {
      void createAuditLog(req, 'LOGIN_FAILED', 'auth', undefined, normalizedEmail);
      sendUnauthorized(res, 'Invalid credentials');
      return;
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      void createAuditLog(req, 'LOGIN_FAILED', 'auth', user.id, normalizedEmail);
      sendUnauthorized(res, 'Invalid credentials');
      return;
    }

    // Reject disabled accounts.
    if (!user.isActive) {
      sendError(res, 'Account is disabled. Contact an administrator.', 403);
      return;
    }

    // Check if email is verified (optional, can be disabled)
    // if (!user.isVerified) {
    //   sendError(res, 'Please verify your email first', 403);
    //   return;
    // }

    // Extract roles + effective permissions (role permissions plus per-user
    // grant overrides, minus per-user deny overrides). Deny wins.
    const roles = user.userRoles.map((ur) => ur.role.name);
    const rolePermissions = user.userRoles.flatMap((ur) =>
      ur.role.permissions.map((rp) => rp.permission.name)
    );
    const grantedPermissions = user.userPermissions
      .filter((up) => up.granted)
      .map((up) => up.permission.name);
    const explicitDenies = user.userPermissions
      .filter((up) => !up.granted)
      .map((up) => up.permission.name);
    const { permissions, deniedPermissions } = resolveEffectivePermissions(
      rolePermissions,
      grantedPermissions,
      explicitDenies
    );
    const banquetIds = (user.userBanquets || []).map((ub) => ub.banquetId);

    // Record login metadata (best-effort, derived from forwarded headers / socket).
    const forwardedFor = req.headers['x-forwarded-for'];
    const clientIp =
      (typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0]?.trim()
        : Array.isArray(forwardedFor)
          ? forwardedFor[0]?.trim()
          : undefined) || req.socket.remoteAddress || null;
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: clientIp },
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      roles,
      permissions,
      deniedPermissions,
      banquetIds,
      isActive: true,
      hasAllVenueAccess: user.hasAllVenueAccess,
    });

    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    void createAuditLog(req, 'LOGIN', 'auth', user.id, user.email);

    // Send response
    sendSuccess(res, {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles,
        permissions,
        deniedPermissions,
        banquetIds,
        hasAllVenueAccess: user.hasAllVenueAccess,
      },
    });
  } catch (error) {
    logger.error('Login failed', { error });
    sendError(res, 'Login failed');
  }
}

/**
 * Logout user
 */
export async function logout(req: AuthRequest, res: Response): Promise<void> {
  try {
    const token = req.headers.authorization?.substring(7);

    if (token) {
      await prisma.session.delete({
        where: { token },
      });
      await invalidateSessionCacheByToken(token);
    }

    void createAuditLog(req, 'LOGOUT', 'auth', req.user?.userId, req.user?.email);
    sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    sendError(res, 'Logout failed');
  }
}

/**
 * Change own password. Requires the current password, enforces the strong
 * password policy, and signs the user out of all OTHER devices while keeping
 * the current session valid.
 */
export async function changePassword(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      sendUnauthorized(res);
      return;
    }

    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, password: true, email: true },
    });

    if (!user) {
      sendUnauthorized(res);
      return;
    }

    const isValidPassword = await comparePassword(currentPassword, user.password);
    if (!isValidPassword) {
      sendError(res, 'Current password is incorrect', 400);
      return;
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, passwordChangedAt: new Date() },
    });

    // Keep the current device signed in; revoke all other sessions.
    await revokeUserSessions(user.id, req.rawToken);

    void createAuditLog(req, 'CHANGE_PASSWORD', 'user', user.id, user.email);
    sendSuccess(res, null, 'Password changed successfully');
  } catch (error) {
    sendError(res, 'Failed to change password');
  }
}

/**
 * Get current user
 */
export async function getCurrentUser(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      sendUnauthorized(res);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        isVerified: true,
        createdAt: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      sendUnauthorized(res);
      return;
    }

    sendSuccess(res, {
      user: {
        ...user,
        roles: req.user.roles,
        permissions: req.user.permissions,
        deniedPermissions: req.user.deniedPermissions,
        banquetIds: req.user.banquetIds,
        hasAllVenueAccess: req.user.hasAllVenueAccess,
      },
    });
  } catch (error) {
    sendError(res, 'Failed to get user');
  }
}
