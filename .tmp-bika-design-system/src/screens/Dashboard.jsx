// Dashboard screen
function Dashboard({ activity, setRoute }) {
  const kpis = [
    { label: 'Revenue · 30d', value: '₹62.4L', delta: '+14.2%', deltaDir:'up',
      spark: [4,8,7,12,10,14,16,11,15,18,21,24], sparkColor: 'var(--accent)' },
    { label: 'Confirmed bookings', value: '38', delta: '+6', deltaDir:'up',
      spark: [3,5,4,6,7,5,8,9,7,10,12,14], sparkColor: 'var(--st-confirmed-dot)' },
    { label: 'Pencil at risk', value: '₹14.2L', delta: '+₹3L', deltaDir:'down',
      spark: [2,3,5,4,6,7,6,8,9,10,11,12], sparkColor: 'var(--st-pencil-dot)' },
    { label: 'Outstanding', value: '₹28.6L', delta: '-₹4.1L', deltaDir:'up',
      spark: [40,38,36,34,32,30,30,29,29,28.6,28,27], sparkColor: 'var(--money-warn)' },
    { label: 'Avg. ticket', value: '₹2.18L', delta: '+9.4%', deltaDir:'up',
      spark: [1.6,1.7,1.8,1.7,1.9,2.0,2.1,2.0,2.1,2.18,2.2,2.25], sparkColor: 'var(--text-2)' },
  ];

  const revData = [
    { l:'Jun', v: 42 }, { l:'Jul', v: 58 }, { l:'Aug', v: 51 },
    { l:'Sep', v: 64 }, { l:'Oct', v: 72 }, { l:'Nov', v: 88 },
    { l:'Dec', v: 124 }, { l:'Jan', v: 96 }, { l:'Feb', v: 110 },
    { l:'Mar', v: 132 }, { l:'Apr', v: 118 }, { l:'May', v: 62 },
  ];

  const hallMix = [
    { l:'Grand Ballroom',   v: 18, color:'var(--teal-700)' },
    { l:'Crystal Hall',     v: 9,  color:'var(--teal-500)' },
    { l:'Heritage Hall',    v: 14, color:'var(--accent)' },
    { l:'Garden Pavilion',  v: 6,  color:'var(--money-warn)' },
    { l:'Emerald Suite',    v: 4,  color:'var(--text-3)' },
  ];

  const upcoming = BIKA.bookings.filter(b => b.date >= '2026-05-28' && b.status !== 'cancelled').slice(0, 5);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Operations overview</h1>
          <div className="sub">Andheri property · {new Date().toLocaleDateString('en-GB',{weekday:'long', day:'2-digit', month:'long'})}</div>
        </div>
        <div className="actions">
          <div className="tab-bar">
            <button className="tab">Today</button>
            <button className="tab active">This week</button>
            <button className="tab">30 days</button>
            <button className="tab">Quarter</button>
          </div>
          <button className="btn"><Icon name="download" size={13}/>Export</button>
          <button className="btn primary" onClick={() => { setRoute('bookings'); setTimeout(()=>window.dispatchEvent(new CustomEvent('bika:new-booking')), 50);}}>
            <Icon name="plus" size={13}/>New booking
          </button>
        </div>
      </div>

      <div className="scoreboard">
        {kpis.map((k, i) => <KpiTile key={i} {...k}/>)}
      </div>

      <div className="split" style={{ marginTop: 16 }}>
        <div className="col" style={{ gap: 16 }}>
          {/* Revenue chart */}
          <div className="card">
            <div className="card-head">
              <span className="ttl">Revenue · trailing 12 months</span>
              <span className="meta">All venues · ₹ in Lakhs</span>
            </div>
            <div className="card-body" style={{ paddingTop: 8 }}>
              <BarChart data={revData} color="var(--accent)"/>
            </div>
          </div>

          {/* Upcoming */}
          <div className="card">
            <div className="card-head">
              <span className="ttl">Upcoming events</span>
              <span className="meta">Next 7 days</span>
              <button className="btn sm ghost" onClick={() => setRoute('bookings')}>View all<Icon name="arrow-right" size={12}/></button>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Date</th><th>Function</th><th>Hall</th><th className="num">Guests</th>
                  <th className="num">Value</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map(b => (
                  <tr key={b.id} className={"st-" + b.status}>
                    <td>
                      <div style={{ fontWeight: 500, color:'var(--text-1)' }}>{fmtDate(b.date)}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{b.time} · {fmtDay(b.date)}</div>
                    </td>
                    <td className="main">{b.function}<div style={{ fontSize: 11, color: 'var(--text-4)' }}>{b.customer}</div></td>
                    <td>{b.hall}</td>
                    <td className="num">{b.guests}</td>
                    <td className="num"><span className="money">{fmtINR(b.total, { compact: true })}</span></td>
                    <td><StatusBadge s={b.status}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Hall utilization */}
          <div className="card">
            <div className="card-head">
              <span className="ttl">Hall utilization · this quarter</span>
              <span className="meta">Bookings by venue</span>
            </div>
            <div className="card-body" style={{ display:'grid', gridTemplateColumns:'140px 1fr', gap: 24, alignItems:'center' }}>
              <DonutChart segments={hallMix} size={132} stroke={16}/>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {hallMix.map((h, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap: 8, padding: '6px 8px', borderRadius: 6, background:'var(--surface-2)' }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: h.color }}/>
                    <div style={{ flex: 1, fontSize: 12.5, color:'var(--text-2)' }}>{h.l}</div>
                    <div style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, color:'var(--text-1)', fontSize: 12.5 }}>{h.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right rail */}
        <div className="col" style={{ gap: 16 }}>
          <div className="card">
            <div className="card-head">
              <span className="ttl">Insights</span>
              <span className="meta"><Icon name="sparkles" size={11}/> Updated 4m ago</span>
            </div>
            {BIKA.insights.map((it, i) => (
              <div key={i} className={"insight " + it.kind}>
                <div className="ic">
                  <Icon name={it.kind === 'good' ? 'trending-up' : it.kind === 'warn' ? 'alert-triangle' : it.kind === 'bad' ? 'alert-circle' : 'info'} size={14}/>
                </div>
                <div>
                  <div className="ttl">{it.ttl}</div>
                  <div className="sub">{it.sub}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-head">
              <span className="ttl">Live activity</span>
              <span className="meta">Realtime · all staff</span>
            </div>
            <div style={{ maxHeight: 360, overflow: 'auto' }}>
              {activity.length === 0 && (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)', fontSize: 12.5 }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>—</div>
                  Listening for activity…
                </div>
              )}
              {activity.map((a, i) => (
                <div key={a.id} className={"feed-item in-" + a.kind + (i === 0 && a.fresh ? ' fresh' : '')}>
                  <div className="dot"></div>
                  <div>
                    <div className="who"><b>{a.who}</b> {a.action} <b>{a.target}</b></div>
                    {a.detail && <div style={{ color: 'var(--text-3)', fontSize: 11.5, marginTop: 2 }}>{a.detail}</div>}
                  </div>
                  <div className="time">{a.time}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <span className="ttl">Today's checklist</span>
              <span className="meta">3 of 7 done</span>
            </div>
            <div style={{ padding: 6 }}>
              {[
                { done: true, txt: 'Confirm Crystal Hall AC repair', who:'Operations' },
                { done: true, txt: 'Send quotation BK-24317 to Mehta', who:'Sales' },
                { done: true, txt: 'Approve menu update – Pack 4', who:'Chef' },
                { done: false, txt: 'Follow-up: 4 pencil bookings expiring', who:'You · Priya' },
                { done: false, txt: 'Daily cash reconciliation', who:'Accounts' },
                { done: false, txt: 'Walk-through: tomorrow\'s 3 events', who:'Operations' },
                { done: false, txt: 'Vendor payments — 2 overdue', who:'Accounts' },
              ].map((t, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap: 10, padding: '6px 8px', borderRadius: 6 }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: 4,
                    border: '1.5px solid ' + (t.done ? 'var(--accent)' : 'var(--border-2)'),
                    background: t.done ? 'var(--accent)' : 'transparent',
                    display: 'grid', placeItems: 'center', color: 'white', fontSize: 9, fontWeight: 700,
                  }}>{t.done && '✓'}</div>
                  <div style={{ flex: 1, fontSize: 12.5, color: t.done ? 'var(--text-4)' : 'var(--text-1)', textDecoration: t.done ? 'line-through' : 'none' }}>{t.txt}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{t.who}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Dashboard = Dashboard;
