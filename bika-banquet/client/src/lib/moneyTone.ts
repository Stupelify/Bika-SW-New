export type MoneyTone = 'pos' | 'neg' | 'warn' | 'neutral';

export interface MoneyToneOptions {
  /** When true, a positive amount represents money still owed (a warning), not income. */
  outstanding?: boolean;
}

export function moneyTone(amount: number, opts: MoneyToneOptions = {}): MoneyTone {
  if (!Number.isFinite(amount) || amount === 0) return 'neutral';
  if (opts.outstanding) return amount > 0 ? 'warn' : 'neutral';
  return amount > 0 ? 'pos' : 'neg';
}

export function moneyToneClass(amount: number, opts: MoneyToneOptions = {}): string {
  const tone = moneyTone(amount, opts);
  return tone === 'neutral' ? '' : `money-${tone}`;
}
