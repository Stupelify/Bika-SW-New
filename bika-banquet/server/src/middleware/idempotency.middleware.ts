import { NextFunction, Response } from 'express';
import { AuthRequest } from './auth.middleware';

type CachedEntry = {
  response: unknown;
  statusCode: number;
  timestamp: number;
};

const CACHE_TTL_MS = 60_000;
const responseCache = new Map<string, CachedEntry>();

function pruneExpiredEntries(now: number): void {
  for (const [key, entry] of responseCache.entries()) {
    if (now - entry.timestamp >= CACHE_TTL_MS) {
      responseCache.delete(key);
    }
  }
}

export function idempotencyMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const idempotencyKey = req.header('X-Idempotency-Key')?.trim();
  const userId = req.user?.userId;

  if (!idempotencyKey || !userId) {
    next();
    return;
  }

  const now = Date.now();
  pruneExpiredEntries(now);

  const cacheKey = `${userId}:${idempotencyKey}`;
  const cached = responseCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    res.status(cached.statusCode).json(cached.response);
    return;
  }

  const originalJson = res.json.bind(res);
  res.json = ((body: unknown) => {
    if (res.statusCode < 400) {
      responseCache.set(cacheKey, {
        response: body,
        statusCode: res.statusCode,
        timestamp: Date.now(),
      });
    }
    return originalJson(body);
  }) as Response['json'];

  next();
}
