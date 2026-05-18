import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { verifyToken, TokenPayload } from '../utils/auth';
import { sendUnauthorized, sendForbidden } from '../utils/response';
import prisma from '../config/database';
import { getRedisClient } from '../config/redis';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    roles: string[];
    permissions: string[];
    banquetIds: string[];
  };
  rawToken?: string;
}

/**
 * Return the raw JWT stored on the request by the authenticate middleware.
 * Used by /auth/sse-token to embed the JWT in the one-time Redis token.
 */
export function resolveTokenFromRequest(req: AuthRequest): string | null {
  return req.rawToken || null;
}

function resolveToken(req: Request): string | null {
  // Standard Bearer token
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // One-time SSE token — only valid on /api/events path
  const routePath = (req.originalUrl || req.url || '').split('?')[0];
  if (routePath.endsWith('/events') && typeof req.query.sse_token === 'string') {
    // Sentinel value — actual JWT lookup happens in authenticate via Redis
    return `sse:${req.query.sse_token.trim()}`;
  }

  return null;
}

const SESSION_CACHE_TTL = 60; // seconds

function tokenCacheKey(token: string): string {
  return `session:${crypto.createHash('sha256').update(token).digest('hex')}`;
}

async function getCachedOrFetchSession(token: string): Promise<TokenPayload | null> {
  const redis = getRedisClient();
  const key = tokenCacheKey(token);

  if (redis) {
    const cached = await redis.get(key);
    if (cached === 'revoked') return null;
    if (cached) {
      try {
        return JSON.parse(cached) as TokenPayload;
      } catch {
        // corrupt cache entry — fall through to DB
      }
    }
  }

  const dbUser = await validateSessionAndResolveUser(token);

  if (redis) {
    if (!dbUser) {
      await redis.set(key, 'revoked', 'EX', SESSION_CACHE_TTL);
    } else {
      await redis.set(key, JSON.stringify(dbUser), 'EX', SESSION_CACHE_TTL);
    }
  }

  return dbUser;
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
          userBanquets: {
            select: {
              banquetId: true,
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

  const banquetIds = (session.user as any).userBanquets
    ? (session.user as any).userBanquets.map((ub: any) => ub.banquetId)
    : [];

  return {
    userId: session.userId,
    email: session.user.email,
    roles,
    permissions,
    banquetIds,
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
    const token = resolveToken(req);

    if (!token) {
      sendUnauthorized(res, 'No token provided');
      return;
    }

    // Resolve one-time SSE token from Redis
    let jwtToken = token;
    if (token.startsWith('sse:')) {
      const redis = getRedisClient();
      if (!redis) {
        sendUnauthorized(res, 'SSE auth unavailable');
        return;
      }
      const sseKey = `sse-token:${token.slice(4)}`;
      const stored = await redis.get(sseKey);
      if (!stored) {
        sendUnauthorized(res, 'SSE token expired or invalid');
        return;
      }
      await redis.del(sseKey); // one-time use
      jwtToken = stored;
    }

    // Store raw JWT on request for downstream use (e.g. /auth/sse-token)
    req.rawToken = jwtToken;

    // Verify JWT signature — throws if invalid (caught below)
    verifyToken(jwtToken);

    const payloadToUse = await getCachedOrFetchSession(jwtToken!);

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
      banquetIds: Array.isArray(payloadToUse.banquetIds) ? payloadToUse.banquetIds : [],
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

    // Re-validate from cache for any role check (catches revoked sessions)
    if (req.rawToken) {
      const refreshed = await getCachedOrFetchSession(req.rawToken);
      if (!refreshed) {
        return sendUnauthorized(res, 'Session expired');
      }
      req.user = refreshed;
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
