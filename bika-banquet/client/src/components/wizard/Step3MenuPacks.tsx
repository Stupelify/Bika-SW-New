'use client';

import { ItemOption, PACK_COLORS, PACK_LABELS, PackFormRow, PackKey, TemplateMenuOption, WizardFormData } from './types';

interface Props {
  data: WizardFormData;
  onChange: (patch: Partial<WizardFormData>) => void;
  items: ItemOption[];
  templateMenus: TemplateMenuOption[];
}

const PACK_KEYS: PackKey[] = ['breakfast', 'lunch', 'hiTea', 'dinner'];

function MenuPanel({
  packKey,
  row,
  items,
  templateMenus,
  onChange,
}: {
  packKey: PackKey;
  row: PackFormRow;
  items: ItemOption[];
  templateMenus: TemplateMenuOption[];
  onChange: (patch: Partial<PackFormRow>) => void;
}) {
  const colors = PACK_COLORS[packKey];
  const label = PACK_LABELS[packKey];

  // Load template
  const applyTemplate = (templateId: string) => {
    const tmpl = templateMenus.find((t) => t.id === templateId);
    const itemIds = tmpl ? tmpl.items.map((ti) => ti.item.id) : [];
    onChange({ templateMenuId: templateId, menuItemIds: itemIds });
  };

  // Group items by itemType for display
  const grouped = items.reduce<Record<string, ItemOption[]>>((acc, item) => {
    const typeName = item.itemType?.name || 'Other';
    if (!acc[typeName]) acc[typeName] = [];
    acc[typeName].push(item);
    return acc;
  }, {});

  const toggleItem = (itemId: string) => {
    const selected = new Set(row.menuItemIds);
    if (selected.has(itemId)) {
      selected.delete(itemId);
    } else {
      selected.add(itemId);
    }
    onChange({ menuItemIds: Array.from(selected) });
  };

  return (
    <div
      style={{
        borderRadius: 14,
        border: `1px solid ${colors.border}`,
        borderLeft: `4px solid ${colors.accent}`,
        background: colors.bg,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${colors.border}` }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)' }}>{label}</span>
        <span
          style={{
            marginLeft: 10,
            fontSize: 11,
            fontWeight: 700,
            background: colors.accent,
            color: 'white',
            borderRadius: 100,
            padding: '2px 8px',
          }}
        >
          {row.menuItemIds.length} items
        </span>
      </div>
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Rate per plate + template */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {row.withCatering && (
            <div>
              <label className="wizard-label">Rate per Plate (₹)</label>
              <input
                type="number"
                min="0"
                step="50"
                value={row.ratePerPlate}
                onChange={(e) => onChange({ ratePerPlate: e.target.value })}
                placeholder="0"
                className="wizard-input"
              />
            </div>
          )}
          <div>
            <label className="wizard-label">Template Menu</label>
            <select
              value={row.templateMenuId}
              onChange={(e) => applyTemplate(e.target.value)}
              className="wizard-input"
            >
              <option value="">Custom (no template)</option>
              {templateMenus.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Menu items grouped by type */}
        <div>
          <label className="wizard-label" style={{ marginBottom: 8, display: 'block' }}>
            Menu Items ({row.menuItemIds.length} selected)
          </label>
          {Object.entries(grouped).map(([typeName, typeItems]) => (
            <div key={typeName} style={{ marginBottom: 10 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--text-4)',
                  marginBottom: 6,
                }}
              >
                {typeName}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {typeItems.map((item) => {
                  const selected = row.menuItemIds.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleItem(item.id)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 100,
                        fontSize: 12,
                        fontWeight: 600,
                        border: `1.5px solid ${selected ? colors.accent : 'var(--border)'}`,
                        background: selected ? colors.bg : 'transparent',
                        color: selected ? colors.accent : 'var(--text-3)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {item.name}
                      {item.point || item.points
                        ? ` (${item.point ?? item.points}pts)`
                        : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Step3MenuPacks({ data, onChange, items, templateMenus }: Props) {
  const enabledPacks = PACK_KEYS.filter((k) => data.packs[k].enabled);

  const patchPack = (key: PackKey, patch: Partial<PackFormRow>) => {
    onChange({
      packs: {
        ...data.packs,
        [key]: { ...data.packs[key], ...patch },
      },
    });
  };

  if (enabledPacks.length === 0) {
    return (
      <div
        style={{
          padding: '32px 20px',
          textAlign: 'center',
          color: 'var(--text-4)',
          fontSize: 14,
        }}
      >
        No meal slots enabled. Go back to Step 2 and enable at least one pack.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>
        Select menu items for each meal slot. Apply a template to pre-populate items.
      </p>
      {enabledPacks.map((key) => (
        <MenuPanel
          key={key}
          packKey={key}
          row={data.packs[key]}
          items={items}
          templateMenus={templateMenus}
          onChange={(patch) => patchPack(key, patch)}
        />
      ))}
    </div>
  );
}
