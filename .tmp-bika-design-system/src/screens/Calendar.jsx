// Calendar — month view + venue timeline
function Calendar({ openSheetForBookingId }) {
  const [view, setView] = useState('month');
  const [month, setMonth] = useState({ y: 2026, m: 5 }); // June 2026

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Calendar</h1>
          <div className="sub">Visual view of all bookings & enquiries</div>
        </div>
        <div className="actions">
          <div className="tab-bar">
            <button className={"tab " + (view === 'month' ? 'active' : '')} onClick={() => setView('month')}>Month</button>
            <button className={"tab " + (view === 'timeline' ? 'active' : '')} onClick={() => setView('timeline')}>Venue timeline</button>
            <button className={"tab " + (view === 'week' ? 'active' : '')} onClick={() => setView('week')}>Week</button>
          </div>
          <button className="btn"><Icon name="filter" size={13}/>Filters</button>
          <button className="btn primary"><Icon name="plus" size={13}/>New booking</button>
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 12 }}>
        <button className="icon-btn"><Icon name="chevron-left" size={14}/></button>
        <div style={{ fontWeight: 600, fontSize: 14, minWidth: 140 }}>
          {new Date(month.y, month.m).toLocaleDateString('en-GB',{month:'long', year:'numeric'})}
        </div>
        <button className="icon-btn"><Icon name="chevron-right" size={14}/></button>
        <button className="btn sm ghost">Today</button>
        <div style={{ flex: 1 }}/>
        <div style={{ display:'flex', alignItems:'center', gap: 10, fontSize: 11.5 }}>
          {[
            ['Confirmed', 'var(--st-confirmed-dot)'],
            ['Pencil',    'var(--st-pencil-dot)'],
            ['Quotation', 'var(--st-quotation-dot)'],
            ['Enquiry',   'var(--st-enquiry-dot)'],
          ].map(([l, c]) => (
            <div key={l} style={{ display:'flex', alignItems:'center', gap: 5, color:'var(--text-3)' }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: c }}/>{l}
            </div>
          ))}
        </div>
      </div>

      {view === 'month' && <MonthGrid month={month} openSheetForBookingId={openSheetForBookingId}/>}
      {view === 'timeline' && <VenueTimeline openSheetForBookingId={openSheetForBookingId}/>}
      {view === 'week' && <WeekView openSheetForBookingId={openSheetForBookingId}/>}
    </div>
  );
}

function MonthGrid({ month, openSheetForBookingId }) {
  const first = new Date(month.y, month.m, 1);
  const startDow = (first.getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(month.y, month.m+1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) {
    const d = new Date(month.y, month.m, -(startDow - 1 - i));
    cells.push({ date: d, out: true });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push({ date: new Date(month.y, month.m, i), out: false });
  }
  while (cells.length < 42) {
    const last = cells[cells.length-1].date;
    const d = new Date(last); d.setDate(d.getDate()+1);
    cells.push({ date: d, out: true });
  }

  const evtsByDay = {};
  BIKA.bookings.forEach(b => {
    (evtsByDay[b.date] ||= []).push(b);
  });

  return (
    <div className="cal-grid">
      {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <div key={d} className="dow">{d}</div>)}
      {cells.map((c, i) => {
        const iso = c.date.toISOString().slice(0,10);
        const evts = evtsByDay[iso] || [];
        const today = iso === '2026-05-28';
        return (
          <div key={i} className={"cal-cell " + (c.out ? 'out' : '') + (today ? ' today' : '')}>
            <div className="dn">{c.date.getDate()}{today && <span style={{ fontSize:10 }}>Today</span>}</div>
            {evts.slice(0, 3).map(e => (
              <div key={e.id} className={"cal-evt " + e.status} onClick={() => openSheetForBookingId(e.id)} style={{ cursor:'pointer' }}>
                <span style={{ fontVariantNumeric:'tabular-nums', fontWeight: 600 }}>{e.time}</span>
                <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.customer}</span>
              </div>
            ))}
            {evts.length > 3 && <div className="cal-more">+{evts.length-3} more</div>}
          </div>
        );
      })}
    </div>
  );
}

