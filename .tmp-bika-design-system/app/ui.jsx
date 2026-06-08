// ui.jsx — design tokens (CSS vars), global styles, responsive hook, primitives
const { useState, useEffect, useRef, useCallback, createContext, useContext } = React;

// ── Global stylesheet (warm stone + teal, Inter Tight) ──────────
const GLOBAL_CSS = `
:root{
  --bg:#FAFAF9; --sf:#FFFFFF; --sf2:#F5F5F4; --sf3:#EFEDEA;
  --bd:#EBE9E6; --bd2:#D6D3CE;
  --t1:#1C1917; --t2:#44403C; --t3:#78716C; --t4:#A8A29E;
  --ac:#0F766E; --ac-h:#0D5F58; --ac-soft:#F0FDFA; --ac-bd:#99F6E4;
  --green:#16A34A; --green-bg:#DCFCE7; --green-fg:#14532D;
  --amber:#D97706; --amber-bg:#FEF3C7; --amber-fg:#78350F;
  --blue:#2563EB;  --blue-bg:#DBEAFE;  --blue-fg:#1E3A8A;
  --sky:#0284C7;   --sky-bg:#E0F2FE;   --sky-fg:#075985;
  --red:#DC2626;   --red-bg:#FEE2E2;   --red-fg:#7F1D1D;
  --r:6px; --r-sm:4px; --r-lg:10px;
  --ff:"Inter Tight",ui-sans-serif,system-ui,sans-serif;
  --fm:"JetBrains Mono",ui-monospace,monospace;
  --shadow:0 1px 2px rgba(28,25,23,.04),0 2px 8px rgba(28,25,23,.04);
  --shadow-lg:0 8px 28px rgba(28,25,23,.14),0 2px 8px rgba(28,25,23,.08);
  --ease:cubic-bezier(.32,.72,0,1); --ease-out:cubic-bezier(.16,1,.3,1);
}
[data-theme="dark"]{
  --bg:#0C0A09; --sf:#1C1917; --sf2:#262321; --sf3:#2E2A27;
  --bd:#2E2A27; --bd2:#44403C;
  --t1:#FAFAF9; --t2:#D6D3CE; --t3:#A8A29E; --t4:#78716C;
  --ac:#2DD4BF; --ac-h:#5EEAD4; --ac-soft:#0F2E2A; --ac-bd:#155E56;
  --green-bg:#0F2E1A; --green-fg:#86EFAC;
  --amber-bg:#3A2A0A; --amber-fg:#FCD34D;
  --blue-bg:#13284D; --blue-fg:#93C5FD;
  --sky-bg:#0A2A3D; --sky-fg:#7DD3FC;
  --red-bg:#3A1212; --red-fg:#FCA5A5;
  --shadow:0 1px 2px rgba(0,0,0,.3); --shadow-lg:0 8px 28px rgba(0,0,0,.5);
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body,#root{height:100%;width:100%}
body{font-family:var(--ff);background:var(--bg);color:var(--t1);font-size:13px;line-height:1.5;-webkit-font-smoothing:antialiased;overflow:hidden}
button{font-family:inherit;cursor:pointer}
input,select,textarea{font-family:inherit}
::-webkit-scrollbar{width:10px;height:10px}
::-webkit-scrollbar-thumb{background:var(--bd2);border-radius:6px;border:2px solid var(--bg)}
::-webkit-scrollbar-track{background:transparent}

/* status badge */
.badge{display:inline-flex;align-items:center;gap:4px;border-radius:3px;padding:2px 7px;font-size:10.5px;font-family:var(--fm);font-weight:600;letter-spacing:.04em;text-transform:uppercase;line-height:1.5;white-space:nowrap;flex-shrink:0}
.badge .dot{width:5px;height:5px;border-radius:50%;flex-shrink:0}
.badge.sm{font-size:9.5px;padding:1px 5px}
.badge.confirmed{background:var(--green-bg);color:var(--green-fg)} .badge.confirmed .dot{background:var(--green)}
.badge.pencil{background:var(--amber-bg);color:var(--amber-fg)} .badge.pencil .dot{background:var(--amber)}
.badge.quotation{background:var(--blue-bg);color:var(--blue-fg)} .badge.quotation .dot{background:var(--blue)}
.badge.enquiry{background:var(--sky-bg);color:var(--sky-fg)} .badge.enquiry .dot{background:var(--sky)}
.badge.won{background:var(--green-bg);color:var(--green-fg)} .badge.won .dot{background:var(--green)}
.badge.lost{background:var(--red-bg);color:var(--red-fg)} .badge.lost .dot{background:var(--red)}
.badge.cancelled{background:var(--red-bg);color:var(--red-fg)} .badge.cancelled .dot{background:var(--red)}
.badge.lead{background:var(--sf2);color:var(--t3)} .badge.lead .dot{background:var(--t4)}
.badge.vip{background:var(--amber-bg);color:var(--amber-fg)} .badge.vip .dot{background:var(--amber)}
.badge.high{background:var(--blue-bg);color:var(--blue-fg)} .badge.high .dot{background:var(--blue)}
.badge.normal{background:var(--sf2);color:var(--t3)} .badge.normal .dot{background:var(--t4)}

/* buttons */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:34px;padding:0 14px;border-radius:var(--r-sm);font-size:12.5px;font-weight:500;border:1px solid var(--bd);background:var(--sf);color:var(--t2);transition:background .12s,border-color .12s;white-space:nowrap}
.btn:hover{background:var(--sf2);border-color:var(--bd2)}
.btn.primary{background:var(--ac);border-color:var(--ac);color:#fff}
.btn.primary:hover{background:var(--ac-h);border-color:var(--ac-h)}
.btn.ghost{border-color:transparent;background:transparent}
.btn.ghost:hover{background:var(--sf2)}
.btn.danger{color:var(--red);border-color:var(--bd)}
.btn.danger:hover{background:var(--red-bg);border-color:var(--red)}
.btn.sm{height:28px;padding:0 10px;font-size:11.5px}
.btn.icon{width:34px;padding:0}
.btn.icon.sm{width:28px}

/* inputs */
.field{display:flex;flex-direction:column;gap:5px}
.field label{font-size:10.5px;font-family:var(--fm);text-transform:uppercase;letter-spacing:.06em;color:var(--t3)}
.input,.select,.textarea{height:34px;padding:0 10px;border:1px solid var(--bd);border-radius:var(--r-sm);background:var(--sf);color:var(--t1);font-size:12.5px;width:100%;transition:border-color .12s,box-shadow .12s}
.textarea{height:auto;padding:8px 10px;resize:vertical;min-height:64px;line-height:1.5}
.input:focus,.select:focus,.textarea:focus{outline:none;border-color:var(--ac);box-shadow:0 0 0 3px var(--ac-soft)}
.input::placeholder,.textarea::placeholder{color:var(--t4)}

/* card */
.card{background:var(--sf);border:1px solid var(--bd);border-radius:var(--r);box-shadow:var(--shadow)}
.card-h{padding:11px 16px;border-bottom:1px solid var(--bd);display:flex;align-items:center;justify-content:space-between;gap:10px}
.card-h h3{font-size:13px;font-weight:600;color:var(--t1);white-space:nowrap}
.card-h>span,.card-h>button{flex-shrink:0;white-space:nowrap}

/* tables */
.tbl{width:100%;border-collapse:collapse}
.tbl th{text-align:left;padding:9px 14px;font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--t3);font-family:var(--fm);font-weight:400;border-bottom:1px solid var(--bd);background:var(--sf2);white-space:nowrap;position:sticky;top:0;z-index:2}
.tbl td{padding:10px 14px;border-bottom:1px solid var(--bd);font-size:12.5px;color:var(--t2);vertical-align:middle}
.tbl tbody tr{cursor:pointer;transition:background .1s}
.tbl tbody tr:hover{background:var(--sf2)}
.tbl tbody tr.sel{background:var(--ac-soft)}
.tbl .num{font-family:var(--fm);text-align:right;white-space:nowrap}
.tbl .mono{font-family:var(--fm)}

/* sectioned label */
.eyebrow{font-size:10px;font-family:var(--fm);text-transform:uppercase;letter-spacing:.08em;color:var(--t4)}

/* page header */
.page-h{padding:11px 20px;border-bottom:1px solid var(--bd);display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;background:var(--sf)}
.page-h h1{font-size:15px;font-weight:600;letter-spacing:-.2px;color:var(--t1)}
.page-h .sub{font-size:11.5px;color:var(--t3);margin-top:1px}

/* segmented control */
.seg{display:inline-flex;border:1px solid var(--bd);border-radius:var(--r-sm);overflow:hidden;background:var(--sf)}
.seg button{height:30px;padding:0 12px;font-size:11.5px;border:none;background:transparent;color:var(--t3);border-right:1px solid var(--bd)}
.seg button:last-child{border-right:none}
.seg button.on{background:var(--ac);color:#fff;font-weight:500}

/* chips */
.chip{height:26px;padding:0 9px;border-radius:999px;border:1px solid var(--bd);background:var(--sf);color:var(--t3);font-size:11px;display:inline-flex;align-items:center;gap:5px;white-space:nowrap}
.chip.on{background:var(--ac-soft);border-color:var(--ac-bd);color:var(--ac)}

/* sheet/modal */
.scrim{position:fixed;inset:0;background:rgba(28,25,23,.32);z-index:60;animation:fade .15s ease}
[data-theme="dark"] .scrim{background:rgba(0,0,0,.55)}
@keyframes fade{from{opacity:0}to{opacity:1}}
@keyframes slideR{from{transform:translateX(100%)}to{transform:translateX(0)}}
@keyframes slideU{from{transform:translateY(100%)}to{transform:translateY(0)}}
.sheet{position:fixed;top:0;right:0;bottom:0;width:min(480px,100vw);background:var(--bg);z-index:61;box-shadow:var(--shadow-lg);display:flex;flex-direction:column;animation:slideR .22s cubic-bezier(.32,.72,0,1)}

/* utility */
.prog{height:4px;background:var(--sf2);border-radius:3px;overflow:hidden}
.prog>span{display:block;height:100%;border-radius:3px}
.hatch{background-image:repeating-linear-gradient(45deg,rgba(217,119,6,.22) 0 6px,transparent 6px 12px)}
@keyframes pulseC{0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.0)}50%{box-shadow:0 0 0 3px rgba(220,38,38,.35)}}
.conflict{animation:pulseC 1.8s ease-in-out infinite;outline:2px solid var(--red);outline-offset:-2px}
.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}

/* density */
[data-density="compact"] .tbl td{padding:5px 14px}
[data-density="compact"] .tbl th{padding:5px 14px}
[data-density="compact"] .page-h{padding-top:8px;padding-bottom:8px}
[data-density="compact"] .card-h{padding:7px 16px}
[data-density="compact"] .btn{height:30px}
[data-density="comfy"] .tbl td{padding:14px 16px}
[data-density="comfy"] .tbl th{padding:12px 16px}
[data-density="comfy"] .page-h{padding-top:22px;padding-bottom:22px}
[data-density="comfy"] .card-h{padding:15px 18px}
[data-density="comfy"] .btn{height:38px}

/* ── motion system ─────────────────────────────────────────── */
.num,.mono,.tnum{font-variant-numeric:tabular-nums}
.btn,.chip,.seg button{transition:background .14s,border-color .14s,color .14s,transform .08s}
.btn:active{transform:scale(.97)}
.card{transition:box-shadow .16s var(--ease-out),border-color .16s,transform .16s var(--ease-out)}
.lift{transition:transform .15s var(--ease-out),box-shadow .15s var(--ease-out),border-color .15s}
@media(prefers-reduced-motion:no-preference){
  .lift:hover{transform:translateY(-2px);box-shadow:var(--shadow-lg);border-color:var(--bd2)}
  .route{animation:routeIn .34s var(--ease-out)}
  @keyframes routeIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
  .stagger>*{animation:rowIn .4s var(--ease-out) backwards}
  @keyframes rowIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
  .stagger>*:nth-child(1){animation-delay:.02s}.stagger>*:nth-child(2){animation-delay:.05s}
  .stagger>*:nth-child(3){animation-delay:.08s}.stagger>*:nth-child(4){animation-delay:.11s}
  .stagger>*:nth-child(5){animation-delay:.14s}.stagger>*:nth-child(6){animation-delay:.17s}
  .stagger>*:nth-child(7){animation-delay:.2s}.stagger>*:nth-child(8){animation-delay:.23s}
  .stagger>*:nth-child(9){animation-delay:.26s}.stagger>*:nth-child(10){animation-delay:.29s}
  .stagger>*:nth-child(n+11){animation-delay:.31s}
  .pop{animation:pop .2s var(--ease-out)}
  @keyframes pop{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:none}}
}

/* ── toolbar (unified header band) ─────────────────────────── */
.toolbar{display:flex;align-items:center;gap:12px;padding:0 16px;height:46px;border-bottom:1px solid var(--bd);background:var(--sf);flex-shrink:0}
.toolbar .tb-title{font-size:13px;font-weight:600;letter-spacing:-.1px;color:var(--t1);white-space:nowrap;flex-shrink:0}
.toolbar .tb-stats{display:flex;align-items:stretch;gap:0;flex:1;min-width:0;overflow-x:auto;scrollbar-width:none}
.toolbar .tb-stats::-webkit-scrollbar{display:none}
.toolbar .tb-actions{display:flex;align-items:center;gap:7px;flex-shrink:0;margin-left:auto}
[data-density="compact"] .toolbar{height:42px}
[data-density="comfy"] .toolbar{height:54px}
.statpill{display:flex;flex-direction:column;justify-content:center;padding:0 14px;border-left:1px solid var(--bd);min-width:0;cursor:default;transition:background .12s}
.statpill:first-child{border-left:none}
.statpill.click{cursor:pointer}
.statpill.click:hover{background:var(--sf2)}
.statpill .sp-l{font-size:9px;font-family:var(--fm);text-transform:uppercase;letter-spacing:.06em;color:var(--t4);white-space:nowrap;line-height:1.3}
.statpill .sp-v{font-size:14px;font-weight:700;letter-spacing:-.3px;font-variant-numeric:tabular-nums;line-height:1.15;white-space:nowrap}
@media(max-width:860px){
  .toolbar{height:auto;flex-wrap:wrap;padding:8px 12px;gap:8px}
  .toolbar .tb-stats{order:3;width:100%;border-top:1px solid var(--bd);padding-top:7px}
  .statpill{padding:0 12px 0 0;border-left:none}
  .statpill .sp-v{font-size:15px}
}

/* ── money ─────────────────────────────────────────────────── */
.money{font-family:var(--fm);font-variant-numeric:tabular-nums;font-weight:600;white-space:nowrap}
.money.owed{color:var(--red)} .money.clear{color:var(--green)} .money.muted{color:var(--t3)}

/* ── inline edit ───────────────────────────────────────────── */
.iedit{cursor:text;border-radius:3px;padding:1px 4px;margin:-1px -4px;transition:background .12s,box-shadow .12s;display:inline-flex;align-items:center;gap:4px}
.iedit:hover{background:var(--ac-soft);box-shadow:inset 0 0 0 1px var(--ac-bd)}
.iedit-input{font-family:inherit;font-size:inherit;font-weight:inherit;color:var(--t1);border:none;background:var(--sf);outline:2px solid var(--ac);border-radius:3px;padding:1px 4px;margin:-1px -4px;width:auto;min-width:40px}

/* ── toast ─────────────────────────────────────────────────── */
#__toasts{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);z-index:200;display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none}
@media(max-width:860px){#__toasts{bottom:74px}}
.toast{pointer-events:auto;display:flex;align-items:center;gap:10px;background:var(--t1);color:var(--bg);padding:10px 14px;border-radius:8px;font-size:12.5px;box-shadow:var(--shadow-lg);animation:toastIn .26s var(--ease-out);max-width:90vw}
.toast .ta{color:var(--ac);font-weight:600;cursor:pointer;font-size:12px;background:none;border:none;padding:0;white-space:nowrap}
@keyframes toastIn{from{opacity:0;transform:translateY(10px) scale(.96)}to{opacity:1;transform:none}}
.toast.out{animation:toastOut .2s var(--ease) forwards}
@keyframes toastOut{to{opacity:0;transform:translateY(8px) scale(.97)}}

/* ── FAB ───────────────────────────────────────────────────── */
.fab{position:fixed;right:16px;bottom:74px;z-index:50;width:54px;height:54px;border-radius:50%;background:var(--ac);color:#fff;border:none;box-shadow:0 6px 20px rgba(15,118,110,.4);display:grid;place-items:center;transition:transform .16s var(--ease-out)}
.fab:active{transform:scale(.92)}

/* ── swipe row (mobile) ────────────────────────────────────── */
.swipe-wrap{position:relative;overflow:hidden}
.swipe-actions{position:absolute;top:0;right:0;bottom:0;display:flex;align-items:stretch}
.swipe-actions button{border:none;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;width:74px;font-size:10px;font-weight:600}
.swipe-fg{position:relative;background:var(--sf);transition:transform .24s var(--ease-out);will-change:transform;touch-action:pan-y}

/* ── triage / action queue ─────────────────────────────────── */
.triage-item{display:flex;align-items:center;gap:12px;padding:11px 14px;border-bottom:1px solid var(--bd);transition:background .12s;cursor:pointer}
.triage-item:hover{background:var(--sf2)}
.triage-rail{width:3px;align-self:stretch;border-radius:2px;flex-shrink:0}
.kbd{font-family:var(--fm);font-size:10px;background:var(--sf2);border:1px solid var(--bd);border-bottom-width:2px;border-radius:4px;padding:1px 5px;color:var(--t3);line-height:1.5;white-space:nowrap}

/* segmented active slide */
.seg button{transition:background .16s var(--ease),color .16s}

/* responsive helpers */
.only-desktop{display:revert}
.only-mobile{display:none}
@media(max-width:860px){
  .only-desktop{display:none!important}
  .only-mobile{display:revert}
  .page-h{padding:14px 16px}
  .page-h h1{font-size:17px}
}
`;

