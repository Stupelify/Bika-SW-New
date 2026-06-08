// shell.jsx — responsive app shell: sidebar (desktop) / bottom-nav + drawer (mobile), topbar, command palette
const { useState:uS, useEffect:uE, useMemo:uM, useRef:uR } = React;

const NAV = [
  { id:'dashboard', l:'Dashboard', icon:'dashboard', grp:'Operate' },
  { id:'bookings',  l:'Bookings',  icon:'bookings',  grp:'Operate' },
  { id:'calendar',  l:'Calendar',  icon:'calendar',  grp:'Operate' },
  { id:'enquiries', l:'Enquiries', icon:'enquiries', grp:'Operate' },
  { id:'customers', l:'Customers', icon:'customers', grp:'Operate' },
  { id:'payments',  l:'Payments',  icon:'payments',  grp:'Operate' },
  { id:'venues',    l:'Venues',    icon:'venues',    grp:'Catalog' },
  { id:'menu',      l:'Menu & Items', icon:'menu',   grp:'Catalog' },
  { id:'reports',   l:'Reports',   icon:'reports',   grp:'Catalog' },
  { id:'activity',  l:'Activity',  icon:'activity',  grp:'Catalog' },
  { id:'settings',  l:'Settings',  icon:'settings',  grp:'Catalog' },
];
const MOBILE_TABS = ['dashboard','bookings','calendar','enquiries'];

function navBadge(id){
  if(id==='bookings') return BOOKINGS.length;
  if(id==='enquiries') return ENQUIRIES.filter(e=>['Lead','Quotation','Pencil'].includes(e.stage)).length;
  if(id==='payments') return BOOKINGS.filter(b=>bookingTotal(b).balance>0 && b.status==='confirmed').length;
  return null;
}

// ── Desktop sidebar ─────────────────────────────────────────────
function Sidebar({route,go,collapsed,setCollapsed}){
  const groups=['Operate','Catalog'];
  return (
    <aside style={{width:collapsed?60:224,flexShrink:0,height:'100%',background:'var(--sf)',borderRight:'1px solid var(--bd)',display:'flex',flexDirection:'column',transition:'width .18s'}}>
      <div style={{height:56,display:'flex',alignItems:'center',gap:10,padding:collapsed?'0 16px':'0 16px',borderBottom:'1px solid var(--bd)',flexShrink:0}}>
        <div style={{width:30,height:30,background:'var(--ac)',borderRadius:6,display:'grid',placeItems:'center',color:'#fff',fontWeight:700,fontSize:15,fontFamily:'var(--fm)',flexShrink:0}}>B</div>
        {!collapsed && <div style={{lineHeight:1.1,overflow:'hidden'}}>
          <div style={{fontWeight:600,fontSize:13.5,letterSpacing:'-.2px',whiteSpace:'nowrap'}}>Bika Banquet</div>
          <div style={{fontSize:9.5,color:'var(--t4)',fontFamily:'var(--fm)',textTransform:'uppercase',letterSpacing:'.07em'}}>Ops Console</div>
        </div>}
      </div>
      <nav style={{flex:1,overflowY:'auto',overflowX:'hidden',padding:'8px 0'}}>
        {groups.map(g=>(
          <div key={g} style={{marginBottom:6}}>
            {!collapsed && <div style={{padding:'8px 16px 4px',fontSize:9.5,fontFamily:'var(--fm)',textTransform:'uppercase',letterSpacing:'.09em',color:'var(--t4)'}}>{g}</div>}
            {NAV.filter(n=>n.grp===g).map(n=>{
              const on=route===n.id, badge=navBadge(n.id);
              return (
                <button key={n.id} onClick={()=>go(n.id)} title={n.l} style={{
                  width:'100%',display:'flex',alignItems:'center',gap:11,padding:collapsed?'9px 0':'8px 16px',justifyContent:collapsed?'center':'flex-start',
                  border:'none',background:on?'var(--ac-soft)':'transparent',color:on?'var(--ac)':'var(--t2)',
                  borderLeft:`2px solid ${on?'var(--ac)':'transparent'}`,fontSize:12.5,fontWeight:on?500:400,textAlign:'left',position:'relative'}}>
                  <Icon n={n.icon} s={17} c={on?'var(--ac)':'var(--t3)'}/>
                  {!collapsed && <span style={{flex:1,whiteSpace:'nowrap'}}>{n.l}</span>}
                  {!collapsed && badge!=null && <span style={{background:on?'var(--ac)':'var(--sf2)',color:on?'#fff':'var(--t3)',borderRadius:3,padding:'0 5px',fontSize:9.5,fontFamily:'var(--fm)',fontWeight:600,lineHeight:'16px'}}>{badge}</span>}
                  {collapsed && badge!=null && <span style={{position:'absolute',top:5,right:9,width:6,height:6,borderRadius:'50%',background:'var(--ac)'}}/>}
                </button>
              );
            })}
          </div>
        ))}
      </nav>
      <div style={{borderTop:'1px solid var(--bd)',padding:collapsed?'10px 0':'10px 12px',display:'flex',alignItems:'center',gap:10,justifyContent:collapsed?'center':'flex-start',flexShrink:0}}>
        <div style={{width:30,height:30,borderRadius:'50%',background:'var(--ac)',display:'grid',placeItems:'center',color:'#fff',fontSize:11,fontWeight:600,fontFamily:'var(--fm)',flexShrink:0}}>PN</div>
        {!collapsed && <div style={{overflow:'hidden',flex:1}}>
          <div style={{fontSize:12,fontWeight:500,whiteSpace:'nowrap'}}>Priya Nambiar</div>
          <div style={{fontSize:10,color:'var(--t3)',whiteSpace:'nowrap'}}>Operations Lead · Andheri</div>
        </div>}
        {!collapsed && <button className="btn icon sm ghost" onClick={()=>setCollapsed(true)} title="Collapse"><Icon n="chevL" s={15}/></button>}
      </div>
      {collapsed && <button className="btn icon sm ghost" onClick={()=>setCollapsed(false)} style={{margin:'0 auto 10px'}} title="Expand"><Icon n="chevR" s={15}/></button>}
    </aside>
  );
}

