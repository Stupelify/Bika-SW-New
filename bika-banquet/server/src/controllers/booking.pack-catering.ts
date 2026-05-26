/**
 * Server-side catering rate rules — mirror client pack-catering.ts.
 */

export const MIN_CATERING_RATE_PER_PLATE = 200;

export interface PackCateringPayload {
  packName?: string;
  ratePerPlate?: number | null;
  menu?: { items?: unknown[] | null } | null;
}

export function packHasCateringIntent(pack: PackCateringPayload): boolean {
  const rate = Number(pack.ratePerPlate);
  const rateValue = Number.isFinite(rate) ? rate : 0;
  const itemCount = pack.menu?.items?.length ?? 0;
  return rateValue > 0 || itemCount > 0;
}

export function validatePackCateringRates(
  packs: PackCateringPayload[] | undefined
): string | null {
  if (!packs?.length) return null;

  for (const pack of packs) {
    if (!packHasCateringIntent(pack)) continue;
    const rate = Number(pack.ratePerPlate ?? 0);
    if (!Number.isFinite(rate) || rate < MIN_CATERING_RATE_PER_PLATE) {
      const label = pack.packName?.trim() || 'Pack';
      return `${label}: rate per plate must be at least ₹${MIN_CATERING_RATE_PER_PLATE} when catering is included.`;
    }
  }
  return null;
}

export function assertPackCateringRates(packs: PackCateringPayload[] | undefined): void {
  const message = validatePackCateringRates(packs);
  if (message) {
    throw new Error(message);
  }
}
