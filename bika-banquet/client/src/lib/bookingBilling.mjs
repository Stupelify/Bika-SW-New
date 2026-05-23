function toFiniteNumber(value) {
  const parsed = Number.parseFloat(String(value ?? '').trim());
  return Number.isFinite(parsed) ? parsed : null;
}

export function resolveGrandTotalFromFinalAmount(finalAmount, totalBillBase) {
  const parsedFinalAmount = toFiniteNumber(finalAmount);
  if (parsedFinalAmount !== null) {
    return Math.max(0, parsedFinalAmount);
  }

  const parsedBillBase = toFiniteNumber(totalBillBase);
  return Math.max(0, parsedBillBase ?? 0);
}

export function calculateDueAmount(finalAmount, totalBillBase, totalPayments) {
  return Math.max(
    0,
    resolveGrandTotalFromFinalAmount(finalAmount, totalBillBase) -
      Math.max(0, toFiniteNumber(totalPayments) ?? 0)
  );
}