// ── Topbar ──────────────────────────────────────────────────────
function Topbar({route,onSearch,theme,toggleTheme,onMenu,isMobile}){
  const [clock,setClock]=uS('');
  uE(()=>{ const t=()=>setClock(new Date().toLocaleTimeString('en-IN',{hour12:false})); t(); const i=setInterval(t,1000); return ()=>clearInterval(i); },[]);
  const title=(NAV.find(n=>n.id===route)||{}).l||'';
  return (
    <header style={{height:56,flexShrink:0,background:'var(--sf)',borderBottom:'1px solid var(--bd)',display:'flex',alignItems:'center',padding:isMobile?'0 14px':'0 20px',gap:12}}>
      {isMobile
        ? <button className="btn icon ghost" onClick={onMenu}><Icon n="menu2" s={20}/></button>
        : <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12.5,flexShrink:0}}>
            <span style={{color:'var(--t3)'}}>Bika Banquets</span><span style={{color:'var(--t4)'}}>/</span>
            <span style={{color:'var(--t1)',fontWeight:500}}>{title}</span>
          </div>}
      {isMobile && <div style={{fontSize:15,fontWeight:600,flex:1}}>{title}</div>}
      {!isMobile && <button onClick={onSearch} style={{flex:1,maxWidth:380,margin:'0 auto',height:34,background:'var(--sf2)',border:'1px solid var(--bd)',borderRadius:'var(--r-sm)',display:'flex',alignItems:'center',padding:'0 12px',gap:8,color:'var(--t3)',fontSize:12}}>
        <Icon n="search" s={15} c="var(--t3)"/><span style={{flex:1,textAlign:'left'}}>Search bookings, customers, halls…</span>
        <span style={{fontFamily:'var(--fm)',fontSize:10,background:'var(--sf)',border:'1px solid var(--bd)',borderRadius:3,padding:'1px 5px'}}>⌘K</span>
      </button>}
      {isMobile && <button className="btn icon ghost" onClick={onSearch}><Icon n="search" s={19}/></button>}
      {!isMobile && <div style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'var(--green)',fontFamily:'var(--fm)',flexShrink:0}}>
        <span style={{width:6,height:6,borderRadius:'50%',background:'var(--green)',boxShadow:'0 0 0 3px var(--green-bg)'}}/>Live
      </div>}
      {!isMobile && <div style={{textAlign:'right',lineHeight:1.2,flexShrink:0}}>
        <div style={{fontFamily:'var(--fm)',fontSize:11,color:'var(--t2)'}}>{clock}</div>
        <div style={{fontSize:9,color:'var(--t4)',textTransform:'uppercase',letterSpacing:'.06em'}}>Mumbai</div>
      </div>}
      <button className="btn icon ghost" onClick={toggleTheme} title="Theme"><Icon n={theme==='light'?'moon':'sun'} s={17}/></button>
    </header>
  );
}

