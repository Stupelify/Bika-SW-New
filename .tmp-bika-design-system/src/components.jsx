// Shared components for Bika Banquet prototype
const { useState, useEffect, useMemo, useRef } = React;

const Icon = ({ name, size = 14, ...p }) => (
  <i data-lucide={name} style={{ width: size, height: size }} {...p}></i>
);

function fmtINR(n, { compact = false } = {}) {
  if (n == null) return '—';
  if (compact) {
    if (n >= 10000000) return '₹' + (n/10000000).toFixed(2).replace(/\.0+$/, '') + 'Cr';
    if (n >= 100000)   return '₹' + (n/100000).toFixed(2).replace(/\.0+$/, '') + 'L';
    if (n >= 1000)     return '₹' + (n/1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return '₹' + n.toLocaleString('en-IN');
}
function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'2-digit' });
}
function fmtDay(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { weekday:'short' });
}

const STATUS_LBL = {
  confirmed:'Confirmed', pencil:'Pencil', quotation:'Quotation',
  enquiry:'Enquiry', cancelled:'Cancelled'
};
function StatusBadge({ s }) {
  return <span className={"st " + s}><span className="d"></span>{STATUS_LBL[s] || s}</span>;
}

function Sparkline({ data, color = 'var(--accent)', height = 24 }) {
  const w = 80;
  const max = Math.max(...data), min = Math.min(...data);
  const range = Math.max(max - min, 1);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = height - ((v - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const areaPts = `0,${height} ${pts} ${w},${height}`;
  const gid = 'sg-' + Math.random().toString(36).slice(2,8);
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={areaPts} fill={`url(#${gid})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function KpiTile({ label, value, unit, delta, deltaDir, spark, sparkColor }) {
  return (
    <div className="kpi">
      <div className="lbl">{label}</div>
      <div className="val">
        {value}{unit && <span className="unit">{unit}</span>}
        {delta != null && (
          <span className={"delta " + (deltaDir === 'up' ? 'up' : 'down')}>
            <Icon name={deltaDir === 'up' ? 'trending-up' : 'trending-down'} size={11}/>
            {delta}
          </span>
        )}
      </div>
      <div className="spark"><Sparkline data={spark} color={sparkColor || 'var(--accent)'} /></div>
    </div>
  );
}

function BarChart({ data, color = 'var(--accent)' }) {
  const max = Math.max(...data.map(d => d.v));
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap: 6, height: 140, padding: '10px 4px 0' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display:'flex', flexDirection:'column', alignItems:'center', gap: 6 }}>
          <div style={{
            width: '100%', maxWidth: 32,
            height: `${(d.v/max)*100}%`,
            background: `linear-gradient(180deg, ${color}, color-mix(in oklch, ${color} 70%, transparent))`,
            borderRadius: '3px 3px 0 0',
            minHeight: 4,
          }}/>
          <div style={{ fontSize: 10.5, color: 'var(--text-4)' }}>{d.l}</div>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ segments, size = 120, stroke = 14 }) {
  const cx = size/2, cy = size/2, r = (size-stroke)/2;
  const C = 2*Math.PI*r;
  const total = segments.reduce((s, x) => s + x.v, 0);
  let acc = 0;
  return (
    <svg width={size} height={size}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke}/>
      {segments.map((s, i) => {
        const len = (s.v/total) * C;
        const offset = -acc;
        acc += len;
        return (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth={stroke}
            strokeDasharray={`${len} ${C}`}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="butt"/>
        );
      })}
      <text x={cx} y={cy-4} textAnchor="middle" fontSize="11" fill="var(--text-4)">Total</text>
      <text x={cx} y={cy+12} textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--text-1)">{total}</text>
    </svg>
  );
}

function SegBar({ value, max, segments }) {
  let acc = 0;
  return (
    <div style={{ display:'flex', height: 6, borderRadius: 999, overflow: 'hidden', background: 'var(--surface-2)' }}>
      {segments.map((s, i) => {
        const w = (s.v/max)*100;
        acc += w;
        return <div key={i} style={{ width: w + '%', background: s.color }}/>;
      })}
    </div>
  );
}

window.fmtINR = fmtINR;
window.fmtDate = fmtDate;
window.fmtDay = fmtDay;
window.STATUS_LBL = STATUS_LBL;
window.Icon = Icon;
window.StatusBadge = StatusBadge;
window.Sparkline = Sparkline;
window.KpiTile = KpiTile;
window.BarChart = BarChart;
window.DonutChart = DonutChart;
window.SegBar = SegBar;
