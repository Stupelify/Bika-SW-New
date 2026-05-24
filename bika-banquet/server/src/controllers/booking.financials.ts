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

export function resolveBookingFinancials(
  input: ResolveBookingFinancialsInput
): ResolvedBookingFinancials {
  const totalAmount = safeMoney(input.totalAmount);
  const discountPercentage = Math.min(
    100,
    Math.max(0, safeNum(input.discountPercentage ?? 0))
  );

  let rawDiscount = safeMoney(input.discountAmountInput ?? 0);
  if (discountPercentage > 0) {
    rawDiscount = safeMoney((totalAmount * discountPercentage) / 100);
  }

  const discountExceeded = exceedsBillingCeiling(rawDiscount, totalAmount);
  const discountAmount = safeMoney(Math.min(rawDiscount, totalAmount));
  const grandTotal = safeMoney(Math.max(0, totalAmount - discountAmount));

  const rawFinal =
    input.finalAmountInput != null && input.finalAmountInput !== undefined
      ? safeMoney(input.finalAmountInput)
      : grandTotal;
  const finalExceeded =
    exceedsBillingCeiling(rawFinal, totalAmount) ||
    exceedsBillingCeiling(rawFinal, grandTotal);
  const finalAmountValue = safeMoney(
    Math.min(rawFinal, grandTotal, totalAmount)
  );

  return {
    totalAmount,
    discountAmount,
    discountPercentage,
    grandTotal,
    finalAmountValue,
    exceededCeiling: discountExceeded || finalExceeded,
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
