'use client';

interface PackSummary {
  ratePerPlate: number;
  packCount: number;
}

interface PaymentRow {
  mode: string;
  amount: string;
  clearingDate: string;
}

interface Props {
  packs: PackSummary[];
  payments: PaymentRow[];
  functionDate: string;
  discountPercent: number;
  isPartyOver: boolean;
  totalBilledAmount?: number;
  settlementTotalAmount?: number;
  settlementDiscountAmount?: number;
}

function getDuePercent(functionDate: string, isPartyOver: boolean): number {
  if (isPartyOver) return 100;
  if (!functionDate) return 40;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const funcDay = new Date(functionDate);
  funcDay.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((funcDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= 2 ? 100 : 40;
}

export default function BookingFinancialSummary({
  packs, payments, functionDate, discountPercent,
  isPartyOver, totalBilledAmount, settlementTotalAmount, settlementDiscountAmount,
}: Props) {
  const discRate = (rpp: number) => rpp * (1 - discountPercent / 100);

  const totalQuoteAmount = packs.reduce((sum, p) => sum + p.ratePerPlate * p.packCount, 0);
  const totalDiscountedAmount = packs.reduce((sum, p) => sum + discRate(p.ratePerPlate) * p.packCount, 0);

  const todayStr = new Date().toISOString().slice(0, 10);
  const credited = payments.reduce((sum, p) => {
    if (p.mode.toLowerCase() === 'cheque' && p.clearingDate && p.clearingDate > todayStr) return sum;
    return sum + (parseFloat(p.amount) || 0);
  }, 0);

  const duePercent = getDuePercent(functionDate, isPartyOver);

  let currentDueBasis = totalDiscountedAmount;
  let currentDueLabel = `${duePercent}% of Discounted Amount`;

  if (isPartyOver) {
    if (settlementTotalAmount !== undefined) {
      currentDueBasis = settlementTotalAmount;
      currentDueLabel = '100% of Settlement Amount';
    } else if (totalBilledAmount !== undefined) {
      currentDueBasis = totalBilledAmount;
      currentDueLabel = '100% of Billed Amount';
    }
  }

  const currentDue = currentDueBasis * (duePercent / 100);
  const amountShort = Math.max(0, currentDue - credited);

  const receivedPercent = totalDiscountedAmount > 0
    ? ((credited / totalDiscountedAmount) * 100).toFixed(0)
    : '0';
  const shortPercent = totalDiscountedAmount > 0
    ? ((amountShort / totalDiscountedAmount) * 100).toFixed(0)
    : '0';

  const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 0 });

  return (
    <div className="rounded-xl border border-[var(--border-2)] overflow-hidden">
      <div className="bg-slate-100 dark:bg-[var(--surface-3)] px-4 py-2 border-b border-[var(--border)]">
        <span className="text-xs font-semibold text-[var(--text-2)]">Financial Summary</span>
      </div>
      <div className="p-4 space-y-1.5 text-sm">
        <div className="flex justify-between text-[var(--text-2)]">
          <span>Total Quote Amount</span>
          <span>₹{fmt(totalQuoteAmount)}</span>
        </div>
        <div className="flex justify-between text-[var(--text-2)]">
          <span>Total Discounted Amount ({discountPercent.toFixed(2)}%)</span>
          <span>₹{fmt(totalDiscountedAmount)}</span>
        </div>
        {totalBilledAmount !== undefined && (
          <div className="flex justify-between text-[var(--text-2)]">
            <span>Total Billed Amount</span>
            <span>₹{fmt(totalBilledAmount)}</span>
          </div>
        )}
        {settlementDiscountAmount !== undefined && (
          <div className="flex justify-between text-[var(--text-2)]">
            <span>Settlement Discount</span>
            <span>₹{fmt(settlementDiscountAmount)}</span>
          </div>
        )}
        {settlementTotalAmount !== undefined && (
          <div className="flex justify-between font-medium text-[var(--text-1)]">
            <span>Total Settlement Amount</span>
            <span>₹{fmt(settlementTotalAmount)}</span>
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-[var(--border)] rounded-lg bg-[var(--surface-2)] dark:bg-[var(--surface-3)] px-3 py-2.5 space-y-1.5">
          <div className="flex justify-between font-medium text-[var(--text-1)]">
            <span>Current Due <span className="text-xs font-normal text-[var(--text-4)]">({currentDueLabel})</span></span>
            <span>₹{fmt(currentDue)}</span>
          </div>
          <div className="flex justify-between text-green-700 dark:text-green-400">
            <span>Received ({receivedPercent}%)</span>
            <span>₹{fmt(credited)}</span>
          </div>
          <div className={`flex justify-between font-semibold ${amountShort > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
            <span>Amount Short ({shortPercent}%)</span>
            <span>₹{fmt(amountShort)}</span>
          </div>
        </div>

        <p className="text-xs text-[var(--text-4)] mt-2 leading-relaxed">
          Before party: 40% of discounted amount due up to 2 days before, then 100% due.
          After party over: billed amount is 100% due. After settlement: settlement amount is 100% due.
          Cheques not credited until clearing date.
        </p>
      </div>
    </div>
  );
}
