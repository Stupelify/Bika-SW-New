'use client';

import { FileText, Lock } from 'lucide-react';
import { formatDateDDMMYYYY, formatDateTimeLabel } from '@/lib/date';
import {
  computePackRowAmountFromApiPack,
  formatDiscountPercentDisplay,
  roundRupee,
} from '@bika/booking-core';
import { computeVersionDiff, histToSnapshot } from '@/lib/booking-form/version-history';

function VersionDiffPill({
  label,
  from,
  to,
  prefix = '',
  isNum = false,
}: {
  label: string;
  from: string | number;
  to: string | number;
  prefix?: string;
  isNum?: boolean;
}) {
  const numDelta = isNum ? Number(to) - Number(from) : 0;
  const up = isNum && numDelta > 0;
  const down = isNum && numDelta < 0;
  const baseStyle = isNum
    ? {
        background: '#2d1a00',
        color: '#fcd34d',
        border: '1px solid rgba(245, 158, 11, 0.35)',
      }
    : {
        background: 'var(--surface)',
        color: 'var(--text-2)',
        border: '1px solid var(--border)',
      };
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs"
      style={baseStyle}
    >
      <span style={{ fontWeight: 600, opacity: 0.8 }}>{label}:</span>
      <span style={{ textDecoration: 'line-through', opacity: 0.7 }}>
        {prefix}
        {typeof from === 'number' ? from.toLocaleString('en-IN') : from}
      </span>
      <span style={{ opacity: 0.7 }}>→</span>
      <span className={`font-semibold ${up ? 'text-green-200' : down ? 'text-red-200' : ''}`}>
        {prefix}{typeof to === 'number' ? to.toLocaleString('en-IN') : to}
      </span>
      {isNum && numDelta !== 0 && (
        <span className={`font-bold ${up ? 'text-green-200' : 'text-red-200'}`}>
          {up ? '▲' : '▼'}
          {Math.abs(numDelta).toLocaleString('en-IN')}
        </span>
      )}
    </span>
  );
}

