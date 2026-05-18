import { NextFunction, Response } from 'express';
import { AuthRequest } from './auth.middleware';

type CachedEntry = {
  response: unknown;
  statusCode: number;
  timestamp: number;
};

const CACHE_TTL_MS = 600_000; // 10 minutes — enough for retried booking requests
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
    // Only cache successful, non-conflict responses.
    // 409 (hall clash etc.) should NOT be cached — client must retry with different data.
    if (res.statusCode >= 200 && res.statusCode < 300) {
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
