// scr-dashboard.jsx — operations cockpit: triage queue is the spine
const { useState:dS, useEffect:dE, useMemo:dM } = React;

const NOW = new Date(2026,5,4); // current date
const dayDiff = (d)=>Math.ceil((d-NOW)/864e5);

function conflictPairs(bookings){
  const out=[];
  for(let i=0;i<bookings.length;i++)for(let j=i+1;j<bookings.length;j++){
    const a=bookings[i],b=bookings[j];
    if(a.status==='cancelled'||b.status==='cancelled')continue;
    if(a.hallIds.some(h=>b.hallIds.includes(h)) && a.start<b.end && b.start<a.end) out.push([a,b]);
  }
  return out;
}

function buildTriage(){
  const items=[];
  // hall conflicts — highest priority
  conflictPairs(BOOKINGS).forEach(([a,b],i)=>{
    items.push({ key:'cf'+i, sev:'high', icon:'bell', title:'Hall conflict needs resolving',
      sub:`${hallById(a.hallIds.find(h=>b.hallIds.includes(h))).name} · ${fmtDate(a.start)} · ${a.id} ↔ ${b.id}`,
      bid:a.id, actions:[{l:'Resolve',primary:1,done:'Opened conflict'},{l:'Dismiss',done:'Dismissed'}], sort:-1 });
  });
  // pencils expiring
  BOOKINGS.filter(b=>b.status==='pencil'&&b.pencilExpiresAt).forEach(b=>{
    const dd=dayDiff(b.pencilExpiresAt); const t=bookingTotal(b);
    items.push({ key:'pe'+b.id, sev:dd<=2?'high':'med', icon:'clock',
      title:`Pencil expires ${dd<=0?'today':'in '+dd+'d'}`,
      sub:`${b.functionName} · ${inr(t.grand)} at risk`, bid:b.id,
      actions:[{l:'Confirm',primary:1,done:'Booking confirmed'},{l:'Extend',done:'Pencil extended 3 days'}], sort:dd });
  });
  // balances due on near events
  BOOKINGS.filter(b=>b.status==='confirmed').forEach(b=>{
    const bal=bookingTotal(b).balance, dd=dayDiff(b.start);
    if(bal>0 && dd>=0 && dd<=22){
      items.push({ key:'bal'+b.id, sev:dd<=7?'high':'med', icon:'payments',
        title:`Balance ${inr(bal)} due`, sub:`${b.functionName} · event in ${dd}d`, bid:b.id,
        actions:[{l:'Record',primary:1,done:'Payment recorded'},{l:'Remind',done:'Reminder sent to customer'}], sort:dd });
    }
  });
  // quotations awaiting response
  BOOKINGS.filter(b=>b.status==='quotation').forEach(b=>{
    items.push({ key:'qt'+b.id, sev:'low', icon:'mail', title:'Quotation awaiting response',
      sub:`${b.functionName} · ${inr(bookingTotal(b).grand)} estimate`, bid:b.id,
      actions:[{l:'Follow up',primary:1,done:'Follow-up logged'}], sort:30 });
  });
  const rank={high:0,med:1,low:2};
  return items.sort((a,b)=> rank[a.sev]-rank[b.sev] || a.sort-b.sort);
}

