'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

interface PaymentRow {
  id?: string;
  mode: string;
  narration: string;
  date: string;
  receivedBy: string;
  amount: string;
  reference: string;
  clearingDate: string;
  _original?: {
    mode: string; narration: string; date: string; receivedBy: string;
    amount: string; reference: string; clearingDate: string;
  };
}

interface Props {
  payments: PaymentRow[];
  isReadOnly: boolean;
  advanceReceived?: number;  // DB-authoritative total (may include prior version payments)
  onAdd: (payment: PaymentRow) => void;
  onUpdate: (index: number, patch: Partial<PaymentRow>) => void;
  onRemove: (index: number) => void;
}

const PAYMENT_MODES: { value: string; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'card', label: 'Card' },
  { value: 'upi', label: 'Online (UPI)' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

const emptyDraft = (): PaymentRow => ({
  mode: 'cash', amount: '', date: todayStr(), receivedBy: '',
  narration: '', reference: '', clearingDate: '',
});

export default function BookingPaymentsLedger({
  payments, isReadOnly, advanceReceived, onAdd, onUpdate, onRemove,
}: Props) {
  const [showDraft, setShowDraft] = useState(false);
  const [draft, setDraft] = useState<PaymentRow>(emptyDraft());

  const handleAddConfirm = () => {
    if (!draft.amount || !draft.date) return;
    onAdd({ ...draft });
    setDraft(emptyDraft());
    setShowDraft(false);
  };

  const todayDate = new Date().toISOString().slice(0, 10);
  const credited = payments.reduce((sum, p) => {
    if (p.mode.toLowerCase() === 'cheque' && p.clearingDate && p.clearingDate > todayDate) return sum;
    return sum + (parseFloat(p.amount) || 0);
  }, 0);
  const totalReceived = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const pendingCheques = totalReceived - credited;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--text-1)]">Payments Ledger</h3>
        {!isReadOnly && (
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full border border-primary-600 px-3 py-1 text-xs font-medium text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20"
            onClick={() => { setDraft(emptyDraft()); setShowDraft(true); }}
          >
            <Plus className="w-3 h-3" /> Add Payment
          </button>
        )}
      </div>

      <div className="rounded-xl border border-[var(--border-2)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-100 dark:bg-[var(--surface-3)] border-b border-[var(--border)]">
                <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--text-2)] whitespace-nowrap">Date</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--text-2)] whitespace-nowrap">Method</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--text-2)] whitespace-nowrap">Ledger</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--text-2)] whitespace-nowrap">Cashier</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--text-2)] whitespace-nowrap">Clearing Date</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--text-2)] whitespace-nowrap">Amount (₹)</th>
                {!isReadOnly && <th className="px-3 py-2" />}
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 && (
                <tr>
                  <td colSpan={isReadOnly ? 6 : 7} className="px-3 py-8 text-center text-sm text-[var(--text-4)]">
                    No payments recorded yet.
                  </td>
                </tr>
              )}
              {payments.map((payment, index) => {
                const isExisting = Boolean(payment.id);
                const patch = (p: Partial<PaymentRow>) => onUpdate(index, p);
                const modeLabel = PAYMENT_MODES.find(m => m.value === payment.mode.toLowerCase())?.label ?? payment.mode;
                const isCheque = payment.mode.toLowerCase() === 'cheque';
                const notYetCleared = isCheque && payment.clearingDate && payment.clearingDate > todayDate;

                return (
                  <tr
                    key={payment.id || `new-${index}`}
                    className={`border-t border-[var(--border)] hover:bg-[var(--surface-2)] ${notYetCleared ? 'opacity-70' : ''}`}
                  >
                    <td className="px-2 py-1.5">
                      {isReadOnly ? (
                        <span className="text-[var(--text-2)]">{payment.date}</span>
                      ) : (
                        <input
                          type="date"
                          className="input py-1 text-sm w-36"
                          value={payment.date}
                          onChange={(e) => patch({ date: e.target.value })}
                        />
                      )}
                    </td>
                    <td className="px-2 py-1.5">
                      {isReadOnly ? (
                        <span className="text-[var(--text-2)]">{modeLabel}</span>
                      ) : (
                        <select
                          className="input py-1 text-sm"
                          value={payment.mode}
                          onChange={(e) => patch({
                            mode: e.target.value,
                            clearingDate: e.target.value !== 'cheque' ? '' : payment.clearingDate,
                          })}
                        >
                          {PAYMENT_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                      )}
                    </td>
                    <td className="px-2 py-1.5">
                      {isReadOnly ? (
                        <span className="text-[var(--text-2)]">{payment.reference || '—'}</span>
                      ) : (
                        <input
                          type="text"
                          className="input py-1 text-sm w-40"
                          placeholder="Bank / ledger name"
                          value={payment.reference}
                          onChange={(e) => patch({ reference: e.target.value })}
                        />
                      )}
                    </td>
                    <td className="px-2 py-1.5">
                      {isReadOnly ? (
                        <span className="text-[var(--text-2)]">{payment.receivedBy || '—'}</span>
                      ) : (
                        <input
                          type="text"
                          className="input py-1 text-sm w-28"
                          placeholder="Staff name"
                          value={payment.receivedBy}
                          onChange={(e) => patch({ receivedBy: e.target.value })}
                        />
                      )}
                    </td>
                    <td className="px-2 py-1.5">
                      {isCheque ? (
                        isReadOnly ? (
                          <span className={`text-sm ${notYetCleared ? 'text-amber-600' : 'text-[var(--text-2)]'}`}>
                            {payment.clearingDate || '—'}
                          </span>
                        ) : (
                          <input
                            type="date"
                            className="input py-1 text-sm w-36"
                            value={payment.clearingDate}
                            onChange={(e) => patch({ clearingDate: e.target.value })}
                          />
                        )
                      ) : (
                        <span className="text-[var(--text-4)] text-xs">—</span>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      {isReadOnly ? (
                        <span className={`font-medium ${notYetCleared ? 'text-amber-600' : 'text-[var(--text-1)]'}`}>
                          ₹{Number(payment.amount || 0).toLocaleString('en-IN')}
                          {notYetCleared && <span className="ml-1 text-xs">(pending)</span>}
                        </span>
                      ) : (
                        <input
                          type="number"
                          min={0}
                          className="input py-1 text-sm w-28 text-right"
                          value={payment.amount}
                          onChange={(e) => patch({ amount: e.target.value })}
                        />
                      )}
                    </td>
                    {!isReadOnly && (
                      <td className="px-2 py-1.5 text-right">
                        {isExisting ? (
                          <span className="text-xs text-[var(--text-4)] select-none">saved</span>
                        ) : (
                          <button
                            type="button"
                            className="text-xs text-red-500 hover:text-red-700 dark:text-red-400"
                            onClick={() => onRemove(index)}
                          >Remove</button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Draft row for adding a new payment */}
        {showDraft && !isReadOnly && (
          <div className="border-t border-[var(--border)] bg-primary-50 dark:bg-primary-900/10 p-4 space-y-3">
            <p className="text-xs font-semibold text-primary-700 dark:text-primary-300">New Payment Entry</p>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              <div>
                <label className="text-xs text-[var(--text-4)] block mb-1">Date *</label>
                <input
                  type="date"
                  className="input py-1 text-sm"
                  value={draft.date}
                  onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-[var(--text-4)] block mb-1">Method</label>
                <select
                  className="input py-1 text-sm"
                  value={draft.mode}
                  onChange={(e) => setDraft((d) => ({
                    ...d,
                    mode: e.target.value,
                    clearingDate: e.target.value !== 'cheque' ? '' : d.clearingDate,
                  }))}
                >
                  {PAYMENT_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[var(--text-4)] block mb-1">Ledger</label>
                <input
                  type="text"
                  className="input py-1 text-sm"
                  placeholder="Bank / cash ledger"
                  value={draft.reference}
                  onChange={(e) => setDraft((d) => ({ ...d, reference: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-[var(--text-4)] block mb-1">Cashier</label>
                <input
                  type="text"
                  className="input py-1 text-sm"
                  placeholder="Staff name"
                  value={draft.receivedBy}
                  onChange={(e) => setDraft((d) => ({ ...d, receivedBy: e.target.value }))}
                />
              </div>
              {draft.mode === 'cheque' && (
                <div>
                  <label className="text-xs text-[var(--text-4)] block mb-1">Clearing Date</label>
                  <input
                    type="date"
                    className="input py-1 text-sm"
                    value={draft.clearingDate}
                    onChange={(e) => setDraft((d) => ({ ...d, clearingDate: e.target.value }))}
                  />
                </div>
              )}
              <div>
                <label className="text-xs text-[var(--text-4)] block mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  min={0}
                  className="input py-1 text-sm"
                  placeholder="0"
                  value={draft.amount}
                  onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" className="btn btn-secondary text-sm" onClick={() => setShowDraft(false)}>Cancel</button>
              <button
                type="button"
                className="btn btn-primary text-sm"
                disabled={!draft.amount || !draft.date}
                onClick={handleAddConfirm}
              >Add to Ledger</button>
            </div>
          </div>
        )}

        {/* Footer totals */}
        {(payments.length > 0 || (advanceReceived !== undefined && advanceReceived > 0)) && (
          <div className="border-t border-[var(--border)] bg-[var(--surface-2)] dark:bg-[var(--surface-3)] px-4 py-3 space-y-1 text-sm">
            {payments.length > 0 && (
              <div className="flex justify-between text-[var(--text-2)]">
                <span>Total Received (this version)</span>
                <span className="font-semibold">₹{credited.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {advanceReceived !== undefined && advanceReceived > credited && (
              <div className="flex justify-between text-blue-700 dark:text-blue-300 text-xs font-medium">
                <span>Total Received (all versions, from DB)</span>
                <span>₹{advanceReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {advanceReceived !== undefined && advanceReceived > credited && payments.length === 0 && (
              <p className="text-xs text-[var(--text-4)] pt-1">
                ₹{advanceReceived.toLocaleString('en-IN')} received on a previous booking version. New payments recorded here apply to this version.
              </p>
            )}
            {pendingCheques > 0 && (
              <div className="flex justify-between text-amber-600 dark:text-amber-400 text-xs">
                <span>Pending — cheque not yet cleared</span>
                <span>₹{pendingCheques.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <p className="text-xs text-[var(--text-4)] pt-1">
              Cheque payments are not credited until the clearing date is reached.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
