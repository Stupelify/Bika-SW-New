// StatusBadge.jsx — Bika Banquet UI Kit
// Exports: StatusBadge to window

const STATUS_MAP = {
  confirmed: { label: 'Confirmed', bg: '#dcfce7', color: '#15803d' },
  pending:   { label: 'Pending',   bg: '#fffbeb', color: '#92400e' },
  cancelled: { label: 'Cancelled', bg: '#fef2f2', color: '#991b1b' },
  quotation: { label: 'Quotation', bg: '#eff6ff', color: '#1d4ed8' },
  pencil:    { label: 'Pencil',    bg: '#fffbeb', color: '#92400e' },
  enquiry:   { label: 'Enquiry',   bg: '#f0f9ff', color: '#0369a1' },
};

function StatusBadge({ status, size = 'md' }) {
  const key = (status || '').toLowerCase().trim();
  const cfg = STATUS_MAP[key] || STATUS_MAP.pending;
  const isSmall = size === 'sm';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: isSmall ? '2px 7px' : '3px 9px',
      borderRadius: '9999px',
      fontSize: isSmall ? '11px' : '12px',
      fontWeight: 600, whiteSpace: 'nowrap',
      background: cfg.bg, color: cfg.color,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, display: 'inline-block', flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

Object.assign(window, { StatusBadge });