function VenueTimeline({ openSheetForBookingId }) {
  const startDate = new Date('2026-05-25');
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(startDate); d.setDate(d.getDate()+i); return d;
  });
  const dayKey = d => d.toISOString().slice(0,10);

  // Group bookings into bars per hall
  const halls = BIKA.halls;
  function barsFor(hallId) {
    return BIKA.bookings.filter(b => b.hallId === hallId && b.date >= dayKey(days[0]) && b.date <= dayKey(days[13]) && b.status !== 'cancelled');
  }

  return (
    <div className="tl-wrap">
      <div className="tl">
        <div className="tl-head">
          <div className="lbl">Venue</div>
          <div className="tl-days">
            {days.map((d, i) => (
              <div key={i} className={"d " + ((d.getDay() === 0 || d.getDay() === 6) ? 'weekend' : '')}>
                <b>{d.getDate()}</b>
                {d.toLocaleDateString('en-GB',{weekday:'short'})}
              </div>
            ))}
          </div>
        </div>

        {halls.map(h => {
          const bars = barsFor(h.id);
          return (
            <div key={h.id} className="tl-row">
              <div className="name">
                <Icon name="building-2" size={13}/>
                {h.name}
                <span className="cap">{h.cap}</span>
              </div>
              <div className="tl-track">
                {bars.map(b => {
                  const idx = days.findIndex(d => dayKey(d) === b.date);
                  if (idx < 0) return null;
                  const left = (idx / 14) * 100;
                  const width = (1 / 14) * 100;
                  return (
                    <div key={b.id} className={"tl-bar " + b.status}
                         onClick={() => openSheetForBookingId(b.id)}
                         style={{ left: `calc(${left}% + 2px)`, width: `calc(${width}% - 4px)` }}>
                      <Icon name={b.status === 'pencil' ? 'pencil' : 'check'} size={11}/>
                      {b.customer}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ openSheetForBookingId }) {
  // Simplified week view
  const startDate = new Date('2026-05-25');
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate); d.setDate(d.getDate()+i); return d;
  });
  const hours = Array.from({ length: 11 }, (_, i) => 10 + i);
  return (
    <div className="card">
      <div style={{ display:'grid', gridTemplateColumns: '60px repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
        <div></div>
        {days.map((d, i) => (
          <div key={i} style={{ padding: '10px 8px', borderLeft:'1px solid var(--divider)', fontSize: 11 }}>
            <div style={{ color:'var(--text-3)', textTransform:'uppercase', fontSize: 10.5, letterSpacing:'.06em', fontWeight: 600 }}>
              {d.toLocaleDateString('en-GB',{weekday:'short'})}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color:'var(--text-1)' }}>{d.getDate()}</div>
          </div>
        ))}
      </div>
      {hours.map(h => (
        <div key={h} style={{ display:'grid', gridTemplateColumns: '60px repeat(7, 1fr)', borderBottom:'1px solid var(--divider)', minHeight: 50 }}>
          <div style={{ padding: '6px 8px', fontSize: 11, color:'var(--text-4)', textAlign:'right' }}>
            {h > 12 ? (h-12) + ' PM' : h + ' AM'}
          </div>
          {days.map((d, i) => {
            const evts = BIKA.bookings.filter(b => b.date === d.toISOString().slice(0,10) && parseInt(b.time) === h);
            return (
              <div key={i} style={{ borderLeft:'1px solid var(--divider)', padding: 3, position:'relative' }}>
                {evts.map(e => (
                  <div key={e.id} className={"cal-evt " + e.status} style={{ marginBottom: 2, cursor:'pointer' }} onClick={() => openSheetForBookingId(e.id)}>
                    <span style={{ fontWeight: 600 }}>{e.time}</span> {e.customer}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

window.Calendar = Calendar;
