/** Payment row fields used for due / credited calculations. */
export interface PaymentCreditRow {
  mode: string;
  amount: string;
  clearingDate: string;
}

/**
 * Cheques count toward due reduction only after a clearing date is entered and
 * that date is today or in the past. Non-cheque payments always count.
 */
export function paymentCountsTowardDue(
  payment: PaymentCreditRow,
  todayStr: string = new Date().toISOString().slice(0, 10)
): boolean {
  if (payment.mode.toLowerCase() !== 'cheque') return true;
  const clearing = payment.clearingDate?.trim();
  if (!clearing) return false;
  return clearing <= todayStr;
}

export function sumPaymentsTowardDue(
  payments: PaymentCreditRow[],
  todayStr: string = new Date().toISOString().slice(0, 10)
): number {
  return payments.reduce((sum, p) => {
    if (!paymentCountsTowardDue(p, todayStr)) return sum;
    const amount = parseFloat(p.amount) || 0;
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);
}

/** Total deposited (all modes), including cheques awaiting clearing date. */
export function sumAllPaymentAmounts(payments: PaymentCreditRow[]): number {
  return payments.reduce((sum, p) => {
    const amount = parseFloat(p.amount) || 0;
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);
}
