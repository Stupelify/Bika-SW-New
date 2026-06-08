// Bookings list + detail side-sheet
function Bookings({ openSheetForBookingId, sheetBookingId, closeSheet, onNew }) {
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState({ status: null, hall: null, range: 'next30' });

  useEffect(() => {
    const handler = () => onNew();
    window.addEventListener('bika:new-booking', handler);
    return () => window.removeEventListener('bika:new-booking', handler);
  }, [onNew]);

  const list = useMemo(() => {
    let xs = BIKA.bookings;
    if (tab !== 'all') xs = xs.filter(b => b.status === tab);
    if (q) {
      const Q = q.toLowerCase();
      xs = xs.filter(b => b.customer.toLowerCase().includes(Q) || b.ref.toLowerCase().includes(Q) || b.function.toLowerCase().includes(Q));
    }
    if (filters.hall) xs = xs.filter(b => b.hallId === filters.hall);
    return xs;
  }, [tab, q, filters]);

  const counts = {
    all: BIKA.bookings.length,
    confirmed: BIKA.bookings.filter(b => b.status === 'confirmed').length,
    pencil: BIKA.bookings.filter(b => b.status === 'pencil').length,
    quotation: BIKA.bookings.filter(b => b.status === 'quotation').length,
    enquiry: BIKA.bookings.filter(b => b.status === 'enquiry').length,
  };

  const sheetBooking = sheetBookingId ? BIKA.bookings.find(b => b.id === sheetBookingId) : null;

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div className="page" style={{ paddingTop: 14, paddingBottom: 0 }}>
        <div className="page-head">
          <div>
            <h1>Bookings</h1>
            <div className="sub">{counts.all} total · {counts.confirmed} confirmed · {counts.pencil} pencil</div>
          </div>
          <div className="actions">
            <button className="btn"><Icon name="download" size={13}/>Export</button>
            <button className="btn primary" onClick={onNew}><Icon name="plus" size={13}/>New booking</button>
          </div>
        </div>

        <div className="card" style={{ overflow: 'visible' }}>
          <div className="toolbar">
            <div className="tab-bar">
              {[
                ['all','All', counts.all],
                ['confirmed','Confirmed', counts.confirmed],
                ['pencil','Pencil', counts.pencil],
                ['quotation','Quotation', counts.quotation],
                ['enquiry','Enquiry', counts.enquiry],
              ].map(([id,lbl,n]) => (
                <button key={id} className={"tab " + (tab === id ? 'active' : '')} onClick={() => setTab(id)}>
                  {lbl}<span className="count">{n}</span>
                </button>
              ))}
            </div>
            <div style={{ flex: 1 }}/>
            <div style={{ position:'relative' }}>
              <Icon name="search" size={13} style={{ position:'absolute', left: 8, top: 8, color:'var(--text-4)' }}/>
              <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Filter bookings…"
                style={{ height: 28, padding: '0 10px 0 26px', border:'1px solid var(--border-2)', borderRadius: 6, background:'var(--surface-2)', width: 220, fontSize: 12.5, outline:'none' }}/>
            </div>
            <button className={"chip " + (filters.hall ? 'on' : '')} onClick={() => setFilters(f => ({ ...f, hall: f.hall ? null : 'H1' }))}>
              <Icon name="building-2"/>Hall: {filters.hall ? BIKA.halls.find(h=>h.id===filters.hall).name : 'Any'}
            </button>
            <button className="chip"><Icon name="calendar"/>Next 30 days</button>
            <button className="chip"><Icon name="plus" size={11}/>Add filter</button>
            <button className="icon-btn" title="Density"><Icon name="rows-3" size={14}/></button>
            <button className="icon-btn" title="Columns"><Icon name="columns-3" size={14}/></button>
          </div>

          <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 240px)' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Customer / Function</th>
                  <th>Date</th>
                  <th>Hall</th>
                  <th className="num">Guests</th>
                  <th className="num">Total</th>
                  <th className="num">Balance</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {list.map(b => (
                  <tr key={b.id} className={"st-" + b.status + (sheetBookingId === b.id ? ' selected' : '')}
                      onClick={() => openSheetForBookingId(b.id)} style={{ cursor: 'pointer' }}>
                    <td className="id">{b.ref}</td>
                    <td className="main">
                      <div>{b.customer}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{b.function}</div>
                    </td>
                    <td>
                      <div>{fmtDate(b.date)}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{b.time} · {fmtDay(b.date)}</div>
                    </td>
                    <td>{b.hall}</td>
                    <td className="num">{b.guests}</td>
                    <td className="num"><span className="money">{fmtINR(b.total, { compact:true })}</span></td>
                    <td className="num">
                      <span className={"money " + (b.balance > 0 ? 'warn' : 'pos')}>{fmtINR(b.balance, { compact:true })}</span>
                    </td>
                    <td><StatusBadge s={b.status}/></td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="row-actions">
                        <button className="icon-btn" title="Open"><Icon name="external-link" size={13}/></button>
                        <button className="icon-btn" title="More"><Icon name="more-horizontal" size={13}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-3)', display:'flex', alignItems:'center', gap: 12 }}>
            <span>{list.length} bookings</span>
            <span style={{ flex: 1 }}/>
            <span className="kbd">J</span> Next  &nbsp;
            <span className="kbd">K</span> Prev  &nbsp;
            <span className="kbd">↵</span> Open
          </div>
        </div>
      </div>

      {sheetBooking && <BookingSheet booking={sheetBooking} onClose={closeSheet}/>}
    </div>
  );
}