function GlobalStyles(){
  useEffect(()=>{
    if(!document.getElementById('__bika_fonts')){
      const l=document.createElement('link'); l.id='__bika_fonts'; l.rel='stylesheet';
      l.href='https://fonts.googleapis.com/css2?family=Inter+Tight:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500&display=swap';
      document.head.appendChild(l);
    }
  },[]);
  return <style>{GLOBAL_CSS}</style>;
}

// ── responsive hook ─────────────────────────────────────────────
function useMedia(q='(max-width:860px)'){
  const force = (typeof window!=='undefined') && new URLSearchParams(location.search).get('force');
  const [m,setM]=useState(()=>typeof window!=='undefined' && window.matchMedia(q).matches);
  useEffect(()=>{
    const mq=window.matchMedia(q);
    const fn=e=>setM(e.matches);
    mq.addEventListener('change',fn); setM(mq.matches);
    return ()=>mq.removeEventListener('change',fn);
  },[q]);
  if(force==='mobile') return true;
  if(force==='desktop') return false;
  return m;
}

// ── theme ───────────────────────────────────────────────────────
function useTheme(){
  const [theme,setTheme]=useState(()=>localStorage.getItem('bika-theme')||'light');
  useEffect(()=>{ document.documentElement.setAttribute('data-theme',theme); localStorage.setItem('bika-theme',theme); },[theme]);
  return [theme,()=>setTheme(t=>t==='light'?'dark':'light')];
}

