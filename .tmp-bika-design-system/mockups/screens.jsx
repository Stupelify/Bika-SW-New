// screens.jsx — artboard content for the 4 migration mockups

// ── Shared data ─────────────────────────────────────────────────
const BOOKINGS_DATA = [
  { id:'BK-24301', fn:'Kapoor Wedding Reception', cust:'Ramesh Kapoor', hall:'Grand Ballroom', date:'15 Jun', total:'₹3.84L', s:'confirmed', pct:94 },
  { id:'BK-24302', fn:'Sharma Anniversary Dinner', cust:'Priya Sharma', hall:'Crystal Hall', date:'18 Jun', total:'₹1.95L', s:'pencil', pct:0, exp:'2d left' },
  { id:'BK-24303', fn:'Mehta Birthday Celebration', cust:'Anita Mehta', hall:'Heritage Hall', date:'20 Jun', total:'₹2.24L', s:'quotation', pct:0 },
  { id:'BK-24304', fn:'Kumar Engagement Ceremony', cust:'Sunil Kumar', hall:'Emerald Suite', date:'22 Jun', total:'₹1.12L', s:'enquiry', pct:0 },
  { id:'BK-24305', fn:'Patel Family Reunion', cust:'Deepak Patel', hall:'Grand Ballroom', date:'25 Jun', total:'₹4.50L', s:'confirmed', pct:67 },
  { id:'BK-24306', fn:'Iyer Naming Ceremony', cust:'Lalitha Iyer', hall:'Crystal Hall', date:'28 Jun', total:'₹0.84L', s:'pencil', pct:20, exp:'5d left' },
];

const KPI_DATA = [
  { l:'Revenue · 30d', v:'₹62.4L', delta:'+14.2%', up:true,  spark:[4,8,7,12,10,14,16,11,15,18,21,24], c:'#0F766E' },
  { l:'Confirmed', v:'38',      delta:'+6',     up:true,  spark:[3,5,4,6,7,5,8,9,7,10,12,14],  c:'#16A34A' },
  { l:'Pencil at risk', v:'₹14.2L', delta:'+₹3L', up:false, spark:[2,3,5,4,6,7,6,8,9,10,11,12], c:'#D97706' },
  { l:'Outstanding', v:'₹28.6L', delta:'-₹4.1L', up:true,  spark:[40,38,36,34,32,30,29,29,28,28,27,27], c:'#B45309' },
  { l:'Avg. ticket', v:'₹2.18L', delta:'+9.4%',  up:true,  spark:[1.6,1.7,1.8,1.7,1.9,2.0,2.1,2.0,2.1,2.18,2.2,2.25], c:'#44403C' },
];

const REV_DATA = [
  {l:'Jun',v:42},{l:'Jul',v:58},{l:'Aug',v:51},{l:'Sep',v:64},{l:'Oct',v:72},{l:'Nov',v:88},
  {l:'Dec',v:124},{l:'Jan',v:96},{l:'Feb',v:110},{l:'Mar',v:132},{l:'Apr',v:118},{l:'May',v:62},
];
const revMax = Math.max(...REV_DATA.map(d=>d.v));

