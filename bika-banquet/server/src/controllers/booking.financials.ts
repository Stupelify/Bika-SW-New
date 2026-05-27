import prisma from '../config/database';
import logger from '../utils/logger';
import { emitBookingBroadcast, emitBookingCalendarCancel } from './booking.shared';

// ---------------------------------------------------------------------------
// sumBookingLines + billing ceiling — no Prisma dependency (unit-testable).
// ---------------------------------------------------------------------------

export interface HallLine {
  charges: number | null | undefined;
}
export interface PackLine {
  ratePerPlate: number | null | undefined;
  packCount: number | null | undefined;
  noOfPack: number | null | undefined;
  setupCost: number | null | undefined;
  extraCharges: number | null | undefined;
  /** Per-meal hall charge (once per pack; not × hall count). */
  hallRate?: number | null | undefined;
}
export interface AdditionalLine {
  charges: number | null | undefined;
  quantity: number | null | undefined;
}

/** Nearest whole rupee (half-up) — canonical money unit for booking billing. */
export function roundRupee(v: number | null | undefined): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function safeMoney(v: number | null | undefined): number {
  return roundRupee(v);
}

function safeNum(v: number | null | undefined): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Map API/DB pack row to sumBookingLines input (includes hallRate once per pack). */
export function mapPackLineForSumBooking(pack: {
  ratePerPlate?: number | string | null;
  packCount?: number | null;
  noOfPack?: number | null;
  setupCost?: number | string | null;
  extraCharges?: number | string | null;
  hallRate?: number | string | null;
  hallRateValue?: number | null;
}): PackLine {
  const hallFromValue = Number(pack.hallRateValue);
  const hallFromField = Number(pack.hallRate);
  const hallRate = Number.isFinite(hallFromValue)
    ? hallFromValue
    : Number.isFinite(hallFromField)
      ? hallFromField
      : undefined;

  return {
    ratePerPlate: safeMoney(Number(pack.ratePerPlate)),
    packCount: pack.packCount,
    noOfPack: pack.noOfPack,
    setupCost: safeMoney(Number(pack.setupCost)),
    extraCharges: safeMoney(Number(pack.extraCharges)),
    hallRate,
  };
}

export function sumBookingLines(input: {
  halls: HallLine[];
  packs: PackLine[];
  additionalItems: AdditionalLine[];
}): number {
  const hallTableTotal = input.halls.reduce((s, h) => s + safeMoney(h.charges), 0);
  const packHallTotal = input.packs.reduce((s, p) => s + safeMoney(p.hallRate), 0);
  const hallTotal = packHallTotal > 0 ? packHallTotal : hallTableTotal;
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

export const BILLING_CEILING_EPSILON = 0.01;

export function exceedsBillingCeiling(value: number, ceiling: number): boolean {
  return safeMoney(value) - safeMoney(ceiling) > BILLING_CEILING_EPSILON;
}

export interface ResolveBookingFinancialsInput {
  totalAmount: number;
  discountPercentage?: number;
  discountAmountInput?: number;
  finalAmountInput?: number | null;
}

export interface ResolvedBookingFinancials {
  totalAmount: number;
  discountAmount: number;
  discountPercentage: number;
  grandTotal: number;
  finalAmountValue: number;
  exceededCeiling: boolean;
}

function deriveDiscountPercentForStorage(
  totalAmount: number,
  discountAmount: number
): number {
  if (totalAmount <= 0) return 0;
  return Math.round((discountAmount / totalAmount) * 10000) / 100;
}

export function resolveBookingFinancials(
  input: ResolveBookingFinancialsInput
): ResolvedBookingFinancials {
  const totalAmount = roundRupee(input.totalAmount);

  const hasAuthoritativeNet =
    input.finalAmountInput != null && input.finalAmountInput !== undefined;

  let discountAmount: number;
  let finalAmountValue: number;
  let discountPercentage: number;
  let exceededCeiling = false;

  if (hasAuthoritativeNet) {
    finalAmountValue = roundRupee(
      Math.min(Math.max(0, Number(input.finalAmountInput)), totalAmount)
    );
    discountAmount = roundRupee(Math.max(0, totalAmount - finalAmountValue));
    discountPercentage = deriveDiscountPercentForStorage(
      totalAmount,
      discountAmount
    );
    if (roundRupee(input.finalAmountInput) > totalAmount) {
      exceededCeiling = true;
    }
  } else {
    const inputDiscountPercent = Math.min(
      100,
      Math.max(0, safeNum(input.discountPercentage ?? 0))
    );
    if (inputDiscountPercent > 0) {
      discountAmount = roundRupee((totalAmount * inputDiscountPercent) / 100);
      discountPercentage = deriveDiscountPercentForStorage(
        totalAmount,
        discountAmount
      );
    } else {
      discountAmount = roundRupee(
        Math.min(safeMoney(input.discountAmountInput ?? 0), totalAmount)
      );
      discountPercentage = deriveDiscountPercentForStorage(
        totalAmount,
        discountAmount
      );
    }
    finalAmountValue = roundRupee(Math.max(0, totalAmount - discountAmount));
    const rawDiscountInput = roundRupee(input.discountAmountInput ?? 0);
    if (
      discountAmount > totalAmount ||
      rawDiscountInput > totalAmount ||
      (inputDiscountPercent > 0 &&
        roundRupee((totalAmount * inputDiscountPercent) / 100) > totalAmount)
    ) {
      exceededCeiling = true;
      discountAmount = Math.min(discountAmount, totalAmount);
      finalAmountValue = roundRupee(Math.max(0, totalAmount - discountAmount));
    }
  }

  const grandTotal = finalAmountValue;

  return {
    totalAmount,
    discountAmount,
    discountPercentage,
    grandTotal,
    finalAmountValue,
    exceededCeiling,
  };
}

export function assertFinancialsWithinCeiling(financials: {
  totalAmount: number;
  grandTotal: number;
  finalAmountValue: number;
}): void {
  if (
    exceedsBillingCeiling(financials.grandTotal, financials.totalAmount) ||
    exceedsBillingCeiling(financials.finalAmountValue, financials.totalAmount)
  ) {
    throw new Error('BOOKING_NET_EXCEEDS_BILL');
  }
}

/**
 * Cancel all pencil bookings whose pencilExpiresAt has passed.
 * Called on a schedule and before hall availability checks.
 */
export async function releasePencilBookings(): Promise<void> {
  try {
    const now = new Date();
    const expired = await prisma.booking.findMany({
      where: {
        isPencilBooking: true,
        pencilExpiresAt: { lt: now },
        status: { notIn: ['cancelled'] },
        isLatest: true,
      },
      select: { id: true },
    });
    if (expired.length === 0) return;

    await prisma.booking.updateMany({
      where: { id: { in: expired.map((b: { id: string }) => b.id) } },
      data: { status: 'cancelled', isPencilBooking: false },
    });

    expired.forEach((b: { id: string }) => {
      emitBookingBroadcast('booking:updated', { id: b.id, status: 'cancelled' });
      emitBookingCalendarCancel(b.id);
    });
    logger.info(`Released ${expired.length} expired pencil booking(s)`);
  } catch (err) {
    logger.error('releasePencilBookings error:', err);
  }
}
