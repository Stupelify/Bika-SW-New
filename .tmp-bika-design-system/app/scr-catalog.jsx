// scr-catalog.jsx — Payments, Venues, Menu, Reports, Activity, Settings
const { useState:caS, useMemo:caM } = React;

// responsive table → cards on mobile
function RTable({cols,rows,renderCard}){
  const isMobile=useMedia();
  if(isMobile){
    return <div style={{display:'flex',flexDirection:'column',gap:8,padding:16}}>{rows.map((r,i)=><div key={i} className="card" style={{padding:12}}>{renderCard(r)}</div>)}</div>;
  }
  return (
    <div style={{padding:16}}>
      <div className="card" style={{overflow:'hidden'}}>
        <table className="tbl">
          <thead><tr>{cols.map(c=><th key={c.k} style={{textAlign:c.num?'right':'left'}}>{c.l}</th>)}</tr></thead>
          <tbody>{rows.map((r,i)=><tr key={i} style={{cursor:r._click?'pointer':'default'}} onClick={r._click}>{cols.map(c=><td key={c.k} className={c.num?'num':''} style={c.cell}>{c.render?c.render(r):r[c.k]}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

// ── PAYMENTS (global ledger) ────────────────────────────────────
function Payments({ openBooking }){
  const all=caM(()=>{ const out=[]; BOOKINGS.forEach(b=>b.payments.forEach(p=>out.push({...p,bookingId:b.id,fn:b.functionName,cust:customerById(b.customerId).name}))); return out.sort((a,b)=>b.date-a.date); },[]);
  const total=all.reduce((s,p)=>s+p.amount,0);
  const outstanding=BOOKINGS.reduce((s,b)=>s+bookingTotal(b).balance,0);
  const isMobile=useMedia();
  return (
    <div className="route" style={{height:'100%',overflowY:'auto'}}>
      <Toolbar title={isMobile?null:'Payments'}
        stats={[
          { label:'Received · all', value:inr(total), color:'var(--green)' },
          { label:'Outstanding', value:inr(outstanding), color:outstanding>0?'var(--red)':'var(--green)' },
          { label:'Transactions', value:all.length },
        ]}
        actions={<button className="btn" onClick={()=>toast('Ledger exported',{icon:'download'})}><Icon n="download" s={15}/>{isMobile?'':'Export'}</button>}/>
      <RTable
        cols={[{k:'date',l:'Date',render:r=>fmtDateFull(r.date),cell:{fontFamily:'var(--fm)'}},{k:'bookingId',l:'Booking',cell:{fontFamily:'var(--fm)',color:'var(--ac)'}},{k:'cust',l:'Customer'},{k:'method',l:'Method'},{k:'ref',l:'Reference',render:r=>r.ref||'—',cell:{fontFamily:'var(--fm)',color:'var(--t3)'}},{k:'by',l:'By'},{k:'amount',l:'Amount',num:true,render:r=>inrFull(r.amount),cell:{fontWeight:600,color:'var(--green)'}}]}
        rows={all.map(r=>({...r,_click:()=>openBooking(r.bookingId)}))}
        renderCard={r=>(<div onClick={()=>openBooking(r.bookingId)}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{fontSize:13,fontWeight:600}}>{r.cust}</span><span style={{fontSize:13,fontFamily:'var(--fm)',fontWeight:700,color:'var(--green)'}}>{inrFull(r.amount)}</span></div>
          <div style={{fontSize:11,color:'var(--t3)',fontFamily:'var(--fm)',display:'flex',gap:8,flexWrap:'wrap'}}><span style={{color:'var(--ac)'}}>{r.bookingId}</span><span>{fmtDate(r.date)}</span><span>{r.method}</span><span>{r.ref}</span></div>
        </div>)}
      />
    </div>
  );
}

// ── VENUES (hall catalogue) ─────────────────────────────────────
function Venues(){
  const isMobile=useMedia();
  return (
    <div className="route" style={{height:'100%',overflowY:'auto'}}>
      <Toolbar title={isMobile?null:'Venues & Halls'}
        stats={isMobile?null:[{label:'Venues',value:VENUES.length},{label:'Halls',value:HALLS.length}]}
        actions={<button className="btn primary" onClick={()=>toast('Add hall',{icon:'check'})}><Icon n="plus" s={15}/>{isMobile?'':'Add hall'}</button>}/>
      <div style={{padding:16,display:'flex',flexDirection:'column',gap:16}} className="stagger">
        {VENUES.map(v=>{
          const halls=HALLS.filter(h=>h.venueId===v.id);
          return (
            <div key={v.id} className="card" style={{overflow:'hidden'}}>
              <div className="card-h"><div><h3>{v.name}</h3><div style={{fontSize:11,color:'var(--t3)',marginTop:1}}>{v.city} · {halls.length} halls</div></div></div>
              {isMobile?(
                <div style={{padding:12,display:'flex',flexDirection:'column',gap:8}}>
                  {halls.map(h=>{ const bks=BOOKINGS.filter(b=>b.hallIds.includes(h.id)); const rev=bks.reduce((s,b)=>s+bookingTotal(b).grand,0);
                    return <div key={h.id} style={{border:'1px solid var(--bd)',borderRadius:'var(--r-sm)',padding:10}}>
                      <div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontSize:13,fontWeight:600}}>{h.name}</span><span style={{fontSize:12,fontFamily:'var(--fm)',fontWeight:600}}>{inr(h.basePrice)}</span></div>
                      <div style={{fontSize:11,color:'var(--t3)',fontFamily:'var(--fm)',marginTop:3}}>Floor {h.floor} · Cap {h.capacity} · {bks.length} bookings · {inr(rev)}</div>
                    </div>;})}
                </div>
              ):(
                <table className="tbl"><thead><tr><th>Hall</th><th style={{textAlign:'right'}}>Floor</th><th style={{textAlign:'right'}}>Capacity</th><th style={{textAlign:'right'}}>Floating</th><th style={{textAlign:'right'}}>Base price</th><th style={{textAlign:'right'}}>Bookings</th><th style={{textAlign:'right'}}>Revenue</th></tr></thead>
                  <tbody>{halls.map(h=>{ const bks=BOOKINGS.filter(b=>b.hallIds.includes(h.id)); const rev=bks.reduce((s,b)=>s+bookingTotal(b).grand,0);
                    return <tr key={h.id} style={{cursor:'default'}}><td style={{color:'var(--t1)',fontWeight:500}}>{h.name}</td><td className="num">{h.floor}</td><td className="num">{h.capacity}</td><td className="num">{h.floating}</td><td className="num" style={{fontWeight:600}}>{inrFull(h.basePrice)}</td><td className="num">{bks.length}</td><td className="num" style={{color:'var(--ac)',fontWeight:600}}>{inr(rev)}</td></tr>;})}</tbody>
                </table>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── MENU (items / packs / vendors) ──────────────────────────────
function Menu(){
  const [tab,setTab]=caS('Packs');
  const isMobile=useMedia();
  const tabs=['Packs','Ingredients','Vendors'];
  const ingredients=[{n:'Basmati Rice',unit:'kg',stock:420,low:100},{n:'Paneer',unit:'kg',stock:85,low:50},{n:'Chicken',unit:'kg',stock:40,low:60},{n:'Ghee',unit:'L',stock:120,low:40},{n:'Mixed Vegetables',unit:'kg',stock:210,low:80}];
  const vendors=[{n:'Sharma Provisions',cat:'Groceries',phone:'+91 98201 11000',last:'28 May'},{n:'Fresh Farms Co',cat:'Vegetables',phone:'+91 98201 22000',last:'01 Jun'},{n:'Royal Meats',cat:'Non-veg',phone:'+91 98201 33000',last:'30 May'}];
  return (
    <div className="route" style={{height:'100%',display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <Toolbar title={isMobile?null:'Menu & Items'}
        actions={<button className="btn primary" onClick={()=>toast('Add item',{icon:'check'})}><Icon n="plus" s={15}/>{isMobile?'':'Add item'}</button>}/>
      <div style={{display:'flex',gap:2,padding:'0 16px',borderBottom:'1px solid var(--bd)',background:'var(--sf)'}}>
        {tabs.map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:'10px 12px',fontSize:11.5,fontFamily:'var(--fm)',textTransform:'uppercase',letterSpacing:'.05em',border:'none',borderBottom:`2px solid ${tab===t?'var(--ac)':'transparent'}`,background:'none',color:tab===t?'var(--t1)':'var(--t3)',fontWeight:tab===t?600:400}}>{t}</button>)}
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        {tab==='Packs' && <RTable
          cols={[{k:'name',l:'Pack',cell:{fontWeight:500,color:'var(--t1)'}},{k:'course',l:'Course'},{k:'veg',l:'Type',render:r=>r.veg?<span style={{color:'var(--green)'}}>● Veg</span>:<span style={{color:'var(--red)'}}>● Non-veg</span>},{k:'rate',l:'Rate/plate',num:true,render:r=>inrFull(r.rate)},{k:'setup',l:'Setup',num:true,render:r=>inrFull(r.setup)}]}
          rows={MENU_PACKS}
          renderCard={r=>(<div><div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{fontSize:13,fontWeight:600}}>{r.name}</span><span style={{fontSize:13,fontFamily:'var(--fm)',fontWeight:700}}>{inrFull(r.rate)}</span></div><div style={{fontSize:11,color:'var(--t3)'}}>{r.course} · {r.veg?'Veg':'Non-veg'} · setup {inrFull(r.setup)}</div></div>)}
        />}
        {tab==='Ingredients' && <RTable
          cols={[{k:'n',l:'Ingredient',cell:{fontWeight:500,color:'var(--t1)'}},{k:'stock',l:'In stock',num:true,render:r=>`${r.stock} ${r.unit}`},{k:'low',l:'Reorder at',num:true,render:r=>`${r.low} ${r.unit}`},{k:'status',l:'Status',render:r=>r.stock<r.low?<Badge s="lost" sm label="Low"/>:<Badge s="won" sm label="OK"/>}]}
          rows={ingredients}
          renderCard={r=>(<div><div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{fontSize:13,fontWeight:600}}>{r.n}</span>{r.stock<r.low?<Badge s="lost" sm label="Low"/>:<Badge s="won" sm label="OK"/>}</div><div style={{fontSize:11,color:'var(--t3)',fontFamily:'var(--fm)'}}>{r.stock} {r.unit} in stock · reorder at {r.low}</div></div>)}
        />}
        {tab==='Vendors' && <RTable
          cols={[{k:'n',l:'Vendor',cell:{fontWeight:500,color:'var(--t1)'}},{k:'cat',l:'Category'},{k:'phone',l:'Phone',cell:{fontFamily:'var(--fm)'}},{k:'last',l:'Last order',num:true}]}
          rows={vendors}
          renderCard={r=>(<div><div style={{fontSize:13,fontWeight:600,marginBottom:4}}>{r.n}</div><div style={{fontSize:11,color:'var(--t3)',fontFamily:'var(--fm)'}}>{r.cat} · {r.phone} · last {r.last}</div></div>)}
        />}
      </div>
    </div>
  );
}

// ── REPORTS ─────────────────────────────────────────────────────
function Reports(){
  const isMobile=useMedia();
  const byType=caM(()=>{ const m={}; BOOKINGS.forEach(b=>{ m[b.functionType]=(m[b.functionType]||0)+bookingTotal(b).grand; }); return Object.entries(m).sort((a,b)=>b[1]-a[1]); },[]);
  const byHall=caM(()=>HALLS.map(h=>({n:h.name,hrs:BOOKINGS.filter(b=>b.hallIds.includes(h.id)).reduce((s,b)=>s+(b.end-b.start)/36e5,0)})).sort((a,b)=>b.hrs-a.hrs),[]);
  const tMax=Math.max(...byType.map(x=>x[1])), hMax=Math.max(...byHall.map(x=>x.hrs),1);
  const totalRev=byType.reduce((s,x)=>s+x[1],0);
  return (
    <div className="route" style={{height:'100%',overflowY:'auto'}}>
      <Toolbar title={isMobile?null:'Reports'}
        stats={isMobile?null:[{label:'Total revenue',value:inr(totalRev),color:'var(--ac)'},{label:'Function types',value:byType.length}]}
        actions={<button className="btn" onClick={()=>toast('Report exported',{icon:'download'})}><Icon n="download" s={15}/>{isMobile?'':'Export CSV'}</button>}/>
      <div style={{padding:16,display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:16}}>
        <div className="card"><div className="card-h"><h3>Revenue by function type</h3></div>
          <div style={{padding:16,display:'flex',flexDirection:'column',gap:10}}>
            {byType.map(([k,v])=>(
              <div key={k}><div style={{display:'flex',justifyContent:'space-between',fontSize:11.5,marginBottom:3}}><span style={{color:'var(--t2)'}}>{k}</span><span style={{fontFamily:'var(--fm)',fontWeight:600}}>{inr(v)}</span></div><div className="prog" style={{height:7}}><span style={{width:`${v/tMax*100}%`,background:'var(--ac)'}}/></div></div>
            ))}
          </div>
        </div>
        <div className="card"><div className="card-h"><h3>Hall utilization (hours)</h3></div>
          <div style={{padding:16,display:'flex',flexDirection:'column',gap:10}}>
            {byHall.map(h=>(
              <div key={h.n}><div style={{display:'flex',justifyContent:'space-between',fontSize:11.5,marginBottom:3}}><span style={{color:'var(--t2)'}}>{h.n}</span><span style={{fontFamily:'var(--fm)',fontWeight:600}}>{h.hrs}h</span></div><div className="prog" style={{height:7}}><span style={{width:`${h.hrs/hMax*100}%`,background:'var(--green)'}}/></div></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ACTIVITY (audit log) ────────────────────────────────────────
function Activity({ openBooking }){
  const isMobile=useMedia();
  return (
    <div className="route" style={{height:'100%',overflowY:'auto'}}>
      <Toolbar title={isMobile?null:'Activity log'}
        stats={isMobile?null:[{label:'Events today',value:ACTIVITY.length}]}
        actions={<button className="btn" onClick={()=>toast('Log exported',{icon:'download'})}><Icon n="download" s={15}/>{isMobile?'':'Export'}</button>}/>
      <RTable
        cols={[{k:'when',l:'When',render:r=>`${fmtDate(r.when)} ${fmtTime(r.when)}`,cell:{fontFamily:'var(--fm)',color:'var(--t3)',whiteSpace:'nowrap'}},{k:'user',l:'User',cell:{fontWeight:500,color:'var(--t1)'}},{k:'action',l:'Action'},{k:'target',l:'Booking',cell:{fontFamily:'var(--fm)',color:'var(--ac)'}},{k:'fn',l:'Function'},{k:'detail',l:'Detail',cell:{color:'var(--t3)'}},{k:'ip',l:'IP',cell:{fontFamily:'var(--fm)',color:'var(--t4)',fontSize:'11px'}}]}
        rows={ACTIVITY.map(a=>({...a,_click:()=>openBooking(a.target)}))}
        renderCard={a=>(<div onClick={()=>openBooking(a.target)}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}><span style={{fontSize:13}}><strong>{a.user}</strong> {a.action} <span style={{color:'var(--ac)',fontFamily:'var(--fm)'}}>{a.target}</span></span></div>
          <div style={{fontSize:11,color:'var(--t3)'}}>{a.detail}</div>
          <div style={{fontSize:10,color:'var(--t4)',fontFamily:'var(--fm)',marginTop:3}}>{fmtDate(a.when)} {fmtTime(a.when)} · {a.ip}</div>
        </div>)}
      />
    </div>
  );
}

// ── SETTINGS ────────────────────────────────────────────────────
function Settings({ theme, toggleTheme }){
  const [tab,setTab]=caS('Profile');
  const isMobile=useMedia();
  const tabs=['Profile','Users','Integrations','Appearance'];
  return (
    <div className="route" style={{height:'100%',display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <Toolbar title={isMobile?null:'Settings'}/>
      <div style={{display:'flex',gap:2,padding:'0 16px',borderBottom:'1px solid var(--bd)',background:'var(--sf)',overflowX:'auto'}}>
        {tabs.map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:'10px 12px',fontSize:11.5,fontFamily:'var(--fm)',textTransform:'uppercase',letterSpacing:'.05em',border:'none',borderBottom:`2px solid ${tab===t?'var(--ac)':'transparent'}`,background:'none',color:tab===t?'var(--t1)':'var(--t3)',fontWeight:tab===t?600:400,whiteSpace:'nowrap'}}>{t}</button>)}
      </div>
      <div style={{flex:1,overflowY:'auto',padding:24,maxWidth:680}}>
        {tab==='Profile' && <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:14}}>
            <div className="field"><label>Full name</label><input className="input" defaultValue="Priya Nambiar"/></div>
            <div className="field"><label>Role</label><input className="input" defaultValue="Operations Lead" readOnly/></div>
            <div className="field"><label>Email</label><input className="input" defaultValue="priya@bika.in"/></div>
            <div className="field"><label>Branch</label><select className="select" defaultValue="Andheri">{['Andheri','Bandra','Powai'].map(x=><option key={x}>{x}</option>)}</select></div>
          </div>
          <div><button className="btn primary">Save changes</button></div>
        </div>}
        {tab==='Users' && <div className="card" style={{overflow:'hidden'}}>
          <table className="tbl"><thead><tr><th>Name</th><th>Role</th><th>Branch</th><th>Status</th></tr></thead>
            <tbody>{USERS.map(u=><tr key={u.id} style={{cursor:'default'}}><td style={{color:'var(--t1)',fontWeight:500}}>{u.name}</td><td>{u.role}</td><td>{u.branch}</td><td>{u.active?<Badge s="won" sm label="Active"/>:<Badge s="normal" sm label="Inactive"/>}</td></tr>)}</tbody>
          </table>
        </div>}
        {tab==='Integrations' && <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {[{n:'Google Calendar',d:'Sync bookings to Google Calendar',on:true},{n:'WhatsApp Business',d:'Send booking confirmations',on:true},{n:'Razorpay',d:'Collect online payments',on:false},{n:'Tally',d:'Export to accounting',on:false}].map(it=>(
            <div key={it.n} className="card" style={{padding:14,display:'flex',alignItems:'center',gap:12}}>
              <div style={{flex:1}}><div style={{fontSize:13.5,fontWeight:600}}>{it.n}</div><div style={{fontSize:11.5,color:'var(--t3)'}}>{it.d}</div></div>
              {it.on?<Badge s="won" label="Connected"/>:<button className="btn sm">Connect</button>}
            </div>
          ))}
        </div>}
        {tab==='Appearance' && <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div className="card" style={{padding:16,display:'flex',alignItems:'center',gap:12}}>
            <div style={{flex:1}}><div style={{fontSize:13.5,fontWeight:600}}>Theme</div><div style={{fontSize:11.5,color:'var(--t3)'}}>Currently {theme}</div></div>
            <button className="btn" onClick={toggleTheme}><Icon n={theme==='light'?'moon':'sun'} s={15}/>Switch to {theme==='light'?'dark':'light'}</button>
          </div>
        </div>}
      </div>
    </div>
  );
}

Object.assign(window,{ Payments, Venues, Menu, Reports, Activity, Settings });
