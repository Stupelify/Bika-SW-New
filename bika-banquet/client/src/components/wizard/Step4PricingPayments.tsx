'use client';

import { AdditionalItem, PackKey, PaymentRow, WizardFormData } from './types';
import Combobox from '@/components/Combobox';

interface Props {
  data: WizardFormData;
  onChange: (patch: Partial<WizardFormData>) => void;
  totalBillAmount: number;
}

const PAYMENT_MODES = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card', 'Other'];

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="wizard-label">{label}</label>
      {children}
    </div>
  );
}

export default function Step4PricingPayments({ data, onChange, totalBillAmount }: Props) {
  const discountPercent = parseFloat(data.finalDiscountPercent) || 0;
  const discountAmount = parseFloat(data.finalDiscountAmount) || 0;
  const finalAmount = parseFloat(data.finalAmount) || totalBillAmount - discountAmount;
  const totalPaid = data.payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
  const balance = finalAmount - totalPaid;

  // Sync discount helpers
  const setDiscountPercent = (pct: string) => {
    const p = Math.min(100, Math.max(0, parseFloat(pct) || 0));
    const amt = parseFloat(((totalBillAmount * p) / 100).toFixed(2));
    onChange({
      finalDiscountPercent: pct,
      finalDiscountAmount: amt.toString(),
      finalAmount: Math.max(0, totalBillAmount - amt).toFixed(2),
      dueAmount: Math.max(0, totalBillAmount - amt - totalPaid).toFixed(2),
    });
  };

  const setDiscountAmount = (amtStr: string) => {
    const amt = Math.min(totalBillAmount, Math.max(0, parseFloat(amtStr) || 0));
    const pct = totalBillAmount > 0 ? parseFloat(((amt / totalBillAmount) * 100).toFixed(2)) : 0;
    onChange({
      finalDiscountAmount: amtStr,
      finalDiscountPercent: pct.toString(),
      finalAmount: Math.max(0, totalBillAmount - amt).toFixed(2),
      dueAmount: Math.max(0, totalBillAmount - amt - totalPaid).toFixed(2),
    });
  };

  const addPayment = () => {
    const today = new Date().toISOString().split('T')[0];
    onChange({
      payments: [
        ...data.payments,
        { mode: 'Cash', narration: '', date: today, receivedBy: '', amount: '' },
      ],
    });
  };

  const patchPayment = (idx: number, patch: Partial<PaymentRow>) => {
    const next = data.payments.map((p, i) => (i === idx ? { ...p, ...patch } : p));
    onChange({ payments: next });
  };

  const removePayment = (idx: number) => {
    onChange({ payments: data.payments.filter((_, i) => i !== idx) });
  };

  const addAdditionalItem = () => {
    onChange({ additionalRequirements: [...data.additionalRequirements, { description: '', amount: '' }] });
  };

  const patchAdditional = (idx: number, patch: Partial<AdditionalItem>) => {
    const next = data.additionalRequirements.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    onChange({ additionalRequirements: next });
  };

  const removeAdditional = (idx: number) => {
    onChange({ additionalRequirements: data.additionalRequirements.filter((_, i) => i !== idx) });
  };

  const fmt = (n: number) =>
    '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Bill summary strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 12,
        }}
      >
        {[
          { label: 'Total Bill', value: fmt(totalBillAmount), accent: false },
          { label: 'Discount', value: fmt(discountAmount), accent: false },
          { label: 'Final Amount', value: fmt(finalAmount), accent: true },
          { label: 'Paid', value: fmt(totalPaid), accent: false },
          { label: 'Balance Due', value: fmt(Math.max(0, balance)), accent: balance > 0 },
        ].map(({ label, value, accent }) => (
          <div
            key={label}
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              border: accent ? '1.5px solid var(--teal-300)' : '1px solid var(--border)',
              background: accent ? 'var(--teal-50)' : 'var(--surface-2)',
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 600, marginBottom: 4 }}>
              {label}
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: accent ? 'var(--teal-700)' : 'var(--text-1)',
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Discount section */}
      <div>
        <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>
          Discount
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FieldRow label="Discount %">
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={data.finalDiscountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              placeholder="0"
              className="wizard-input"
            />
          </FieldRow>
          <FieldRow label="Discount Amount (₹)">
            <input
              type="number"
              min="0"
              step="100"
              value={data.finalDiscountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              placeholder="0"
              className="wizard-input"
            />
          </FieldRow>
        </div>
      </div>

      {/* Additional charges */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>
            Additional Charges
          </h4>
          <button
            type="button"
            onClick={addAdditionalItem}
            style={{
              fontSize: 12,
              color: 'var(--teal-600)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            + Add
          </button>
        </div>
        {data.additionalRequirements.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 140px 32px',
              gap: 8,
              marginBottom: 8,
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              value={item.description}
              onChange={(e) => patchAdditional(idx, { description: e.target.value })}
              placeholder="Description"
              className="wizard-input"
            />
            <input
              type="number"
              min="0"
              value={item.amount}
              onChange={(e) => patchAdditional(idx, { amount: e.target.value })}
              placeholder="Amount"
              className="wizard-input"
            />
            <button
              type="button"
              onClick={() => removeAdditional(idx)}
              style={{
                border: 'none',
                background: 'none',
                color: '#ef4444',
                cursor: 'pointer',
                fontSize: 16,
              }}
            >
              ×
            </button>
          </div>
        ))}
        {data.additionalRequirements.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--text-4)' }}>No additional charges added.</div>
        )}
      </div>

      {/* Advance required */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FieldRow label="Advance Required (₹)">
          <input
            type="number"
            min="0"
            step="500"
            value={data.advanceRequired}
            onChange={(e) => onChange({ advanceRequired: e.target.value })}
            placeholder="0"
            className="wizard-input"
          />
        </FieldRow>
        <FieldRow label="Due Amount (₹)">
          <input
            type="number"
            min="0"
            step="500"
            value={data.dueAmount}
            onChange={(e) => onChange({ dueAmount: e.target.value })}
            placeholder="0"
            className="wizard-input"
          />
        </FieldRow>
      </div>

      {/* Payments received */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>
            Payments Received
          </h4>
          <button
            type="button"
            onClick={addPayment}
            style={{
              fontSize: 12,
              color: 'var(--teal-600)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            + Add Payment
          </button>
        </div>
        {data.payments.map((payment, idx) => (
          <div
            key={idx}
            style={{
              display: 'grid',
              gridTemplateColumns: '100px 1fr 120px 1fr 120px 32px',
              gap: 8,
              marginBottom: 8,
              alignItems: 'center',
            }}
          >
            <Combobox
              value={payment.mode}
              onChange={(val) => patchPayment(idx, { mode: val })}
              options={PAYMENT_MODES.map((m) => ({ value: m, label: m }))}
              placeholder="Mode"
            />
            <input
              type="text"
              value={payment.narration}
              onChange={(e) => patchPayment(idx, { narration: e.target.value })}
              placeholder="Narration"
              className="wizard-input"
            />
            <input
              type="date"
              value={payment.date}
              onChange={(e) => patchPayment(idx, { date: e.target.value })}
              className="wizard-input"
            />
            <input
              type="text"
              value={payment.receivedBy}
              onChange={(e) => patchPayment(idx, { receivedBy: e.target.value })}
              placeholder="Received by"
              className="wizard-input"
            />
            <input
              type="number"
              min="0"
              value={payment.amount}
              onChange={(e) => patchPayment(idx, { amount: e.target.value })}
              placeholder="Amount"
              className="wizard-input"
            />
            <button
              type="button"
              onClick={() => removePayment(idx)}
              style={{
                border: 'none',
                background: 'none',
                color: '#ef4444',
                cursor: 'pointer',
                fontSize: 16,
              }}
            >
              ×
            </button>
          </div>
        ))}
        {data.payments.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--text-4)' }}>No payments recorded.</div>
        )}
        {data.payments.length > 0 && (
          <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: 'var(--teal-700)', marginTop: 8 }}>
            Total Received: {fmt(totalPaid)}
          </div>
        )}
      </div>
    </div>
  );
}
