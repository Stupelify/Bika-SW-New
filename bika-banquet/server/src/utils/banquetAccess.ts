import { AuthRequest } from '../middleware/auth.middleware';

/**
 * A user's venue (banquet) access scope.
 * - allVenues=true  => unrestricted: may see/act on every venue.
 * - allVenues=false => restricted to `banquetIds`. An EMPTY list means NO
 *   access (fail-closed): such a user can see nothing venue-scoped.
 */
export interface VenueScope {
  allVenues: boolean;
  banquetIds: string[];
}

export function getVenueScope(req: Pick<AuthRequest, 'user'>): VenueScope {
  return {
    allVenues: req.user?.hasAllVenueAccess === true,
    banquetIds: Array.isArray(req.user?.banquetIds) ? req.user!.banquetIds : [],
  };
}

/** Whether the user may access a specific banquet. */
export function canAccessBanquet(
  scope: VenueScope,
  banquetId: string | null | undefined
): boolean {
  if (scope.allVenues) return true;
  return !!banquetId && scope.banquetIds.includes(banquetId);
}

/**
 * Prisma filter fragment for a model with a direct `banquetId` column.
 * Returns `undefined` when unrestricted (caller should apply no filter).
 * Otherwise `{ in: banquetIds }` — note an empty array matches nothing,
 * which is the intended fail-closed behavior.
 */
export function banquetIdInFilter(
  scope: VenueScope
): { in: string[] } | undefined {
  return scope.allVenues ? undefined : { in: scope.banquetIds };
}

export function withBookingBanquetScope<T extends Record<string, unknown>>(
  where: T,
  scope: VenueScope
): T & Record<string, unknown> {
  if (scope.allVenues) {
    return where;
  }
  return {
    ...where,
    halls: {
      some: {
        hall: {
          banquetId: { in: scope.banquetIds },
        },
      },
    },
  };
}

export function withEnquiryBanquetScope<T extends Record<string, unknown>>(
  where: T,
  scope: VenueScope
): T & Record<string, unknown> {
  if (scope.allVenues) {
    return where;
  }
  return {
    ...where,
    halls: {
      some: {
        hall: {
          banquetId: { in: scope.banquetIds },
        },
      },
    },
  };
}
