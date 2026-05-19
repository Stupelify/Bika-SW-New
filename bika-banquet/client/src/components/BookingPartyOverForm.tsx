'use client';

import { useState } from 'react';
import { Flag, Lock } from 'lucide-react';

interface Props {
  booking: any | null;
  functionDate: string;
  discountPercent: number;
  isPartyOverSubmitted: boolean;
  saving: boolean;
  onSubmit: (payload: {
    packs: Array<{ bookingPackId: string; extraPlate: number; extraRate: number }>;
    settlementDiscountPercent: number;
    settlementDiscountAmount: number;
    settlementTotalAmount: number;
  }) => Promise<void>;
}

function isDateReached(functionDate: string): boolean {
  if (!functionDate) return false;
  const funcDay = new Date(functionDate);
  funcDay.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return funcDay.getTime() <= today.getTime();
}

export default function BookingPartyOverForm({
  booking, functionDate, discountPercent, isPartyOverSubmitted, saving, onSubmit,
}: Props) {
  const [actualPax, setActualPax] = useState<Record<string, string>>({});
  const [settlementDiscountPct, setSettlementDiscountPct] = useState('0');

  const unlocked = isDateReached(functionDate);
  const packs: any[] = booking?.packs || [];

  const discRate = (rpp: number) => rpp * (1 - discountPercent / 100);

  const rows = packs.map((pack) => {
    const qr = pack.ratePerPlate ?? 0;
    const dr = discRate(qr);
    const mgPax = pack.packCount ?? pack.noOfPack ?? 0;
    const existingExtra = pack.extraPlate ?? 0;
    const defaultActual = mgPax + existingExtra;
    const actualStr = actualPax[pack.id] ?? String(defaultActual);
    const actualP = parseInt(actualStr) || defaultActual;
    const billedP = Math.max(mgPax, actualP);
    const discAmt = dr * mgPax;
    const billedAmt = dr * billedP;
    return { pack, qr, dr, mgPax, actualP, billedP, discAmt, billedAmt };
  });

  const totalDiscAmt = rows.reduce((s, r) => s + r.discAmt, 0);
  const totalBilledAmt = rows.reduce((s, r) => s + r.billedAmt, 0);
  const settlePct = parseFloat(settlementDiscountPct) || 0;
  const settleDiscAmt = totalBilledAmt * (settlePct / 100);
  const settleTotalAmt = totalBilledAmt - settleDiscAmt;

  const fmt = (n: number) => Math.round(n).toLocaleString('en-IN');

  const handleSubmit = async () => {
    if (!window.confirm('Mark party as over? ALL booking versions will be permanently locked. This cannot be undone.')) return;
    await onSubmit({
      packs: rows.map((r) => ({
        bookingPackId: r.pack.id,
        extraPlate: Math.max(0, r.billedP - r.mgPax),
        extraRate: r.dr,
      })),
      settlementDiscountPercent: settlePct,
      settlementDiscountAmount: settleDiscAmt,
      settlementTotalAmount: settleTotalAmt,
    });
  };

  if (isPartyOverSubmitted) {
    return (
      <div className="rounded-xl border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-500/10 p-4">
        <p className="text-sm font-medium text-green-800 dark:text-green-300 flex items-center gap-2">
          <Flag className="w-4 h-4" /> Party finalized. All versions are permanently locked.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Flag className="w-4 h-4 text-red-500" />
          <h3 className="text-lg font-semibold text-[var(--text-1)]">Party Over</h3>
        </div>
        {!unlocked && (
          <div className="flex items-center gap-1.5 rounded-full border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-500/10 px-3 py-1 text-xs text-amber-700 dark:text-amber-300">
            <Lock className="w-3 h-3" />
            Editable from {functionDate ? new Date(functionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
          </div>
        )}
      </div>

      {packs.length === 0 && (
        <div className="rounded-xl border border-[var(--border)] p-8 text-center text-sm text-[var(--text-4)]">
          No packs configured on this booking.
        </div>
      )}

      {packs.length > 0 && (
        <>
          <div className={`rounded-xl border border-[var(--border-2)] overflow-hidden${!unlocked ? ' opacity-60' : ''}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-[var(--surface-3)] border-b border-[var(--border)]">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--text-2)] whitespace-nowrap">Agreement</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--text-2)] whitespace-nowrap">Menu pts</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--text-2)] whitespace-nowrap">Quote Rate</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--text-2)] whitespace-nowrap">Disc %</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--text-2)] whitespace-nowrap">Disc Rate</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-orange-700 dark:text-orange-300 whitespace-nowrap bg-orange-50 dark:bg-orange-900/20">Disc Amt</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--text-2)] whitespace-nowrap">MG Pax</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-primary-700 dark:text-primary-400 whitespace-nowrap">Actual Pax ✏</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--text-2)] whitespace-nowrap">Billed Pax</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--text-1)] whitespace-nowrap">Billed Amt</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ pack, qr, dr, mgPax, actualP, billedP, discAmt, billedAmt }) => (
                    <tr key={pack.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-2)]">
                      <td className="px-3 py-2 font-medium text-[var(--text-1)] whitespace-nowrap">{pack.packName}</td>
                      <td className="px-3 py-2 text-right text-[var(--text-2)]">{pack.menuPoint ?? 0}</td>
                      <td className="px-3 py-2 text-right text-[var(--text-2)]">{fmt(qr)}</td>
                      <td className="px-3 py-2 text-right text-[var(--text-2)]">{discountPercent.toFixed(2)}%</td>
                      <td className="px-3 py-2 text-right text-[var(--text-2)]">{fmt(dr)}</td>
                      <td className="px-3 py-2 text-right font-medium bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200">
                        {fmt(discAmt)}
                      </td>
                      <td className="px-3 py-2 text-right text-[var(--text-2)]">{mgPax}</td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="number"
                          min={0}
                          disabled={!unlocked}
                          className="input py-1 text-sm w-24 text-center disabled:bg-[var(--surface-2)] disabled:cursor-not-allowed"
                          value={actualPax[pack.id] ?? String(actualP)}
                          onChange={(e) =>
                            setActualPax((prev) => ({ ...prev, [pack.id]: e.target.value }))
                          }
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-[var(--text-1)]">{billedP}</td>
                      <td className="px-3 py-2 text-right font-semibold text-[var(--text-1)]">{fmt(billedAmt)}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-[var(--border)] bg-[var(--surface-2)] dark:bg-[var(--surface-3)]">
                    <td colSpan={5} className="px-3 py-2 text-right text-xs font-semibold text-[var(--text-3)]">Totals</td>
                    <td className="px-3 py-2 text-right font-semibold bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200">
                      {fmt(totalDiscAmt)}
                    </td>
                    <td colSpan={3} />
                    <td className="px-3 py-2 text-right font-bold text-[var(--text-1)]">{fmt(totalBilledAmt)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Settlement */}
          <div className={`rounded-xl border border-[var(--border-2)] p-4 space-y-3${!unlocked ? ' opacity-60' : ''}`}>
            <p className="text-sm font-semibold text-[var(--text-1)]">Settlement</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <label className="text-xs text-[var(--text-4)] block mb-1">Settlement Discount %</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  disabled={!unlocked}
                  className="input py-1 text-sm disabled:bg-[var(--surface-2)] disabled:cursor-not-allowed"
                  value={settlementDiscountPct}
                  onChange={(e) => setSettlementDiscountPct(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-[var(--text-4)] block mb-1">Settlement Discount Amt</label>
                <div className="input py-1 text-sm bg-[var(--surface-2)] cursor-not-allowed text-[var(--text-2)]">
                  ₹{fmt(settleDiscAmt)}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-[var(--text-4)] block mb-1">Settlement Amount</label>
                <div className="input py-1 text-sm bg-[var(--surface-2)] cursor-not-allowed font-semibold text-[var(--text-1)]">
                  ₹{fmt(settleTotalAmt)}
                </div>
              </div>
            </div>
          </div>

          {unlocked && (
            <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-500/10 p-3">
              <p className="text-xs text-red-700 dark:text-red-200">
                ⚠ Marking party as over permanently locks ALL booking versions. This action cannot be reversed. Please enter actual pax as used.
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              className="btn bg-red-600 hover:bg-red-700 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={saving || !unlocked}
              onClick={handleSubmit}
            >
              <span className="inline-flex items-center gap-2">
                {!unlocked && <Lock className="w-4 h-4" />}
                {unlocked && <Flag className="w-4 h-4" />}
                {saving ? 'Processing…' : !unlocked ? 'Locked' : 'Settle & Lock Party'}
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
