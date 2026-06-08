// main.jsx — app router + state, composes shell + screens + Tweaks
const { useState:mS, useEffect:mE, useCallback:mC } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "nav": "top",
  "accent": "#0F766E",
  "density": "compact",
  "dark": false
}/*EDITMODE-END*/;

const ACCENTS = ['#0F766E','#2563EB','#4F46E5','#B45309'];

function App(){
  const isMobile = useMedia();
  const [t,setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route,setRoute] = mS(()=>{
    const r=new URLSearchParams(location.search).get('r');
    return r||localStorage.getItem('bika-route')||'dashboard';
  });
  const [collapsed,setCollapsed] = mS(false);
  const [drawer,setDrawer] = mS(false);
  const [palette,setPalette] = mS(false);
  const [help,setHelp] = mS(false);
  const [theme,toggleTheme] = useTheme();

  // per-screen selection state
  const [bookingId,setBookingId] = mS(null);
  const [showNewBooking,setShowNewBooking] = mS(false);
  const [customerId,setCustomerId] = mS(null);

  mE(()=>{ localStorage.setItem('bika-route',route); },[route]);
  // keep the dark tweak and the theme hook in sync (theme hook is source of truth)
  mE(()=>{ if(t.dark !== (theme==='dark')) toggleTheme(); },[t.dark]);
  mE(()=>{
    const h=e=>{ if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){ e.preventDefault(); setPalette(p=>!p); } };
    window.addEventListener('keydown',h); return ()=>window.removeEventListener('keydown',h);
  },[]);

  const go = mC((r,arg)=>{
    setRoute(r); setDrawer(false);
    if(r==='bookings'){ if(arg==='new') setShowNewBooking(true); else setBookingId(null); }
    if(r==='customers') setCustomerId(null);
  },[]);

  const openBooking = mC((id)=>{ setRoute('bookings'); setBookingId(id); setDrawer(false); setPalette(false); },[]);
  const openCustomer = mC((id)=>{ setRoute('customers'); setCustomerId(id); setDrawer(false); setPalette(false); },[]);

  // keyboard-first navigation
  const NAV_KEYS=['dashboard','bookings','calendar','enquiries','customers','payments','venues','menu','reports'];
  useKeys({
    '1':()=>go('dashboard'),'2':()=>go('bookings'),'3':()=>go('calendar'),'4':()=>go('enquiries'),
    '5':()=>go('customers'),'6':()=>go('payments'),'7':()=>go('venues'),'8':()=>go('menu'),'9':()=>go('reports'),
    'n':()=>{ setRoute('bookings'); setBookingId(null); setShowNewBooking(true); },
    '/':()=>setPalette(true),
    '?':()=>setHelp(h=>!h),
    'Escape':()=>{ setHelp(false); },
  },[]);

  const fabAction = mC(()=>{
    if(route==='enquiries'){ toast('New enquiry',{icon:'check'}); return; }
    if(route==='customers'){ toast('New customer',{icon:'check'}); return; }
    setRoute('bookings'); setBookingId(null); setShowNewBooking(true);
  },[route]);

  const screen = (()=>{
    switch(route){
      case 'dashboard': return <Dashboard go={go} openBooking={openBooking}/>;
      case 'bookings':  return <Bookings openId={bookingId} setOpenId={setBookingId} showNew={showNewBooking} setShowNew={setShowNewBooking}/>;
      case 'calendar':  return <Calendar openBooking={openBooking}/>;
      case 'enquiries': return <Enquiries openCustomer={openCustomer}/>;
      case 'customers': return <Customers openId={customerId} setOpenId={setCustomerId} openBooking={openBooking}/>;
      case 'payments':  return <Payments openBooking={openBooking}/>;
      case 'venues':    return <Venues/>;
      case 'menu':      return <Menu/>;
      case 'reports':   return <Reports/>;
      case 'activity':  return <Activity openBooking={openBooking}/>;
      case 'settings':  return <Settings theme={theme} toggleTheme={toggleTheme}/>;
      default: return <Dashboard go={go} openBooking={openBooking}/>;
    }
  })();

  // accent override (derive soft/border/hover from chosen accent)
  const ac=t.accent||'#0F766E';
  const accentVars={
    '--ac':ac,
    '--ac-soft':`color-mix(in oklab, ${ac} 10%, var(--sf))`,
    '--ac-bd':`color-mix(in oklab, ${ac} 42%, var(--sf))`,
    '--ac-h':`color-mix(in oklab, ${ac} 82%, black)`,
  };
  const topNav = t.nav==='top' && !isMobile;

  return (
    <React.Fragment>
      <GlobalStyles/>
      <div data-density={t.density} style={{...accentVars,display:'flex',flexDirection:topNav?'column':'row',height:'100%',width:'100%',overflow:'hidden',background:'var(--bg)'}}>
        {topNav && <TopNav route={route} go={go} onSearch={()=>setPalette(true)} theme={theme} toggleTheme={toggleTheme}/>}
        {!isMobile && !topNav && <Sidebar route={route} go={go} collapsed={collapsed} setCollapsed={setCollapsed}/>}
        <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0,overflow:'hidden'}}>
          {!topNav && <Topbar route={route} onSearch={()=>setPalette(true)} theme={theme} toggleTheme={toggleTheme} onMenu={()=>setDrawer(true)} isMobile={isMobile}/>}
          <main style={{flex:1,overflow:'hidden',minHeight:0}}>{screen}</main>
          {isMobile && <BottomNav route={route} go={go} onMore={()=>setDrawer(true)}/>}
        </div>
      </div>
      {isMobile && <MobileDrawer open={drawer} onClose={()=>setDrawer(false)} route={route} go={go} theme={theme} toggleTheme={toggleTheme}/>}
      {isMobile && <FAB onClick={fabAction}/>}
      <CommandPalette open={palette} onClose={()=>setPalette(false)} go={go} openBooking={openBooking} openCustomer={openCustomer}/>
      {help && <ShortcutsHelp onClose={()=>setHelp(false)}/>}

      <TweaksPanel>
        <TweakSection label="Navigation"/>
        <TweakRadio label="Nav layout" value={t.nav} options={['sidebar','top']} onChange={v=>setTweak('nav',v)}/>
        <div style={{fontSize:11,color:'var(--t3)',padding:'2px 2px 8px',lineHeight:1.4}}>“Top” mirrors the original codebase bar — reclaims width for tables &amp; calendar.</div>
        <TweakSection label="Theme"/>
        <TweakColor label="Accent" value={t.accent} options={ACCENTS} onChange={v=>setTweak('accent',v)}/>
        <TweakToggle label="Dark mode" value={t.dark} onChange={v=>setTweak('dark',v)}/>
        <TweakSection label="Density"/>
        <TweakRadio label="Spacing" value={t.density} options={['compact','balanced','comfy']} onChange={v=>setTweak('density',v)}/>
      </TweaksPanel>
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);

function ShortcutsHelp({onClose}){
  const rows=[
    ['1 – 9','Jump to section'],['N','New booking'],['/','Search'],['⌘K','Command palette'],
    ['Drag','Reschedule event (calendar)'],['Swipe','Row actions (mobile)'],['?','Toggle this panel'],['Esc','Close'],
  ];
  return (
    <React.Fragment>
      <div className="scrim" style={{zIndex:90}} onClick={onClose}/>
      <div className="pop" style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:91,width:'min(420px,92vw)',background:'var(--bg)',border:'1px solid var(--bd)',borderRadius:'var(--r-lg)',boxShadow:'var(--shadow-lg)',overflow:'hidden'}}>
        <div className="card-h" style={{borderBottom:'1px solid var(--bd)'}}><h3>Keyboard shortcuts</h3><button className="btn icon sm ghost" onClick={onClose}><Icon n="close" s={16}/></button></div>
        <div style={{padding:'8px 16px 14px'}}>
          {rows.map(([k,d])=>(
            <div key={k} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--bd)'}}>
              <span style={{fontSize:12.5,color:'var(--t2)'}}>{d}</span>
              <span className="kbd">{k}</span>
            </div>
          ))}
        </div>
      </div>
    </React.Fragment>
  );
}
