import prisma from '../config/database';

interface VersionRow {
  id: string;
}

/**
 * Returns all booking IDs in the version chain containing anchorId,
 * ordered root→latest, using a single recursive CTE.
 */
export async function resolveVersionChain(anchorId: string): Promise<string[]> {
  const rows = await prisma.$queryRaw<VersionRow[]>`
    WITH RECURSIVE backward AS (
      SELECT b.id, b."previousBookingId"
      FROM bookings b
      WHERE b.id = ${anchorId}

      UNION ALL

      SELECT b.id, b."previousBookingId"
      FROM bookings b
      INNER JOIN backward c ON b.id = c."previousBookingId"
    ),
    root AS (
      SELECT id FROM backward WHERE "previousBookingId" IS NULL LIMIT 1
    ),
    forward AS (
      SELECT b.id, b."previousBookingId"
      FROM bookings b
      INNER JOIN root r ON b.id = r.id

      UNION ALL

      SELECT b.id, b."previousBookingId"
      FROM bookings b
      INNER JOIN forward f ON b."previousBookingId" = f.id
    )
    SELECT id FROM forward
  `;

  return rows.map((r: VersionRow) => r.id);
}

export {
  assertFinancialsWithinCeiling,
  BILLING_CEILING_EPSILON,
  computeMealsDiscountCarryForward,
  exceedsBillingCeiling,
  mapPackLineForSumBooking,
  resolveBookingFinancials,
  roundRupee,
  splitMealsAndExtrasSubtotals,
  sumBookingLines,
  sumExtrasSubtotal,
  type AdditionalLine,
  type HallLine,
  type PackLine,
  type ResolveBookingFinancialsInput,
  type ResolvedBookingFinancials,
} from './booking.financials';

// ---------------------------------------------------------------------------
// getPdfAsset — Promise-based PDF asset cache with TTL.
// Concurrent callers for the same key share the in-flight promise; resolved
// entries are reused until ttlMs elapses, then re-fetched on next request.
// ---------------------------------------------------------------------------

interface CacheEntry {
  promise: Promise<Buffer | null>;
  resolvedAt: number | null;
}

const assetCache = new Map<string, CacheEntry>();
const DEFAULT_ASSET_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function getPdfAsset(
  key: string,
  loader: () => Promise<Buffer | null>,
  options: { ttlMs?: number } = {}
): Promise<Buffer | null> {
  const ttlMs = options.ttlMs ?? DEFAULT_ASSET_TTL_MS;
  const existing = assetCache.get(key);

  if (existing) {
    const age = existing.resolvedAt !== null ? Date.now() - existing.resolvedAt : 0;
    if (existing.resolvedAt === null || age < ttlMs) {
      // In-flight or still fresh — return same promise
      return existing.promise;
    }
    assetCache.delete(key);
  }

  const entry: CacheEntry = { promise: null as unknown as Promise<Buffer | null>, resolvedAt: null };
  entry.promise = loader().then((result) => {
    entry.resolvedAt = Date.now();
    return result;
  });
  assetCache.set(key, entry);
  return entry.promise;
}
