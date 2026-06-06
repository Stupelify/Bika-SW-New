import { VenueScope } from './banquetAccess';

/**
 * Prisma `where` fragment restricting enquiries to the user's allowed venues.
 * Hall-less enquiries (no venue assigned yet) stay visible so a restricted
 * user can still see enquiries they just created. Returns undefined when the
 * user has unrestricted (all-venues) access.
 */
export function enquiryScopeFilter(scope: VenueScope):
  | { OR: Array<Record<string, unknown>> }
  | undefined {
  if (scope.allVenues) return undefined;
  return {
    OR: [
      { halls: { some: { hall: { banquetId: { in: scope.banquetIds } } } } },
      { halls: { none: {} } },
    ],
  };
}

/** Whether an enquiry (by its hall banquet ids) is within the user's scope. */
export function enquiryInScope(
  scope: VenueScope,
  hallBanquetIds: Array<string | null | undefined>
): boolean {
  if (scope.allVenues) return true;
  if (hallBanquetIds.length === 0) return true; // hall-less: visible to all
  return hallBanquetIds.some((id) => !!id && scope.banquetIds.includes(id));
}
