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

  return rows.map((r) => r.id);
}
