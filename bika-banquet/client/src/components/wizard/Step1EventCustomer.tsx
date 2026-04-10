'use client';

import { FUNCTION_TYPE_OPTIONS, WizardFormData, CustomerOption } from './types';
import Combobox from '@/components/Combobox';

interface Props {
  data: WizardFormData;
  onChange: (patch: Partial<WizardFormData>) => void;
  customers: CustomerOption[];
  canAddCustomer: boolean;
  onAddCustomer?: () => void;
}

export default function Step1EventCustomer({ data, onChange, customers, canAddCustomer, onAddCustomer }: Props) {
  const todayIso = new Date().toISOString().split('T')[0];

  const customerOptions = customers.map(c => ({
    value: c.id,
    label: c.name,
    secondary: c.phone
  }));

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
          <Combobox
            value={data.functionType}
            onChange={(value) => onChange({ functionType: value })}
            options={FUNCTION_TYPE_OPTIONS.map(opt => ({ value: opt, label: opt }))}
            placeholder="Select function type…"
          />
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
        <Combobox
          value={data.customerId}
          onChange={(value) => onChange({ customerId: value })}
          options={customerOptions}
          placeholder="Select customer…"
          searchPlaceholder="Search by name or phone…"
        />
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
            <Combobox
              value={data.secondCustomerId}
              onChange={(value) => onChange({ secondCustomerId: value })}
              options={customerOptions.filter(c => c.value !== data.customerId)}
              placeholder="Select second customer…"
            />
          </div>
        )}
      </div>

      {/* Referred By */}
      <div>
        <label className="wizard-label">Referred By</label>
        <Combobox
          value={data.referredById}
          onChange={(value) => onChange({ referredById: value })}
          options={customerOptions.filter(c => c.value !== data.customerId)}
          placeholder="None"
        />
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
