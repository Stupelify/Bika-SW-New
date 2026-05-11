import { Request, Response, NextFunction } from 'express';

/**
 * Adds Cache-Control headers for GET responses on slow-changing reference data.
 * Using `private` because responses are auth-protected (not for CDN caching).
 * stale-while-revalidate lets the browser serve stale content while fetching fresh.
 */
export function httpCache(maxAge = 60) {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.set(
      'Cache-Control',
      `private, max-age=${maxAge}, stale-while-revalidate=${maxAge * 2}`
    );
    next();
  };
}