function BookingSheet({ booking: b, onClose }) {
  const [tab, setTab] = useState('overview');
  return (
    <>
      <div className="sheet-scrim" onClick={onClose}/>
      <div className="sheet">
        <div className="sheet-head">
          <div style={{ flex: 1 }}>
            <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
              <span className="code" style={{ color:'var(--text-3)' }}>{b.ref}</span>
              <StatusBadge s={b.status}/>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4, letterSpacing: '-0.01em' }}>
              {b.function} · {b.customer}
            </div>
          </div>
          <button className="icon-btn" title="Edit"><Icon name="pencil" size={14}/></button>
          <button className="icon-btn" title="More"><Icon name="more-horizontal" size={14}/></button>
          <button className="icon-btn" onClick={onClose} title="Close"><Icon name="x" size={14}/></button>
        </div>

        <div style={{ display:'flex', gap: 0, padding: '0 16px', borderBottom:'1px solid var(--border)' }}>
          {['overview','menu','payments','timeline','files'].map(t => (
            <button key={t} onClick={()=>setTab(t)}
              style={{
                border: 0, background: 'transparent', padding: '10px 12px',
                fontSize: 12.5, fontWeight: 500, cursor:'pointer',
                color: tab === t ? 'var(--text-1)' : 'var(--text-3)',
                borderBottom: '2px solid ' + (tab === t ? 'var(--accent)' : 'transparent'),
                textTransform: 'capitalize',
              }}>{t}</button>
          ))}
        </div>

        <div className="sheet-body">
          {tab === 'overview' && <SheetOverview b={b}/>}
          {tab === 'menu'     && <SheetMenu b={b}/>}
          {tab === 'payments' && <SheetPayments b={b}/>}
          {tab === 'timeline' && <SheetTimeline b={b}/>}
          {tab === 'files'    && <SheetFiles/>}
        </div>

        <div className="sheet-foot">
          <button className="btn"><Icon name="file-text" size={13}/>Quotation PDF</button>
          <button className="btn"><Icon name="message-circle" size={13}/>WhatsApp</button>
          <div style={{ flex: 1 }}/>
          <button className="btn"><Icon name="x" size={13}/>Cancel booking</button>
          <button className="btn primary"><Icon name="check" size={13}/>Confirm</button>
        </div>
      </div>
    </>
  );
}

