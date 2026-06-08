// shared.jsx — tokens, shell components, primitives
// Exported to window for use in screens.jsx

// ── New design tokens (warm stone + teal) ──────────────────────
const T = {
  bg:'#FAFAF9', sf:'#FFFFFF', sf2:'#F5F5F4', sf3:'#EFEDEA',
  bd:'#EBE9E6', bd2:'#D1CEC9',
  t1:'#1C1917', t2:'#44403C', t3:'#78716C', t4:'#A8A29E',
  ac:'#0F766E', acSoft:'#F0FDFA', acHover:'#0D5F58',
  ff:'"Inter Tight", ui-sans-serif, sans-serif',
  fm:'"JetBrains Mono", ui-monospace, monospace',
  r: 4,
  st:{
    confirmed:{ bg:'#DCFCE7', fg:'#14532D', dot:'#16A34A', l:'Confirmed' },
    pencil:   { bg:'#FEF3C7', fg:'#78350F', dot:'#D97706', l:'Pencil' },
    quotation:{ bg:'#DBEAFE', fg:'#1E3A8A', dot:'#2563EB', l:'Quotation' },
    enquiry:  { bg:'#E0F2FE', fg:'#075985', dot:'#0284C7', l:'Enquiry' },
    won:      { bg:'#DCFCE7', fg:'#14532D', dot:'#16A34A', l:'Won' },
    lost:     { bg:'#FEE2E2', fg:'#7F1D1D', dot:'#DC2626', l:'Lost' },
  },
};

// ── Codebase tokens (cool zinc + blue) ─────────────────────────
const CB = {
  bg:'#fafafa', sf:'#ffffff', sf2:'#f4f4f5',
  bd:'#e4e4e7', bd2:'#d4d4d8',
  t1:'#18181b', t2:'#3f3f46', t3:'#71717a', t4:'#a1a1aa',
  ac:'#2563eb',
  ff:'"IBM Plex Sans", ui-sans-serif, sans-serif',
  fm:'"IBM Plex Mono", ui-monospace, monospace',
  st:{
    confirmed:'#059669', pencil:'#d97706',
    quotation:'#7c3aed', enquiry:'#71717a',
  },
};

// ── Status badge — new filled style ────────────────────────────
function StatusBadge({ s, small }) {
  const st = T.st[s] || { bg:T.sf2, fg:T.t2, dot:T.t3, l:s };
  const fs = small ? 9.5 : 10.5;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:4,
      background:st.bg, color:st.fg, borderRadius:3,
      padding: small ? '1px 5px' : '2px 7px',
      fontSize:fs, fontFamily:T.fm, fontWeight:600,
      letterSpacing:'0.04em', textTransform:'uppercase', lineHeight:1.5,
      flexShrink:0,
    }}>
      <span style={{width:5,height:5,borderRadius:'50%',background:st.dot,flexShrink:0}}/>
      {st.l}
    </span>
  );
}

// ── Old status badge — codebase border-only style ───────────────
function OldBadge({ s }) {
  const c = CB.st[s] || CB.t3;
  const l = s.charAt(0).toUpperCase()+s.slice(1);
  return (
    <span style={{
      fontFamily:CB.fm, fontSize:9, textTransform:'uppercase',
      letterSpacing:'0.07em', padding:'0 4px', lineHeight:'16px',
      color:c, border:`1px solid ${c}`, whiteSpace:'nowrap',
    }}>{l}</span>
  );
}

