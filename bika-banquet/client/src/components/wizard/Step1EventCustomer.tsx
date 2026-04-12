'use client';

import { FUNCTION_TYPE_OPTIONS, WizardFormData, CustomerOption } from './types';

interface Props {
  data: WizardFormData;
  onChange: (patch: Partial<WizardFormData>) => void;
  customers: CustomerOption[];
  canAddCustomer: boolean;
  onAddCustomer?: () => void;
}

function CustomerSelect({
  label,
  value,
  search,
  onSearchChange,
  onSelect,
  customers,
  required,
}: {
  label: string;
  value: string;
  search: string;
  onSearchChange: (v: string) => void;
  onSelect: (id: string) => void;
  customers: CustomerOption[];
  required?: boolean;
}) {
  const filtered = search
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.phone.includes(search)
      )
    : customers.slice(0, 8);

  const selected = customers.find((c) => c.id === value);

  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text-3)',
          marginBottom: 4,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      {selected ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--teal-50)',
            border: '1.5px solid var(--teal-200)',
            borderRadius: 10,
            padding: '10px 14px',
          }}
        >
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-1)' }}>
              {selected.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-4)' }}>{selected.phone}</div>
          </div>
          <button
            type="button"
            onClick={() => { onSelect(''); onSearchChange(''); }}
            style={{
              fontSize: 11,
              color: 'var(--teal-600)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Change
          </button>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder={`Search ${label.toLowerCase()}…`}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1.5px solid var(--border)',
              borderRadius: 10,
              outline: 'none',
              fontSize: 14,
              background: 'var(--surface)',
              color: 'var(--text-1)',
              boxSizing: 'border-box',
            }}
          />
          {filtered.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                zIndex: 20,
                maxHeight: 220,
                overflowY: 'auto',
                boxShadow: 'var(--shadow-md)',
                marginTop: 4,
              }}
            >
              {filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { onSelect(c.id); onSearchChange(c.name); }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '9px 14px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: 14,
                    color: 'var(--text-1)',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{c.name}</span>
                  <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-4)' }}>
                    {c.phone}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Step1EventCustomer({ data, onChange, customers, canAddCustomer, onAddCustomer }: Props) {
  const todayIso = new Date().toISOString().split('T')[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Function Type + Date */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        <div>
          <label className="wizard-label">
            Function Type <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <select
            value={data.functionType}
            onChange={(e) => onChange({ functionType: e.target.value })}
            className="wizard-input"
          >
            <option value="">Select function type…</option>
            {FUNCTION_TYPE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="wizard-label">
            Function Date <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="date"
            value={data.functionDate}
            min={todayIso}
            onChange={(e) => onChange({ functionDate: e.target.value })}
            className="wizard-input"
          />
        </div>
      </div>

      {/* Primary Customer */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)' }}>
            Primary Customer
          </span>
          {canAddCustomer && onAddCustomer && (
            <button
              type="button"
              onClick={onAddCustomer}
              style={{
                fontSize: 12,
                color: 'var(--teal-600)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              + New Customer
            </button>
          )}
        </div>
        {/* Simple inline search/select */}
        <div>
          <input
            type="text"
            placeholder="Search by name or phone…"
            value={
              data.customerId
                ? (customers.find((c) => c.id === data.customerId)
                    ? `${customers.find((c) => c.id === data.customerId)!.name} (${customers.find((c) => c.id === data.customerId)!.phone})`
                    : '')
                : ''
            }
            readOnly={Boolean(data.customerId)}
            onChange={() => {}}
            onClick={() => data.customerId && onChange({ customerId: '' })}
            className="wizard-input"
            style={{ cursor: data.customerId ? 'pointer' : undefined }}
          />
          {!data.customerId && (
            <div
              style={{
                marginTop: 4,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                maxHeight: 200,
                overflowY: 'auto',
              }}
            >
              {customers.slice(0, 12).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onChange({ customerId: c.id })}
                  style={{
                    display: 'flex',
                    width: '100%',
                    textAlign: 'left',
                    padding: '9px 14px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: 14,
                    gap: 8,
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{c.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-4)' }}>{c.phone}</span>
                </button>
              ))}
            </div>
          )}
          {data.customerId && (
            <button
              type="button"
              onClick={() => onChange({ customerId: '' })}
              style={{
                marginTop: 4,
                fontSize: 12,
                color: 'var(--text-4)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              ✕ Clear selection
            </button>
          )}
        </div>
      </div>

      {/* Second Customer toggle */}
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={data.includeSecondCustomer}
            onChange={(e) => onChange({ includeSecondCustomer: e.target.checked })}
          />
          <span style={{ fontSize: 14, color: 'var(--text-2)' }}>
            Include a second customer
          </span>
        </label>
        {data.includeSecondCustomer && (
          <div style={{ marginTop: 12 }}>
            <label className="wizard-label">Second Customer</label>
            <select
              value={data.secondCustomerId}
              onChange={(e) => onChange({ secondCustomerId: e.target.value })}
              className="wizard-input"
            >
              <option value="">Select second customer…</option>
              {customers
                .filter((c) => c.id !== data.customerId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      {/* Referred By */}
      <div>
        <label className="wizard-label">Referred By</label>
        <select
          value={data.referredById}
          onChange={(e) => onChange({ referredById: e.target.value })}
          className="wizard-input"
        >
          <option value="">None</option>
          {customers
            .filter((c) => c.id !== data.customerId)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone})
              </option>
            ))}
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="wizard-label">Notes</label>
        <textarea
          value={data.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          rows={3}
          placeholder="Any special instructions or notes…"
          className="wizard-input"
          style={{ resize: 'vertical' }}
        />
      </div>
    </div>
  );
}
