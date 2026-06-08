// scr-calendar.jsx — hall board (drag-to-reschedule + resize), week, month
const { useState:cS, useMemo:cM, useEffect:cE, useRef:cR } = React;

const ST_COLOR={confirmed:'var(--green)',pencil:'var(--amber)',quotation:'var(--blue)',enquiry:'var(--sky)'};
const pad2=n=>String(n).padStart(2,'0');

function Calendar({ openBooking }){
  const isMobile = useMedia();
  const [view,setView] = cS(isMobile?'Month':'Board');
  const [liveConf,setLiveConf] = cS(()=>detectConflicts(BOOKINGS).size);

  return (
    <div className="route" style={{height:'100%',display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <Toolbar title={isMobile?null:'Calendar'}
        stats={isMobile?null:[
          { label:'June bookings', value:BOOKINGS.filter(b=>b.start.getMonth()===5).length },
          { label:'Conflicts', value:liveConf, color:liveConf?'var(--red)':'var(--green)' },
        ]}
        actions={
          <div className="seg">
            {(isMobile?['Month','Week']:['Board','Week','Month']).map(v=><button key={v} className={view===v?'on':''} onClick={()=>setView(v)}>{v}</button>)}
          </div>
        }/>
      <div style={{flex:1,overflow:'hidden'}}>
        {view==='Board' && <HallBoard openBooking={openBooking} onConf={setLiveConf}/>}
        {view==='Week' && <WeekView openBooking={openBooking}/>}
        {view==='Month' && <MonthView openBooking={openBooking}/>}
      </div>
    </div>
  );
}

// ── Hall board with drag-to-reschedule + resize ─────────────────
function HallBoard({openBooking,onConf}){
  const START=8, HOURS=15, PX=56;
  const day = new Date(2026,5,15);
  const dayBookings = cM(()=>BOOKINGS.filter(b=>b.start.getDate()===15&&b.start.getMonth()===5),[]);
  const groups = cM(()=>VENUES.map(v=>({v,halls:HALLS.filter(h=>h.venueId===v.id)})).filter(g=>g.halls.length),[]);

  const [ov,setOv] = cS({});      // id -> {sh,eh,hallId}
  const [drag,setDrag] = cS(null);
  const lanes = cR({});
  const dragRef = cR(null); dragRef.current = drag;

  const base = b => ({ sh:b.start.getHours()+b.start.getMinutes()/60, eh:b.end.getHours()+b.end.getMinutes()/60, hallId:b.hallIds[0] });
  const posOf = b => ov[b.id] || base(b);
  const eff = b => (drag&&drag.id===b.id) ? {sh:drag.sh,eh:drag.eh,hallId:drag.hallId} : posOf(b);

  // live conflicts from effective positions
  const confSet = cM(()=>{
    const w=dayBookings.map(b=>({id:b.id,...eff(b)}));
    const s=new Set();
    for(let i=0;i<w.length;i++)for(let j=i+1;j<w.length;j++){ const a=w[i],b=w[j]; if(a.hallId===b.hallId && a.sh<b.eh && b.sh<a.eh){ s.add(a.id); s.add(b.id); } }
    return s;
  },[ov,drag,dayBookings]);
  cE(()=>{ onConf&&onConf(confSet.size); },[confSet.size]);

  const snap = h => Math.round(h/0.25)*0.25;
  const clamp = h => Math.max(START,Math.min(START+HOURS,h));

  cE(()=>{
    if(!drag) return;
    const move=(e)=>{
      const d=dragRef.current; if(!d) return;
      const dxH=(e.clientX-d.startX)/PX;
      if(d.mode==='resize'){
        const eh=Math.max(d.origSh+0.5, clamp(snap(d.origEh+dxH)));
        setDrag({...d,eh,moved:true});
      } else {
        let sh=clamp(snap(d.origSh+dxH)); let eh=sh+(d.origEh-d.origSh);
        if(eh>START+HOURS){ eh=START+HOURS; sh=eh-(d.origEh-d.origSh); }
        let hallId=d.hallId;
        for(const hid in lanes.current){ const el=lanes.current[hid]; if(!el)continue; const r=el.getBoundingClientRect(); if(e.clientY>=r.top&&e.clientY<=r.bottom){ hallId=hid; break; } }
        setDrag({...d,sh,eh,hallId,moved:Math.abs(e.clientX-d.startX)>4||hallId!==d.hallId});
      }
    };
    const up=()=>{
      const d=dragRef.current; if(!d) return;
      if(d.moved){
        setOv(o=>({...o,[d.id]:{sh:d.sh,eh:d.eh,hallId:d.hallId}}));
        const hh=Math.floor(d.sh),mm=Math.round((d.sh-hh)*60);
        toast(`${d.id} → ${pad2(hh)}:${pad2(mm)} · ${hallById(d.hallId).name}`,{icon:'check'});
      } else { openBooking(d.id); }
      setDrag(null);
    };
    window.addEventListener('pointermove',move); window.addEventListener('pointerup',up);
    return ()=>{ window.removeEventListener('pointermove',move); window.removeEventListener('pointerup',up); };
  },[drag&&drag.id]);

  return (
    <div style={{height:'100%',overflow:'auto',position:'relative',userSelect:drag?'none':'auto'}}>
      {confSet.size>0 && (
        <div className="pop" style={{padding:'7px 16px',background:'var(--red-bg)',borderBottom:'1px solid var(--red)',display:'flex',alignItems:'center',gap:10,position:'sticky',top:0,zIndex:20}}>
          <Icon n="bell" s={15} c="var(--red)"/>
          <span style={{fontSize:11,fontFamily:'var(--fm)',fontWeight:700,color:'var(--red-fg)',textTransform:'uppercase',letterSpacing:'.05em'}}>{confSet.size} hall conflict{confSet.size>1?'s':''}</span>
          <span style={{fontSize:11.5,color:'var(--t3)'}}>drag an event to a free hall or time to resolve</span>
        </div>
      )}
      <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 16px',borderBottom:'1px solid var(--bd)',background:'var(--sf)',position:'sticky',top:confSet.size?35:0,zIndex:19}}>
        <span style={{fontSize:13,fontWeight:600}}>{fmtDateFull(day)}</span>
        <span style={{fontSize:10.5,color:'var(--t4)',fontFamily:'var(--fm)',display:'flex',alignItems:'center',gap:5}}><Icon n="grip" s={12} c="var(--t4)"/>drag to reschedule · drag right edge to resize</span>
        {Object.keys(ov).length>0 && <button className="btn sm ghost" style={{marginLeft:'auto'}} onClick={()=>{ setOv({}); toast('Reverted all changes',{icon:'clock'}); }}>Reset</button>}
      </div>
      <div style={{minWidth:140+HOURS*PX}}>
        <div style={{display:'flex',position:'sticky',top:confSet.size?70:35,zIndex:10,background:'var(--bg)',borderBottom:'1px solid var(--bd)'}}>
          <div style={{width:140,flexShrink:0,height:30,background:'var(--sf)',borderRight:'1px solid var(--bd)',display:'flex',alignItems:'center',padding:'0 12px'}} className="eyebrow">Hall</div>
          <div style={{display:'flex',flex:1}}>
            {Array.from({length:HOURS},(_,i)=>(
              <div key={i} style={{width:PX,flexShrink:0,height:30,borderLeft:'1px solid var(--bd)',display:'flex',alignItems:'center',paddingLeft:5,fontSize:9.5,fontFamily:'var(--fm)',color:'var(--t3)'}}>{pad2(START+i)}:00</div>
            ))}
          </div>
        </div>
        {groups.map(g=>(
          <div key={g.v.id}>
            <div style={{display:'flex',height:22,background:'var(--sf2)',borderBottom:'1px solid var(--bd)',alignItems:'center'}}>
              <div className="eyebrow" style={{padding:'0 12px'}}>{g.v.name}</div>
            </div>
            {g.halls.map(h=>{
              const evs=dayBookings.filter(b=>eff(b).hallId===h.id);
              const hasConf=evs.some(e=>confSet.has(e.id));
              return (
                <div key={h.id} style={{display:'flex',borderBottom:'1px solid var(--bd)',height:60}}>
                  <div style={{width:140,flexShrink:0,borderRight:'1px solid var(--bd)',padding:'8px 12px',background:hasConf?'var(--red-bg)':'var(--sf)',position:'sticky',left:0,zIndex:5}}>
                    <div style={{fontSize:12.5,fontWeight:500,display:'flex',alignItems:'center',gap:4}}>{h.name}{hasConf&&<Icon n="bell" s={11} c="var(--red)"/>}</div>
                    <div style={{fontSize:10,color:'var(--t3)',fontFamily:'var(--fm)'}}>cap {h.capacity}</div>
                  </div>
                  <div ref={el=>lanes.current[h.id]=el} style={{position:'relative',flex:1}}>
                    {Array.from({length:HOURS},(_,i)=><div key={i} style={{position:'absolute',top:0,bottom:0,left:i*PX,width:1,background:'var(--bd)',opacity:.5}}/>)}
                    {evs.map(ev=>{
                      const p=eff(ev);
                      const left=(p.sh-START)*PX, width=Math.max(46,(p.eh-p.sh)*PX-3);
                      const col=ST_COLOR[ev.status]||'var(--sky)';
                      const isP=ev.status==='pencil', conf=confSet.has(ev.id), dragging=drag&&drag.id===ev.id;
                      const t=BOOKINGS.find(x=>x.id===ev.id)?bookingTotal(BOOKINGS.find(x=>x.id===ev.id)):null;
                      return (
                        <div key={ev.id} className={conf?'conflict':''} onPointerDown={e=>{ if(e.button!==0)return; const p0=eff(ev); setDrag({id:ev.id,mode:'move',startX:e.clientX,origSh:p0.sh,origEh:p0.eh,sh:p0.sh,eh:p0.eh,hallId:p0.hallId,moved:false}); }}
                          style={{position:'absolute',top:5,bottom:5,left,width,borderRadius:3,overflow:'hidden',cursor:dragging?'grabbing':'grab',
                            background:isP?'var(--sf)':`color-mix(in oklab,${col} 13%,var(--sf))`,
                            borderLeft:`3px solid ${col}`,borderStyle:ev.source==='google'?'dashed':'solid',borderWidth:ev.source==='google'?'1px 1px 1px 3px':'0 0 0 3px',borderColor:col,
                            boxShadow:dragging?'var(--shadow-lg)':'none',zIndex:dragging?30:1,transition:dragging?'none':'box-shadow .15s',touchAction:'none'}} title={ev.functionName}>
                          <div className={isP?'hatch':''} style={{padding:'4px 7px',height:'100%',display:'flex',flexDirection:'column',justifyContent:'center',pointerEvents:'none'}}>
                            <div style={{fontSize:10.5,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{ev.functionName}</div>
                            <div style={{fontSize:9,fontFamily:'var(--fm)',color:'var(--t3)',display:'flex',gap:6,whiteSpace:'nowrap'}}>
                              <span>{pad2(Math.floor(p.sh))}:{pad2(Math.round((p.sh%1)*60))}</span>{t&&<span>{inr(t.grand)}</span>}{ev.source==='google'&&<span style={{color:'var(--sky)'}}>G</span>}
                            </div>
                          </div>
                          <div onPointerDown={e=>{ e.stopPropagation(); if(e.button!==0)return; const p0=eff(ev); setDrag({id:ev.id,mode:'resize',startX:e.clientX,origSh:p0.sh,origEh:p0.eh,sh:p0.sh,eh:p0.eh,hallId:p0.hallId,moved:false}); }}
                            style={{position:'absolute',top:0,right:0,bottom:0,width:9,cursor:'ew-resize',touchAction:'none'}}/>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div style={{height:20}}/>
      </div>
    </div>
  );
}

// ── Week view ───────────────────────────────────────────────────
function WeekView({openBooking}){
  const isMobile=useMedia();
  const weekStart=new Date(2026,5,15);
  const days=Array.from({length:7},(_,i)=>{ const dt=new Date(weekStart); dt.setDate(15+i); return dt; });
  return (
    <div style={{height:'100%',overflow:'auto',padding:isMobile?12:16}}>
      <div className="stagger" style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(7,1fr)',gap:isMobile?10:8}}>
        {days.map(dt=>{
          const bks=BOOKINGS.filter(b=>b.start.getDate()===dt.getDate()&&b.start.getMonth()===dt.getMonth());
          const today=dt.getDate()===15;
          return (
            <div key={dt.getDate()} className="card" style={{minHeight:isMobile?'auto':180,display:'flex',flexDirection:'column',overflow:'hidden'}}>
              <div style={{padding:'8px 10px',borderBottom:'1px solid var(--bd)',background:today?'var(--ac-soft)':'var(--sf2)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:10.5,fontFamily:'var(--fm)',textTransform:'uppercase',color:today?'var(--ac)':'var(--t3)',fontWeight:today?600:400}}>{dt.toLocaleDateString('en-IN',{weekday:'short'})}</span>
                <span style={{fontSize:14,fontWeight:700,fontFamily:'var(--fm)',color:today?'var(--ac)':'var(--t1)'}}>{dt.getDate()}</span>
              </div>
              <div style={{padding:8,display:'flex',flexDirection:'column',gap:5,flex:1}}>
                {bks.map(b=>{ const c=customerById(b.customerId);
                  return <div key={b.id} onClick={()=>openBooking(b.id)} style={{padding:'5px 7px',borderRadius:'var(--r-sm)',borderLeft:`3px solid ${ST_COLOR[b.status]}`,background:'var(--sf2)',cursor:'pointer',transition:'transform .12s'}} onMouseEnter={e=>e.currentTarget.style.transform='translateX(2px)'} onMouseLeave={e=>e.currentTarget.style.transform='none'}>
                    <div style={{fontSize:11,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{b.functionName}</div>
                    <div style={{fontSize:9.5,fontFamily:'var(--fm)',color:'var(--t3)'}}>{fmtTime(b.start)} · {c.name.split(' ')[0]}</div>
                  </div>;
                })}
                {!bks.length && <div style={{fontSize:10.5,color:'var(--t4)',textAlign:'center',padding:'8px 0'}}>—</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Month view ──────────────────────────────────────────────────
function MonthView({openBooking}){
  const isMobile=useMedia();
  const daysInMonth=30, offset=0;
  const cells=[];
  for(let i=0;i<offset;i++) cells.push(null);
  for(let dnum=1;dnum<=daysInMonth;dnum++) cells.push(dnum);
  const dows=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  return (
    <div style={{height:'100%',overflow:'auto',padding:isMobile?10:16,display:'flex',flexDirection:'column'}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:1,marginBottom:6}}>
        {dows.map(d=><div key={d} style={{textAlign:'center',fontSize:9.5,fontFamily:'var(--fm)',textTransform:'uppercase',color:'var(--t4)',letterSpacing:'.05em',padding:'2px 0'}}>{isMobile?d[0]:d}</div>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gridAutoRows:'1fr',gap:1,background:'var(--bd)',border:'1px solid var(--bd)',borderRadius:'var(--r-sm)',overflow:'hidden',flex:1,minHeight:isMobile?420:520}}>
        {cells.map((dnum,i)=>{
          if(dnum===null) return <div key={i} style={{background:'var(--sf2)',opacity:.4}}/>;
          const bks=BOOKINGS.filter(b=>b.start.getDate()===dnum&&b.start.getMonth()===5);
          const today=dnum===4;
          const rev=bks.reduce((s,b)=>s+bookingTotal(b).grand,0);
          return (
            <div key={i} style={{background:'var(--sf)',padding:isMobile?'3px':'5px 6px',display:'flex',flexDirection:'column',gap:2,minHeight:0,overflow:'hidden',transition:'background .12s'}} onMouseEnter={e=>e.currentTarget.style.background='var(--sf2)'} onMouseLeave={e=>e.currentTarget.style.background='var(--sf)'}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:isMobile?10:11.5,fontFamily:'var(--fm)',fontWeight:today?700:400,color:today?'#fff':'var(--t2)',background:today?'var(--ac)':'transparent',width:today?18:'auto',height:today?18:'auto',borderRadius:'50%',display:'grid',placeItems:'center'}}>{dnum}</span>
                {rev>0&&!isMobile&&<span style={{fontSize:8.5,fontFamily:'var(--fm)',color:'var(--t4)'}}>{inr(rev)}</span>}
              </div>
              {isMobile ? (
                bks.length>0 && <div style={{display:'flex',gap:2,flexWrap:'wrap',marginTop:1}}>{bks.slice(0,3).map(b=><span key={b.id} onClick={()=>openBooking(b.id)} style={{width:5,height:5,borderRadius:'50%',background:ST_COLOR[b.status]}}/>)}</div>
              ) : (
                <React.Fragment>
                  {bks.slice(0,3).map(b=><div key={b.id} onClick={()=>openBooking(b.id)} style={{fontSize:9.5,padding:'1px 4px',borderRadius:3,borderLeft:`2px solid ${ST_COLOR[b.status]}`,background:'var(--sf2)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',cursor:'pointer'}}>{b.functionName}</div>)}
                  {bks.length>3 && <div style={{fontSize:9,color:'var(--t4)'}}>+{bks.length-3} more</div>}
                </React.Fragment>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window,{ Calendar });