// ── Desktop horizontal top-nav (alternative to sidebar) ────────
function TopNav({route,go,onSearch,theme,toggleTheme}){
  const [clock,setClock]=uS('');
  uE(()=>{ const t=()=>setClock(new Date().toLocaleTimeString('en-IN',{hour12:false})); t(); const i=setInterval(t,1000); return ()=>clearInterval(i); },[]);
  return (
    <header style={{height:44,flexShrink:0,background:'var(--sf)',borderBottom:'1px solid var(--bd)',display:'flex',alignItems:'center',padding:'0 14px',gap:12}}>
      {/* subtle mark — no logo lockup */}
      <div style={{display:'flex',alignItems:'center',gap:7,flexShrink:0}}>
        <span style={{width:9,height:9,borderRadius:2,background:'var(--ac)'}}/>
        <span style={{fontFamily:'var(--fm)',fontSize:11,fontWeight:500,color:'var(--t3)',letterSpacing:'.04em',whiteSpace:'nowrap'}} className="only-desktop">BIKA OPS</span>
      </div>
      <div style={{width:1,height:18,background:'var(--bd)',flexShrink:0}}/>
      {/* nav links — scrollable */}
      <nav style={{display:'flex',alignItems:'center',gap:1,flex:1,overflowX:'auto',height:'100%',scrollbarWidth:'none'}}>
        {NAV.map(n=>{
          const on=route===n.id, badge=navBadge(n.id);
          return (
            <button key={n.id} onClick={()=>go(n.id)} style={{
              display:'flex',alignItems:'center',gap:6,padding:'0 10px',height:'100%',border:'none',background:'none',
              color:on?'var(--ac)':'var(--t3)',fontSize:12,fontWeight:on?600:400,whiteSpace:'nowrap',
              borderBottom:`2px solid ${on?'var(--ac)':'transparent'}`,position:'relative'}}>
              {n.l}
              {badge!=null && <span style={{background:on?'var(--ac)':'var(--sf2)',color:on?'#fff':'var(--t3)',borderRadius:3,padding:'0 4px',fontSize:9,fontFamily:'var(--fm)',fontWeight:600,lineHeight:'15px'}}>{badge}</span>}
            </button>
          );
        })}
      </nav>
      {/* right cluster */}
      <button onClick={onSearch} style={{height:28,background:'var(--sf2)',border:'1px solid var(--bd)',borderRadius:'var(--r-sm)',display:'flex',alignItems:'center',padding:'0 9px',gap:7,color:'var(--t4)',fontSize:11.5,flexShrink:0,maxWidth:150}} className="only-desktop">
        <Icon n="search" s={13} c="var(--t4)"/><span style={{flex:1,textAlign:'left',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>Search</span>
        <span style={{fontFamily:'var(--fm)',fontSize:9.5,border:'1px solid var(--bd)',borderRadius:3,padding:'0 4px'}}>⌘K</span>
      </button>
      <button className="btn icon ghost only-mobile" onClick={onSearch} style={{flexShrink:0}}><Icon n="search" s={17}/></button>
      <span style={{fontFamily:'var(--fm)',fontSize:10.5,color:'var(--t4)',flexShrink:0,whiteSpace:'nowrap'}} className="only-desktop">{clock}</span>
      <button className="btn icon sm ghost" onClick={toggleTheme} title="Theme" style={{flexShrink:0}}><Icon n={theme==='light'?'moon':'sun'} s={16}/></button>
      <div style={{width:26,height:26,borderRadius:'50%',background:'var(--sf3)',display:'grid',placeItems:'center',color:'var(--t2)',fontSize:10,fontWeight:600,fontFamily:'var(--fm)',flexShrink:0}} title="Priya Nambiar · Operations Lead">PN</div>
    </header>
  );
}

// ── Mobile bottom nav ───────────────────────────────────────────
function BottomNav({route,go,onMore}){
  return (
    <nav style={{height:60,flexShrink:0,background:'var(--sf)',borderTop:'1px solid var(--bd)',display:'flex',paddingBottom:'env(safe-area-inset-bottom)'}}>
      {MOBILE_TABS.map(id=>{
        const n=NAV.find(x=>x.id===id), on=route===id, badge=navBadge(id);
        return (
          <button key={id} onClick={()=>go(id)} style={{flex:1,border:'none',background:'none',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:3,color:on?'var(--ac)':'var(--t3)',position:'relative'}}>
            <Icon n={n.icon} s={21} c={on?'var(--ac)':'var(--t3)'}/>
            <span style={{fontSize:9.5,fontWeight:on?600:400}}>{n.l}</span>
            {badge!=null && <span style={{position:'absolute',top:6,right:'calc(50% - 18px)',background:'var(--ac)',color:'#fff',fontSize:8,fontFamily:'var(--fm)',fontWeight:600,minWidth:14,height:14,borderRadius:7,display:'grid',placeItems:'center',padding:'0 3px'}}>{badge}</span>}
          </button>
        );
      })}
      <button onClick={onMore} style={{flex:1,border:'none',background:'none',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:3,color:'var(--t3)'}}>
        <Icon n="more" s={21}/><span style={{fontSize:9.5}}>More</span>
      </button>
    </nav>
  );
}

// ── Mobile drawer (full nav) ────────────────────────────────────
function MobileDrawer({open,onClose,route,go,theme,toggleTheme}){
  if(!open) return null;
  return (
    <React.Fragment>
      <div className="scrim" onClick={onClose} style={{zIndex:70}}/>
      <div style={{position:'fixed',top:0,left:0,bottom:0,width:'min(300px,84vw)',background:'var(--bg)',zIndex:71,boxShadow:'var(--shadow-lg)',display:'flex',flexDirection:'column',animation:'slideL .22s cubic-bezier(.32,.72,0,1)'}}>
        <style>{`@keyframes slideL{from{transform:translateX(-100%)}to{transform:translateX(0)}}`}</style>
        <div style={{height:56,display:'flex',alignItems:'center',gap:10,padding:'0 16px',borderBottom:'1px solid var(--bd)'}}>
          <div style={{width:30,height:30,background:'var(--ac)',borderRadius:6,display:'grid',placeItems:'center',color:'#fff',fontWeight:700,fontFamily:'var(--fm)'}}>B</div>
          <div style={{flex:1}}><div style={{fontWeight:600,fontSize:13.5}}>Bika Banquet</div><div style={{fontSize:9.5,color:'var(--t4)',fontFamily:'var(--fm)',textTransform:'uppercase'}}>Ops Console</div></div>
          <button className="btn icon ghost" onClick={onClose}><Icon n="close" s={18}/></button>
        </div>
        <nav style={{flex:1,overflowY:'auto',padding:'8px 0'}}>
          {['Operate','Catalog'].map(g=>(
            <div key={g}>
              <div style={{padding:'8px 16px 4px',fontSize:9.5,fontFamily:'var(--fm)',textTransform:'uppercase',letterSpacing:'.09em',color:'var(--t4)'}}>{g}</div>
              {NAV.filter(n=>n.grp===g).map(n=>{
                const on=route===n.id, badge=navBadge(n.id);
                return (
                  <button key={n.id} onClick={()=>{go(n.id);onClose();}} style={{width:'100%',display:'flex',alignItems:'center',gap:12,padding:'11px 16px',border:'none',background:on?'var(--ac-soft)':'transparent',color:on?'var(--ac)':'var(--t2)',borderLeft:`2px solid ${on?'var(--ac)':'transparent'}`,fontSize:13.5,fontWeight:on?500:400,textAlign:'left'}}>
                    <Icon n={n.icon} s={18} c={on?'var(--ac)':'var(--t3)'}/><span style={{flex:1}}>{n.l}</span>
                    {badge!=null && <span style={{background:'var(--sf2)',color:'var(--t3)',borderRadius:3,padding:'0 6px',fontSize:10,fontFamily:'var(--fm)',fontWeight:600}}>{badge}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div style={{borderTop:'1px solid var(--bd)',padding:'12px 16px',display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:34,height:34,borderRadius:'50%',background:'var(--ac)',display:'grid',placeItems:'center',color:'#fff',fontSize:12,fontWeight:600,fontFamily:'var(--fm)'}}>PN</div>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500}}>Priya Nambiar</div><div style={{fontSize:10.5,color:'var(--t3)'}}>Operations Lead</div></div>
          <button className="btn icon ghost" onClick={toggleTheme}><Icon n={theme==='light'?'moon':'sun'} s={17}/></button>
        </div>
      </div>
    </React.Fragment>
  );
}

// ── Command palette ─────────────────────────────────────────────
function CommandPalette({open,onClose,go,openBooking,openCustomer}){
  const [q,setQ]=uS('');
  const inputRef=uR(null);
  uE(()=>{ if(open){ setQ(''); setTimeout(()=>inputRef.current&&inputRef.current.focus(),30); } },[open]);
  const results=uM(()=>{
    const t=q.toLowerCase().trim();
    const pages=NAV.filter(n=>!t||n.l.toLowerCase().includes(t)).map(n=>({grp:'Pages',id:n.id,label:n.l,icon:n.icon,act:()=>go(n.id)}));
    const bk=BOOKINGS.filter(b=>!t||b.functionName.toLowerCase().includes(t)||b.id.toLowerCase().includes(t)).slice(0,5).map(b=>({grp:'Bookings',id:b.id,label:b.functionName,sub:b.id,act:()=>openBooking(b.id)}));
    const cu=CUSTOMERS.filter(c=>!t||c.name.toLowerCase().includes(t)||c.phone.includes(t)).slice(0,5).map(c=>({grp:'Customers',id:c.id,label:c.name,sub:c.phone,act:()=>openCustomer(c.id)}));
    return [...pages.slice(0,t?6:4),...bk,...cu];
  },[q]);
  if(!open) return null;
  const grps=[...new Set(results.map(r=>r.grp))];
  return (
    <React.Fragment>
      <div className="scrim" onClick={onClose} style={{zIndex:80,alignItems:'flex-start'}}/>
      <div style={{position:'fixed',top:'12vh',left:'50%',transform:'translateX(-50%)',width:'min(560px,92vw)',background:'var(--bg)',border:'1px solid var(--bd)',borderRadius:'var(--r-lg)',boxShadow:'var(--shadow-lg)',zIndex:81,overflow:'hidden',display:'flex',flexDirection:'column',maxHeight:'70vh'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'13px 16px',borderBottom:'1px solid var(--bd)'}}>
          <Icon n="search" s={17} c="var(--t3)"/>
          <input ref={inputRef} value={q} onChange={e=>setQ(e.target.value)} placeholder="Search bookings, customers, pages…" style={{flex:1,border:'none',background:'none',outline:'none',fontSize:14,color:'var(--t1)'}}/>
          <span style={{fontFamily:'var(--fm)',fontSize:10,color:'var(--t4)',border:'1px solid var(--bd)',borderRadius:3,padding:'1px 5px'}}>ESC</span>
        </div>
        <div style={{overflowY:'auto',padding:'6px 0'}}>
          {grps.map(g=>(
            <div key={g}>
              <div style={{padding:'6px 16px 2px',fontSize:9.5,fontFamily:'var(--fm)',textTransform:'uppercase',letterSpacing:'.08em',color:'var(--t4)'}}>{g}</div>
              {results.filter(r=>r.grp===g).map(r=>(
                <button key={r.grp+r.id} onClick={()=>{r.act();onClose();}} style={{width:'100%',display:'flex',alignItems:'center',gap:11,padding:'9px 16px',border:'none',background:'none',textAlign:'left',color:'var(--t1)'}} onMouseEnter={e=>e.currentTarget.style.background='var(--sf2)'} onMouseLeave={e=>e.currentTarget.style.background='none'}>
                  {r.icon && <Icon n={r.icon} s={16} c="var(--t3)"/>}
                  <span style={{flex:1,fontSize:13}}>{r.label}</span>
                  {r.sub && <span style={{fontSize:11,color:'var(--t3)',fontFamily:'var(--fm)'}}>{r.sub}</span>}
                </button>
              ))}
            </div>
          ))}
          {results.length===0 && <div style={{padding:'24px',textAlign:'center',color:'var(--t3)',fontSize:13}}>No results</div>}
        </div>
      </div>
    </React.Fragment>
  );
}

Object.assign(window,{ NAV, Sidebar, Topbar, TopNav, BottomNav, MobileDrawer, CommandPalette });