function Dashboard({ go, openBooking }){
  const isMobile = useMedia();
  const [range,setRange] = dS('This week');
  const [done,setDone] = dS([]);
  const triage = dM(()=>buildTriage(),[]);
  const live = triage.filter(t=>!done.includes(t.key));

  const conflicts = dM(()=>detectConflicts(BOOKINGS),[]);
  const outstanding = dM(()=>BOOKINGS.reduce((s,b)=>s+bookingTotal(b).balance,0),[]);
  const pencilRisk = dM(()=>BOOKINGS.filter(b=>b.status==='pencil').reduce((s,b)=>s+bookingTotal(b).grand,0),[]);
  const confirmedCt = BOOKINGS.filter(b=>b.status==='confirmed').length;
  const weekCt = BOOKINGS.filter(b=>{const dd=dayDiff(b.start);return dd>=0&&dd<=7;}).length;

  const act=(t,a)=>{ setDone(d=>[...d,t.key]); if(a.l==='Resolve'){ go('calendar'); return; } toast(a.done||'Done',{icon:a.l==='Remind'||a.l==='Follow up'?'bell':'check',action:'Undo',onAction:()=>setDone(d=>d.filter(k=>k!==t.key))}); };

  const sevColor={high:'var(--red)',med:'var(--amber)',low:'var(--sky)'};
  const sevBg={high:'var(--red-bg)',med:'var(--amber-bg)',low:'var(--sky-bg)'};

  const rev = [42,58,51,64,72,88,124,96,110,132,118,62];
  const revLbl = ['Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May'];
  const revMax = Math.max(...rev);
  const halls = [
    { n:'Grand Ballroom', pct:84, c:'var(--ac)' },{ n:'Pearl Lawn', pct:72, c:'var(--green)' },
    { n:'Heritage Hall', pct:61, c:'var(--blue)' },{ n:'Crystal Hall', pct:48, c:'var(--amber)' },
    { n:'Others', pct:33, c:'var(--t4)' },
  ];
  const upcoming = [...BOOKINGS].filter(b=>dayDiff(b.start)>=0).sort((a,b)=>a.start-b.start).slice(0,7);

  const stats=[
    { label:'This week', value:<CountUp value={weekCt} format={n=>Math.round(n)}/>, onClick:()=>go('calendar') },
    { label:'Confirmed', value:<CountUp value={confirmedCt} format={n=>Math.round(n)}/>, color:'var(--green)', onClick:()=>go('bookings') },
    { label:'Pencil at risk', value:<CountUp value={pencilRisk} format={n=>inr(n)}/>, color:'var(--amber)' },
    { label:'Outstanding', value:<CountUp value={outstanding} format={n=>inr(n)}/>, color:'var(--red)', onClick:()=>go('payments') },
    { label:'Conflicts', value:<CountUp value={conflicts.size} format={n=>Math.round(n)}/>, color:conflicts.size?'var(--red)':'var(--t1)', onClick:()=>go('calendar') },
  ];

  return (
    <div className="route" style={{height:'100%',display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <Toolbar title={isMobile?null:'Operations'} stats={stats} actions={
        <React.Fragment>
          <div className="seg only-desktop">
            {['Today','This week','30 days','Quarter'].map(t=>(<button key={t} className={range===t?'on':''} onClick={()=>setRange(t)}>{t}</button>))}
          </div>
          <button className="btn primary" onClick={()=>go('bookings','new')}><Icon n="plus" s={15}/>{isMobile?'':'New booking'}</button>
        </React.Fragment>
      }/>

      <div style={{flex:1,overflowY:'auto',background:'var(--bg)'}}>
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 340px',gap:12,padding:12}}>
          {/* LEFT */}
          <div style={{display:'flex',flexDirection:'column',gap:12,minWidth:0}}>
            {/* TRIAGE — the spine */}
            <div className="card" style={{overflow:'hidden'}}>
              <div className="card-h">
                <h3 style={{display:'flex',alignItems:'center',gap:8}}>Needs you now
                  {live.length>0 && <span style={{background:'var(--red)',color:'#fff',borderRadius:999,fontSize:10,fontFamily:'var(--fm)',fontWeight:700,padding:'1px 7px'}}>{live.length}</span>}
                </h3>
                <span style={{fontSize:10.5,color:'var(--t4)',fontFamily:'var(--fm)'}}>priority order</span>
              </div>
              {live.length===0 ? (
                <div className="pop" style={{padding:'34px 16px',textAlign:'center'}}>
                  <div style={{width:44,height:44,borderRadius:'50%',background:'var(--green-bg)',display:'grid',placeItems:'center',margin:'0 auto 10px'}}><Icon n="check" s={22} c="var(--green)" sw={2.4}/></div>
                  <div style={{fontSize:14,fontWeight:600}}>You're all caught up</div>
                  <div style={{fontSize:12,color:'var(--t3)',marginTop:2}}>Every urgent item has been handled.</div>
                </div>
              ) : (
                <div className="stagger">
                  {live.map((t,i)=>(
                    <div key={t.key} className="triage-item" onClick={()=>openBooking(t.bid)}>
                      <div className="triage-rail" style={{background:sevColor[t.sev]}}/>
                      <div style={{width:30,height:30,borderRadius:7,background:sevBg[t.sev],display:'grid',placeItems:'center',flexShrink:0}}><Icon n={t.icon} s={15} c={sevColor[t.sev]}/></div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12.5,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t.title}</div>
                        <div style={{fontSize:11,color:'var(--t3)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t.sub}</div>
                      </div>
                      <div style={{display:'flex',gap:6,flexShrink:0}} onClick={e=>e.stopPropagation()}>
                        {(isMobile?t.actions.slice(0,1):t.actions).map((a,j)=>(
                          <button key={j} className={`btn sm ${a.primary?'primary':''}`} onClick={()=>act(t,a)}>{a.l}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* revenue chart */}
            <div className="card">
              <div className="card-h"><h3>Revenue · trailing 12 months</h3><span style={{fontSize:11,color:'var(--t3)'}}>₹ in Lakhs</span></div>
              <div style={{padding:'14px 16px 10px'}}>
                <div style={{display:'flex',alignItems:'flex-end',gap:isMobile?3:6,height:110}}>
                  {rev.map((v,i)=>(
                    <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                      <div style={{width:'100%',background:i===11?'var(--sf3)':'var(--ac)',opacity:i===11?.6:1,borderRadius:'3px 3px 0 0',height:`${(v/revMax)*94}px`,minHeight:3,transition:'height .5s var(--ease-out)'}} title={`${revLbl[i]}: ₹${v}L`}/>
                      <div style={{fontSize:8.5,color:'var(--t4)',fontFamily:'var(--fm)'}}>{revLbl[i]}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* hall utilization */}
            <div className="card">
              <div className="card-h"><h3>Hall utilization</h3><span style={{fontSize:11,color:'var(--t3)'}}>This month</span></div>
              <div style={{padding:16,display:'flex',gap:18,alignItems:'center'}}>
                <Donut segments={halls}/>
                <div style={{flex:1,display:'flex',flexDirection:'column',gap:7}}>
                  {halls.map(h=>(
                    <div key={h.n} style={{display:'flex',alignItems:'center',gap:8,fontSize:11.5}}>
                      <span style={{width:9,height:9,borderRadius:2,background:h.c,flexShrink:0}}/>
                      <span style={{flex:1,color:'var(--t2)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{h.n}</span>
                      <span style={{fontFamily:'var(--fm)',color:'var(--t3)'}}>{h.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{display:'flex',flexDirection:'column',gap:12,minWidth:0}}>
            <div className="card" style={{overflow:'hidden'}}>
              <div className="card-h"><h3>Upcoming events</h3><button className="btn sm ghost" onClick={()=>go('calendar')}>Calendar <Icon n="chevR" s={13}/></button></div>
              <div className="stagger">
                {upcoming.map(b=>{ const c=customerById(b.customerId),t=bookingTotal(b);
                  return (
                    <div key={b.id} onClick={()=>openBooking(b.id)} style={{padding:'9px 14px',borderBottom:'1px solid var(--bd)',display:'flex',gap:11,alignItems:'center',cursor:'pointer',transition:'background .12s'}} onMouseEnter={e=>e.currentTarget.style.background='var(--sf2)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <div style={{textAlign:'center',flexShrink:0,width:34}}>
                        <div style={{fontSize:15,fontWeight:700,fontFamily:'var(--fm)',lineHeight:1,fontVariantNumeric:'tabular-nums'}}>{b.start.getDate()}</div>
                        <div style={{fontSize:8.5,color:'var(--t4)',textTransform:'uppercase',letterSpacing:'.04em'}}>{b.start.toLocaleDateString('en-IN',{month:'short'})}</div>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12.5,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{b.functionName}</div>
                        <div style={{fontSize:10.5,color:'var(--t3)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.name} · {hallById(b.hallIds[0]).name}</div>
                      </div>
                      <div style={{textAlign:'right',flexShrink:0}}>
                        <Money v={t.grand}/>
                        <div style={{marginTop:3}}><Badge s={b.status} sm/></div>
                      </div>
                    </div>
                  );})}
              </div>
            </div>
            <div className="card" style={{overflow:'hidden'}}>
              <div className="card-h"><h3>Live activity</h3><span style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'var(--green)',fontFamily:'var(--fm)'}}><span style={{width:5,height:5,borderRadius:'50%',background:'var(--green)'}}/>Realtime</span></div>
              {ACTIVITY.slice(0,6).map((a,i)=>(
                <div key={a.id} onClick={()=>openBooking(a.target)} style={{padding:'8px 14px',borderBottom:i<5?'1px solid var(--bd)':'none',display:'flex',gap:10,cursor:'pointer'}}>
                  <div style={{width:6,height:6,borderRadius:'50%',background:'var(--ac)',marginTop:5,flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:11.5}}><strong style={{fontWeight:600}}>{a.user}</strong> {a.action} <strong style={{fontWeight:600}}>{a.target}</strong></div>
                    <div style={{fontSize:10.5,color:'var(--t3)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{a.detail}</div>
                  </div>
                  <span style={{fontSize:10,color:'var(--t4)',fontFamily:'var(--fm)',flexShrink:0}}>{fmtTime(a.when)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{height:isMobile?80:16}}/>
      </div>
    </div>
  );
}

function Donut({segments}){
  const size=96, r=38, cx=size/2, cy=size/2, circ=2*Math.PI*r;
  const total=segments.reduce((s,x)=>s+x.pct,0);
  let off=0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{flexShrink:0,transform:'rotate(-90deg)'}}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--sf2)" strokeWidth="12"/>
      {segments.map((s,i)=>{ const len=(s.pct/total)*circ; const el=<circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.c} strokeWidth="12" strokeDasharray={`${len} ${circ-len}`} strokeDashoffset={-off} style={{transition:'stroke-dasharray .6s var(--ease-out)'}}/>; off+=len; return el; })}
    </svg>
  );
}

Object.assign(window,{ Dashboard });