// ── Sparkline SVG ───────────────────────────────────────────────
function Sparkline({ data, color, h=22, w=60 }) {
  const max=Math.max(...data), min=Math.min(...data), range=Math.max(max-min,1);
  const pts=data.map((v,i)=>`${(i/(data.length-1))*w},${h-2-((v-min)/range)*(h-4)+2}`).join(' ');
  const area=`0,${h} ${pts} ${w},${h}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{display:'block',overflow:'visible'}}>
      <polygon points={area} fill={color} opacity={0.14}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}

// ── Nav data ────────────────────────────────────────────────────
const MAIN_NAV = [
  { id:'dashboard', l:'Dashboard' },
  { id:'bookings',  l:'Bookings',  badge:42 },
  { id:'calendar',  l:'Calendar' },
  { id:'enquiries', l:'Enquiries', badge:12 },
  { id:'customers', l:'Customers' },
  { id:'payments',  l:'Payments',  badge:3 },
];
const OPS_NAV = [
  { id:'venues',   l:'Venues' },
  { id:'menu',     l:'Menu & Items' },
  { id:'reports',  l:'Reports' },
  { id:'activity', l:'Activity' },
  { id:'settings', l:'Settings' },
];
const CB_NAV = ['Timeline','Bookings','Customers','Enquiries','Venues','Menu','Payments','Reports','Activity','Settings'];

// ── New sidebar nav item ────────────────────────────────────────
function NavItem({ item, active }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:10, padding:'7px 12px',
      fontSize:12.5, fontFamily:T.ff, cursor:'default', userSelect:'none',
      color: active ? T.ac : T.t2,
      background: active ? T.acSoft : 'transparent',
      borderLeft:`2px solid ${active ? T.ac : 'transparent'}`,
    }}>
      <span style={{flex:1, fontWeight:active?500:400}}>{item.l}</span>
      {item.badge != null && (
        <span style={{
          background:active?T.ac:T.sf2, color:active?'#fff':T.t3,
          borderRadius:3, padding:'0 5px', fontSize:10,
          fontFamily:T.fm, fontWeight:600, lineHeight:'16px',
        }}>{item.badge}</span>
      )}
    </div>
  );
}

// ── New Shell (sidebar + topbar) ────────────────────────────────
function Shell({ active='dashboard', page='Dashboard', children }) {
  return (
    <div style={{display:'flex',height:'100%',width:'100%',background:T.bg,fontFamily:T.ff,overflow:'hidden'}}>

      {/* ── Sidebar 220px ── */}
      <aside style={{width:220,flexShrink:0,height:'100%',background:T.sf,borderRight:`1px solid ${T.bd}`,display:'flex',flexDirection:'column'}}>
        {/* brand */}
        <div style={{padding:'14px 12px',borderBottom:`1px solid ${T.bd}`,display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
          <div style={{width:28,height:28,background:T.ac,borderRadius:3,display:'grid',placeItems:'center',color:'#fff',fontWeight:700,fontSize:14,fontFamily:T.fm}}>B</div>
          <span style={{fontWeight:600,fontSize:13,color:T.t1,letterSpacing:'-0.2px'}}>Bika Banquet</span>
        </div>
        {/* nav */}
        <div style={{flex:1,paddingTop:8,overflow:'hidden'}}>
          <div style={{padding:'4px 12px 4px',fontSize:9.5,fontFamily:T.fm,color:T.t4,letterSpacing:'0.09em',textTransform:'uppercase'}}>Operate</div>
          {MAIN_NAV.map(it=><NavItem key={it.id} item={it} active={it.id===active}/>)}
          <div style={{padding:'10px 12px 4px',fontSize:9.5,fontFamily:T.fm,color:T.t4,letterSpacing:'0.09em',textTransform:'uppercase'}}>Catalog</div>
          {OPS_NAV.map(it=><NavItem key={it.id} item={it} active={it.id===active}/>)}
        </div>
        {/* user footer */}
        <div style={{padding:'10px 12px',borderTop:`1px solid ${T.bd}`,display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
          <div style={{width:28,height:28,borderRadius:'50%',background:T.ac,display:'grid',placeItems:'center',color:'#fff',fontSize:10,fontWeight:600,fontFamily:T.fm,flexShrink:0}}>PN</div>
          <div style={{overflow:'hidden'}}>
            <div style={{fontSize:12,fontWeight:500,color:T.t1,whiteSpace:'nowrap'}}>Priya Nambiar</div>
            <div style={{fontSize:10,color:T.t3,whiteSpace:'nowrap'}}>Operations Lead · Andheri</div>
          </div>
        </div>
      </aside>

      {/* ── Main column ── */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>
        {/* topbar */}
        <header style={{height:48,flexShrink:0,background:T.sf,borderBottom:`1px solid ${T.bd}`,display:'flex',alignItems:'center',padding:'0 16px',gap:10}}>
          <div style={{width:28,height:28,display:'grid',placeItems:'center',border:`1px solid ${T.bd}`,borderRadius:4,fontSize:14,color:T.t3,cursor:'default',flexShrink:0}}>≡</div>
          <div style={{display:'flex',alignItems:'center',gap:4,fontSize:12,fontFamily:T.ff,flexShrink:0}}>
            <span style={{color:T.t3}}>Bika Banquets</span>
            <span style={{color:T.t4,margin:'0 1px'}}>/</span>
            <span style={{color:T.t1,fontWeight:500}}>{page}</span>
          </div>
          <div style={{flex:1,maxWidth:320,margin:'0 auto',height:30,background:T.sf2,border:`1px solid ${T.bd}`,borderRadius:4,display:'flex',alignItems:'center',padding:'0 10px',gap:6,color:T.t3,fontSize:11.5}}>
            <span>⌕</span>
            <span style={{flex:1}}>Search bookings, customers, halls…</span>
            <span style={{fontFamily:T.fm,fontSize:10,background:T.sf,border:`1px solid ${T.bd}`,borderRadius:2,padding:'1px 5px'}}>⌘K</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:'#16A34A',fontFamily:T.fm,flexShrink:0}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:'#16A34A',display:'inline-block'}}/>
            Live
          </div>
          <div style={{lineHeight:1.3,textAlign:'right',flexShrink:0}}>
            <div style={{fontFamily:T.fm,fontSize:10,color:T.t2}}>14:32:09</div>
            <div style={{fontSize:9,color:T.t4,textTransform:'uppercase',letterSpacing:'0.06em'}}>Mumbai</div>
          </div>
          <div style={{width:28,height:28,display:'grid',placeItems:'center',border:`1px solid ${T.bd}`,borderRadius:4,fontSize:13,color:T.t2,cursor:'default',flexShrink:0}}>☾</div>
          <div style={{width:28,height:28,borderRadius:'50%',background:T.ac,display:'grid',placeItems:'center',color:'#fff',fontSize:10,fontWeight:600,fontFamily:T.fm,flexShrink:0}}>PN</div>
        </header>
        <div style={{flex:1,overflow:'hidden'}}>{children}</div>
      </div>
    </div>
  );
}

// ── Old Codebase Shell (top-nav, zinc) ──────────────────────────
function BeforeShell({ active='Timeline', children }) {
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',background:CB.bg,fontFamily:CB.ff,overflow:'hidden'}}>
      <header style={{height:44,flexShrink:0,background:CB.bg,borderBottom:`1px solid ${CB.bd}`,display:'flex',alignItems:'center',padding:'0 12px',gap:16}}>
        <div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
          <div style={{width:12,height:12,background:CB.ac}}/>
          <span style={{fontFamily:CB.fm,fontWeight:500,fontSize:11,color:CB.t1}}>BIKA_OPS</span>
          <span style={{fontFamily:CB.fm,fontSize:10,color:CB.t4}}>v2.4</span>
        </div>
        <nav style={{display:'flex',alignItems:'center',flex:1,overflow:'hidden'}}>
          {CB_NAV.map(item=>(
            <div key={item} style={{
              padding:'0 9px',height:44,display:'flex',alignItems:'center',
              fontSize:11,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em',
              color:item===active?CB.t1:CB.t3, whiteSpace:'nowrap', cursor:'default',
              borderBottom:`2px solid ${item===active?CB.ac:'transparent'}`,
            }}>{item}</div>
          ))}
        </nav>
        <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
          <div style={{height:28,padding:'0 8px',background:CB.sf,border:`1px solid ${CB.bd}`,display:'flex',alignItems:'center',gap:8,color:CB.t3,fontSize:11,minWidth:160}}>
            <span>Jump to…</span>
            <span style={{marginLeft:'auto',fontFamily:CB.fm,fontSize:10,border:`1px solid ${CB.bd}`,padding:'0 4px'}}>⌘K</span>
          </div>
          <div style={{lineHeight:1.3,textAlign:'right'}}>
            <div style={{fontFamily:CB.fm,fontSize:10,color:CB.t2}}>14:32:09</div>
            <div style={{fontSize:9,color:CB.t4,textTransform:'uppercase',letterSpacing:'0.06em'}}>Mumbai</div>
          </div>
          <div style={{width:28,height:28,display:'grid',placeItems:'center',border:`1px solid ${CB.bd}`,fontSize:13,color:CB.t3,cursor:'default'}}>☾</div>
          <div style={{width:28,height:28,background:CB.sf2,border:`1px solid ${CB.bd}`,display:'grid',placeItems:'center',fontFamily:CB.fm,fontSize:10,color:CB.t2}}>SI</div>
        </div>
      </header>
      <div style={{flex:1,overflow:'hidden'}}>{children}</div>
    </div>
  );
}

// ── export to window ────────────────────────────────────────────
Object.assign(window, {
  T, CB,
  StatusBadge, OldBadge, Sparkline,
  NavItem, Shell, BeforeShell,
  MAIN_NAV, OPS_NAV, CB_NAV,
});