export default function FinalizedVersionHistory({
  historicalVersions,
}: {
  historicalVersions: any[];
}) {
  if (historicalVersions.length === 0) return null;

  return (
            <div className="mt-8 space-y-6 border-t border-[var(--border)] pt-8">
              <h2 className="text-xl font-bold text-[var(--text-1)]">Finalized Version History</h2>
              <p className="text-sm text-[var(--text-4)] -mt-3">
                Previous immutable versions — always expanded so you can track every booking detail at each step.
              </p>
              {historicalVersions.map((hist: any, histIdx: number) => {
                const resolved = hist?.snapshotData && typeof hist.snapshotData === 'object'
                  ? hist.snapshotData
                  : hist;
                const historyPacks = Array.isArray(resolved?.packs) ? resolved.packs : [];
                const histPayments: any[] = Array.isArray(hist?.payments)
                  ? hist.payments
                  : Array.isArray(resolved?.payments)
                  ? resolved.payments
                  : [];
                const histAdditional: any[] = Array.isArray(hist?.additionalItems)
                  ? hist.additionalItems
                  : Array.isArray(resolved?.additionalItems)
                  ? resolved.additionalItems
                  : [];
                const finalizedBy =
                  hist?.finalizedMeta?.finalizedBy?.name ||
                  hist?.finalizedBooking?.finalizedByUser?.name ||
                  hist?.finalizedBooking?.user?.name ||
                  'System';
                const finalizedAt =
                  hist?.finalizedMeta?.finalizedAt ||
                  hist?.finalizedBooking?.finalizedAt ||
                  null;

                const histTotalPackAmount = historyPacks.reduce(
                  (sum: number, pack: any) => sum + computePackRowAmountFromApiPack(pack),
                  0
                );
                const histTotalAdditional = histAdditional.reduce((sum: number, item: any) => {
                  const amt = Number(item?.charges ?? item?.amount ?? 0);
                  return sum + (Number.isFinite(amt) ? Math.max(0, amt) : 0);
                }, 0);
                const histTotalBill = roundRupee(histTotalPackAmount + histTotalAdditional);
                const histFinalAmount = roundRupee(
                  Number(
                    resolved?.finalAmountValue ??
                      resolved?.finalAmount ??
                      hist?.finalAmount ??
                      resolved?.grandTotal ??
                      hist?.grandTotal ??
                      histTotalBill
                  )
                );
                const histDiscountAmount = roundRupee(
                  Math.max(0, histTotalBill - histFinalAmount)
                );
                const histDiscountPercent = Number(
                  formatDiscountPercentDisplay(
                    histTotalBill > 0 ? (histDiscountAmount / histTotalBill) * 100 : 0
                  )
                );
                const histAdvanceRequired = Number(
                  resolved?.advanceRequiredValue ?? resolved?.advanceRequired ?? hist?.advanceRequired ?? 0
                );
                const histDueAmount = Number(
                  resolved?.dueAmountValue ?? resolved?.dueAmount ?? hist?.dueAmount ?? 0
                );
                const histNotes: string = resolved?.notes || hist?.notes || '';
                const histTotalPayments = histPayments.reduce((sum: number, p: any) => {
                  const amt = Number(p?.amount ?? p?.amountValue ?? 0);
                  return sum + (Number.isFinite(amt) ? amt : 0);
                }, 0);
                const histCustomerName =
                  resolved?.customer?.name ||
                  resolved?.customerName ||
                  hist?.customer?.name ||
                  'Unknown';
                const histCustomerPhone =
                  resolved?.customer?.phone ||
                  resolved?.customerPhone ||
                  hist?.customer?.phone ||
                  '-';
                const histFunctionDate = resolved?.functionDate
                  ? formatDateDDMMYYYY(resolved.functionDate)
                  : '-';
                const histTimeRange = (() => {
                  const start = resolved?.startTime || resolved?.functionTime || '';
                  const end = resolved?.endTime || '';
                  if (start && end) return `${start} - ${end}`;
                  return start || end || '-';
                })();
                const hallNames = (Array.isArray(resolved?.halls) ? resolved.halls : [])
                  .map((entry: any) => entry?.hall?.name || entry?.hallName)
                  .filter(Boolean);
                const banquetNames = (Array.isArray(resolved?.halls) ? resolved.halls : [])
                  .map((entry: any) => entry?.hall?.banquet?.name)
                  .filter(Boolean);

                return (
                  <div key={hist.id} className="rounded-xl border-2 border-[var(--border-2)] bg-[var(--surface)] shadow-sm overflow-hidden">
                    {/* ── Version header ── */}
                    <div className="flex items-center justify-between gap-3 bg-[var(--surface-2)] px-5 py-3 border-b border-[var(--border)]">
                      <div>
                        <p className="text-sm font-bold text-[var(--text-1)]">
                          Version {hist.versionNumber}
                          <span className="ml-2 inline-flex items-center rounded-full bg-[var(--surface-3)] px-2 py-0.5 text-xs font-medium text-[var(--text-2)]">
                            {hist.status}
                          </span>
                        </p>
                        <p className="text-xs text-[var(--text-4)] mt-0.5">
                          Finalized by <strong>{finalizedBy}</strong> on {formatDateTimeLabel(finalizedAt)}
                        </p>
                      </div>
                      <Lock className="w-4 h-4 text-[var(--text-4)] flex-shrink-0" />
                    </div>

                    {/* ── Inter-version diff summary ── */}
                    {(() => {
                      const prevHist = historicalVersions[histIdx + 1];
                      if (!prevHist) return null;
                      const thisDiff = computeVersionDiff(
                        histToSnapshot(hist),
                        histToSnapshot(prevHist)
                      );
                      const hasAnyDiff =
                        thisDiff.functionDate ||
                        thisDiff.functionType ||
                        thisDiff.discountAmountChange ||
                        thisDiff.finalAmountChange ||
                        thisDiff.advanceRequiredChange ||
                        thisDiff.dueAmountChange ||
                        Object.keys(thisDiff.packs).length > 0;
                      if (!hasAnyDiff) return null;

                      // Collect all menu item names for this lookup
                      const allMenuItemsForDiff = new Map<string, string>();
                      historyPacks.forEach((pack: any) => {
                        (pack?.bookingMenu?.items || []).forEach((entry: any) => {
                          const id = entry?.itemId || entry?.item?.id;
                          const name = entry?.item?.name;
                          if (id && name) allMenuItemsForDiff.set(id, name);
                        });
                      });

                      return (
                        <div className="px-5 pt-3 pb-0">
                          <div className="rounded-lg border border-blue-100 bg-blue-50 dark:bg-blue-500/10 p-3 space-y-2">
                            <p className="text-xs font-semibold text-blue-700 dark:text-blue-200 uppercase tracking-wide">
                              Changes from v{historicalVersions[histIdx + 1]?.versionNumber ?? '?'}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {thisDiff.functionDate && (
                                <VersionDiffPill label="Date" from={thisDiff.functionDate.from} to={thisDiff.functionDate.to} />
                              )}
                              {thisDiff.functionType && (
                                <VersionDiffPill label="Function" from={thisDiff.functionType.from} to={thisDiff.functionType.to} />
                              )}
                              {thisDiff.finalAmountChange && (
                                <VersionDiffPill label="Net Amount" prefix="₹" from={thisDiff.finalAmountChange.from} to={thisDiff.finalAmountChange.to} isNum />
                              )}
                              {thisDiff.discountAmountChange && (
                                <VersionDiffPill label="Discount" prefix="₹" from={thisDiff.discountAmountChange.from} to={thisDiff.discountAmountChange.to} isNum />
                              )}
                              {thisDiff.advanceRequiredChange && (
                                <VersionDiffPill label="Advance" prefix="₹" from={thisDiff.advanceRequiredChange.from} to={thisDiff.advanceRequiredChange.to} isNum />
                              )}
                              {thisDiff.dueAmountChange && (
                                <VersionDiffPill label="Due" prefix="₹" from={thisDiff.dueAmountChange.from} to={thisDiff.dueAmountChange.to} isNum />
                              )}
                              {Object.entries(thisDiff.packs).map(([packKey, pd]) => (
                                <span key={`diff-pack-${packKey}`} className="inline-flex flex-wrap gap-1 contents">
                                  {pd.paxChange && (
                                    <VersionDiffPill label={`${packKey} PAX`} from={pd.paxChange.from} to={pd.paxChange.to} isNum />
                                  )}
                                  {pd.ratePerPlateChange && (
                                    <VersionDiffPill label={`${packKey} Rate`} prefix="₹" from={pd.ratePerPlateChange.from} to={pd.ratePerPlateChange.to} isNum />
                                  )}
                                  {pd.hallRateChange && (
                                    <VersionDiffPill label={`${packKey} Hall`} prefix="₹" from={pd.hallRateChange.from} to={pd.hallRateChange.to} isNum />
                                  )}
                                  {pd.addedItemIds.map((id) => (
                                    <span
                                      key={`add-${id}`}
                                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                                      style={{
                                        background: '#052e16',
                                        color: '#86efac',
                                        border: '1px solid rgba(34, 197, 94, 0.4)',
                                      }}
                                    >
                                      + {allMenuItemsForDiff.get(id) || id}
                                    </span>
                                  ))}
                                  {pd.removedItemIds.map((id) => (
                                    <span
                                      key={`rem-${id}`}
                                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                                      style={{
                                        background: '#2d0a0a',
                                        color: '#fca5a5',
                                        border: '1px solid rgba(239, 68, 68, 0.4)',
                                      }}
                                    >
                                      − {allMenuItemsForDiff.get(id) || id}
                                    </span>
                                  ))}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="px-5 py-4 space-y-6">
                      {/* ── Core info (form-style, read-only) ── */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="label">Customer</label>
                          <input className="input" value={histCustomerName} readOnly />
                        </div>
                        <div>
                          <label className="label">Customer Phone</label>
                          <input className="input" value={histCustomerPhone} readOnly />
                        </div>
                        <div>
                          <label className="label">Function Type</label>
                          <input className="input" value={resolved?.functionType || '-'} readOnly />
                        </div>
                        <div>
                          <label className="label">Function Name</label>
                          <input className="input" value={resolved?.functionName || '-'} readOnly />
                        </div>
                        <div>
                          <label className="label">Function Date</label>
                          <input className="input" value={histFunctionDate} readOnly />
                        </div>
                        <div>
                          <label className="label">Time</label>
                          <input className="input" value={histTimeRange} readOnly />
                        </div>
                        <div>
                          <label className="label">Expected Guests</label>
                          <input
                            className="input"
                            value={resolved?.expectedGuests ?? hist?.expectedGuests ?? '-'}
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="label">Confirmed Guests</label>
                          <input
                            className="input"
                            value={resolved?.confirmedGuests ?? hist?.confirmedGuests ?? 0}
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="label">Banquet</label>
                          <input
                            className="input"
                            value={banquetNames.length > 0 ? banquetNames.join(', ') : '-'}
                            readOnly
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="label">Halls</label>
                          <input
                            className="input"
                            value={hallNames.length > 0 ? hallNames.join(', ') : '-'}
                            readOnly
                          />
                        </div>
                      </div>

                      {/* ── Packs ── */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-[var(--text-1)] border-b border-[var(--border)] pb-1">Packs</h4>
                        {historyPacks.length === 0 ? (
                          <div className="empty-state" style={{ padding: '16px 12px' }}>
                            <div className="empty-state-icon">
                              <FileText size={20} />
                            </div>
                            <p className="empty-state-title">No packs recorded</p>
                            <p className="empty-state-desc">No menu packs were saved in this version.</p>
                          </div>
                        ) : (
                          historyPacks.map((pack: any) => {
                            const hallRate = Number(pack?.hallRateValue ?? pack?.hallRate ?? 0);
                            const ratePerPlate = Number(pack?.ratePerPlate || 0);
                            const pax = Number(pack?.packCount ?? pack?.noOfPack ?? 0);
                            const extraPlate = Number(pack?.extraPlate || 0);
                            const computedAmount = computePackRowAmountFromApiPack(pack);
                            const menuItems = Array.isArray(pack?.bookingMenu?.items)
                              ? pack.bookingMenu.items
                              : [];
                            const hallNames: string[] = Array.isArray(pack?.halls)
                              ? pack.halls.map((h: any) => h?.hall?.name || h?.name || '').filter(Boolean)
                              : pack?.hallName
                              ? [pack.hallName]
                              : [];

                            return (
                              <div
                                key={pack.id || `${hist.id}-${pack.packName}`}
                                className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-4 space-y-3"
                              >
                                {/* Pack header row */}
                                <div className="flex flex-wrap items-center gap-3">
                                  <span className="text-sm font-bold text-[var(--text-1)]">
                                    {pack.packName}
                                    {pack.timeSlot ? ` (${pack.timeSlot})` : ''}
                                  </span>
                                  {pack.withHall !== undefined && (
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${pack.withHall ? 'bg-blue-100 text-blue-700 dark:text-blue-200' : 'bg-[var(--surface-3)] text-[var(--text-4)]'}`}>
                                      Hall {pack.withHall ? '✓' : '✗'}
                                    </span>
                                  )}
                                  {pack.withCatering !== undefined && (
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${pack.withCatering ? 'bg-green-100 text-green-700 dark:text-green-200' : 'bg-[var(--surface-3)] text-[var(--text-4)]'}`}>
                                      Catering {pack.withCatering ? '✓' : '✗'}
                                    </span>
                                  )}
                                </div>

                                {/* Pack numbers (form-style, read-only) */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                                  <div>
                                    <label className="label">PAX</label>
                                    <input className="input" value={pax} readOnly />
                                  </div>
                                  <div>
                                    <label className="label">Rate / Plate</label>
                                    <input
                                      className="input"
                                      value={`₹${ratePerPlate.toLocaleString('en-IN')}`}
                                      readOnly
                                    />
                                  </div>
                                  <div>
                                    <label className="label">Hall Rate</label>
                                    <input
                                      className="input"
                                      value={`₹${hallRate.toLocaleString('en-IN')}`}
                                      readOnly
                                    />
                                  </div>
                                  <div>
                                    <label className="label">Extra Plates</label>
                                    <input className="input" value={extraPlate} readOnly />
                                  </div>
                                  <div>
                                    <label className="label">Pack Amount</label>
                                    <input
                                      className="input font-semibold text-blue-700 dark:text-blue-200"
                                      value={`₹${computedAmount.toLocaleString('en-IN')}`}
                                      readOnly
                                    />
                                  </div>
                                </div>

                                {/* Hall names */}
                                {hallNames.length > 0 && (
                                  <p className="text-xs text-[var(--text-2)]">
                                    <span className="font-medium">Halls: </span>
                                    {hallNames.join(', ')}
                                  </p>
                                )}

                                {/* Menu items */}
                                <div>
                                  <p className="text-xs font-medium text-[var(--text-2)] mb-1">Menu Items</p>
                                  {menuItems.length === 0 ? (
                                    <span className="text-xs text-[var(--text-4)]">No menu items saved.</span>
                                  ) : (
                                    <div className="flex flex-wrap gap-1.5">
                                      {menuItems.map((entry: any) => (
                                        <span
                                          key={`${pack.id}-${entry.itemId || entry.item?.id}`}
                                          className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-0.5 text-xs text-[var(--text-2)]"
                                        >
                                          {entry?.item?.itemType?.name
                                            ? <><span className="text-[var(--text-4)] mr-1">{entry.item.itemType.name}:</span></>
                                            : null}
                                          {entry?.item?.name || 'Item'}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* ── Additional Requirements ── */}
                      {histAdditional.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-[var(--text-1)] border-b border-[var(--border)] pb-1">Additional Requirements</h4>
                          <div className="rounded-lg border border-[var(--border)] overflow-hidden">
                            <div className="grid grid-cols-[1fr,auto] bg-[var(--surface-2)] px-3 py-2 text-xs font-semibold text-[var(--text-2)]">
                              <div>Description</div>
                              <div className="text-right">Amount</div>
                            </div>
                            {histAdditional.map((item: any, idx: number) => (
                              <div key={`hist-add-${hist.id}-${idx}`} className="grid grid-cols-[1fr,auto] px-3 py-2 text-sm border-t border-[var(--border)] bg-[var(--surface)]">
                                <span className="text-[var(--text-1)]">{item?.description || '-'}</span>
                                <span className="text-right font-medium text-[var(--text-1)]">
                                  ₹{Number(item?.charges ?? item?.amount ?? 0).toLocaleString('en-IN')}
                                </span>
                              </div>
                            ))}
                            <div className="grid grid-cols-[1fr,auto] px-3 py-2 bg-[var(--surface-2)] border-t border-[var(--border)] text-sm font-semibold text-[var(--text-2)]">
                              <span>Additional Total</span>
                              <span className="text-right">₹{histTotalAdditional.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ── Payments ── */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-[var(--text-1)] border-b border-[var(--border)] pb-1">Payments</h4>
                        {histPayments.length === 0 ? (
                          <div className="empty-state" style={{ padding: '16px 12px' }}>
                            <div className="empty-state-icon">
                              <FileText size={20} />
                            </div>
                            <p className="empty-state-title">No payments recorded</p>
                            <p className="empty-state-desc">Payments will appear here once logged.</p>
                          </div>
                        ) : (
                          <div className="rounded-lg border border-[var(--border)] overflow-hidden">
                            <div className="hidden md:grid md:grid-cols-5 bg-[var(--surface-2)] px-3 py-2 text-xs font-semibold text-[var(--text-2)]">
                              <div>Mode</div>
                              <div>Narration</div>
                              <div>Date</div>
                              <div>Received By</div>
                              <div className="text-right">Amount</div>
                            </div>
                            {histPayments.map((payment: any, idx: number) => (
                              <div key={`hist-pay-${hist.id}-${idx}`} className="grid grid-cols-2 md:grid-cols-5 gap-1 px-3 py-2 text-sm border-t border-[var(--border)] bg-[var(--surface)]">
                                <span className="text-[var(--text-1)] font-medium">{payment?.method || payment?.paymentMethod || payment?.mode || '-'}</span>
                                <span className="text-[var(--text-2)]">{payment?.narration || '-'}</span>
                                <span className="text-[var(--text-2)]">{payment?.paymentDate ? formatDateDDMMYYYY(payment.paymentDate.slice(0, 10)) : payment?.date ? formatDateDDMMYYYY(payment.date) : '-'}</span>
                                <span className="text-[var(--text-2)]">{payment?.receiver?.name || payment?.receivedBy || '-'}</span>
                                <span className="text-right font-semibold text-[var(--text-1)]">₹{Number(payment?.amount ?? payment?.amountValue ?? 0).toLocaleString('en-IN')}</span>
                              </div>
                            ))}
                            <div className="flex items-center justify-between px-3 py-2 bg-[var(--surface-2)] border-t border-[var(--border)] text-sm font-semibold text-[var(--text-2)]">
                              <span>Total Payments</span>
                              <span>₹{histTotalPayments.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ── Amount Summary ── */}
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 space-y-2">
                        <h4 className="text-sm font-semibold text-[var(--text-1)] mb-3">Amount Summary</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                          <div>
                            <span className="text-xs text-[var(--text-4)] block">Total Bill</span>
                            <span className="font-semibold text-[var(--text-1)]">₹{histTotalBill.toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <span className="text-xs text-[var(--text-4)] block">Discount ({histDiscountPercent.toFixed(2)}%)</span>
                            <span className="font-semibold text-red-700 dark:text-red-200">−₹{histDiscountAmount.toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <span className="text-xs text-[var(--text-4)] block">Net Amount</span>
                            <span className="font-bold text-green-800 dark:text-green-200 text-base">₹{histFinalAmount.toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <span className="text-xs text-[var(--text-4)] block">Advance Required</span>
                            <span className="font-semibold text-[var(--text-1)]">₹{histAdvanceRequired.toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <span className="text-xs text-[var(--text-4)] block">Due Amount</span>
                            <span className="font-semibold text-[var(--text-1)]">₹{histDueAmount.toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <span className="text-xs text-[var(--text-4)] block">Payments Received</span>
                            <span className="font-semibold text-[var(--text-1)]">₹{histTotalPayments.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>

                      {/* ── Notes ── */}
                      {histNotes && (
                        <div>
                          <h4 className="text-sm font-semibold text-[var(--text-1)] border-b border-[var(--border)] pb-1 mb-2">Notes</h4>
                          <p className="text-sm text-[var(--text-2)] whitespace-pre-wrap rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-100 p-3">{histNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

  );
}
