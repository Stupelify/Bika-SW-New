import { AuthRequest } from '../middleware/auth.middleware';

export function getAllowedBanquetIds(req: Pick<AuthRequest, 'user'>): string[] {
  return Array.isArray(req.user?.banquetIds) ? req.user!.banquetIds : [];
}

export function withBookingBanquetScope<T extends Record<string, unknown>>(
  where: T,
  allowedBanquetIds: string[]
): T & Record<string, unknown> {
  if (allowedBanquetIds.length === 0) {
    return where;
  }

  return {
    ...where,
    halls: {
      some: {
        hall: {
          banquetId: { in: allowedBanquetIds },
        },
      },
    },
  };
}

export function withEnquiryBanquetScope<T extends Record<string, unknown>>(
  where: T,
  allowedBanquetIds: string[]
): T & Record<string, unknown> {
  if (allowedBanquetIds.length === 0) {
    return where;
  }

  return {
    ...where,
    halls: {
      some: {
        hall: {
          banquetId: { in: allowedBanquetIds },
        },
      },
    },
  };
}