// ── primitives ──────────────────────────────────────────────────
function Badge({s,sm,label}){
  const labels={confirmed:'Confirmed',pencil:'Pencil',quotation:'Quotation',enquiry:'Enquiry',won:'Won',lost:'Lost',cancelled:'Cancelled',lead:'Lead',vip:'VIP',high:'High',normal:'Normal'};
  return <span className={`badge ${s}${sm?' sm':''}`}><span className="dot"/>{label||labels[s]||s}</span>;
}

function Sparkline({data,color='var(--ac)',h=30,w=64}){
  const max=Math.max(...data),min=Math.min(...data),rng=Math.max(max-min,1e-6);
  const pts=data.map((v,i)=>`${(i/(data.length-1))*w},${h-2-((v-min)/rng)*(h-5)}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{display:'block',overflow:'visible'}}>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={color} opacity={.12}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}

function Progress({pct,color}){
  const c=color||(pct>=100?'var(--green)':'var(--ac)');
  return <div className="prog"><span style={{width:`${Math.min(100,pct)}%`,background:c}}/></div>;
}

// Sheet / drawer — slides from right (desktop) or bottom (mobile)
function Sheet({open,onClose,children,width,mobileFull}){
  const isMobile=useMedia();
  useEffect(()=>{
    if(!open) return;
    const h=e=>e.key==='Escape'&&onClose();
    window.addEventListener('keydown',h); return ()=>window.removeEventListener('keydown',h);
  },[open,onClose]);
  if(!open) return null;
  const style=isMobile
    ? {top:mobileFull?0:'auto',right:0,left:0,bottom:0,width:'100vw',height:mobileFull?'100%':'92%',animation:'slideU .24s cubic-bezier(.32,.72,0,1)',borderRadius:mobileFull?0:'var(--r-lg) var(--r-lg) 0 0'}
    : {width:width||'min(480px,100vw)'};
  return (
    <React.Fragment>
      <div className="scrim" onClick={onClose}/>
      <div className="sheet" style={style}>{children}</div>
    </React.Fragment>
  );
}

function Icon({n,s=16,c='currentColor',sw=1.6}){
  const P={
    dashboard:'M3 3h7v7H3zM14 3h7v4h-7zM14 10h7v11h-7zM3 14h7v7H3z',
    bookings:'M4 4h16v16H4zM4 9h16M9 4v16',
    calendar:'M3 5h18v16H3zM3 9h18M8 3v4M16 3v4',
    enquiries:'M4 5h16v10H8l-4 4z',
    customers:'M9 11a3 3 0 100-6 3 3 0 000 6zM3 20a6 6 0 0112 0M16 7a3 3 0 110 6M21 20a5 5 0 00-7-4.5',
    payments:'M3 6h18v12H3zM3 10h18M7 15h3',
    venues:'M3 21V8l9-5 9 5v13M9 21v-6h6v6',
    menu:'M4 4h16v16H4zM4 9h16M9 4v16',
    reports:'M4 20V10M10 20V4M16 20v-7M22 20H2',
    activity:'M22 12h-4l-3 8-6-16-3 8H2',
    settings:'M12 9a3 3 0 100 6 3 3 0 000-6zM19 12a7 7 0 00-.1-1l2-1.5-2-3.5-2.4 1a7 7 0 00-1.7-1l-.4-2.5h-4l-.4 2.5a7 7 0 00-1.7 1l-2.4-1-2 3.5L4.1 11a7 7 0 000 2l-2 1.5 2 3.5 2.4-1a7 7 0 001.7 1l.4 2.5h4l.4-2.5a7 7 0 001.7-1l2.4 1 2-3.5-2-1.5a7 7 0 00.1-1z',
    search:'M11 11m-7 0a7 7 0 1014 0 7 7 0 10-14 0M21 21l-5-5',
    plus:'M12 5v14M5 12h14', close:'M6 6l12 12M18 6L6 18',
    chevR:'M9 6l6 6-6 6', chevL:'M15 6l-6 6 6 6', chevD:'M6 9l6 6 6-6',
    sun:'M12 7a5 5 0 100 10 5 5 0 000-10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
    moon:'M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z',
    menu2:'M3 6h18M3 12h18M3 18h18', back:'M19 12H5M12 19l-7-7 7-7',
    more:'M5 12h.01M12 12h.01M19 12h.01', bell:'M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0',
    check:'M20 6L9 17l-5-5', clock:'M12 7v5l3 2M12 3a9 9 0 100 18 9 9 0 000-18z',
    phone:'M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.6A2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.2a2 2 0 012.1-.5c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z',
    mail:'M3 5h18v14H3zM3 6l9 7 9-7', edit:'M11 4H4v16h16v-7M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4z',
    print:'M6 9V2h12v7M6 18H4v-7h16v7h-2M8 14h8v8H8z', download:'M12 3v12M7 10l5 5 5-5M5 21h14',
    filter:'M3 4h18l-7 8v6l-4 2v-8z', star:'M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z',
    grip:'M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01', logout:'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  };
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d={P[n]||''}/></svg>;
}

// ── Toolbar (unified header: title + stats + actions) ───────────
function Toolbar({title,stats,actions,children}){
  return (
    <div className="toolbar">
      {title && <span className="tb-title">{title}</span>}
      {stats && <div className="tb-stats">{stats.map((s,i)=>(
        <div key={i} className={`statpill${s.onClick?' click':''}`} onClick={s.onClick} title={s.title}>
          <span className="sp-l">{s.label}</span>
          <span className="sp-v" style={{color:s.color||'var(--t1)'}}>{s.value}</span>
        </div>
      ))}</div>}
      {children}
      {actions && <div className="tb-actions">{actions}</div>}
    </div>
  );
}

// ── Money (tabular, color-coded) ────────────────────────────────
function Money({v,kind='neutral',full,abbr}){
  const cls=kind==='owed'?'owed':kind==='clear'?'clear':kind==='muted'?'muted':'';
  const txt=abbr?inr(v):(full?inrFull(v):inr(v));
  return <span className={`money ${cls}`}>{txt}</span>;
}

// ── CountUp (animated number) ───────────────────────────────────
function CountUp({value,format=(n)=>Math.round(n).toLocaleString('en-IN'),dur=620}){
  const [v,setV]=useState(value);
  const ref=useRef(value);
  useEffect(()=>{
    let raf,start; const from=ref.current,to=value;
    if(from===to) return;
    const reduce=window.matchMedia('(prefers-reduced-motion:reduce)').matches || typeof requestAnimationFrame!=='function';
    if(reduce){ setV(to); ref.current=to; return; }
    // guaranteed landing even if rAF is throttled/never fires (e.g. background tab)
    const fb=setTimeout(()=>{ setV(to); ref.current=to; if(raf)cancelAnimationFrame(raf); },dur+80);
    const step=(t)=>{ if(!start)start=t; const p=Math.min(1,(t-start)/dur); const e=1-Math.pow(1-p,3); const cur=from+(to-from)*e; setV(cur); ref.current=cur; if(p<1)raf=requestAnimationFrame(step); else { ref.current=to; clearTimeout(fb); } };
    raf=requestAnimationFrame(step);
    return ()=>{ if(raf)cancelAnimationFrame(raf); clearTimeout(fb); };
  },[value]);
  return <span style={{fontVariantNumeric:'tabular-nums'}}>{format(v)}</span>;
}

// ── InlineEdit (click-to-edit cell) ─────────────────────────────
function InlineEdit({value,onCommit,type='text',prefix='',format,width}){
  const [editing,setEditing]=useState(false);
  const [val,setVal]=useState(value);
  const inputRef=useRef(null);
  useEffect(()=>{ if(editing&&inputRef.current){ inputRef.current.focus(); inputRef.current.select(); } },[editing]);
  useEffect(()=>{ setVal(value); },[value]);
  const commit=()=>{ setEditing(false); if(val!==value){ onCommit&&onCommit(val); } };
  if(editing) return <input ref={inputRef} className="iedit-input" type={type} value={val} style={{width:width||70}}
    onChange={e=>setVal(type==='number'?e.target.value:e.target.value)}
    onBlur={commit} onKeyDown={e=>{ if(e.key==='Enter')commit(); if(e.key==='Escape'){ setVal(value); setEditing(false); } }} onClick={e=>e.stopPropagation()}/>;
  return <span className="iedit" onClick={e=>{ e.stopPropagation(); setEditing(true); }} title="Click to edit">{prefix}{format?format(value):value}<Icon n="edit" s={10} c="var(--t4)"/></span>;
}

// ── FAB ─────────────────────────────────────────────────────────
function FAB({onClick,icon='plus'}){ return <button className="fab" onClick={onClick} aria-label="Quick add"><Icon n={icon} s={24} c="#fff" sw={2}/></button>; }

// ── SwipeRow (mobile swipe-to-reveal actions) ───────────────────
function SwipeRow({children,actions}){
  const [x,setX]=useState(0);
  const start=useRef(null);
  const W=actions.reduce((s,a)=>s+74,0);
  const onDown=e=>{ start.current={x:e.clientX,base:x}; };
  const onMove=e=>{ if(start.current==null)return; const dx=e.clientX-start.current.x; let nx=start.current.base+dx; nx=Math.max(-W,Math.min(0,nx)); setX(nx); };
  const onUp=()=>{ if(start.current==null)return; setX(x< -W/2 ? -W : 0); start.current=null; };
  return (
    <div className="swipe-wrap">
      <div className="swipe-actions">{actions.map((a,i)=>(<button key={i} style={{background:a.color}} onClick={()=>{ a.onClick(); setX(0); }}><Icon n={a.icon} s={16} c="#fff"/>{a.label}</button>))}</div>
      <div className="swipe-fg" style={{transform:`translateX(${x}px)`}}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        {children}
      </div>
    </div>
  );
}

// ── toast (vanilla, callable from anywhere) ─────────────────────
function toast(message,opts={}){
  let host=document.getElementById('__toasts');
  if(!host){ host=document.createElement('div'); host.id='__toasts'; document.body.appendChild(host); }
  const el=document.createElement('div'); el.className='toast';
  const ic=opts.icon||'check';
  el.innerHTML=`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${opts.iconColor||'#16A34A'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${({check:'M20 6L9 17l-5-5',bell:'M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9',clock:'M12 7v5l3 2M12 3a9 9 0 100 18 9 9 0 000-18z'})[ic]||'M20 6L9 17l-5-5'}"/></svg>`;
  const span=document.createElement('span'); span.textContent=message; el.appendChild(span);
  if(opts.action){ const b=document.createElement('button'); b.className='ta'; b.textContent=opts.action; b.onclick=()=>{ opts.onAction&&opts.onAction(); dismiss(); }; el.appendChild(b); }
  host.appendChild(el);
  const dismiss=()=>{ el.classList.add('out'); setTimeout(()=>el.remove(),200); };
  setTimeout(dismiss,opts.dur||2600);
}

// ── keyboard shortcuts hook ─────────────────────────────────────
function useKeys(map,deps=[]){
  useEffect(()=>{
    const h=e=>{
      const tag=(e.target.tagName||'').toLowerCase();
      if(tag==='input'||tag==='textarea'||tag==='select'||e.target.isContentEditable) return;
      if(e.metaKey||e.ctrlKey||e.altKey) return;
      const fn=map[e.key];
      if(fn){ e.preventDefault(); fn(e); }
    };
    window.addEventListener('keydown',h); return ()=>window.removeEventListener('keydown',h);
  },deps);
}

Object.assign(window,{ GlobalStyles, useMedia, useTheme, Badge, Sparkline, Progress, Sheet, Icon, Toolbar, Money, CountUp, InlineEdit, FAB, SwipeRow, toast, useKeys });