function KV({ k, v, mono }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', padding: '6px 0', borderBottom:'1px dashed var(--divider)' }}>
      <div style={{ fontSize: 11.5, color: 'var(--text-3)', textTransform:'uppercase', letterSpacing:'.04em', fontWeight: 600 }}>{k}</div>
      <div style={{ fontSize: 13, color: 'var(--text-1)', fontFamily: mono ? 'var(--font-mono)' : 'inherit', fontVariantNumeric:'tabular-nums' }}>{v}</div>
    </div>
  );
}

function SheetOverview({ b }) {
  return (
    <div className="col" style={{ gap: 18 }}>
      <div style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: 14,
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12
      }}>
        <div>
          <div style={{ fontSize: 11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.04em' }}>Grand total</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, letterSpacing:'-0.02em' }}>{fmtINR(b.total)}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.04em' }}>Advance</div>
          <div className="money pos" style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{fmtINR(b.advance)}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.04em' }}>Balance</div>
          <div className={"money " + (b.balance > 0 ? 'warn' : 'pos')} style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{fmtINR(b.balance)}</div>
        </div>
        <div style={{ gridColumn:'1 / -1' }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize: 11, color: 'var(--text-3)' }}>
            <span>Collection</span>
            <span>{Math.round((b.advance / b.total) * 100)}% received</span>
          </div>
          <div style={{ marginTop: 6 }}>
            <SegBar value={b.advance} max={b.total} segments={[{ v: b.advance, color: 'var(--accent)' }]}/>
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom: 4 }}>Event details</div>
        <KV k="Function date" v={`${fmtDate(b.date)} · ${b.time}`}/>
        <KV k="Hall" v={b.hall}/>
        <KV k="Expected guests" v={b.guests}/>
        <KV k="Booking type" v="Lunch + Dinner · 2 slots"/>
        <KV k="Created" v={fmtDate(b.created)}/>
      </div>

      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom: 4 }}>Customer</div>
        <KV k="Name" v={b.customer}/>
        <KV k="Customer ID" v={b.customerId} mono/>
        <KV k="Phone" v={b.phone} mono/>
        <KV k="Referred by" v="Patel Family (CUS-1056)"/>
      </div>
    </div>
  );
}

function SheetMenu({ b }) {
  const packs = [
    { name: 'Welcome (5 PM – 7 PM)', items: ['Pani Puri Station', 'Chaat Counter', 'Mocktail Bar', 'Mini Samosa', 'Tikki Trio'] },
    { name: 'Main Dinner (8 PM – 10 PM)', items: ['Paneer Tikka Lazeez', 'Murgh Malai', 'Dal Bukhara', 'Tandoori Roti / Kulcha', 'Jeera Rice', 'Salad Bar (6)', 'Live Dosa Counter'] },
    { name: 'Dessert (after dinner)', items: ['Gulab Jamun', 'Rasmalai', 'Live Jalebi', 'Kulfi Faluda', 'Pan Counter'] },
  ];
  return (
    <div className="col" style={{ gap: 14 }}>
      <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
        Pack 4 · Pure Veg · Jain options available · <b style={{ color: 'var(--text-1)' }}>₹2,150/plate × {b.guests} guests</b>
      </div>
      {packs.map((p, i) => (
        <div key={i} style={{ border:'1px solid var(--border)', borderRadius: 8, overflow:'hidden' }}>
          <div style={{ padding: '8px 12px', background:'var(--surface-2)', fontWeight: 600, fontSize: 12.5, display:'flex', alignItems:'center', gap: 8, borderBottom:'1px solid var(--border)' }}>
            <Icon name="utensils-crossed" size={13}/> {p.name}
            <span style={{ marginLeft:'auto', fontSize: 11, color:'var(--text-3)', fontWeight: 500 }}>{p.items.length} items</span>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap: 6, padding: 10 }}>
            {p.items.map((it, j) => <span key={j} className="tag">{it}</span>)}
          </div>
        </div>
      ))}
    </div>
  );
}

