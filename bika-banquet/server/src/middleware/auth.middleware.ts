import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';
import { sendUnauthorized, sendForbidden } from '../utils/response';
import prisma from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    roles: string[];
    permissions: string[];
  };
}

/**
 * Authenticate user from JWT token
 */
export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendUnauthorized(res, 'No token provided');
      return;
    }

    const token = authHeader.substring(7);

    // Verify token
    const payload = verifyToken(token);

    // Check if session exists and is valid
    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
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
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      sendUnauthorized(res, 'Session expired');
      return;
    }

    // Extract roles and permissions
    const roles = session.user.userRoles.map((ur) => ur.role.name);
    const permissions = session.user.userRoles.flatMap((ur) =>
      ur.role.permissions.map((rp) => rp.permission.name)
    );

    // Attach user to request
    req.user = {
      userId: session.userId,
      email: session.user.email,
      roles,
      permissions: [...new Set(permissions)], // Remove duplicates
    };

    next();
  } catch (error) {
    sendUnauthorized(res, 'Invalid token');
  }
}

/**
 * Check if user has required role
 */
export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendUnauthorized(res);
    }

    const hasRole = roles.some((role) => req.user!.roles.includes(role));

    if (!hasRole) {
      return sendForbidden(res, 'Insufficient permissions');
    }

    next();
  };
}

/**
 * Check if user has required permission
 */
export function requirePermission(...permissions: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendUnauthorized(res);
    }

    const hasPermission = permissions.some((permission) =>
      req.user!.permissions.includes(permission)
    );

    if (!hasPermission) {
      return sendForbidden(res, 'Insufficient permissions');
    }

    next();
  };
}
