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
import { AuthRequest } from '../middleware/auth.middleware';
import { toEntryCase } from '../utils/textCase';

// Validation schemas
export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
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
      sendUnauthorized(res, 'Invalid credentials');
      return;
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
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

    // Extract roles, permissions, banquet restrictions.
    // Permissions are the union of role permissions AND direct user permissions.
    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissions = [
      ...new Set([
        ...user.userRoles.flatMap((ur) =>
          ur.role.permissions.map((rp) => rp.permission.name)
        ),
        ...user.userPermissions.map((up) => up.permission.name),
      ]),
    ];
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

    // Send response
    sendSuccess(res, {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles,
        permissions,
        banquetIds,
        hasAllVenueAccess: user.hasAllVenueAccess,
      },
    });
  } catch (error) {
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
    }

    sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    sendError(res, 'Logout failed');
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
        banquetIds: req.user.banquetIds,
        hasAllVenueAccess: req.user.hasAllVenueAccess,
      },
    });
  } catch (error) {
    sendError(res, 'Failed to get user');
  }
}
