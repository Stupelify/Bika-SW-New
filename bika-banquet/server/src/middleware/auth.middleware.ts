import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/auth';
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

function pathWithoutQuery(value: string | undefined): string {
  return (value || '').split('?')[0];
}

function shouldValidateSession(req: Request): boolean {
  const routePath = pathWithoutQuery(req.originalUrl || req.url);
  return (
    (req.method === 'POST' && routePath.endsWith('/auth/logout')) ||
    (req.method === 'POST' && routePath.endsWith('/auth/change-password'))
  );
}

function hasAdminRoleCheck(roles: string[]): boolean {
  return roles.some((role) => role.trim().toLowerCase() === 'admin');
}

async function validateSessionAndResolveUser(
  token: string
): Promise<TokenPayload | null> {
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
    return null;
  }

  const roles = session.user.userRoles.map((entry) => entry.role.name);
  const permissions = [
    ...new Set(
      session.user.userRoles.flatMap((entry) =>
        entry.role.permissions.map((permission) => permission.permission.name)
      )
    ),
  ];

  return {
    userId: session.userId,
    email: session.user.email,
    roles,
    permissions,
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

    const payloadToUse = shouldValidateSession(req)
      ? await validateSessionAndResolveUser(token)
      : {
          userId: payload.userId,
          email: payload.email,
          roles: Array.isArray(payload.roles) ? payload.roles : [],
          permissions: Array.isArray(payload.permissions)
            ? payload.permissions
            : [],
        };

    if (!payloadToUse) {
      sendUnauthorized(res, 'Session expired');
      return;
    }

    // Attach user to request
    req.user = {
      userId: payloadToUse.userId,
      email: payloadToUse.email,
      roles: payloadToUse.roles,
      permissions: payloadToUse.permissions,
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
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendUnauthorized(res);
    }

    if (hasAdminRoleCheck(roles)) {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ')
        ? authHeader.substring(7)
        : null;

      if (!token) {
        return sendUnauthorized(res, 'No token provided');
      }

      const refreshedUser = await validateSessionAndResolveUser(token);
      if (!refreshedUser) {
        return sendUnauthorized(res, 'Session expired');
      }

      req.user = refreshedUser;
    }

    const hasRole = roles.some((role) =>
      req.user!.roles.some(
        (userRole) => userRole.trim().toLowerCase() === role.trim().toLowerCase()
      )
    );

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
