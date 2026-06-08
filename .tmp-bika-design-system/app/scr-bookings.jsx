// scr-bookings.jsx — dense data table + bulk ops + saved views + inline edit; detail as slide-over
const { useState:bkS, useMemo:bkM } = React;

const BNOW = new Date(2026,5,4);
const bDayDiff = d => Math.ceil((d-BNOW)/864e5);

const VIEWS = [
  { id:'all',         label:'All',            fn:()=>true },
  { id:'balance',     label:'Balance due',    fn:b=>bookingTotal(b).balance>0 && b.status==='confirmed' },
  { id:'pencils',     label:'Pencils expiring',fn:b=>b.status==='pencil' && b.pencilExpiresAt },
  { id:'unconfirmed', label:'Unconfirmed',    fn:b=>['pencil','quotation','enquiry'].includes(b.status) },
  { id:'confirmed',   label:'Confirmed',      fn:b=>b.status==='confirmed' },
  { id:'high',        label:'High value · >₹10L', fn:b=>bookingTotal(b).grand>=1000000 },
];

function Bookings({ openId, setOpenId, showNew, setShowNew }){
  const isMobile = useMedia();
  const [q,setQ] = bkS('');
  const [view,setView] = bkS('all');
  const [sel,setSel] = bkS(()=>new Set());
  const [edits,setEdits] = bkS({}); // id -> {expectedGuests}

  const vfn = VIEWS.find(v=>v.id===view).fn;
  const list = bkM(()=>{
    const t=q.toLowerCase().trim();
    return BOOKINGS.filter(b=>{
      if(!vfn(b)) return false;
      if(t){ const c=customerById(b.customerId); if(!b.functionName.toLowerCase().includes(t)&&!b.id.toLowerCase().includes(t)&&!c.name.toLowerCase().includes(t)) return false; }
      return true;
    }).sort((a,b)=>a.start-b.start);
  },[q,view,edits]);

  const guestsOf = b => (edits[b.id]&&edits[b.id].expectedGuests!=null) ? edits[b.id].expectedGuests : b.expectedGuests;
  const setGuests = (b,v) => { setEdits(e=>({...e,[b.id]:{...e[b.id],expectedGuests:Number(v)||0}})); toast(`${b.id} · guests updated to ${v}`,{icon:'check'}); };

  const selected = openId ? BOOKINGS.find(b=>b.id===openId) : null;
  const toggleSel = id => setSel(s=>{ const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n; });
  const selAll = () => setSel(s=> s.size===list.length ? new Set() : new Set(list.map(b=>b.id)));
  const bulk = (label,icon) => { const n=sel.size; setSel(new Set()); toast(`${label} · ${n} booking${n>1?'s':''}`,{icon:icon||'check'}); };

  // ── MOBILE ──
  if(isMobile){
    if(selected && openId) return <BookingDetail b={selected} onBack={()=>setOpenId(null)} isMobile/>;
    return (
      <div className="route" style={{height:'100%',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <Toolbar title={null} actions={null}>
          <div style={{flex:1,position:'relative'}}>
            <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',display:'flex'}}><Icon n="search" s={15} c="var(--t4)"/></span>
            <input className="input" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search bookings…" style={{paddingLeft:32,height:32}}/>
          </div>
        </Toolbar>
        <div style={{display:'flex',gap:6,padding:'8px 12px',overflowX:'auto',borderBottom:'1px solid var(--bd)',background:'var(--sf)',flexShrink:0}}>
          {VIEWS.map(v=><button key={v.id} onClick={()=>setView(v.id)} className={`chip${view===v.id?' on':''}`} style={{flexShrink:0}}>{v.label}</button>)}
        </div>
        <div style={{flex:1,overflowY:'auto'}} className="stagger">
          {list.map(b=>(
            <SwipeRow key={b.id} actions={[
              {icon:'payments',label:'Pay',color:'var(--green)',onClick:()=>toast(`${b.id} · payment recorded`,{icon:'check'})},
              {icon:'phone',label:'Call',color:'var(--ac)',onClick:()=>toast(`Calling ${customerById(b.customerId).name}…`,{icon:'bell'})},
            ]}>
              <BookingRow b={b} guests={guestsOf(b)} onClick={()=>setOpenId(b.id)}/>
            </SwipeRow>
          ))}
          {list.length===0 && <Empty/>}
          <div style={{height:80}}/>
        </div>
        {showNew && <NewBookingSheet onClose={()=>setShowNew(false)}/>}
      </div>
    );
  }

  // ── DESKTOP: dense table ──
  const totalVal = list.reduce((s,b)=>s+bookingTotal(b).grand,0);
  const totalBal = list.reduce((s,b)=>s+bookingTotal(b).balance,0);
  return (
    <div className="route" style={{height:'100%',display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <Toolbar title="Bookings"
        stats={[
          { label:'In view', value:list.length },
          { label:'Total value', value:inr(totalVal) },
          { label:'Outstanding', value:inr(totalBal), color:totalBal>0?'var(--red)':'var(--green)' },
        ]}
        actions={
          <React.Fragment>
            <div style={{position:'relative'}}>
              <span style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',display:'flex'}}><Icon n="search" s={14} c="var(--t4)"/></span>
              <input className="input" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search…" style={{paddingLeft:30,height:30,width:180}}/>
            </div>
            <button className="btn primary" onClick={()=>setShowNew(true)}><Icon n="plus" s={15}/>New booking</button>
          </React.Fragment>
        }/>

      {/* saved views */}
      <div style={{display:'flex',gap:6,padding:'8px 16px',borderBottom:'1px solid var(--bd)',background:'var(--sf)',flexShrink:0,alignItems:'center',overflowX:'auto'}}>
        <span style={{fontSize:9.5,fontFamily:'var(--fm)',textTransform:'uppercase',letterSpacing:'.06em',color:'var(--t4)',flexShrink:0}}>Views</span>
        {VIEWS.map(v=><button key={v.id} onClick={()=>setView(v.id)} className={`chip${view===v.id?' on':''}`} style={{flexShrink:0}}>{v.label}</button>)}
      </div>

      {/* bulk bar OR table */}
      <div style={{flex:1,overflow:'auto',position:'relative'}}>
        {sel.size>0 && (
          <div className="pop" style={{position:'sticky',top:0,zIndex:5,display:'flex',alignItems:'center',gap:10,padding:'8px 16px',background:'var(--ac)',color:'#fff'}}>
            <span style={{fontSize:12.5,fontWeight:600}}>{sel.size} selected</span>
            <div style={{flex:1}}/>
            <button className="btn sm" style={{background:'rgba(255,255,255,.16)',borderColor:'transparent',color:'#fff'}} onClick={()=>bulk('Marked confirmed')}>Mark confirmed</button>
            <button className="btn sm" style={{background:'rgba(255,255,255,.16)',borderColor:'transparent',color:'#fff'}} onClick={()=>bulk('Reminder sent','bell')}>Send reminder</button>
            <button className="btn sm" style={{background:'rgba(255,255,255,.16)',borderColor:'transparent',color:'#fff'}} onClick={()=>bulk('Exported','download')}>Export</button>
            <button className="btn icon sm" style={{background:'transparent',borderColor:'transparent',color:'#fff'}} onClick={()=>setSel(new Set())}><Icon n="close" s={16} c="#fff"/></button>
          </div>
        )}
        <table className="tbl">
          <thead>
            <tr>
              <th style={{width:34,paddingRight:0}}><input type="checkbox" checked={sel.size>0&&sel.size===list.length} onChange={selAll} style={{cursor:'pointer'}}/></th>
              <th>Booking</th><th>Function / Customer</th><th>Date</th><th>Hall</th>
              <th style={{textAlign:'right'}}>Guests</th><th style={{textAlign:'right'}}>Grand total</th><th style={{textAlign:'right'}}>Balance</th><th>Status</th>
            </tr>
          </thead>
          <tbody className="stagger">
            {list.map(b=>{ const c=customerById(b.customerId),t=bookingTotal(b);
              const exp=b.pencilExpiresAt?bDayDiff(b.pencilExpiresAt):null;
              return (
                <tr key={b.id} className={sel.has(b.id)?'sel':''} onClick={()=>setOpenId(b.id)}>
                  <td style={{paddingRight:0}} onClick={e=>e.stopPropagation()}><input type="checkbox" checked={sel.has(b.id)} onChange={()=>toggleSel(b.id)} style={{cursor:'pointer'}}/></td>
                  <td className="mono" style={{color:'var(--t3)',whiteSpace:'nowrap'}}>{b.id}{b.source==='google'&&<span style={{color:'var(--sky)',marginLeft:4}} title="Google Calendar">G</span>}</td>
                  <td style={{maxWidth:220}}><div style={{color:'var(--t1)',fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{b.functionName}</div><div style={{fontSize:10.5,color:'var(--t3)'}}>{c.name}</div></td>
                  <td className="mono" style={{whiteSpace:'nowrap'}}>{fmtDate(b.start)}{exp!=null&&<div style={{fontSize:9.5,color:'var(--amber)'}}>exp {exp}d</div>}</td>
                  <td style={{whiteSpace:'nowrap'}}>{hallById(b.hallIds[0]).name}{b.hallIds.length>1&&<span style={{color:'var(--t4)'}}> +{b.hallIds.length-1}</span>}</td>
                  <td className="num" onClick={e=>e.stopPropagation()}><InlineEdit value={edits[b.id]&&edits[b.id].expectedGuests!=null?edits[b.id].expectedGuests:b.expectedGuests} type="number" onCommit={v=>setGuests(b,v)} width={56}/></td>
                  <td className="num" style={{color:'var(--t1)'}}><Money v={t.grand}/></td>
                  <td className="num"><Money v={t.balance} kind={t.balance>0?'owed':'clear'}/></td>
                  <td><Badge s={b.status} sm/></td>
                </tr>
              );})}
          </tbody>
        </table>
        {list.length===0 && <Empty/>}
      </div>

      {/* detail slide-over */}
      <Sheet open={!!selected} onClose={()=>setOpenId(null)} width="min(700px,100vw)">
        {selected && <BookingDetail b={selected} onBack={()=>setOpenId(null)} inSheet/>}
      </Sheet>
      {showNew && <NewBookingSheet onClose={()=>setShowNew(false)}/>}
    </div>
  );
}

function Empty(){ return <div style={{padding:48,textAlign:'center',color:'var(--t4)',fontSize:13}}>No bookings match this view.</div>; }

function BookingRow({b,guests,onClick}){
  const c=customerById(b.customerId), t=bookingTotal(b);
  const pct=t.grand>0?Math.round(t.received/t.grand*100):0;
  const expDays = b.pencilExpiresAt ? bDayDiff(b.pencilExpiresAt) : null;
  return (
    <div onClick={onClick} style={{padding:'11px 14px',borderBottom:'1px solid var(--bd)',cursor:'pointer',background:'var(--sf)'}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:3,gap:8}}>
        <span style={{fontSize:10,fontFamily:'var(--fm)',color:'var(--t3)',whiteSpace:'nowrap'}}>{b.id}{b.source==='google'&&<span style={{color:'var(--sky)',marginLeft:5}}>G</span>}</span>
        <span style={{fontSize:10,fontFamily:'var(--fm)',color:'var(--t3)',whiteSpace:'nowrap'}}>{fmtDate(b.start)}</span>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:8,marginBottom:3}}>
        <span style={{fontSize:13,fontWeight:500,color:'var(--t1)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',minWidth:0,flex:1}}>{b.functionName}</span>
        <Money v={t.grand}/>
      </div>
      <div style={{fontSize:11,color:'var(--t3)',marginBottom:6,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.name} · {hallById(b.hallIds[0]).name} · {guests} pax</div>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <Badge s={b.status} sm/>
        {expDays!=null && <span style={{fontSize:10,fontFamily:'var(--fm)',color:'var(--amber)'}}>exp {expDays}d</span>}
        {t.balance>0 && <span style={{marginLeft:'auto',fontSize:10,fontFamily:'var(--fm)'}}><span style={{color:'var(--t4)'}}>bal </span><Money v={t.balance} kind="owed"/></span>}
        {t.balance<=0 && pct>0 && <span style={{marginLeft:'auto',fontSize:10,fontFamily:'var(--fm)',color:'var(--green)'}}>Paid ✓</span>}
      </div>
      {pct>0 && <div style={{marginTop:5}}><Progress pct={pct}/></div>}
    </div>
  );
}

// ── Detail ──────────────────────────────────────────────────────
const TABS = ['Overview','Money','Packs','Halls','Payments','Versions'];

function BookingDetail({b,onBack,isMobile,inSheet}){
  const [tab,setTab] = bkS('Overview');
  const c=customerById(b.customerId), t=bookingTotal(b);
  const pct=t.grand>0?Math.round(t.received/t.grand*100):0;
  const compact = isMobile || inSheet;

  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',overflow:'hidden',background:'var(--bg)'}}>
      <div style={{padding:compact?'12px 16px':'14px 20px',borderBottom:'1px solid var(--bd)',background:'var(--sf)',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
          {(isMobile||inSheet) && <button className="btn icon sm ghost" onClick={onBack} style={{marginLeft:-6}}><Icon n={isMobile?'back':'close'} s={18}/></button>}
          <span style={{fontSize:10,fontFamily:'var(--fm)',color:'var(--t3)'}}>{b.id}</span>
          <Badge s={b.status}/>
          <span style={{fontSize:10,fontFamily:'var(--fm)',color:'var(--t4)'}}>v{b.versions}</span>
          <div style={{marginLeft:'auto',display:'flex',gap:6}}>
            {!compact && <button className="btn sm" onClick={()=>toast('Edit mode',{icon:'check'})}><Icon n="edit" s={14}/>Edit</button>}
            {!isMobile && <button className="btn sm" onClick={()=>toast('Sent to printer',{icon:'check'})}><Icon n="print" s={14}/>Print</button>}
            <button className="btn sm primary" onClick={()=>toast(`Payment recorded for ${b.id}`,{icon:'check'})}><Icon n="plus" s={14}/>Payment</button>
          </div>
        </div>
        <h1 style={{fontSize:compact?17:20,fontWeight:700,letterSpacing:'-.4px'}}>{b.functionName}</h1>
        <div style={{fontSize:11.5,color:'var(--t3)',marginTop:3}}>{c.name} · {c.phone} · {fmtDateFull(b.start)} · {fmtTime(b.start)}–{fmtTime(b.end)}</div>
      </div>
      <div style={{display:'flex',borderBottom:'1px solid var(--bd)',background:'var(--sf)',padding:compact?'0 8px':'0 20px',gap:2,flexShrink:0,overflowX:'auto'}}>
        {TABS.map(tb=>(
          <button key={tb} onClick={()=>setTab(tb)} style={{padding:'9px 11px',fontSize:11,fontFamily:'var(--fm)',textTransform:'uppercase',letterSpacing:'.05em',border:'none',borderBottom:`2px solid ${tab===tb?'var(--ac)':'transparent'}`,background:'none',color:tab===tb?'var(--t1)':'var(--t3)',whiteSpace:'nowrap',fontWeight:tab===tb?600:400}}>{tb}</button>
        ))}
      </div>
      <div style={{flex:1,overflow:'hidden',display:compact?'block':(tab==='Overview'?'grid':'block'),gridTemplateColumns:!compact&&tab==='Overview'?'1fr 300px':undefined}}>
        <div style={{overflowY:'auto',height:'100%',padding:compact?16:20}} className="route">
          {tab==='Overview' && <OverviewTab b={b} c={c} compact={compact}/>}
          {tab==='Money' && <MoneyTab b={b} t={t}/>}
          {tab==='Packs' && <PacksTab b={b}/>}
          {tab==='Halls' && <HallsTab b={b}/>}
          {tab==='Payments' && <PaymentsTab b={b} t={t}/>}
          {tab==='Versions' && <VersionsTab b={b}/>}
        </div>
        {!compact && tab==='Overview' && (
          <div style={{borderLeft:'1px solid var(--bd)',background:'var(--sf2)',overflowY:'auto',padding:16}}>
            <MoneyStack b={b} t={t} pct={pct}/>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({title,children,cols}){
  return (
    <div style={{marginBottom:20}}>
      <div className="eyebrow" style={{marginBottom:10}}>{title}</div>
      <div style={{display:cols?'grid':'flex',gridTemplateColumns:cols?`repeat(${cols},1fr)`:undefined,flexDirection:cols?undefined:'column',gap:cols?'10px 20px':8}}>{children}</div>
    </div>
  );
}
function Field({k,v}){
  return <div style={{borderLeft:'2px solid var(--bd)',paddingLeft:9}}><div style={{fontSize:9.5,fontFamily:'var(--fm)',textTransform:'uppercase',letterSpacing:'.05em',color:'var(--t4)'}}>{k}</div><div style={{fontSize:12.5,color:'var(--t1)',marginTop:1}}>{v||'—'}</div></div>;
}

function OverviewTab({b,c,compact}){
  return (
    <div>
      <Section title="Function details" cols={compact?2:3}>
        <Field k="Type" v={b.functionType}/>
        <Field k="Date" v={fmtDateFull(b.start)}/>
        <Field k="Time" v={`${fmtTime(b.start)}–${fmtTime(b.end)}`}/>
        <Field k="Expected" v={`${b.expectedGuests} guests`}/>
        <Field k="Confirmed" v={b.confirmedGuests?`${b.confirmedGuests} guests`:'—'}/>
        <Field k="Source" v={b.source}/>
      </Section>
      <Section title="Customer" cols={compact?2:3}>
        <Field k="Name" v={c.name}/>
        <Field k="Phone" v={c.phone}/>
        <Field k="Email" v={c.email}/>
        <Field k="City" v={c.city}/>
        <Field k="Community" v={c.community}/>
        <Field k="Priority" v={c.priority}/>
      </Section>
      <Section title="Halls">
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {b.hallIds.map(h=><span key={h} className="chip on">{hallById(h).name}</span>)}
        </div>
      </Section>
      {b.notes && <Section title="Notes"><p style={{fontSize:12.5,color:'var(--t2)',lineHeight:1.6,background:'var(--sf)',border:'1px solid var(--bd)',borderRadius:'var(--r-sm)',padding:12}}>{b.notes}</p></Section>}
      {compact && <MoneyStack b={b} t={bookingTotal(b)} pct={bookingTotal(b).grand>0?Math.round(bookingTotal(b).received/bookingTotal(b).grand*100):0}/>}
    </div>
  );
}

function MoneyStack({b,t,pct}){
  const rows=[
    {k:'Hall charges',v:inrFull(b.hallCharges)},
    {k:'Packs & menu',v:inrFull(t.packsTotal)},
    {k:'Subtotal',v:inrFull(t.sub),sep:1},
    b.discount?{k:'Discount',v:'− '+inrFull(b.discount),c:'var(--red)'}:null,
    {k:`GST ${b.taxPct}%`,v:'+ '+inrFull(t.tax)},
    {k:'Grand total',v:inrFull(t.grand),bold:1,sep:1},
    {k:'Advance req.',v:inrFull(b.advanceReq)},
    {k:'Received',v:inrFull(t.received),c:'var(--green)'},
    {k:'Balance',v:inrFull(t.balance),c:t.balance>0?'var(--red)':'var(--green)',bold:1},
  ].filter(Boolean);
  return (
    <div className="card" style={{padding:14,fontFamily:'var(--fm)'}}>
      <div className="eyebrow" style={{marginBottom:12}}>Money stack</div>
      {rows.map((r,i)=>(
        <React.Fragment key={i}>
          {r.sep && <div style={{height:1,background:'var(--bd)',margin:'8px 0'}}/>}
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:5,fontSize:11,gap:10}}>
            <span style={{color:'var(--t3)',textTransform:'uppercase',fontSize:9.5,letterSpacing:'.03em',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{r.k}</span>
            <span style={{fontWeight:r.bold?700:400,color:r.c||'var(--t1)',whiteSpace:'nowrap',flexShrink:0,fontVariantNumeric:'tabular-nums'}}>{r.v}</span>
          </div>
        </React.Fragment>
      ))}
      <div style={{marginTop:10}}><Progress pct={pct} color={pct>=100?'var(--green)':'var(--ac)'}/></div>
      <div style={{fontSize:10,color:'var(--t3)',textAlign:'right',marginTop:4}}>{pct}% paid</div>
    </div>
  );
}

function MoneyTab({b,t}){
  const isMobile=useMedia();
  return <div style={{maxWidth:isMobile?'100%':420}}><MoneyStack b={b} t={t} pct={t.grand>0?Math.round(t.received/t.grand*100):0}/></div>;
}

function PacksTab({b}){
  return (
    <div className="card" style={{overflow:'hidden'}}>
      <table className="tbl">
        <thead><tr><th>Slot</th><th>Menu pack</th><th style={{textAlign:'right'}}>Plates</th><th style={{textAlign:'right'}}>Rate</th><th style={{textAlign:'right'}}>Setup</th><th style={{textAlign:'right'}}>Total</th></tr></thead>
        <tbody>
          {b.packs.map((p,i)=>{ const mp=packById(p.packId); const tot=p.plates*mp.rate+mp.setup;
            return <tr key={i} style={{cursor:'default'}}><td>{p.slot}</td><td style={{color:'var(--t1)',fontWeight:500}}>{mp.name} {mp.veg?<span style={{color:'var(--green)',fontSize:10}}>● veg</span>:<span style={{color:'var(--red)',fontSize:10}}>● non-veg</span>}</td><td className="num">{p.plates}</td><td className="num">{inrFull(mp.rate)}</td><td className="num">{inrFull(mp.setup)}</td><td className="num" style={{fontWeight:600,color:'var(--t1)'}}>{inrFull(tot)}</td></tr>;
          })}
        </tbody>
      </table>
    </div>
  );
}

function HallsTab({b}){
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      {b.hallIds.map(hid=>{ const h=hallById(hid), v=venueById(h.venueId);
        return (
          <div key={hid} className="card lift" style={{padding:14,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div><div style={{fontSize:14,fontWeight:600}}>{h.name}</div><div style={{fontSize:11.5,color:'var(--t3)',marginTop:2}}>{v.name} · Floor {h.floor} · Cap {h.capacity} (float {h.floating})</div></div>
            <div style={{textAlign:'right'}}><div style={{fontSize:13,fontFamily:'var(--fm)',fontWeight:600}}>{inrFull(h.basePrice)}</div><div style={{fontSize:10,color:'var(--t3)'}}>base price</div></div>
          </div>
        );})}
    </div>
  );
}

function PaymentsTab({b,t}){
  if(!b.payments.length) return <div style={{padding:30,textAlign:'center',color:'var(--t4)',fontSize:13}}>No payments recorded yet.</div>;
  return (
    <div className="card" style={{overflow:'hidden'}}>
      <table className="tbl">
        <thead><tr><th>Date</th><th>Method</th><th>Reference</th><th>By</th><th style={{textAlign:'right'}}>Amount</th></tr></thead>
        <tbody>
          {b.payments.map(p=>(
            <tr key={p.id} style={{cursor:'default'}}><td className="mono">{fmtDateFull(p.date)}</td><td>{p.method}</td><td className="mono" style={{color:'var(--t3)'}}>{p.ref}</td><td>{p.by}</td><td className="num" style={{fontWeight:600,color:'var(--green)'}}>{inrFull(p.amount)}</td></tr>
          ))}
          <tr style={{cursor:'default'}}><td colSpan={4} style={{fontWeight:600,color:'var(--t1)'}}>Total received</td><td className="num" style={{fontWeight:700,color:'var(--t1)'}}>{inrFull(t.received)}</td></tr>
        </tbody>
      </table>
    </div>
  );
}

function VersionsTab({b}){
  const versions=Array.from({length:b.versions},(_,i)=>({n:b.versions-i,date:fmtDateFull(new Date(2026,4,20+i*3)),by:['Suresh','Anita','Vikram'][i%3],note:i===0?'Current version':'Edited pricing & guests'}));
  return (
    <div style={{display:'flex',flexDirection:'column',gap:0}}>
      {versions.map((v,i)=>(
        <div key={v.n} style={{display:'flex',gap:12,padding:'12px 0',borderBottom:i<versions.length-1?'1px solid var(--bd)':'none'}}>
          <div style={{width:32,height:32,borderRadius:'50%',background:i===0?'var(--ac-soft)':'var(--sf2)',color:i===0?'var(--ac)':'var(--t3)',display:'grid',placeItems:'center',fontFamily:'var(--fm)',fontSize:11,fontWeight:600,flexShrink:0}}>v{v.n}</div>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500}}>{v.note}</div><div style={{fontSize:11,color:'var(--t3)',marginTop:1}}>{v.date} · {v.by}</div></div>
          {i===0 && <Badge s="confirmed" sm label="Current"/>}
        </div>
      ))}
    </div>
  );
}

// ── New booking form ────────────────────────────────────────────
function NewBookingSheet({onClose}){
  const [step,setStep]=bkS(1);
  const [f,setF]=bkS({fn:'',type:'Wedding Reception',cust:'',phone:'',date:'',start:'18:00',end:'23:00',hall:'h1',guests:'',pack:'mp1',advance:''});
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  const mp=packById(f.pack);
  const est=(Number(f.guests)||0)*mp.rate+mp.setup+hallById(f.hall).basePrice;
  return (
    <Sheet open onClose={onClose} width="min(520px,100vw)" mobileFull>
      <div style={{padding:'14px 18px',borderBottom:'1px solid var(--bd)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div><div style={{fontSize:15,fontWeight:600}}>New booking</div><div style={{fontSize:11,color:'var(--t3)'}}>Step {step} of 3</div></div>
        <button className="btn icon ghost" onClick={onClose}><Icon n="close" s={18}/></button>
      </div>
      <div style={{padding:'4px 18px 0',display:'flex',gap:4,flexShrink:0}}>
        {[1,2,3].map(s=><div key={s} style={{flex:1,height:3,borderRadius:2,background:s<=step?'var(--ac)':'var(--sf2)',marginTop:12,transition:'background .2s'}}/>)}
      </div>
      <div style={{flex:1,overflowY:'auto',padding:18,display:'flex',flexDirection:'column',gap:14}} className="route" key={step}>
        {step===1 && <React.Fragment>
          <div className="field"><label>Function name</label><input className="input" value={f.fn} onChange={e=>set('fn',e.target.value)} placeholder="e.g. Kapoor Wedding Reception"/></div>
          <div className="field"><label>Function type</label><select className="select" value={f.type} onChange={e=>set('type',e.target.value)}>{['Wedding Reception','Anniversary','Birthday','Engagement','Corporate','Naming','Sangeet','Walima','Reunion'].map(x=><option key={x}>{x}</option>)}</select></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div className="field"><label>Customer name</label><input className="input" value={f.cust} onChange={e=>set('cust',e.target.value)} placeholder="Full name"/></div>
            <div className="field"><label>Phone</label><input className="input" value={f.phone} onChange={e=>set('phone',e.target.value)} placeholder="+91 …"/></div>
          </div>
        </React.Fragment>}
        {step===2 && <React.Fragment>
          <div className="field"><label>Date</label><input className="input" type="date" value={f.date} onChange={e=>set('date',e.target.value)}/></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div className="field"><label>Start time</label><input className="input" type="time" value={f.start} onChange={e=>set('start',e.target.value)}/></div>
            <div className="field"><label>End time</label><input className="input" type="time" value={f.end} onChange={e=>set('end',e.target.value)}/></div>
          </div>
          <div className="field"><label>Hall</label><select className="select" value={f.hall} onChange={e=>set('hall',e.target.value)}>{HALLS.map(h=><option key={h.id} value={h.id}>{h.name} — {venueById(h.venueId).name} (cap {h.capacity})</option>)}</select></div>
          <div className="field"><label>Expected guests</label><input className="input" type="number" value={f.guests} onChange={e=>set('guests',e.target.value)} placeholder="0"/></div>
        </React.Fragment>}
        {step===3 && <React.Fragment>
          <div className="field"><label>Menu pack</label><select className="select" value={f.pack} onChange={e=>set('pack',e.target.value)}>{MENU_PACKS.map(p=><option key={p.id} value={p.id}>{p.name} — {inrFull(p.rate)}/plate</option>)}</select></div>
          <div className="field"><label>Advance to collect</label><input className="input" value={f.advance} onChange={e=>set('advance',e.target.value)} placeholder="₹"/></div>
          <div className="card" style={{padding:14,fontFamily:'var(--fm)',marginTop:4}}>
            <div className="eyebrow" style={{marginBottom:10}}>Estimate</div>
            <Row k="Hall" v={inrFull(hallById(f.hall).basePrice)}/>
            <Row k={`${mp.name} ×${f.guests||0}`} v={inrFull((Number(f.guests)||0)*mp.rate)}/>
            <Row k="Setup" v={inrFull(mp.setup)}/>
            <div style={{height:1,background:'var(--bd)',margin:'8px 0'}}/>
            <Row k="Est. before tax" v={inrFull(est)} bold/>
          </div>
        </React.Fragment>}
      </div>
      <div style={{padding:'12px 18px',borderTop:'1px solid var(--bd)',display:'flex',gap:8,flexShrink:0}}>
        {step>1 && <button className="btn" onClick={()=>setStep(step-1)}>Back</button>}
        <div style={{flex:1}}/>
        {step<3 ? <button className="btn primary" onClick={()=>setStep(step+1)}>Continue</button>
                : <button className="btn primary" onClick={()=>{ toast('Booking created',{icon:'check'}); onClose(); }}><Icon n="check" s={15}/>Create booking</button>}
      </div>
    </Sheet>
  );
}
function Row({k,v,bold}){ return <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:5}}><span style={{color:'var(--t3)',textTransform:'uppercase',fontSize:9.5}}>{k}</span><span style={{fontWeight:bold?700:400,fontVariantNumeric:'tabular-nums'}}>{v}</span></div>; }

Object.assign(window,{ Bookings });