// ── ARTBOARD 1 — Before (codebase) ─────────────────────────────
function BeforeArtboard() {
  const today = [
    { time:'10:00–14:00', fn:'Kapoor Wedding Reception', cust:'Ramesh Kapoor', hall:'Grand Ballroom', guests:350, total:'₹3.84L', s:'confirmed' },
    { time:'11:00–15:00', fn:'Sharma Anniversary Dinner', cust:'Priya Sharma', hall:'Crystal Hall', guests:120, total:'₹1.95L', s:'pencil' },
    { time:'19:00–23:00', fn:'Mehta Birthday Celebration', cust:'Anita Mehta', hall:'Heritage Hall', guests:200, total:'₹2.24L', s:'confirmed' },
  ];
  const cash = [12,8,24,18,32,15,9,28,41,35,22,18,30,44];
  const cashMax = Math.max(...cash);
  const funnel = [{l:'Lead',v:14},{l:'Quotation',v:9},{l:'Pencil',v:7},{l:'Won',v:22}];
  const fMax = Math.max(...funnel.map(f=>f.v));
  const kpis = [
    {l:'Revenue (30d)',v:'₹62.4L',sub:'confirmed',c:null},
    {l:'Received (30d)',v:'₹48.1L',sub:'all sources',c:null},
    {l:'Total dues',v:'₹14.3L',sub:'open balance',c:'#dc2626'},
    {l:'Today',v:'3',sub:'events',c:null},
    {l:'Pencils',v:'7',sub:'expiring',c:'#d97706'},
    {l:'Conflicts',v:'2',sub:'7d ahead',c:'#dc2626'},
  ];
  const td = { padding:'6px 0', fontSize:11, fontFamily:CB.fm, color:CB.t1, borderBottom:`1px solid rgba(228,228,231,0.7)` };

  return (
    <BeforeShell active="Timeline">
      <div style={{height:'100%',background:CB.bg,overflow:'hidden',fontFamily:CB.ff}}>
        {/* KPI strip */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:1,background:CB.bd,borderBottom:`1px solid ${CB.bd}`}}>
          {kpis.map((k,i)=>(
            <div key={i} style={{background:CB.bg,padding:'10px 12px'}}>
              <div style={{fontSize:9,textTransform:'uppercase',letterSpacing:'0.08em',color:CB.t4,fontFamily:CB.fm}}>{k.l}</div>
              <div style={{fontSize:20,fontWeight:600,fontFamily:CB.fm,marginTop:2,lineHeight:1,color:k.c||CB.t1}}>{k.v}</div>
              <div style={{fontSize:10,color:CB.t3,marginTop:2}}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Main split */}
        <div style={{display:'grid',gridTemplateColumns:'8fr 4fr',gap:1,background:CB.bd}}>
          {/* Today table */}
          <div style={{background:CB.bg,padding:16}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
              <span style={{fontSize:10,textTransform:'uppercase',letterSpacing:'0.08em',color:CB.t3,fontFamily:CB.fm}}>Today</span>
              <span style={{fontSize:10,textTransform:'uppercase',letterSpacing:'0.06em',color:CB.ac,fontFamily:CB.fm,cursor:'default'}}>Open timeline →</span>
            </div>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{borderBottom:`1px solid ${CB.bd}`}}>
                  {['Time','Function','Customer','Hall','Guests','Total','Status'].map(h=>(
                    <th key={h} style={{textAlign:['Guests','Total','Status'].includes(h)?'right':'left',padding:'4px 0',fontSize:10,textTransform:'uppercase',letterSpacing:'0.06em',color:CB.t3,fontFamily:CB.fm,fontWeight:400}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {today.map((b,i)=>(
                  <tr key={i}>
                    <td style={{...td,fontFamily:CB.fm,color:CB.t2,whiteSpace:'nowrap'}}>{b.time}</td>
                    <td style={{...td,maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',paddingLeft:4}}>{b.fn}</td>
                    <td style={{...td,color:CB.t3,paddingLeft:4}}>{b.cust}</td>
                    <td style={{...td,color:CB.t3,paddingLeft:4}}>{b.hall}</td>
                    <td style={{...td,textAlign:'right',fontFamily:CB.fm}}>{b.guests}</td>
                    <td style={{...td,textAlign:'right',fontFamily:CB.fm}}>{b.total}</td>
                    <td style={{...td,textAlign:'right'}}><OldBadge s={b.s}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Alerts */}
          <div style={{background:CB.bg,padding:16}}>
            <div style={{fontSize:10,textTransform:'uppercase',letterSpacing:'0.08em',color:CB.t3,fontFamily:CB.fm,marginBottom:8}}>Alerts</div>
            <div style={{display:'flex',flexDirection:'column',gap:3}}>
              {[
                {c:'#dc2626',k:'! Conflict',msg:'Kapoor Wedding ⇄ 1 more on 2 Jun'},
                {c:'#d97706',k:'Pencil · exp 2d',msg:'Sharma Anniversary'},
                {c:'#d97706',k:'Pencil · exp 5d',msg:'Iyer Naming Ceremony'},
                {c:'#dc2626',k:'Due 4 Jun',msg:'Patel Family Reunion — ₹1.8L',kg:CB.t3},
              ].map((a,i)=>(
                <div key={i} style={{padding:'5px 8px',borderLeft:`2px solid ${a.c}`,background:`rgba(0,0,0,0.02)`}}>
                  <div style={{fontSize:9,textTransform:'uppercase',letterSpacing:'0.06em',fontFamily:CB.fm,color:a.kg||a.c,marginBottom:1}}>{a.k}</div>
                  <div style={{fontSize:11,color:CB.t2}}>{a.msg}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom: cash + funnel */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,background:CB.bd}}>
          <div style={{background:CB.bg,padding:16}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
              <span style={{fontSize:10,textTransform:'uppercase',letterSpacing:'0.08em',color:CB.t3,fontFamily:CB.fm}}>Cash inflow — last 14 days</span>
              <span style={{fontFamily:CB.fm,fontSize:10,color:CB.t3}}>total ₹3.4L</span>
            </div>
            <div style={{display:'flex',alignItems:'flex-end',gap:2,height:72}}>
              {cash.map((v,i)=>(
                <div key={i} style={{flex:1,background:`rgba(37,99,235,0.18)`,borderTop:`1px solid ${CB.ac}`,height:`${Math.max(2,(v/cashMax)*100)}%`}}/>
              ))}
            </div>
            <div style={{display:'flex',justifyContent:'space-between',marginTop:4,fontSize:9,fontFamily:CB.fm,color:CB.t3}}>
              <span>−13d</span><span>−7d</span><span>today</span>
            </div>
          </div>
          <div style={{background:CB.bg,padding:16}}>
            <div style={{fontSize:10,textTransform:'uppercase',letterSpacing:'0.08em',color:CB.t3,fontFamily:CB.fm,marginBottom:10}}>Enquiry funnel</div>
            {funnel.map((f,i)=>(
              <div key={i} style={{marginBottom:7}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:2}}>
                  <span style={{textTransform:'uppercase',letterSpacing:'0.04em',fontSize:10,color:CB.t2}}>{f.l}</span>
                  <span style={{fontFamily:CB.fm,color:CB.t2,fontSize:11}}>{f.v}</span>
                </div>
                <div style={{height:6,background:CB.sf2}}><div style={{height:'100%',background:CB.ac,width:`${(f.v/fMax)*100}%`}}/></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BeforeShell>
  );
}

// ── ARTBOARD 2 — After: Redesigned Dashboard ────────────────────
function AfterDashArtboard() {
  const insights = [
    {k:'good',  ttl:'Utilization at 84%', sub:'Grand Ballroom fully booked next 3 weekends'},
    {k:'warn',  ttl:'7 pencils expiring this week', sub:'₹14.2L at risk — follow up today'},
    {k:'bad',   ttl:'2 active hall conflicts', sub:'BK-24301 overlaps with BK-24315 on 15 Jun'},
    {k:'info',  ttl:'Avg. ticket up 9.4%', sub:'Premium packs driving higher spend per head'},
  ];
  const insightColor = {good:'#16A34A',warn:'#D97706',bad:'#DC2626',info:'#0284C7'};
  const insightBg    = {good:'#F0FDF4',warn:'#FFFBEB',bad:'#FEF2F2',info:'#F0F9FF'};
  const upcoming = BOOKINGS_DATA.slice(0,5);

  return (
    <Shell active="dashboard" page="Dashboard">
      <div style={{height:'100%',background:T.bg,overflow:'hidden',fontFamily:T.ff}}>
        {/* Page head */}
        <div style={{padding:'14px 20px 10px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:`1px solid ${T.bd}`,flexShrink:0}}>
          <div>
            <h1 style={{fontSize:16,fontWeight:700,color:T.t1,letterSpacing:'-0.3px'}}>Operations overview</h1>
            <div style={{fontSize:11.5,color:T.t3,marginTop:2}}>Andheri property · Sunday, 1 June 2026</div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{display:'flex',border:`1px solid ${T.bd}`,borderRadius:4,overflow:'hidden'}}>
              {['Today','This week','30 days','Quarter'].map((t,i)=>(
                <button key={t} style={{padding:'5px 10px',fontSize:11,fontFamily:T.ff,background:i===1?T.ac:'transparent',color:i===1?'#fff':T.t3,border:'none',borderRight:i<3?`1px solid ${T.bd}`:'none',cursor:'default',fontWeight:i===1?500:400}}>{t}</button>
              ))}
            </div>
            <button style={{height:30,padding:'0 12px',fontSize:11.5,border:`1px solid ${T.bd}`,borderRadius:4,background:T.sf,color:T.t2,cursor:'default'}}>Export</button>
            <button style={{height:30,padding:'0 12px',fontSize:11.5,border:'none',borderRadius:4,background:T.ac,color:'#fff',cursor:'default',fontWeight:500}}>+ New booking</button>
          </div>
        </div>

        {/* KPI strip */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:1,background:T.bd,borderBottom:`1px solid ${T.bd}`}}>
          {KPI_DATA.map((k,i)=>(
            <div key={i} style={{background:T.sf,padding:'10px 14px',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div>
                <div style={{fontSize:9.5,textTransform:'uppercase',letterSpacing:'0.07em',color:T.t4,fontFamily:T.fm}}>{k.l}</div>
                <div style={{fontSize:22,fontWeight:700,color:T.t1,marginTop:3,letterSpacing:'-0.5px',lineHeight:1}}>{k.v}</div>
                <div style={{display:'flex',alignItems:'center',gap:4,marginTop:4}}>
                  <span style={{fontSize:11,color:k.up?'#16A34A':'#DC2626',fontFamily:T.fm,fontWeight:500}}>{k.up?'↑':'↓'} {k.delta}</span>
                </div>
              </div>
              <Sparkline data={k.spark} color={k.c} h={32} w={56}/>
            </div>
          ))}
        </div>

        {/* Main 2-col grid */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 360px',gap:12,padding:16,height:'calc(100% - 56px - 72px - 1px)'}}>

          {/* Left col */}
          <div style={{display:'flex',flexDirection:'column',gap:12,overflow:'hidden'}}>
            {/* Revenue chart */}
            <div style={{background:T.sf,border:`1px solid ${T.bd}`,borderRadius:T.r,padding:14,flexShrink:0}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                <span style={{fontSize:12,fontWeight:600,color:T.t1}}>Revenue · trailing 12 months</span>
                <span style={{fontSize:11,color:T.t3}}>All venues · ₹ in Lakhs</span>
              </div>
              <div style={{display:'flex',alignItems:'flex-end',gap:4,height:90}}>
                {REV_DATA.map((d,i)=>(
                  <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                    <div style={{width:'100%',background:i===11?T.sf2:T.ac,opacity:i===11?0.4:1,borderRadius:'2px 2px 0 0',height:`${(d.v/revMax)*80+2}px`}}/>
                    <div style={{fontSize:8.5,color:T.t4,fontFamily:T.fm}}>{d.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming events */}
            <div style={{background:T.sf,border:`1px solid ${T.bd}`,borderRadius:T.r,flex:1,overflow:'hidden'}}>
              <div style={{padding:'10px 14px',borderBottom:`1px solid ${T.bd}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:12,fontWeight:600,color:T.t1}}>Upcoming events</span>
                <span style={{fontSize:11,color:T.t3}}>Next 7 days</span>
              </div>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:T.sf2}}>
                    {['Date','Function','Hall','Guests','Total','Status'].map(h=>(
                      <th key={h} style={{textAlign:['Guests','Total'].includes(h)?'right':'left',padding:'7px 12px',fontSize:10,textTransform:'uppercase',letterSpacing:'0.06em',color:T.t3,fontFamily:T.fm,fontWeight:400,borderBottom:`1px solid ${T.bd}`}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map((b,i)=>(
                    <tr key={i} style={{borderBottom:`1px solid ${T.bd}`,cursor:'default'}}>
                      <td style={{padding:'8px 12px',fontSize:12,fontFamily:T.fm,color:T.t2,whiteSpace:'nowrap'}}>{b.date}</td>
                      <td style={{padding:'8px 4px',fontSize:12,color:T.t1,fontWeight:500,maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.fn}</td>
                      <td style={{padding:'8px 4px',fontSize:11.5,color:T.t3,whiteSpace:'nowrap'}}>{b.hall}</td>
                      <td style={{padding:'8px 4px',fontSize:12,fontFamily:T.fm,textAlign:'right',color:T.t2}}>—</td>
                      <td style={{padding:'8px 4px',fontSize:12,fontFamily:T.fm,textAlign:'right',fontWeight:600,color:T.t1}}>{b.total}</td>
                      <td style={{padding:'8px 12px',textAlign:'left'}}><StatusBadge s={b.s} small/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right col */}
          <div style={{display:'flex',flexDirection:'column',gap:12,overflow:'hidden'}}>
            {/* Insights */}
            <div style={{background:T.sf,border:`1px solid ${T.bd}`,borderRadius:T.r,flexShrink:0}}>
              <div style={{padding:'10px 14px',borderBottom:`1px solid ${T.bd}`,display:'flex',justifyContent:'space-between'}}>
                <span style={{fontSize:12,fontWeight:600,color:T.t1}}>Insights</span>
                <span style={{fontSize:10,color:T.t4}}>✦ Updated 4m ago</span>
              </div>
              {insights.map((it,i)=>(
                <div key={i} style={{padding:'9px 14px',borderBottom:i<3?`1px solid ${T.bd}`:'none',display:'flex',gap:10,alignItems:'flex-start'}}>
                  <div style={{width:22,height:22,borderRadius:4,background:insightBg[it.k],display:'grid',placeItems:'center',fontSize:11,flexShrink:0,color:insightColor[it.k]}}>
                    {it.k==='good'?'↑':it.k==='warn'?'⚠':it.k==='bad'?'✕':'ℹ'}
                  </div>
                  <div>
                    <div style={{fontSize:12,fontWeight:500,color:T.t1}}>{it.ttl}</div>
                    <div style={{fontSize:11,color:T.t3,marginTop:1}}>{it.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Live activity */}
            <div style={{background:T.sf,border:`1px solid ${T.bd}`,borderRadius:T.r,flex:1,overflow:'hidden'}}>
              <div style={{padding:'10px 14px',borderBottom:`1px solid ${T.bd}`,display:'flex',justifyContent:'space-between'}}>
                <span style={{fontSize:12,fontWeight:600,color:T.t1}}>Live activity</span>
                <span style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:'#16A34A',fontFamily:T.fm}}>
                  <span style={{width:5,height:5,borderRadius:'50%',background:'#16A34A',display:'inline-block'}}/>Realtime
                </span>
              </div>
              {[
                {who:'Suresh',act:'confirmed',target:'BK-24301',detail:'Kapoor Wedding Reception · ₹3.84L',t:'now'},
                {who:'Anita',act:'added payment',target:'BK-24298',detail:'₹50,000 · UPI · REF8821',t:'2m'},
                {who:'Vikram',act:'updated',target:'BK-24302',detail:'Hall changed: Grand → Crystal',t:'5m'},
                {who:'Rakesh',act:'created',target:'BK-24307',detail:'New enquiry — Gupta naming',t:'12m'},
                {who:'Anita',act:'marked pencil',target:'BK-24303',detail:'Expiry set: 7 Jun 2026',t:'18m'},
              ].map((a,i)=>(
                <div key={i} style={{padding:'8px 14px',borderBottom:i<4?`1px solid ${T.bd}`:'none',display:'flex',gap:10,alignItems:'flex-start'}}>
                  <div style={{width:6,height:6,borderRadius:'50%',background:T.ac,marginTop:4,flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:11.5,color:T.t1}}><strong style={{fontWeight:600}}>{a.who}</strong> {a.act} <strong style={{fontWeight:600}}>{a.target}</strong></div>
                    <div style={{fontSize:10.5,color:T.t3,marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.detail}</div>
                  </div>
                  <span style={{fontSize:10,color:T.t4,fontFamily:T.fm,flexShrink:0}}>{a.t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

// ── ARTBOARD 3 — Calendar / HallBoard ──────────────────────────
function CalendarArtboard() {
  const HALLS = [
    { v:'BIKA ANDHERI', h:[
      { n:'Grand Ballroom', cap:500, floor:2, occ:8, events:[
        { s:'confirmed', start:10, dur:4, fn:'Kapoor Wedding', guests:350, val:'₹3.84L', conflict:true },
        { s:'confirmed', start:12, dur:4, fn:'Malhotra Mehendi', guests:180, val:'₹2.1L', conflict:true, source:'google' },
      ]},
      { n:'Crystal Hall', cap:200, floor:1, occ:4, events:[
        { s:'pencil', start:11, dur:5, fn:'Sharma Anniversary', guests:120, val:'₹1.95L', exp:'2d' },
      ]},
      { n:'Heritage Hall', cap:300, floor:3, occ:6, events:[
        { s:'confirmed', start:9, dur:4, fn:'Mehta Birthday', guests:200, val:'₹2.24L' },
        { s:'quotation', start:15, dur:3, fn:'Patel Engagement', guests:80, val:'₹1.1L' },
      ]},
    ]},
    { v:'BIKA BANDRA', h:[
      { n:'Emerald Suite', cap:80, floor:1, occ:2, events:[
        { s:'enquiry', start:14, dur:2, fn:'Kumar Pre-wedding', guests:40, val:'₹0.52L' },
      ]},
      { n:'Sapphire Room', cap:120, floor:2, occ:5, events:[
        { s:'confirmed', start:16, dur:3, fn:'Iyer Baby Shower', guests:90, val:'₹0.84L' },
      ]},
    ]},
  ];
  const START_H = 8, TOTAL_H = 14, PX = 56;
  const statusColor = { confirmed:T.st.confirmed, pencil:T.st.pencil, quotation:T.st.quotation, enquiry:T.st.enquiry };

  return (
    <Shell active="calendar" page="Calendar">
      <div style={{display:'flex',height:'100%',overflow:'hidden',fontFamily:T.ff}}>

        {/* Filter rail */}
        <aside style={{width:184,flexShrink:0,background:T.sf,borderRight:`1px solid ${T.bd}`,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          {/* Date nav */}
          <div style={{padding:12,borderBottom:`1px solid ${T.bd}`}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
              <button style={{width:24,height:24,display:'grid',placeItems:'center',border:`1px solid ${T.bd}`,borderRadius:3,background:'none',color:T.t3,cursor:'default',fontSize:14}}>‹</button>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:9.5,fontFamily:T.fm,textTransform:'uppercase',letterSpacing:'0.07em',color:T.t3}}>Sunday</div>
                <div style={{fontSize:13,fontWeight:600,fontFamily:T.fm,color:T.t1}}>01 Jun 2026</div>
              </div>
              <button style={{width:24,height:24,display:'grid',placeItems:'center',border:`1px solid ${T.bd}`,borderRadius:3,background:'none',color:T.t3,cursor:'default',fontSize:14}}>›</button>
            </div>
            <button style={{width:'100%',padding:'4px 0',fontSize:10,textTransform:'uppercase',letterSpacing:'0.07em',border:`1px solid ${T.bd}`,borderRadius:3,background:'none',color:T.t3,cursor:'default',fontFamily:T.fm}}>Today</button>
          </div>
          {/* View */}
          <div style={{padding:12,borderBottom:`1px solid ${T.bd}`}}>
            <div style={{fontSize:9.5,fontFamily:T.fm,textTransform:'uppercase',letterSpacing:'0.07em',color:T.t4,marginBottom:8}}>View</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:2}}>
              {['Board','Day','Week','Month'].map((v,i)=>(
                <button key={v} style={{padding:'4px 0',fontSize:10,textTransform:'uppercase',letterSpacing:'0.06em',fontFamily:T.fm,border:`1px solid ${i===0?T.ac:T.bd}`,borderRadius:3,background:i===0?T.ac:'none',color:i===0?'#fff':T.t3,cursor:'default'}}>{v}</button>
              ))}
            </div>
          </div>
          {/* Status filters */}
          <div style={{padding:12,borderBottom:`1px solid ${T.bd}`}}>
            <div style={{fontSize:9.5,fontFamily:T.fm,textTransform:'uppercase',letterSpacing:'0.07em',color:T.t4,marginBottom:8}}>Status</div>
            {Object.entries(T.st).filter(([k])=>['confirmed','pencil','quotation','enquiry'].includes(k)).map(([k,v])=>(
              <div key={k} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                <div style={{width:12,height:12,borderRadius:2,background:v.dot,flexShrink:0}}/>
                <span style={{fontSize:11.5,textTransform:'capitalize',color:T.t2}}>{v.l}</span>
              </div>
            ))}
          </div>
          {/* Hall occupancy */}
          <div style={{padding:12,flex:1}}>
            <div style={{fontSize:9.5,fontFamily:T.fm,textTransform:'uppercase',letterSpacing:'0.07em',color:T.t4,marginBottom:8}}>Hall occupancy</div>
            {HALLS.map(group=>(
              <div key={group.v} style={{marginBottom:10}}>
                <div style={{fontSize:9.5,fontFamily:T.fm,textTransform:'uppercase',letterSpacing:'0.06em',color:T.t3,marginBottom:4}}>{group.v.split(' ')[1]}</div>
                {group.h.map(h=>{
                  const pct = Math.min(100,(h.occ/TOTAL_H)*100);
                  const barC = pct>75?'#DC2626':pct>40?T.ac:'#16A34A';
                  return (
                    <div key={h.n} style={{marginBottom:6}}>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:2}}>
                        <span style={{color:T.t2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:110}}>{h.n}</span>
                        <span style={{fontFamily:T.fm,fontSize:10,color:T.t3,flexShrink:0}}>{h.occ}h</span>
                      </div>
                      <div style={{height:3,background:T.sf2,borderRadius:2}}>
                        <div style={{height:'100%',background:barC,borderRadius:2,width:`${pct}%`}}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </aside>

        {/* HallBoard */}
        <div style={{flex:1,overflow:'auto',position:'relative',minWidth:0}}>
          {/* Conflict banner */}
          <div style={{padding:'7px 14px',background:'color-mix(in oklab,#DC2626 10%,white)',borderBottom:`1px solid #FCA5A5`,display:'flex',alignItems:'center',gap:10,position:'sticky',top:0,zIndex:20}}>
            <span style={{fontSize:11,fontFamily:T.fm,fontWeight:700,color:'#DC2626',textTransform:'uppercase',letterSpacing:'0.06em'}}>! 2 hall conflicts</span>
            <span style={{fontSize:11,color:T.t3}}>— overlapping bookings on Grand Ballroom · Click to resolve.</span>
          </div>
          {/* Time header */}
          <div style={{display:'flex',borderBottom:`1px solid ${T.bd}`,position:'sticky',top:36,zIndex:10,background:T.bg}}>
            <div style={{width:144,flexShrink:0,background:T.sf,borderRight:`1px solid ${T.bd}`,padding:'0 12px',height:32,display:'flex',alignItems:'center',fontSize:9.5,fontFamily:T.fm,textTransform:'uppercase',letterSpacing:'0.07em',color:T.t4}}>Hall / Time</div>
            <div style={{display:'flex',flex:1}}>
              {Array.from({length:TOTAL_H+1},(_,i)=>{
                const h=START_H+i;
                return (
                  <div key={i} style={{width:PX,flexShrink:0,height:32,display:'flex',alignItems:'center',paddingLeft:4,borderLeft:`1px solid ${T.bd}`,fontSize:9.5,fontFamily:T.fm,color:T.t3}}>
                    {String(h).padStart(2,'0')}:00
                  </div>
                );
              })}
            </div>
          </div>
          {/* Hall rows */}
          {HALLS.map(group=>(
            <div key={group.v}>
              <div style={{display:'flex',height:26,background:`${T.sf2}`,borderBottom:`1px solid ${T.bd}`,alignItems:'center'}}>
                <div style={{width:144,padding:'0 12px',fontSize:9.5,fontFamily:T.fm,textTransform:'uppercase',letterSpacing:'0.07em',color:T.t3}}>{group.v}</div>
              </div>
              {group.h.map(h=>(
                <div key={h.n} style={{display:'flex',borderBottom:`1px solid ${T.bd}`,height:58}}>
                  <div style={{
                    width:144,flexShrink:0,borderRight:`1px solid ${T.bd}`,padding:'6px 10px',
                    background:h.events.some(e=>e.conflict)?'rgba(220,38,38,0.05)':'transparent',
                  }}>
                    <div style={{fontSize:12,fontWeight:500,color:T.t1,display:'flex',alignItems:'center',gap:4}}>
                      {h.n.split(' ')[0]}
                      {h.events.some(e=>e.conflict)&&<span style={{fontSize:9,color:'#DC2626',fontFamily:T.fm,fontWeight:700}}>!</span>}
                    </div>
                    <div style={{fontSize:10,color:T.t3,fontFamily:T.fm}}>cap {h.cap}</div>
                  </div>
                  <div style={{position:'relative',flex:1,overflow:'hidden'}}>
                    {Array.from({length:TOTAL_H},(_,i)=>(
                      <div key={i} style={{position:'absolute',top:0,bottom:0,left:i*PX,width:1,background:T.bd,opacity:0.6}}/>
                    ))}
                    {h.events.map((ev,ei)=>{
                      const st = statusColor[ev.s] || statusColor.enquiry;
                      const left = (ev.start-START_H)*PX;
                      const width = ev.dur*PX-3;
                      const isHatch = ev.s==='pencil';
                      const bgImg = isHatch ? 'repeating-linear-gradient(45deg,rgba(217,119,6,0.18) 0 6px,transparent 6px 12px)' : undefined;
                      const isConflict = ev.conflict;
                      return (
                        <div key={ei} style={{
                          position:'absolute',top:4,bottom:4,left,width,
                          borderLeft:`3px solid ${st.dot}`,
                          background: isHatch ? 'transparent' : `color-mix(in oklab,${st.dot} 14%,white)`,
                          backgroundImage: bgImg,
                          outline: isConflict ? `2px solid #DC2626` : undefined,
                          outlineOffset: isConflict ? '-2px' : undefined,
                          borderStyle: ev.source==='google' ? 'dashed' : undefined,
                          overflow:'hidden', cursor:'default',
                        }}>
                          <div style={{padding:'3px 6px',height:'100%',display:'flex',flexDirection:'column',justifyContent:'center'}}>
                            <div style={{fontSize:10.5,fontWeight:600,color:T.t1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{ev.fn}</div>
                            <div style={{fontSize:9.5,fontFamily:T.fm,color:T.t3,display:'flex',gap:6}}>
                              <span>{ev.start}:00–{ev.start+ev.dur}:00</span>
                              <span>{ev.val}</span>
                              {ev.exp&&<span style={{color:'#D97706'}}>{ev.exp}</span>}
                              {ev.source==='google'&&<span style={{color:'#0891b2'}}>G</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

// ── ARTBOARD 4 — Bookings Master-Detail ────────────────────────
function BookingsArtboard() {
  const sel = BOOKINGS_DATA[0];
  const TABS = ['Overview','Money','Packs','Halls','Payments','Versions'];
  const activeTab = 'Overview';

  return (
    <Shell active="bookings" page="Bookings">
      <div style={{display:'flex',height:'100%',overflow:'hidden',fontFamily:T.ff}}>

        {/* Master list 360px */}
        <div style={{width:360,flexShrink:0,borderRight:`1px solid ${T.bd}`,background:T.sf,display:'flex',flexDirection:'column'}}>
          <div style={{padding:10,borderBottom:`1px solid ${T.bd}`,display:'flex',flexDirection:'column',gap:8}}>
            <input placeholder="Search bookings, customers…" style={{width:'100%',height:30,padding:'0 10px',fontSize:12,border:`1px solid ${T.bd}`,borderRadius:4,background:T.bg,fontFamily:T.ff,color:T.t1,outline:'none'}} readOnly/>
            <div style={{display:'flex',gap:2}}>
              {['All 42','Confirmed','Pencil','Quotation','Enquiry'].map((s,i)=>(
                <button key={s} style={{padding:'3px 7px',fontSize:10,fontFamily:T.fm,textTransform:'uppercase',letterSpacing:'0.04em',border:`1px solid ${i===0?T.ac:T.bd}`,borderRadius:3,background:i===0?T.ac:'none',color:i===0?'#fff':T.t3,cursor:'default',whiteSpace:'nowrap'}}>{s}</button>
              ))}
            </div>
          </div>
          <div style={{flex:1,overflow:'hidden'}}>
            {BOOKINGS_DATA.map((b,i)=>{
              const isSel = b.id===sel.id;
              const st = T.st[b.s]||T.st.enquiry;
              return (
                <div key={b.id} style={{padding:'10px 12px',borderBottom:`1px solid ${T.bd}`,background:isSel?T.acSoft:'transparent',borderLeft:`3px solid ${isSel?T.ac:'transparent'}`,cursor:'default'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                    <span style={{fontSize:10,fontFamily:T.fm,color:T.t3}}>{b.id}</span>
                    <span style={{fontSize:10,fontFamily:T.fm,color:T.t3}}>{b.date}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:3}}>
                    <span style={{fontSize:12.5,fontWeight:500,color:T.t1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:200}}>{b.fn}</span>
                    <span style={{fontSize:12,fontFamily:T.fm,fontWeight:600,color:T.t1,flexShrink:0,marginLeft:4}}>{b.total}</span>
                  </div>
                  <div style={{fontSize:10.5,color:T.t3,marginBottom:5,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.cust} · {b.hall}</div>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <StatusBadge s={b.s} small/>
                    {b.exp&&<span style={{fontSize:10,fontFamily:T.fm,color:T.st.pencil.dot}}>exp {b.exp}</span>}
                    {b.pct>0&&<span style={{marginLeft:'auto',fontSize:10,fontFamily:T.fm,color:b.pct===100?'#16A34A':T.t3}}>{b.pct}% paid</span>}
                  </div>
                  {b.pct>0&&(
                    <div style={{height:2,background:T.sf2,borderRadius:2,marginTop:4}}>
                      <div style={{height:'100%',background:b.pct===100?'#16A34A':T.ac,borderRadius:2,width:`${b.pct}%`}}/>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail pane */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',background:T.bg}}>
          {/* Detail header */}
          <div style={{padding:'12px 20px',borderBottom:`1px solid ${T.bd}`,background:T.sf,flexShrink:0}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
              <span style={{fontSize:10,fontFamily:T.fm,color:T.t3}}>{sel.id}</span>
              <StatusBadge s={sel.s}/>
              <span style={{fontSize:10,fontFamily:T.fm,color:T.t4}}>v3</span>
              <div style={{marginLeft:'auto',display:'flex',gap:6}}>
                <button style={{padding:'4px 10px',fontSize:11,border:`1px solid ${T.bd}`,borderRadius:4,background:T.sf,color:T.t2,cursor:'default'}}>Edit</button>
                <button style={{padding:'4px 10px',fontSize:11,border:`1px solid ${T.bd}`,borderRadius:4,background:T.sf,color:T.t2,cursor:'default'}}>Print</button>
                <button style={{padding:'4px 10px',fontSize:11,border:'none',borderRadius:4,background:T.ac,color:'#fff',cursor:'default',fontWeight:500}}>Add Payment</button>
              </div>
            </div>
            <h1 style={{fontSize:18,fontWeight:700,color:T.t1,letterSpacing:'-0.3px'}}>{sel.fn}</h1>
            <div style={{fontSize:11.5,color:T.t3,marginTop:3}}>{sel.cust} · +91 98200 11111 · {sel.date} 2026 · 10:00–22:00</div>
          </div>
          {/* Tabs */}
          <div style={{display:'flex',borderBottom:`1px solid ${T.bd}`,background:T.sf,padding:'0 20px',gap:2,flexShrink:0}}>
            {TABS.map(t=>(
              <button key={t} style={{padding:'8px 10px',fontSize:11,fontFamily:T.fm,textTransform:'uppercase',letterSpacing:'0.05em',border:'none',borderBottom:`2px solid ${t===activeTab?T.ac:'transparent'}`,background:'none',color:t===activeTab?T.t1:T.t3,cursor:'default'}}>{t}</button>
            ))}
          </div>
          {/* Tab body */}
          <div style={{flex:1,overflow:'hidden',display:'grid',gridTemplateColumns:'1fr 280px'}}>
            {/* Main tab content */}
            <div style={{padding:20,overflow:'hidden'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
                <Section title="Customer">
                  {[['Name','Ramesh Kapoor'],['Phone','+91 98200 31111'],['Email','ramesh@kapoor.com'],['City','Mumbai'],['Community','Sindhi'],['GST','—']].map(([k,v])=>(
                    <FieldRow key={k} k={k} v={v}/>
                  ))}
                </Section>
                <Section title="Function">
                  {[['Type','Wedding Reception'],['Expected guests','350'],['Confirmed guests','312'],['Source','in-app']].map(([k,v])=>(
                    <FieldRow key={k} k={k} v={v}/>
                  ))}
                </Section>
              </div>
              <Section title="Notes">
                <p style={{fontSize:12,color:T.t2,lineHeight:1.6}}>DJ confirmed for 22:00–02:00. Floral arch required at entry — coordinate with Shyam Decorators. Ensure AC is serviced by 10 Jun.</p>
              </Section>
            </div>
            {/* Money stack sidebar */}
            <div style={{padding:16,borderLeft:`1px solid ${T.bd}`,background:`${T.sf2}60`,overflow:'hidden'}}>
              <div style={{background:T.sf,border:`1px solid ${T.bd}`,borderRadius:T.r,padding:14,fontFamily:T.fm}}>
                <div style={{fontSize:9.5,textTransform:'uppercase',letterSpacing:'0.07em',color:T.t4,marginBottom:12}}>Money stack</div>
                {[
                  {k:'Hall charges',     v:'₹2,50,000'},
                  {k:'Reception pack ×350', v:'₹7,00,000'},
                  {k:'DJ setup',         v:'₹75,000'},
                  {k:'Subtotal',         v:'₹10,25,000', sep:true},
                  {k:'Discount',         v:'− ₹25,000', c:'#DC2626'},
                  {k:'GST 18%',          v:'+ ₹1,80,000'},
                  {k:'Grand Total',      v:'₹11,80,000', bold:true, sep:true},
                  {k:'Advance req.',     v:'₹3,00,000'},
                  {k:'Received',         v:'₹3,60,958', c:'#16A34A'},
                  {k:'Balance',          v:'₹8,19,042', c:'#DC2626', bold:true},
                ].map((r,i)=>(
                  <div key={i}>
                    {r.sep&&<div style={{height:1,background:T.bd,margin:'7px 0'}}/>}
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:4}}>
                      <span style={{color:T.t3,textTransform:'uppercase',fontSize:9.5,letterSpacing:'0.04em'}}>{r.k}</span>
                      <span style={{fontWeight:r.bold?700:400,color:r.c||T.t1}}>{r.v}</span>
                    </div>
                  </div>
                ))}
                <div style={{height:5,background:T.sf2,borderRadius:3,marginTop:8}}>
                  <div style={{height:'100%',background:'#16A34A',borderRadius:3,width:'31%'}}/>
                </div>
                <div style={{fontSize:10,color:T.t3,textAlign:'right',marginTop:4}}>31% paid</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <div style={{fontSize:9.5,textTransform:'uppercase',letterSpacing:'0.07em',color:T.t4,fontFamily:T.fm,marginBottom:8}}>{title}</div>
      <div style={{display:'flex',flexDirection:'column',gap:6}}>{children}</div>
    </div>
  );
}
function FieldRow({ k, v }) {
  return (
    <div style={{borderLeft:`2px solid ${T.bd}`,paddingLeft:8}}>
      <div style={{fontSize:9.5,textTransform:'uppercase',letterSpacing:'0.06em',color:T.t4,fontFamily:T.fm}}>{k}</div>
      <div style={{fontSize:12.5,color:T.t1}}>{v}</div>
    </div>
  );
}

Object.assign(window, { BeforeArtboard, AfterDashArtboard, CalendarArtboard, BookingsArtboard });
