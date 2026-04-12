'use client';

import { BanquetOption, HallOption, PACK_COLORS, PACK_LABELS, PackFormRow, PackKey, WizardFormData } from './types';

interface Props {
  data: WizardFormData;
  onChange: (patch: Partial<WizardFormData>) => void;
  banquets: BanquetOption[];
  halls: HallOption[];
  clashWarnings?: Array<{
    bookingId: string;
    functionName: string;
    clashingHalls: Array<{ id: string; name: string }>;
  }>;
}

const PACK_KEYS: PackKey[] = ['breakfast', 'lunch', 'hiTea', 'dinner'];

function PackRow({
  packKey,
  row,
  banquets,
  halls,
  onChange,
}: {
  packKey: PackKey;
  row: PackFormRow;
  banquets: BanquetOption[];
  halls: HallOption[];
  onChange: (patch: Partial<PackFormRow>) => void;
}) {
  const colors = PACK_COLORS[packKey];
  const label = PACK_LABELS[packKey];

  const filteredHalls = row.banquetId
    ? halls.filter((h) => h.banquet?.id === row.banquetId)
    : halls;

  return (
    <div
      style={{
        borderRadius: 14,
        border: `1px solid ${colors.border}`,
        borderLeft: `4px solid ${colors.accent}`,
        background: row.enabled ? colors.bg : 'var(--surface-2)',
        overflow: 'hidden',
        transition: 'background 0.2s',
      }}
    >
      {/* Pack header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          cursor: 'pointer',
        }}
        onClick={() => onChange({ enabled: !row.enabled })}
      >
        <input
          type="checkbox"
          checked={row.enabled}
          onChange={(e) => { e.stopPropagation(); onChange({ enabled: e.target.checked }); }}
          style={{ width: 16, height: 16, cursor: 'pointer', accentColor: colors.accent }}
        />
        <span
          style={{
            fontWeight: 700,
            fontSize: 14,
            color: row.enabled ? 'var(--text-1)' : 'var(--text-4)',
          }}
        >
          {label}
        </span>
        {row.enabled && (
          <span style={{ marginLeft: 'auto', fontSize: 12, color: colors.accent, fontWeight: 600 }}>
            {row.startTime}–{row.endTime}
          </span>
        )}
      </div>

      {row.enabled && (
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Toggles */}
          <div style={{ display: 'flex', gap: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
              <input
                type="checkbox"
                checked={row.withHall}
                onChange={(e) => onChange({ withHall: e.target.checked })}
                style={{ accentColor: colors.accent }}
              />
              With Hall
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
              <input
                type="checkbox"
                checked={row.withCatering}
                onChange={(e) => onChange({ withCatering: e.target.checked })}
                style={{ accentColor: colors.accent }}
              />
              With Catering
            </label>
          </div>

          {/* Time Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="wizard-label">Start Time</label>
              <input
                type="time"
                value={row.startTime}
                onChange={(e) => onChange({ startTime: e.target.value })}
                className="wizard-input"
              />
            </div>
            <div>
              <label className="wizard-label">End Time</label>
              <input
                type="time"
                value={row.endTime}
                onChange={(e) => onChange({ endTime: e.target.value })}
                className="wizard-input"
              />
            </div>
          </div>

          {/* Hall selection */}
          {row.withHall && (
            <>
              <div>
                <label className="wizard-label">Banquet</label>
                <select
                  value={row.banquetId}
                  onChange={(e) => onChange({ banquetId: e.target.value, hallIds: [] })}
                  className="wizard-input"
                >
                  <option value="">Select banquet…</option>
                  {banquets.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="wizard-label">Halls</label>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                    padding: '8px 10px',
                    border: '1.5px solid var(--border)',
                    borderRadius: 10,
                    minHeight: 42,
                    background: 'var(--surface)',
                  }}
                >
                  {filteredHalls.length === 0 ? (
                    <span style={{ fontSize: 13, color: 'var(--text-4)' }}>
                      {row.banquetId ? 'No halls in this banquet' : 'Select banquet first'}
                    </span>
                  ) : (
                    filteredHalls.map((h) => {
                      const checked = row.hallIds.includes(h.id);
                      return (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() =>
                            onChange({
                              hallIds: checked
                                ? row.hallIds.filter((id) => id !== h.id)
                                : [...row.hallIds, h.id],
                            })
                          }
                          style={{
                            padding: '4px 10px',
                            borderRadius: 100,
                            fontSize: 12,
                            fontWeight: 600,
                            border: `1.5px solid ${checked ? colors.accent : 'var(--border)'}`,
                            background: checked ? colors.bg : 'transparent',
                            color: checked ? colors.accent : 'var(--text-3)',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          {h.name}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div>
                <label className="wizard-label">Hall Rate (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={row.hallRate}
                  onChange={(e) => onChange({ hallRate: e.target.value })}
                  placeholder="0"
                  className="wizard-input"
                />
              </div>
            </>
          )}

          {/* Pax */}
          <div>
            <label className="wizard-label">No. of Guests (Pax)</label>
            <input
              type="number"
              min="1"
              value={row.pax}
              onChange={(e) => onChange({ pax: e.target.value })}
              placeholder="0"
              className="wizard-input"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Step2VenuesTiming({ data, onChange, banquets, halls, clashWarnings }: Props) {
  const patchPack = (key: PackKey, patch: Partial<PackFormRow>) => {
    onChange({
      packs: {
        ...data.packs,
        [key]: { ...data.packs[key], ...patch },
      },
    });
  };

  const enabledCount = PACK_KEYS.filter((k) => data.packs[k].enabled).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>
        Enable meal slots and assign venues. You can configure menus in the next step.
      </p>

      {enabledCount === 0 && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 10,
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            fontSize: 13,
            color: 'var(--text-4)',
          }}
        >
          Enable at least one meal slot to proceed.
        </div>
      )}

      {clashWarnings && clashWarnings.length > 0 && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            background: '#fef2f2',
            border: '1px solid #fecaca',
            fontSize: 13,
            color: '#b91c1c',
          }}
        >
          ⚠️ Hall clash detected — these bookings overlap:{' '}
          {clashWarnings.map((w) => (
            <span key={w.bookingId} style={{ fontWeight: 600 }}>
              {w.functionName} ({w.clashingHalls.map((h) => h.name).join(', ')}){' '}
            </span>
          ))}
        </div>
      )}

      {PACK_KEYS.map((key) => (
        <PackRow
          key={key}
          packKey={key}
          row={data.packs[key]}
          banquets={banquets}
          halls={halls}
          onChange={(patch) => patchPack(key, patch)}
        />
      ))}
    </div>
  );
}
