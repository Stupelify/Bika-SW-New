// KpiCard.jsx — Bika Banquet UI Kit
// Exports: KpiCard to window

function Sparkline({ values, color = 'var(--teal-500)' }) {
  if (!values || values.length < 2) return null;
  const w = 60, h = 24;
  const min = Math.min(...values), max = Math.max(...values);
  const range = Math.max(1, max - min);
  const step = w / (values.length - 1);
  const pts = values.map((v, i) => `${i * step},${h - ((v - min) / range) * (h - 2) - 1}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="60" height="24" aria-hidden="true" style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DeltaBadge({ value }) {
  if (value === undefined || value === null) return null;
  const up = value >= 0;
  const neutral = value === 0;
  const bg = neutral ? 'var(--surface-2)' : up ? '#dcfce7' : '#fef2f2';
  const color = neutral ? 'var(--text-3)' : up ? '#15803d' : '#dc2626';
  const arrow = neutral ? '—' : up ? '↑' : '↓';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: '9999px', background: bg, color }}>
      {arrow} {Math.abs(value)}% Trend
    </span>
  );
}

function KpiCard({ label, value, delta, icon: Icon, sparkline, format = 'number' }) {
  function fmt(v) {
    if (typeof v === 'string') return v;
    if (format === 'currency') return `₹${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    if (format === 'percent') return `${Number(v).toFixed(1)}%`;
    return Number(v).toLocaleString('en-IN');
  }
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '18px 20px', boxShadow: 'var(--shadow-xs)', transition: 'border-color 0.2s', cursor: 'default' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-2)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-4)', letterSpacing: '0.02em', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{label}</span>
        {Icon && <Icon />}
      </div>
      <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 8, fontVariantNumeric: 'tabular-nums' }}>{fmt(value)}</p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <DeltaBadge value={delta} />
        {sparkline && <Sparkline values={sparkline} />}
      </div>
    </div>
  );
}

Object.assign(window, { KpiCard, Sparkline });
