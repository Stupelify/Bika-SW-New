'use client';

import { CustomerOption, HallOption, PACK_LABELS, PackKey, TemplateMenuOption, WizardFormData } from './types';
import { formatDateDDMMYYYY } from '@/lib/date';

interface Props {
  data: WizardFormData;
  customers: CustomerOption[];
  halls: HallOption[];
  templateMenus: TemplateMenuOption[];
  totalBillAmount: number;
  totalPaid: number;
  isEditing: boolean;
  saving: boolean;
  onBack: () => void;
  onSubmit: () => void;
}

const PACK_KEYS: PackKey[] = ['breakfast', 'lunch', 'hiTea', 'dinner'];

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '8px 0',
        borderBottom: '1px solid var(--border)',
        gap: 12,
      }}
    >
      <span style={{ fontSize: 13, color: 'var(--text-4)', flexShrink: 0, minWidth: 140 }}>
        {label}
      </span>
      <span style={{ fontSize: 13, color: 'var(--text-1)', fontWeight: 500, textAlign: 'right' }}>
        {value || '—'}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 16,
      }}
    >
      <div
        style={{
          padding: '10px 16px',
          background: 'var(--surface-2)',
          borderBottom: '1px solid var(--border)',
          fontWeight: 700,
          fontSize: 13,
          color: 'var(--text-2)',
        }}
      >
        {title}
      </div>
      <div style={{ padding: '0 16px' }}>{children}</div>
    </div>
  );
}

const fmt = (n: number) =>
  '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Step5Review({
  data,
  customers,
  halls,
  templateMenus,
  totalBillAmount,
  totalPaid,
  isEditing,
  saving,
  onBack,
  onSubmit,
}: Props) {
  const primaryCustomer = customers.find((c) => c.id === data.customerId);
  const secondCustomer = data.includeSecondCustomer
    ? customers.find((c) => c.id === data.secondCustomerId)
    : null;
  const referredBy = customers.find((c) => c.id === data.referredById);

  const discountAmount = parseFloat(data.finalDiscountAmount) || 0;
  const finalAmount = parseFloat(data.finalAmount) || totalBillAmount - discountAmount;
  const balance = finalAmount - totalPaid;

  const enabledPacks = PACK_KEYS.filter((k) => data.packs[k].enabled);

  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 0, marginBottom: 20 }}>
        Review all details before submitting. Click &ldquo;Back&rdquo; to make changes.
      </p>

      {/* Event */}
      <Section title="Event Details">
        <Row label="Function Type" value={data.functionType} />
        <Row
          label="Function Date"
          value={data.functionDate ? formatDateDDMMYYYY(data.functionDate) : '—'}
        />
        {data.notes && <Row label="Notes" value={data.notes} />}
      </Section>

      {/* Customers */}
      <Section title="Customer(s)">
        <Row
          label="Primary Customer"
          value={primaryCustomer ? `${primaryCustomer.name} (${primaryCustomer.phone})` : '—'}
        />
        {secondCustomer && (
          <Row
            label="Second Customer"
            value={`${secondCustomer.name} (${secondCustomer.phone})`}
          />
        )}
        {referredBy && (
          <Row label="Referred By" value={`${referredBy.name} (${referredBy.phone})`} />
        )}
      </Section>

      {/* Venues */}
      {enabledPacks.length > 0 && (
        <Section title="Venues & Meal Slots">
          {enabledPacks.map((key) => {
            const row = data.packs[key];
            const hallNames = row.hallIds
              .map((id) => halls.find((h) => h.id === id)?.name)
              .filter(Boolean)
              .join(', ');
            return (
              <div key={key} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: 'var(--text-1)' }}>
                  {PACK_LABELS[key]}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  {row.startTime}–{row.endTime} · {row.pax || 0} pax
                  {row.withHall && hallNames && ` · ${hallNames}`}
                  {row.withHall && row.hallRate && ` · Hall ₹${row.hallRate}`}
                </div>
              </div>
            );
          })}
        </Section>
      )}

      {/* Menu */}
      {enabledPacks.length > 0 && (
        <Section title="Menu">
          {enabledPacks.map((key) => {
            const row = data.packs[key];
            const tmpl = templateMenus.find((t) => t.id === row.templateMenuId);
            return (
              <div key={key} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: 'var(--text-1)' }}>
                  {PACK_LABELS[key]}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  {tmpl ? tmpl.name : 'Custom menu'} · {row.menuItemIds.length} items
                  {row.withCatering && row.ratePerPlate ? ` · ₹${row.ratePerPlate}/plate` : ''}
                </div>
              </div>
            );
          })}
        </Section>
      )}

      {/* Pricing */}
      <Section title="Pricing Summary">
        <Row label="Total Bill" value={fmt(totalBillAmount)} />
        <Row label="Discount" value={fmt(discountAmount)} />
        <Row label="Final Amount" value={<strong style={{ color: 'var(--teal-700)' }}>{fmt(finalAmount)}</strong>} />
        <Row label="Paid" value={fmt(totalPaid)} />
        <Row
          label="Balance Due"
          value={
            <strong style={{ color: balance > 0 ? '#dc2626' : 'var(--teal-700)' }}>
              {fmt(Math.max(0, balance))}
            </strong>
          }
        />
      </Section>

      {/* Submit */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
        <button
          type="button"
          onClick={onBack}
          disabled={saving}
          className="btn btn-secondary"
          style={{ minWidth: 100 }}
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={saving}
          className="btn btn-primary"
          style={{ minWidth: 140 }}
        >
          {saving
            ? 'Saving…'
            : isEditing
            ? '✓ Update Booking'
            : '✓ Create Booking'}
        </button>
      </div>
    </div>
  );
}
