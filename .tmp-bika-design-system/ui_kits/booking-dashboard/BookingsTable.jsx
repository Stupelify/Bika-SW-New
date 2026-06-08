// BookingsTable.jsx — Bika Banquet UI Kit
// Exports: BookingsTable to window

const { useState: useStateTable } = React;

const SAMPLE_BOOKINGS = [
  { id: '1', name: 'Sharma Wedding Reception', customer: 'Priya Sharma', phone: '+91 98765 43210', functionType: 'Wedding', functionDate: '25/12/2024', hall: 'Crystal Hall', status: 'confirmed', grandTotal: 345000, advance: 150000 },
  { id: '2', name: 'Patel Corporate Dinner', customer: 'Rajesh Patel', phone: '+91 87654 32109', functionType: 'Corporate', functionDate: '28/12/2024', hall: 'Grand Banquet', status: 'pencil', grandTotal: 180000, advance: 0 },
  { id: '3', name: 'Kumar Birthday Bash', customer: 'Sunita Kumar', phone: '+91 76543 21098', functionType: 'Birthday', functionDate: '01/01/2025', hall: 'Emerald Room', status: 'quotation', grandTotal: 95000, advance: 20000 },
  { id: '4', name: 'Mehta Family Reunion', customer: 'Ajay Mehta', phone: '+91 65432 10987', functionType: 'Reception', functionDate: '05/01/2025', hall: 'Crystal Hall', status: 'confirmed', grandTotal: 220000, advance: 100000 },
  { id: '5', name: 'Singh Engagement', customer: 'Kavita Singh', phone: '+91 54321 09876', functionType: 'Wedding', functionDate: '10/01/2025', hall: 'Rose Garden', status: 'pending', grandTotal: 280000, advance: 50000 },
  { id: '6', name: 'Gupta Tech Summit', customer: 'Vikram Gupta', phone: '+91 43210 98765', functionType: 'Corporate', functionDate: '12/01/2025', hall: 'Grand Banquet', status: 'enquiry', grandTotal: 120000, advance: 0 },
  { id: '7', name: 'Sharma Anniversary', customer: 'Neha Sharma', phone: '+91 32109 87654', functionType: 'Reception', functionDate: '14/01/2025', hall: 'Emerald Room', status: 'cancelled', grandTotal: 95000, advance: 30000 },
];

const TABS = ['All', 'Confirmed', 'Pending', 'Pencil', 'Quotation', 'Enquiry', 'Cancelled'];

function BookingsTable({ onView }) {
  const [activeTab, setActiveTab] = useStateTable('All');
  const [search, setSearch] = useStateTable('');
  const [page, setPage] = useStateTable(1);
  const PER_PAGE = 5;

  const filtered = SAMPLE_BOOKINGS.filter(b => {
    const matchTab = activeTab === 'All' || b.status === activeTab.toLowerCase();
    const matchSearch = !search || b.name.toLowerCase().includes(search.toLowerCase()) || b.customer.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const fmt = n => `₹${Number(n).toLocaleString('en-IN')}`;

  return (
    <div>
      {/* Tab row */}
      <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--surface-2)', borderRadius: 12, marginBottom: 16, overflowX: 'auto', width: 'fit-content', maxWidth: '100%' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => { setActiveTab(t); setPage(1); }}
            style={{ padding: '6px 13px', fontSize: 12.5, fontWeight: activeTab === t ? 600 : 500, color: activeTab === t ? 'var(--text-1)' : 'var(--text-3)', borderRadius: 9, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', transition: 'all 0.15s', background: activeTab === t ? 'var(--surface)' : 'transparent', boxShadow: activeTab === t ? '0 1px 3px rgba(15,23,42,0.08)' : 'none' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16, maxWidth: 320 }}>
        <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, stroke: 'var(--text-4)', fill: 'none', strokeWidth: 1.75, pointerEvents: 'none' }} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input placeholder="Search bookings…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ width: '100%', borderRadius: 12, padding: '8px 12px 8px 32px', fontSize: 13, fontFamily: 'inherit', border: '1px solid var(--border-2)', background: 'var(--surface)', color: 'var(--text-1)', boxSizing: 'border-box', outline: 'none' }} />
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, boxShadow: 'var(--shadow-xs)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
            <thead>
              <tr>
                {['Customer', 'Function', 'Date', 'Hall', 'Status', 'Grand Total', 'Advance', ''].map(h => (
                  <th key={h} style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-4)', background: 'var(--surface-2)', padding: '9px 14px', textAlign: 'left', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-4)', fontSize: 13 }}>No bookings found</td></tr>
              ) : paged.map(b => (
                <tr key={b.id}
                  style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.12s', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--teal-50)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{b.customer}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 1 }}>{b.phone}</div>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-2)', verticalAlign: 'middle' }}>
                    <div style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 1 }}>{b.functionType}</div>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{b.functionDate}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-2)', verticalAlign: 'middle' }}>{b.hall}</td>
                  <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}><StatusBadge status={b.status} size="sm" /></td>
                  <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: 'var(--text-1)', fontVariantNumeric: 'tabular-nums', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{fmt(b.grandTotal)}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{fmt(b.advance)}</td>
                  <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', gap: 4, opacity: 0.5 }}
                      onMouseEnter={e => e.currentTarget.style.opacity = 1}
                      onMouseLeave={e => e.currentTarget.style.opacity = 0.5}>
                      <button onClick={() => onView && onView(b)}
                        style={{ padding: '3px 8px', borderRadius: 7, background: 'var(--surface)', border: '1px solid var(--border-2)', fontSize: 11.5, fontWeight: 600, color: 'var(--text-3)', cursor: 'pointer', fontFamily: 'inherit' }}>View</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-4)' }}>
          <span>Showing {Math.min((page-1)*PER_PAGE+1, filtered.length)}–{Math.min(page*PER_PAGE, filtered.length)} of {filtered.length}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button disabled={page === 1} onClick={() => setPage(p => p-1)}
              style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 12, fontWeight: 600, color: 'var(--text-3)', cursor: page===1?'not-allowed':'pointer', opacity: page===1?0.5:1, fontFamily: 'inherit' }}>←</button>
            {Array.from({length: totalPages}, (_, i) => i+1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border)', background: page===p ? 'var(--teal-600)' : 'var(--surface)', fontSize: 12, fontWeight: 600, color: page===p ? 'white' : 'var(--text-3)', cursor: 'pointer', fontFamily: 'inherit' }}>{p}</button>
            ))}
            <button disabled={page === totalPages} onClick={() => setPage(p => p+1)}
              style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 12, fontWeight: 600, color: 'var(--text-3)', cursor: page===totalPages?'not-allowed':'pointer', opacity: page===totalPages?0.5:1, fontFamily: 'inherit' }}>→</button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { BookingsTable, SAMPLE_BOOKINGS });
