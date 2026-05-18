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

// ---------------------------------------------------------------------------
// sumBookingLines — canonical total-amount calculation, shared across
// recalculateBookingFinancials, createBooking, and updateBooking.
// ---------------------------------------------------------------------------

export interface HallLine { charges: number | null | undefined }
export interface PackLine {
  ratePerPlate: number | null | undefined;
  packCount: number | null | undefined;
  noOfPack: number | null | undefined;
  setupCost: number | null | undefined;
  extraCharges: number | null | undefined;
}
export interface AdditionalLine {
  charges: number | null | undefined;
  quantity: number | null | undefined;
}

function safeMoney(v: number | null | undefined): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

function safeNum(v: number | null | undefined): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function sumBookingLines(input: {
  halls: HallLine[];
  packs: PackLine[];
  additionalItems: AdditionalLine[];
}): number {
  const hallTotal = input.halls.reduce((s, h) => s + safeMoney(h.charges), 0);
  const packTotal = input.packs.reduce((s, p) => {
    const count = Math.max(1, safeNum(p.packCount ?? p.noOfPack ?? 1));
    return (
      s +
      safeMoney(p.ratePerPlate) * count +
      safeMoney(p.setupCost) +
      safeMoney(p.extraCharges)
    );
  }, 0);
  const additionalTotal = input.additionalItems.reduce(
    (s, a) => s + safeMoney(a.charges) * Math.max(1, safeNum(a.quantity ?? 1)),
    0
  );
  return safeMoney(hallTotal + packTotal + additionalTotal);
}