function SheetPayments({ b }) {
  const rows = [
    { d: b.created, m: 'UPI', a: Math.round(b.advance*.4), n: 'Token amount' },
    { d: '2026-04-12', m: 'NEFT', a: Math.round(b.advance*.6), n: 'Pre-event advance' },
  ];
  return (
    <div className="col" style={{ gap: 12 }}>
      <button className="btn primary" style={{ alignSelf:'flex-start' }}><Icon name="plus" size={13}/>Record payment</button>
      <table className="tbl">
        <thead><tr><th>Date</th><th>Method</th><th>Note</th><th className="num">Amount</th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{fmtDate(r.d)}</td>
              <td><span className="tag">{r.m}</span></td>
              <td className="main">{r.n}</td>
              <td className="num money pos">{fmtINR(r.a)}</td>
            </tr>
          ))}
          <tr>
            <td colSpan="3" style={{ textAlign:'right', fontWeight: 600, color:'var(--text-3)' }}>Balance due</td>
            <td className={"num money " + (b.balance > 0 ? 'warn' : 'pos')} style={{ fontWeight:700 }}>{fmtINR(b.balance)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function SheetTimeline({ b }) {
  const events = [
    { t:'4m ago',  who:'Priya N.',   txt:'Updated menu pack to Pack 4', kind:'info' },
    { t:'Today',   who:'Rahul S.',   txt:'Recorded payment ₹85,000 via UPI', kind:'good' },
    { t:'Yesterday', who:'System',   txt:'Quotation v3 issued (PDF emailed)', kind:'info' },
    { t:'3d ago',  who:'Priya N.',   txt:'Confirmed Grand Ballroom for the date', kind:'good' },
    { t:'5d ago',  who:'Ananya K.',  txt:'Created enquiry · referral from Patel family', kind:'info' },
  ];
  return (
    <div>
      {events.map((e,i)=>(
        <div key={i} style={{ display:'grid', gridTemplateColumns:'12px 1fr', gap: 12, paddingBottom: 14, position:'relative' }}>
          <div style={{ position:'relative' }}>
            <div style={{ width: 8, height: 8, borderRadius: 50, background:'var(--accent)', marginTop: 5 }}/>
            {i < events.length-1 && <div style={{ position:'absolute', left: 3.5, top: 16, bottom: -14, width: 1, background: 'var(--border-2)' }}/>}
          </div>
          <div>
            <div style={{ fontSize: 12.5, color:'var(--text-1)' }}><b>{e.who}</b> {e.txt}</div>
            <div style={{ fontSize: 11, color:'var(--text-4)', marginTop: 2 }}>{e.t}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SheetFiles() {
  const files = [
    { n: 'Quotation v3.pdf', s:'182 KB', t:'PDF' },
    { n: 'Menu pack 4 — signed.pdf', s:'94 KB', t:'PDF' },
    { n: 'Floor plan — Grand Ballroom.png', s:'1.4 MB', t:'IMG' },
    { n: 'Vendor list (florist + AV).xlsx', s:'22 KB', t:'XLS' },
  ];
  return (
    <div className="col" style={{ gap: 6 }}>
      {files.map((f, i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap: 12, padding: 10, border:'1px solid var(--border)', borderRadius: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 6, background:'var(--surface-2)', display:'grid', placeItems:'center', fontSize: 9, fontWeight: 700, color:'var(--text-3)' }}>{f.t}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{f.n}</div>
            <div style={{ fontSize: 11, color:'var(--text-4)' }}>{f.s}</div>
          </div>
          <button className="icon-btn"><Icon name="download" size={13}/></button>
        </div>
      ))}
    </div>
  );
}

function NewBookingSheet({ onClose }) {
  return (
    <>
      <div className="sheet-scrim" onClick={onClose}/>
      <div className="sheet">
        <div className="sheet-head">
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.06em', fontWeight: 600 }}>New booking</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2, letterSpacing:'-0.01em' }}>Quick booking</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>
        <div className="sheet-body">
          <div style={{ fontSize: 11, fontWeight: 700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom: 10 }}>Customer</div>
          <div className="fld" style={{ position:'relative' }}>
            <label>Search or create customer</label>
            <div style={{ position:'relative' }}>
              <Icon name="search" size={13} style={{ position:'absolute', left: 10, top: 9, color:'var(--text-4)' }}/>
              <input style={{ paddingLeft: 30, width: '100%' }} placeholder="Type name or phone…" defaultValue="Aarav"/>
            </div>
            <div style={{ border:'1px solid var(--border)', borderRadius: 8, marginTop: 4, background:'var(--surface)' }}>
              {BIKA.customers.slice(0,3).map(c => (
                <div key={c.id} style={{ padding: '8px 12px', display:'flex', alignItems:'center', gap: 10, borderBottom:'1px solid var(--divider)' }}>
                  <div className="avatar" style={{ width: 24, height: 24, fontSize: 10 }}>{c.name.split(' ').map(x=>x[0]).slice(0,2).join('')}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color:'var(--text-4)' }}>{c.phone} · {c.bookings} bookings · {c.city}</div>
                  </div>
                  <span className="code" style={{ fontSize: 11, color:'var(--text-3)' }}>{c.id}</span>
                </div>
              ))}
              <div style={{ padding: '8px 12px', display:'flex', alignItems:'center', gap: 10, color:'var(--accent-text)', fontSize: 12.5, fontWeight: 500 }}>
                <Icon name="plus" size={13}/> Create new customer "Aarav…"
              </div>
            </div>
          </div>

          <div style={{ height: 16 }}/>

          <div style={{ fontSize: 11, fontWeight: 700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom: 10 }}>Event</div>
          <div className="form-grid">
            <div className="fld">
              <label>Function name</label>
              <input defaultValue="Wedding Reception"/>
            </div>
            <div className="fld">
              <label>Function type</label>
              <select defaultValue="Wedding"><option>Wedding</option><option>Engagement</option><option>Corporate</option><option>Other</option></select>
            </div>
            <div className="fld">
              <label>Date</label>
              <input type="date" defaultValue="2026-08-14"/>
            </div>
            <div className="fld">
              <label>Time</label>
              <input type="time" defaultValue="19:30"/>
            </div>
            <div className="fld">
              <label>Hall</label>
              <select><option>Grand Ballroom (800)</option><option>Crystal Hall (450)</option><option>Heritage Hall (600)</option></select>
            </div>
            <div className="fld">
              <label>Expected guests</label>
              <input type="number" defaultValue="450"/>
            </div>
            <div className="fld full">
              <label>Notes</label>
              <textarea placeholder="Any special requirements…"></textarea>
            </div>
          </div>

          <div style={{ height: 16 }}/>

          <div style={{ fontSize: 11, fontWeight: 700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom: 10 }}>Pricing</div>
          <div style={{
            background: 'var(--surface-2)', border:'1px solid var(--border)', borderRadius: 8, padding: 14
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 0' }}>
              <span style={{ color:'var(--text-3)' }}>Pack 4 · ₹2,150/plate × 450</span>
              <span className="money">{fmtINR(967500)}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 0' }}>
              <span style={{ color:'var(--text-3)' }}>Hall rental — Grand Ballroom</span>
              <span className="money">{fmtINR(75000)}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 0' }}>
              <span style={{ color:'var(--text-3)' }}>GST (5%)</span>
              <span className="money">{fmtINR(52125)}</span>
            </div>
            <div style={{ height: 1, background:'var(--border)', margin:'8px 0' }}/>
            <div style={{ display:'flex', justifyContent:'space-between', fontWeight: 700, fontSize: 14 }}>
              <span>Grand total</span>
              <span className="money">{fmtINR(1094625)}</span>
            </div>
          </div>
        </div>
        <div className="sheet-foot">
          <button className="btn" onClick={onClose}>Save as Pencil</button>
          <div style={{ flex: 1 }}/>
          <button className="btn">Save & continue</button>
          <button className="btn primary" onClick={onClose}><Icon name="check" size={13}/>Confirm booking</button>
        </div>
      </div>
    </>
  );
}

window.Bookings = Bookings;
window.NewBookingSheet = NewBookingSheet;
