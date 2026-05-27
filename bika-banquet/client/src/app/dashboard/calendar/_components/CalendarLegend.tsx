'use client';

import type { TimelineHallRow } from '@/components/VenueTimelineBoard';

// Mirror of the 8-colour palette used by VenueTimelineBoard (color-by-location).
// The board groups rows by banquetName in first-appearance order and assigns
// PALETTE[idx % len] per group, so we replicate that exact mapping here to keep
// the legend swatches consistent with the board.
const PALETTE = [
  '#0d9488',
  '#4f46e5',
  '#d97706',
  '#e11d48',
  '#0284c7',
  '#16a34a',
  '#9333ea',
  '#b45309',
] as const;

// Status legend — mirrors globals.css .status-* / the design STATUS map.
const STATUS_LEGEND: Array<{ key: string; label: string; bg: string; accent: string }> = [
  { key: 'confirmed', label: 'Confirmed', bg: '#dcfce7', accent: '#22c55e' },
  { key: 'pencil', label: 'Pencil', bg: '#fffbeb', accent: '#f59e0b' },
  { key: 'quotation', label: 'Quotation', bg: '#eff6ff', accent: '#3b82f6' },
  { key: 'enquiry', label: 'Enquiry', bg: '#f0f9ff', accent: '#0ea5e9' },
];

const STRIPE =
  'repeating-linear-gradient(135deg,transparent 0,transparent 4px,rgba(146,64,14,.18) 4px,rgba(146,64,14,.18) 5px)';

interface CalendarLegendProps {
  rows: TimelineHallRow[];
}

/**
 * Slim horizontal strip shown above the VenueTimelineBoard on desktop. Shows one
 * swatch per banquet LOCATION (color-by-location, matching the board), a status
 * legend, and a "Now" tick.
 */
export default function CalendarLegend({ rows }: CalendarLegendProps) {
  // Replicate the board's grouping: first-appearance order of banquetName over
  // the (already hallName-sorted) rows, idx-based palette assignment.
  const seen = new Set<string>();
  const locations: Array<{ name: string; color: string }> = [];
  for (const row of rows) {
    const name = row.banquetName?.trim() || 'Unassigned';
    if (seen.has(name)) continue;
    seen.add(name);
    locations.push({ name, color: PALETTE[locations.length % PALETTE.length] });
  }

  if (locations.length === 0) return null;

  return (
    <div
      className="hidden lg:flex"
      style={{
        alignItems: 'center',
        gap: 12,
        padding: '6px 16px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        flexShrink: 0,
        overflowX: 'auto',
      }}
    >
      {locations.map((loc) => (
        <span
          key={loc.name}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 11,
            color: 'var(--text-3)',
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{ width: 8, height: 8, borderRadius: 2, background: loc.color, flexShrink: 0 }}
          />
          {loc.name}
        </span>
      ))}

      <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 10, alignItems: 'center' }}>
        {STATUS_LEGEND.map((s) => (
          <span
            key={s.key}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              color: 'var(--text-3)',
              whiteSpace: 'nowrap',
            }}
          >
            <span
              style={{
                width: 10,
                height: 8,
                borderRadius: 2,
                background: s.bg,
                border: `1px solid ${s.accent}`,
                backgroundImage: s.key === 'pencil' ? STRIPE : 'none',
              }}
            />
            {s.label}
          </span>
        ))}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            color: 'var(--text-3)',
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{ width: 1.5, height: 12, background: 'var(--teal-600)', display: 'inline-block' }}
          />
          Now
        </span>
      </span>
    </div>
  );
}
