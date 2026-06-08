// Customers + Payments + Enquiries + light screens
function Customers({ openCustomer }) {
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    if (!q) return BIKA.customers;
    const Q = q.toLowerCase();
    return BIKA.customers.filter(c => c.name.toLowerCase().includes(Q) || c.phone.includes(q) || c.city.toLowerCase().includes(Q));
  }, [q]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Customers</h1>
          <div className="sub">{BIKA.customers.length} active · ₹1.04Cr lifetime value</div>
        </div>
        <div className="actions">
          <button className="btn"><Icon name="upload" size={13}/>Import</button>
          <button className="btn primary"><Icon name="plus" size={13}/>New customer</button>
        </div>
      </div>
      <div className="card">
        <div className="toolbar">
          <div style={{ position:'relative' }}>
            <Icon name="search" size={13} style={{ position:'absolute', left: 8, top: 8, color:'var(--text-4)' }}/>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search customers by name, phone, city…"
              style={{ height: 28, padding: '0 10px 0 26px', border:'1px solid var(--border-2)', borderRadius: 6, background:'var(--surface-2)', width: 320, fontSize: 12.5, outline:'none' }}/>
          </div>
          <button className="chip"><Icon name="building"/>City</button>
          <button className="chip"><Icon name="trending-up"/>By value</button>
          <button className="chip"><Icon name="users"/>Repeat 2+</button>
          <div style={{ flex: 1 }}/>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{list.length} of {BIKA.customers.length}</span>
        </div>

        <table className="tbl">
          <thead>
            <tr>
              <th>Customer</th><th>Phone</th><th>City</th><th>Since</th>
              <th className="num">Bookings</th><th className="num">Lifetime value</th><th></th>
            </tr>
          </thead>
          <tbody>
            {list.map(c => (
              <tr key={c.id} onClick={() => openCustomer(c.id)} style={{ cursor:'pointer' }}>
                <td>
                  <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
                    <div className="avatar" style={{ width:26, height:26, fontSize: 10 }}>{c.name.split(' ').map(x=>x[0]).slice(0,2).join('')}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color:'var(--text-1)' }}>{c.name}</div>
                      <div className="code" style={{ fontSize: 10.5, color:'var(--text-4)' }}>{c.id}</div>
                    </div>
                  </div>
                </td>
                <td className="code">{c.phone}</td>
                <td>{c.city}</td>
                <td>{c.since}</td>
                <td className="num">{c.bookings}</td>
                <td className="num money">{fmtINR(c.value, { compact: true })}</td>
                <td>
                  <div className="row-actions">
                    <button className="icon-btn"><Icon name="phone" size={13}/></button>
                    <button className="icon-btn"><Icon name="message-circle" size={13}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Enquiries() {
  const list = BIKA.enquiries;
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Enquiries</h1>
          <div className="sub">{list.length} open · 6 hot leads · avg response 2h 14m</div>
        </div>
        <div className="actions">
          <button className="btn"><Icon name="filter" size={13}/>Filters</button>
          <button className="btn primary"><Icon name="plus" size={13}/>Log enquiry</button>
        </div>
      </div>
      <div className="card">
        <div className="toolbar">
          <div className="tab-bar">
            <button className="tab active">All<span className="count">{list.length}</span></button>
            <button className="tab">Hot<span className="count">{list.filter(x=>x.score==='Hot').length}</span></button>
            <button className="tab">Warm<span className="count">{list.filter(x=>x.score==='Warm').length}</span></button>
            <button className="tab">Cold<span className="count">{list.filter(x=>x.score==='Cold').length}</span></button>
          </div>
          <div style={{ flex: 1 }}/>
          <button className="chip"><Icon name="user"/>Assignee</button>
          <button className="chip"><Icon name="phone"/>Source</button>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Ref</th><th>Customer / Phone</th><th>Function</th>
              <th>Event date</th><th className="num">Guests</th><th>Source</th>
              <th>Assignee</th><th>Age</th><th>Score</th>
            </tr>
          </thead>
          <tbody>
            {list.map(e => (
              <tr key={e.id} className="st-enquiry" style={{ cursor:'pointer' }}>
                <td className="id">{e.id}</td>
                <td className="main">
                  <div>{e.customer}</div>
                  <div className="code" style={{ fontSize:10.5, color:'var(--text-4)' }}>{e.phone}</div>
                </td>
                <td>{e.function}</td>
                <td>{fmtDate(e.date)}</td>
                <td className="num">{e.guests}</td>
                <td><span className="tag">{e.source}</span></td>
                <td>{e.assignee}</td>
                <td className="muted">{e.age}</td>
                <td>
                  <span className="st" style={{
                    background: e.score === 'Hot' ? 'rgba(220,38,38,.10)' : e.score === 'Warm' ? 'rgba(217,119,6,.10)' : 'rgba(168,162,158,.18)',
                    color: e.score === 'Hot' ? 'var(--money-neg)' : e.score === 'Warm' ? 'var(--money-warn)' : 'var(--text-3)'
                  }}>
                    <span className="d" style={{ background: e.score === 'Hot' ? 'var(--money-neg)' : e.score === 'Warm' ? 'var(--money-warn)' : 'var(--text-4)' }}/>
                    {e.score}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Payments() {
  const totalCollected = BIKA.payments.reduce((s,p) => s + p.amount, 0);
  const outstanding = BIKA.bookings.reduce((s,b) => s + (b.status !== 'cancelled' ? b.balance : 0), 0);
  const overdue = Math.round(outstanding * 0.32);
  const due7 = Math.round(outstanding * 0.41);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Payments & ledger</h1>
          <div className="sub">All transactions across bookings</div>
        </div>
        <div className="actions">
          <button className="btn"><Icon name="download" size={13}/>Export</button>
          <button className="btn primary"><Icon name="plus" size={13}/>Record payment</button>
        </div>
      </div>

      <div className="scoreboard" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <KpiTile label="Collected · 30d" value={fmtINR(totalCollected, { compact: true })} delta="+22%" deltaDir="up"
                 spark={[4,5,7,9,12,11,14,15,18,20,24,28]} sparkColor="var(--money-pos)"/>
        <KpiTile label="Outstanding" value={fmtINR(outstanding, { compact: true })} delta="-12%" deltaDir="up"
                 spark={[30,32,31,30,28,26,28,27,26,24,22,21]} sparkColor="var(--money-warn)"/>
        <KpiTile label="Overdue 30d+" value={fmtINR(overdue, { compact: true })} delta="+₹1.2L" deltaDir="down"
                 spark={[5,6,7,7,8,9,10,11,11,12,12,11]} sparkColor="var(--money-neg)"/>
        <KpiTile label="Due in 7 days" value={fmtINR(due7, { compact: true })} delta="3 invoices" deltaDir="up"
                 spark={[1,2,2,3,3,4,4,5,5,6,6,7]} sparkColor="var(--accent)"/>
      </div>

      <div className="split" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="card-head">
            <span className="ttl">Recent payments</span>
            <span className="meta">Last 30 transactions</span>
          </div>
          <table className="tbl">
            <thead>
              <tr><th>Date</th><th>Ref</th><th>Customer</th><th>Method</th><th>Type</th><th className="num">Amount</th><th>Status</th></tr>
            </thead>
            <tbody>
              {BIKA.payments.slice(0,18).map(p => (
                <tr key={p.id}>
                  <td>{fmtDate(p.date)}</td>
                  <td className="id">{p.bookingId}</td>
                  <td className="main">{p.customer}</td>
                  <td><span className="tag">{p.method}</span></td>
                  <td className="muted">{p.type}</td>
                  <td className="num money pos">{fmtINR(p.amount, { compact: true })}</td>
                  <td><span className="st confirmed"><span className="d"/>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="col" style={{ gap: 16 }}>
          <div className="card">
            <div className="card-head">
              <span className="ttl">Collection by method</span>
              <span className="meta">This month</span>
            </div>
            <div className="card-body">
              {[
                ['UPI',    52, 'var(--accent)'],
                ['NEFT',   28, 'var(--teal-500)'],
                ['Cash',   12, 'var(--money-warn)'],
                ['Card',    6, 'var(--text-3)'],
                ['Cheque',  2, 'var(--text-4)'],
              ].map(([m, v, c]) => (
                <div key={m} style={{ marginBottom: 8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span>{m}</span><span className="money" style={{ color: c, fontWeight: 600 }}>{v}%</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: 'var(--surface-2)' }}>
                    <div style={{ height: '100%', width: v+'%', borderRadius: 3, background: c }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <span className="ttl">Overdue · priority</span>
              <span className="meta">3 customers</span>
            </div>
            <div>
              {BIKA.bookings.filter(b => b.balance > 100000 && b.status !== 'cancelled').slice(0,4).map(b => (
                <div key={b.id} style={{ padding: '10px 14px', borderBottom: '1px solid var(--divider)', display:'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-1)' }}>{b.customer}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{b.ref} · {fmtDate(b.date)}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div className="money warn" style={{ fontSize: 13, fontWeight: 600 }}>{fmtINR(b.balance, { compact: true })}</div>
                    <div style={{ fontSize: 11, color:'var(--text-4)' }}>due</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Venues() {
  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Venues & halls</h1><div className="sub">{BIKA.halls.length} halls · 1 banquet complex</div></div>
        <div className="actions"><button className="btn primary"><Icon name="plus" size={13}/>Add hall</button></div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {BIKA.halls.map(h => {
          const upcoming = BIKA.bookings.filter(b => b.hallId === h.id && b.status === 'confirmed').length;
          return (
            <div key={h.id} className="card">
              <div style={{ height: 110, background: 'linear-gradient(135deg, var(--surface-2), var(--surface-3))', borderBottom:'1px solid var(--border)', position:'relative' }}>
                <span className="tag" style={{ position:'absolute', top: 10, left: 10 }}>{h.tier}</span>
                <Icon name="building-2" size={36} style={{ position:'absolute', right: 14, bottom: 14, color: 'var(--text-4)' }}/>
              </div>
              <div className="card-body">
                <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color:'var(--text-1)', flex: 1 }}>{h.name}</div>
                  <span className="code" style={{ color:'var(--text-3)', fontSize: 11 }}>{h.id}</span>
                </div>
                <div style={{ display:'flex', gap: 16, marginTop: 12, fontSize: 12 }}>
                  <div><div style={{ color:'var(--text-4)', fontSize: 10.5, textTransform:'uppercase', letterSpacing:'.06em', fontWeight: 600 }}>Capacity</div><div style={{ fontWeight: 600, color:'var(--text-1)', marginTop: 2 }}>{h.cap}</div></div>
                  <div><div style={{ color:'var(--text-4)', fontSize: 10.5, textTransform:'uppercase', letterSpacing:'.06em', fontWeight: 600 }}>Confirmed</div><div style={{ fontWeight: 600, color:'var(--text-1)', marginTop: 2 }}>{upcoming}</div></div>
                  <div><div style={{ color:'var(--text-4)', fontSize: 10.5, textTransform:'uppercase', letterSpacing:'.06em', fontWeight: 600 }}>Utiliz.</div><div className="money pos" style={{ fontWeight: 600, marginTop: 2 }}>{60 + (h.cap%30)}%</div></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MenuScreen() {
  const packs = [
    { id:'P1', name: 'Silver Veg', plate: 1450, items: 24, type:'Veg' },
    { id:'P2', name: 'Gold Veg', plate: 1850, items: 32, type:'Veg' },
    { id:'P3', name: 'Royal Veg+', plate: 2150, items: 38, type:'Veg' },
    { id:'P4', name: 'Royal Wedding', plate: 2450, items: 44, type:'Mixed' },
    { id:'P5', name: 'Corporate Lunch', plate: 950, items: 18, type:'Mixed' },
    { id:'P6', name: 'Jain Special', plate: 1750, items: 28, type:'Jain' },
  ];
  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Menu & items</h1><div className="sub">6 packs · 184 items · 22 categories</div></div>
        <div className="actions">
          <button className="btn"><Icon name="utensils-crossed" size={13}/>Items</button>
          <button className="btn primary"><Icon name="plus" size={13}/>New pack</button>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {packs.map(p => (
          <div key={p.id} className="card">
            <div className="card-body">
              <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
                <Icon name="utensils-crossed" size={16} style={{ color:'var(--accent)' }}/>
                <div style={{ fontWeight: 600, color:'var(--text-1)', flex: 1 }}>{p.name}</div>
                <span className="tag">{p.type}</span>
              </div>
              <div style={{ marginTop: 12, display:'flex', alignItems:'baseline', gap: 6 }}>
                <span style={{ fontSize: 24, fontWeight: 700, letterSpacing:'-0.02em' }}>{fmtINR(p.plate)}</span>
                <span style={{ color:'var(--text-3)', fontSize: 12 }}>/plate</span>
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color:'var(--text-3)' }}>{p.items} items · 3 courses</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Reports() {
  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Reports</h1><div className="sub">Revenue, utilization, function trends</div></div>
        <div className="actions">
          <button className="btn"><Icon name="calendar" size={13}/>FY 2025–26</button>
          <button className="btn"><Icon name="download" size={13}/>Export PDF</button>
        </div>
      </div>
      <div className="scoreboard">
        <KpiTile label="FY revenue" value="₹7.42Cr" delta="+18%" deltaDir="up" spark={[10,12,14,15,18,20,22,24,28,30,32,35]} sparkColor="var(--accent)"/>
        <KpiTile label="Bookings" value="284" delta="+24" deltaDir="up" spark={[18,20,22,26,28,30,32,30,32,34,36,38]} sparkColor="var(--st-confirmed-dot)"/>
        <KpiTile label="Avg ticket" value="₹2.61L" delta="+6.4%" deltaDir="up" spark={[2.0,2.1,2.2,2.3,2.4,2.4,2.5,2.5,2.6,2.6,2.61,2.7]} sparkColor="var(--text-2)"/>
        <KpiTile label="Cancellations" value="11" delta="-3" deltaDir="up" spark={[5,4,4,3,3,2,2,3,2,2,1,1]} sparkColor="var(--money-neg)"/>
        <KpiTile label="Repeat rate" value="32%" delta="+4 pts" deltaDir="up" spark={[20,22,24,25,26,27,28,29,30,31,32,32]} sparkColor="var(--money-pos)"/>
      </div>

      <div className="split" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="card-head"><span className="ttl">Revenue by function type</span><span className="meta">FY 2025–26</span></div>
          <div className="card-body">
            <BarChart data={[
              { l:'Wedding', v: 320 }, { l:'Corp.', v: 110 }, { l:'Engage.', v: 88 },
              { l:'Recept.', v: 156 }, { l:'B-day', v: 42 }, { l:'Conf.', v: 60 }, { l:'Other', v: 36 }
            ]} color="var(--accent)"/>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><span className="ttl">Top customers</span><span className="meta">By lifetime value</span></div>
          <div>
            {[...BIKA.customers].sort((a,b)=>b.value-a.value).slice(0,6).map((c,i) => (
              <div key={c.id} style={{ display:'flex', alignItems:'center', gap: 10, padding:'8px 14px', borderBottom:'1px solid var(--divider)' }}>
                <div style={{ width:18, fontSize:11, color:'var(--text-4)', fontWeight: 600 }}>{i+1}</div>
                <div style={{ flex: 1, fontSize: 12.5, fontWeight: 500 }}>{c.name}</div>
                <div className="money" style={{ fontWeight: 600, fontSize: 12.5 }}>{fmtINR(c.value, {compact:true})}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Logs() {
  const items = [
    { t:'a few seconds ago', who:'Priya N.', act:'updated', tgt:'BK-24317 status to Confirmed', mod:'Bookings' },
    { t:'2 minutes ago',     who:'Rahul S.', act:'recorded', tgt:'payment ₹85,000 (UPI) on BK-24312', mod:'Payments' },
    { t:'14 minutes ago',    who:'Ananya K.', act:'created', tgt:'enquiry EN-8819 for Wedding', mod:'Enquiries' },
    { t:'1 hour ago',        who:'System',   act:'sent', tgt:'quotation PDF to mehta@gmail.com', mod:'System' },
    { t:'2 hours ago',       who:'Sameer V.', act:'modified', tgt:'menu pack Royal Wedding (Pack 4)', mod:'Menu' },
    { t:'5 hours ago',       who:'Priya N.', act:'cancelled', tgt:'BK-24296 with refund ₹2.4L', mod:'Bookings' },
  ];
  return (
    <div className="page">
      <div className="page-head"><div><h1>Activity log</h1><div className="sub">Every change, every user, every booking.</div></div></div>
      <div className="card">
        {items.map((x, i) => (
          <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid var(--divider)', display:'flex', gap: 12, alignItems:'center' }}>
            <div className="avatar" style={{ width:28, height:28, fontSize: 10 }}>{x.who.split(' ').map(c=>c[0]).join('')}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13 }}><b>{x.who}</b> <span style={{ color:'var(--text-3)' }}>{x.act}</span> <b>{x.tgt}</b></div>
              <div style={{ fontSize: 11, color:'var(--text-4)', marginTop: 2 }}>{x.t} · {x.mod}</div>
            </div>
            <span className="tag">{x.mod}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Settings() {
  return (
    <div className="page">
      <div className="page-head"><div><h1>Settings</h1><div className="sub">Team, roles, integrations</div></div></div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap: 14 }}>
        {[
          { i:'users', t:'Team', s:'12 users · 4 roles' },
          { i:'shield', t:'Permissions', s:'Role-based access control' },
          { i:'building-2', t:'Business profile', s:'Bika Banquets · Andheri' },
          { i:'mail', t:'Email & WhatsApp', s:'SMTP · WhatsApp Business' },
          { i:'credit-card', t:'Billing', s:'Pro plan · ₹4,999/mo' },
          { i:'plug-zap', t:'Integrations', s:'4 connected · Razorpay, Zoho' },
        ].map((c, i) => (
          <div key={i} className="card" style={{ padding: 16, display:'flex', flexDirection:'column', gap: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--accent-soft)', color: 'var(--accent-text)', display:'grid', placeItems:'center' }}>
              <Icon name={c.i} size={18}/>
            </div>
            <div style={{ fontWeight: 600, color:'var(--text-1)', marginTop: 4 }}>{c.t}</div>
            <div style={{ fontSize: 12, color:'var(--text-3)' }}>{c.s}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

window.Customers = Customers;
window.Enquiries = Enquiries;
window.Payments = Payments;
window.Venues = Venues;
window.MenuScreen = MenuScreen;
window.Reports = Reports;
window.Logs = Logs;
window.Settings = Settings;
