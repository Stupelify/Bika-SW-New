'use client';

import React, { useMemo, useState } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────

const SH = 8, EH = 23, TOTAL_MIN = (EH - SH) * 60;
const SH_MIN = SH * 60, EH_MIN = EH * 60;
const HOURS = Array.from({ length: EH - SH + 1 }, (_, i) => SH + i);

const D_SW = 188;   // desktop sidebar width
const M_SW = 72;    // mobile sidebar width
const D_RH = 48;    // desktop day/week row height
const D_MRH = 58;   // desktop month row height (taller for pills)
const M_RH = 40;    // mobile row height
const D_MCW = 38;   // desktop month cell min-width

// ─── Palette ──────────────────────────────────────────────────────────────────

const PALETTE = [
  { solid: '#0d9488', soft: 'rgba(13,148,136,0.13)',  text: '#115e59', border: '#14b8a6', heat: 'rgba(13,148,136,' },
  { solid: '#4f46e5', soft: 'rgba(79,70,229,0.13)',   text: '#3730a3', border: '#6366f1', heat: 'rgba(79,70,229,' },
  { solid: '#d97706', soft: 'rgba(217,119,6,0.14)',   text: '#92400e', border: '#f59e0b', heat: 'rgba(217,119,6,' },
  { solid: '#e11d48', soft: 'rgba(225,29,72,0.13)',   text: '#9f1239', border: '#fb7185', heat: 'rgba(225,29,72,' },
  { solid: '#7c3aed', soft: 'rgba(124,58,237,0.13)',  text: '#5b21b6', border: '#a78bfa', heat: 'rgba(124,58,237,' },
];
type Pal = typeof PALETTE[number];

function stableHash(s: string): number {
  let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h;
}
function getPalette(seed: string): Pal {
  const k = seed.trim().toLowerCase(); return k ? PALETTE[stableHash(k) % PALETTE.length] : PALETTE[0];
}
function venueInitials(name: string): string {
  const w = name.trim().split(/\s+/);
  if (w.length === 1) return name.slice(0, 2).toUpperCase();
  return (w[0][0] + w[w.length - 1][0]).toUpperCase();
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TimelineSlot {
  bookingId?: string; date: string; functionName: string; functionType?: string;
  customerName?: string; guests?: number; status: string;
  startMinutes: number; endMinutes: number;
  isPencilBooking?: boolean; pencilExpiresAt?: string | null;
  source: 'software' | 'google'; htmlLink?: string;
}

export interface TimelineHallRow {
  hallId?: string; hallName: string; banquetName?: string;
  rowType?: 'hall' | 'googleVenue'; slots: TimelineSlot[];
}

interface VenueGroup { name: string; pal: Pal; halls: TimelineHallRow[] }

export interface VenueTimelineBoardProps {
  rows: TimelineHallRow[]; viewMode: 'day' | 'week' | 'month';
  viewDate: Date; weekDays: Date[]; selectedDate: string;
  onBookingClick: (id: string) => void;
  onCreateBooking: () => void;
  onDateDrillDown?: (date: string) => void;
}

// ─── Position utils ───────────────────────────────────────────────────────────

function pL(min: number) { return Math.max(0, Math.min(100, (min - SH_MIN) / TOTAL_MIN * 100)); }
function pW(s: number, e: number) { return Math.max(0.5, (e - s) / TOTAL_MIN * 100); }
function norm(s: number, e: number): [number, number] {
  if (s === 0 && e === 1440) return [SH_MIN, EH_MIN];
  const ns = Math.max(s, SH_MIN), ne = Math.min(e, EH_MIN);
  if (ns >= ne) return [ns, Math.min(ns + 60, EH_MIN)];
  return [ns, ne];
}
const noTime = (s: number, e: number) => s === 0 && e === 1440;

// ─── Date utils ───────────────────────────────────────────────────────────────

function dk(d: Date) {
  return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-');
}
function isToday(d: Date) {
  const n = new Date(); return d.getDate()===n.getDate()&&d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear();
}
function fmtH(h: number) { if(h===12)return'12pm'; if(h===0||h===24)return'12am'; return h>12?`${h-12}pm`:`${h}am`; }
function fmtMins(m: number) { const h=Math.floor(m/60),mn=m%60; return `${h>12?h-12:h===0?12:h}:${String(mn).padStart(2,'0')}${h>=12?'pm':'am'}`; }
function pencilCD(exp?: string|null) {
  if(!exp)return'PENCIL'; const ms=new Date(exp).getTime()-Date.now();
  if(ms<=0)return'PENCIL · expired'; const h=Math.floor(ms/3600000),m=Math.floor((ms%3600000)/60000);
  return h>0?`PENCIL · ${h}h ${m}m`:`PENCIL · ${m}m`;
}

// ─── Lane assignment ──────────────────────────────────────────────────────────

interface Laned extends TimelineSlot { lane: number; totalLanes: number; ns: number; ne: number; nt: boolean }

function assignLanes(slots: TimelineSlot[]): Laned[] {
  if (!slots.length) return [];
  const prep = slots.map(s => { const [ns,ne]=norm(s.startMinutes,s.endMinutes); return {...s,ns,ne,nt:noTime(s.startMinutes,s.endMinutes)}; });
  const sorted=[...prep].sort((a,b)=>a.ns-b.ns);
  const ends:number[]=[];
  const wl=sorted.map(s=>{ let lane=ends.findIndex(e=>e<=s.ns); if(lane===-1)lane=ends.length; ends[lane]=s.ne; return{...s,lane}; });
  const total=ends.length;
  return wl.map(s=>({...s,totalLanes:total}));
}

// ─── Venue grouping ───────────────────────────────────────────────────────────

function useGroups(rows: TimelineHallRow[]): VenueGroup[] {
  return useMemo(() => {
    const m=new Map<string,TimelineHallRow[]>();
    for(const r of rows){const k=r.banquetName?.trim()||'Unassigned';if(!m.has(k))m.set(k,[]);m.get(k)!.push(r);}
    return Array.from(m.entries()).map(([name,halls])=>({name,pal:getPalette(name),halls}));
  },[rows]);
}

// ─── Shared atoms ─────────────────────────────────────────────────────────────

const BD = '1px solid #eaedf5';
const BD_INNER = '1px solid #f1f3fa';

function Chevron({open}:{open:boolean}) {
  return (
    <svg width={9} height={9} viewBox="0 0 11 11" fill="none"
      style={{transform:open?'rotate(90deg)':'none',transition:'transform .15s',flexShrink:0,color:'#bbb'}}>
      <path d="M3 2l5 3.5L3 9" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function GridLines() {
  return <>{HOURS.map(h=>(
    <div key={h} style={{position:'absolute',left:`${pL(h*60)}%`,top:0,bottom:0,width:1,background:'rgba(0,0,0,0.05)',pointerEvents:'none'}}/>
  ))}</>;
}

function NowLine() {
  const n=new Date(),m=n.getHours()*60+n.getMinutes();
  if(m<SH_MIN||m>EH_MIN)return null;
  return (
    <div style={{position:'absolute',left:`${pL(m)}%`,top:0,bottom:0,width:2,background:'rgba(239,68,68,.85)',zIndex:5,pointerEvents:'none'}}>
      <div style={{position:'absolute',top:'50%',left:-3,width:8,height:8,borderRadius:'50%',background:'rgba(239,68,68,.85)',transform:'translateY(-50%)'}}/>
    </div>
  );
}

// ─── Hover Tooltip ────────────────────────────────────────────────────────────

function TooltipRow({label,val}:{label:string;val:string}) {
  return (
    <div style={{display:'flex',gap:8,marginBottom:3,alignItems:'flex-start'}}>
      <span style={{color:'#64748b',width:36,flexShrink:0,fontSize:10}}>{label}</span>
      <span style={{color:'#cbd5e1',flex:1}}>{val}</span>
    </div>
  );
}

function Tooltip({s,x,y}:{s:Laned;x:number;y:number}) {
  const isPencil=s.isPencilBooking||s.status==='pencil';
  const flip=typeof window!=='undefined'&&y>window.innerHeight-160;
  return (
    <div style={{
      position:'fixed',left:x+14,top:flip?y-150:y+10,zIndex:9999,
      background:'#1e293b',color:'#fff',borderRadius:10,padding:'10px 12px',
      fontSize:11,boxShadow:'0 8px 24px rgba(0,0,0,.3)',minWidth:190,maxWidth:240,
      pointerEvents:'none',
    }}>
      {isPencil&&<div style={{fontSize:9,fontWeight:700,color:'#fcd34d',letterSpacing:'.05em',marginBottom:4}}>{pencilCD(s.pencilExpiresAt)}</div>}
      <div style={{fontWeight:700,fontSize:12,marginBottom:6,color:'#f1f5f9',lineHeight:1.3}}>{s.functionName}</div>
      {s.customerName&&<TooltipRow label="Client" val={s.customerName}/>}
      {s.functionType&&<TooltipRow label="Event" val={s.functionType}/>}
      <TooltipRow label="Time" val={`${fmtMins(s.ns)} – ${fmtMins(s.ne)}`}/>
      {!!s.guests&&<TooltipRow label="Pax" val={`${s.guests} guests`}/>}
      <div style={{marginTop:6,paddingTop:6,borderTop:'1px solid rgba(255,255,255,.1)',fontSize:9,color:'#475569'}}>Click to open full details</div>
    </div>
  );
}

// ─── Booking bar ──────────────────────────────────────────────────────────────

function Bar({s,pal,rh,onClick}:{s:Laned;pal:Pal;rh:number;onClick:()=>void}) {
  const [tip,setTip]=useState<{x:number;y:number}|null>(null);
  const isPencil=s.isPencilBooking||s.status==='pencil';
  const laneH=(rh-6)/s.totalLanes, top=3+s.lane*laneH, h=laneH-2;
  const barStyle:React.CSSProperties=isPencil
    ?{background:'transparent',border:`1.5px dashed ${pal.solid}`,color:pal.solid}
    :s.nt?{background:`${pal.solid}66`,border:`1px dashed ${pal.border}`,color:'#fff'}
    :{background:pal.solid,color:'#fff'};
  return (
    <>
      <button type="button" onClick={onClick}
        onMouseEnter={e=>setTip({x:e.clientX,y:e.clientY})}
        onMouseMove={e=>setTip({x:e.clientX,y:e.clientY})}
        onMouseLeave={()=>setTip(null)}
        style={{
          position:'absolute',left:`${pL(s.ns)}%`,width:`${pW(s.ns,s.ne)}%`,
          top,height:h,minWidth:3,borderRadius:4,overflow:'hidden',cursor:'pointer',zIndex:2,
          display:'flex',flexDirection:'column',justifyContent:'center',padding:'0 5px',
          textAlign:'left',...barStyle,
        }}
      >
        {h>=13&&<>
          {isPencil&&<span style={{fontSize:8,fontWeight:700,letterSpacing:'.04em',lineHeight:1.3,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{pencilCD(s.pencilExpiresAt)}</span>}
          <span style={{fontSize:10,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',lineHeight:1.3}}>{s.functionName}</span>
          {h>=26&&<span style={{fontSize:9,opacity:.8,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',lineHeight:1.2}}>{[s.functionType,s.guests?`${s.guests} pax`:null].filter(Boolean).join(' · ')}</span>}
        </>}
      </button>
      {tip&&<Tooltip s={s} x={tip.x} y={tip.y}/>}
    </>
  );
}

// ─── Venue sidebar cell ───────────────────────────────────────────────────────

function VenueCell({name,pal,open,toggle,busyCount,totalHalls,sw,rh}:{name:string;pal:Pal;open:boolean;toggle:()=>void;busyCount:number;totalHalls:number;sw:number;rh:number}) {
  return (
    <button type="button" onClick={toggle}
      style={{width:sw,flexShrink:0,height:rh,display:'flex',alignItems:'center',gap:7,padding:'0 8px 0 10px',cursor:'pointer',background:'transparent',border:'none',borderRight:BD,userSelect:'none',textAlign:'left'}}>
      <Chevron open={open}/>
      <div style={{width:26,height:26,borderRadius:7,background:pal.solid,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'#fff',flexShrink:0,letterSpacing:'-.01em'}}>
        {venueInitials(name)}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:11,fontWeight:700,color:'#111',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',letterSpacing:'-.01em'}}>{name}</div>
        {totalHalls>0&&<div style={{fontSize:9,color:'#9ca3af',marginTop:1}}>{busyCount}/{totalHalls} busy</div>}
      </div>
      {busyCount>0&&<div style={{width:16,height:16,borderRadius:'50%',background:pal.solid,display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:700,color:'#fff',flexShrink:0}}>{busyCount}</div>}
    </button>
  );
}

function HallCell({name,slots,sw,rh,showStatus}:{name:string;slots:TimelineSlot[];sw:number;rh:number;showStatus?:boolean}) {
  const busy=slots.length>0;
  return (
    <div style={{width:sw,flexShrink:0,height:rh,display:'flex',alignItems:'center',padding:'0 8px 0 24px',borderRight:BD,gap:4}}>
      <span style={{fontSize:10,color:'#9ca3af',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{name}</span>
      {showStatus&&<div style={{flexShrink:0,padding:'1px 5px',borderRadius:6,fontSize:8,fontWeight:700,background:busy?'#fef2f2':'#f0fdf4',color:busy?'#dc2626':'#16a34a',border:`1px solid ${busy?'#fecaca':'#bbf7d0'}`}}>
        {busy?'Busy':'Free'}
      </div>}
    </div>
  );
}

// ─── Desktop Day View ─────────────────────────────────────────────────────────

function DesktopDay({groups,selDate,exp,toggle,onBook,onCreate}:{
  groups:VenueGroup[];selDate:string;exp:Set<string>;toggle:(n:string)=>void;onBook:(id:string)=>void;onCreate:()=>void;
}) {
  return (
    <div style={{overflowX:'auto'}}>
      <div style={{minWidth:D_SW+600}}>
        <div style={{display:'flex',height:26,background:'#f9fafb',borderBottom:BD,position:'sticky',top:0,zIndex:10}}>
          <div style={{width:D_SW,flexShrink:0,borderRight:BD,display:'flex',alignItems:'center',paddingLeft:10,fontSize:10,fontWeight:600,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'.06em'}}>Venue / Hall</div>
          <div style={{flex:1,position:'relative'}}>
            {HOURS.map(h=>(
              <div key={h} style={{position:'absolute',left:`${pL(h*60)}%`,top:0,bottom:0,display:'flex',alignItems:'center',paddingLeft:3,fontSize:9,fontWeight:500,color:'#c0c5d0',pointerEvents:'none',userSelect:'none'}}>{fmtH(h)}</div>
            ))}
          </div>
        </div>
        {groups.map(g=>{
          const open=exp.has(g.name);
          const vSlots=assignLanes(g.halls.flatMap(h=>h.slots.filter(s=>s.date===selDate)));
          const busyHalls=g.halls.filter(h=>h.slots.some(s=>s.date===selDate)).length;
          return (
            <React.Fragment key={g.name}>
              <div style={{display:'flex',height:D_RH,background:'#f4f6fc',borderBottom:BD}}>
                <VenueCell name={g.name} pal={g.pal} open={open} toggle={()=>toggle(g.name)} busyCount={busyHalls} totalHalls={g.halls.length} sw={D_SW} rh={D_RH}/>
                <div style={{flex:1,position:'relative',overflow:'visible',cursor:'crosshair'}}
                  onClick={e=>{if((e.target as Element).tagName==='DIV'&&vSlots.length===0)onCreate();}}>
                  <GridLines/><NowLine/>
                  {vSlots.map(s=><Bar key={s.bookingId||s.functionName+s.date} s={s} pal={g.pal} rh={D_RH} onClick={()=>s.bookingId&&onBook(s.bookingId)}/>)}
                </div>
              </div>
              {open&&g.halls.map((hall,i)=>{
                const hSlots=assignLanes(hall.slots.filter(s=>s.date===selDate));
                return (
                  <div key={hall.hallName} style={{display:'flex',height:D_RH,background:'#fff',borderBottom:i===g.halls.length-1?BD:BD_INNER}}>
                    <HallCell name={hall.hallName} slots={hall.slots.filter(s=>s.date===selDate)} sw={D_SW} rh={D_RH} showStatus/>
                    <div style={{flex:1,position:'relative',overflow:'visible',cursor:'crosshair'}}
                      onClick={e=>{if((e.target as Element).tagName==='DIV'&&hSlots.length===0)onCreate();}}>
                      <GridLines/><NowLine/>
                      {hSlots.length===0&&(
                        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none'}}>
                          <span style={{fontSize:9,color:'#d1d5db',fontStyle:'italic'}}>Free — click to create booking</span>
                        </div>
                      )}
                      {hSlots.map(s=><Bar key={s.bookingId||s.functionName+s.date} s={s} pal={g.pal} rh={D_RH} onClick={()=>s.bookingId&&onBook(s.bookingId)}/>)}
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ─── Desktop Week View (WV1 — time bars, clickable headers) ──────────────────

function WeekBarCell({slots,pal,today,onBook,rh}:{slots:TimelineSlot[];pal:Pal;today:boolean;onBook:(id:string)=>void;rh:number}) {
  const laned=assignLanes(slots);
  return (
    <div style={{flex:1,position:'relative',height:rh,borderLeft:BD,background:today?'rgba(239,68,68,.04)':undefined,overflow:'visible'}}>
      {laned.map(s=><Bar key={s.bookingId||s.functionName+s.date} s={s} pal={pal} rh={rh} onClick={()=>s.bookingId&&onBook(s.bookingId)}/>)}
    </div>
  );
}

function DesktopWeek({groups,wdays,exp,toggle,onBook,onDrill}:{
  groups:VenueGroup[];wdays:Date[];exp:Set<string>;toggle:(n:string)=>void;onBook:(id:string)=>void;onDrill?:(d:string)=>void;
}) {
  return (
    <div style={{overflowX:'auto'}}>
      <div style={{minWidth:D_SW+wdays.length*110}}>
        <div style={{display:'flex',height:38,background:'#f9fafb',borderBottom:BD,position:'sticky',top:0,zIndex:10}}>
          <div style={{width:D_SW,flexShrink:0,borderRight:BD,display:'flex',alignItems:'center',paddingLeft:10,fontSize:10,fontWeight:600,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'.06em'}}>Venue / Hall</div>
          {wdays.map(day=>{
            const tod=isToday(day);
            return (
              <button key={dk(day)} type="button"
                onClick={()=>onDrill?.(dk(day))}
                title={onDrill?'Click to see day view':undefined}
                style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',borderLeft:BD,background:tod?'rgba(239,68,68,.04)':undefined,cursor:onDrill?'pointer':'default',border:'none',padding:'4px 0',transition:'background .1s'}}
                onMouseEnter={e=>{if(onDrill)(e.currentTarget as HTMLElement).style.background=tod?'rgba(239,68,68,.09)':'#f0fdf4';}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background=tod?'rgba(239,68,68,.04)':'';}}
              >
                <span style={{fontSize:9,fontWeight:500,textTransform:'uppercase',color:tod?'rgb(239,68,68)':'#c0c5d0',lineHeight:1}}>{day.toLocaleDateString('en-IN',{weekday:'short'})}</span>
                <div style={{fontSize:13,fontWeight:tod?700:500,width:tod?20:undefined,height:tod?20:undefined,borderRadius:tod?'50%':undefined,background:tod?'rgb(239,68,68)':undefined,color:tod?'#fff':'#555',display:'flex',alignItems:'center',justifyContent:'center',marginTop:2}}>{day.getDate()}</div>
                {onDrill&&<span style={{fontSize:7,color:'#c0c5d0',marginTop:1}}>↓ day</span>}
              </button>
            );
          })}
        </div>
        {groups.map(g=>{
          const open=exp.has(g.name);
          const busyHalls=g.halls.filter(h=>wdays.some(d=>h.slots.some(s=>s.date===dk(d)))).length;
          return (
            <React.Fragment key={g.name}>
              <div style={{display:'flex',height:D_RH,background:'#f4f6fc',borderBottom:BD}}>
                <VenueCell name={g.name} pal={g.pal} open={open} toggle={()=>toggle(g.name)} busyCount={busyHalls} totalHalls={g.halls.length} sw={D_SW} rh={D_RH}/>
                {wdays.map(day=><WeekBarCell key={dk(day)} slots={g.halls.flatMap(h=>h.slots.filter(s=>s.date===dk(day)))} pal={g.pal} today={isToday(day)} onBook={onBook} rh={D_RH}/>)}
              </div>
              {open&&g.halls.map((hall,i)=>(
                <div key={hall.hallName} style={{display:'flex',height:D_RH,background:'#fff',borderBottom:i===g.halls.length-1?BD:BD_INNER}}>
                  <HallCell name={hall.hallName} slots={[]} sw={D_SW} rh={D_RH}/>
                  {wdays.map(day=><WeekBarCell key={dk(day)} slots={hall.slots.filter(s=>s.date===dk(day))} pal={g.pal} today={isToday(day)} onBook={onBook} rh={D_RH}/>)}
                </div>
              ))}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ─── Desktop Month View (pills + heatmap + drill-down) ────────────────────────

function MonthPillCell({slots,pal,tod,wknd,onBook,onDrill,rh}:{
  slots:TimelineSlot[];pal:Pal;tod:boolean;wknd:boolean;onBook:(id:string)=>void;onDrill?:()=>void;rh:number;
}) {
  const n=slots.length;
  const heatAlpha=n===0?0:n===1?.06:n===2?.13:n===3?.21:.32;
  const bg=wknd?'#f9fafb':n>0?`${pal.heat}${heatAlpha})`:undefined;
  return (
    <div onClick={onDrill}
      style={{flex:1,height:rh,borderLeft:BD,padding:'3px 3px 2px',display:'flex',flexDirection:'column',gap:2,overflow:'hidden',background:bg,outline:tod?`1.5px solid ${pal.solid}`:undefined,outlineOffset:-1,cursor:onDrill?'pointer':undefined,transition:'background .1s',minWidth:D_MCW}}
      onMouseEnter={e=>{if(onDrill&&n===0)(e.currentTarget as HTMLElement).style.background='rgba(13,148,136,0.05)';}}
      onMouseLeave={e=>{if(onDrill&&n===0)(e.currentTarget as HTMLElement).style.background=bg||'';}}
    >
      {slots.slice(0,3).map((s,i)=>{
        const p=s.isPencilBooking||s.status==='pencil';
        return (
          <button key={s.bookingId||i} type="button"
            onClick={e=>{e.stopPropagation();s.bookingId&&onBook(s.bookingId);}}
            title={s.functionName}
            style={{padding:'1px 4px',borderRadius:3,background:p?'transparent':pal.solid,border:p?`1px dashed ${pal.solid}`:'none',cursor:'pointer',textAlign:'left',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:9,fontWeight:600,color:p?pal.solid:'#fff',lineHeight:1.45,flexShrink:0}}>
            {p?'✏ ':''}{s.functionName.length>14?s.functionName.slice(0,13)+'…':s.functionName}
          </button>
        );
      })}
      {n>3&&<span style={{fontSize:8,color:'#9ca3af',paddingLeft:2,lineHeight:1}}>+{n-3} more</span>}
    </div>
  );
}

function DesktopMonth({groups,vdate,exp,toggle,onBook,onDrill}:{
  groups:VenueGroup[];vdate:Date;exp:Set<string>;toggle:(n:string)=>void;onBook:(id:string)=>void;onDrill?:(d:string)=>void;
}) {
  const yr=vdate.getFullYear(),mo=vdate.getMonth();
  const dim=new Date(yr,mo+1,0).getDate();
  const today=new Date(),isCM=today.getMonth()===mo&&today.getFullYear()===yr;
  const days=Array.from({length:dim},(_,i)=>i+1);
  const wknd=(d:number)=>{const dow=new Date(yr,mo,d).getDay();return dow===0||dow===6;};
  const mdk=(d:number)=>`${yr}-${String(mo+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

  return (
    <div style={{overflowX:'auto'}}>
      <div style={{minWidth:D_SW+dim*D_MCW}}>
        <div style={{display:'flex',height:26,background:'#f9fafb',borderBottom:BD,position:'sticky',top:0,zIndex:10}}>
          <div style={{width:D_SW,flexShrink:0,borderRight:BD,display:'flex',alignItems:'center',paddingLeft:10,fontSize:10,fontWeight:600,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'.06em'}}>{vdate.toLocaleDateString('en-IN',{month:'short',year:'numeric'})}</div>
          {days.map(d=>{
            const tod=isCM&&d===today.getDate();
            return (
              <div key={d} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',borderLeft:BD,background:wknd(d)?'#f4f6fc':undefined,minWidth:D_MCW}}>
                <div style={{fontSize:8,fontWeight:tod?700:400,width:tod?14:undefined,height:tod?14:undefined,borderRadius:tod?'50%':undefined,background:tod?'rgb(239,68,68)':undefined,color:tod?'#fff':wknd(d)?'rgba(239,68,68,.45)':'#c0c5d0',display:'flex',alignItems:'center',justifyContent:'center'}}>{d}</div>
              </div>
            );
          })}
        </div>
        {groups.map(g=>{
          const open=exp.has(g.name);
          return (
            <React.Fragment key={g.name}>
              <div style={{display:'flex',height:D_MRH,background:'#f4f6fc',borderBottom:BD}}>
                <VenueCell name={g.name} pal={g.pal} open={open} toggle={()=>toggle(g.name)} busyCount={0} totalHalls={g.halls.length} sw={D_SW} rh={D_MRH}/>
                {days.map(d=><MonthPillCell key={d} slots={g.halls.flatMap(h=>h.slots.filter(s=>s.date===mdk(d)))} pal={g.pal} tod={isCM&&d===today.getDate()} wknd={wknd(d)} onBook={onBook} onDrill={onDrill?()=>onDrill(mdk(d)):undefined} rh={D_MRH}/>)}
              </div>
              {open&&g.halls.map((hall,i)=>(
                <div key={hall.hallName} style={{display:'flex',height:D_MRH,background:'#fff',borderBottom:i===g.halls.length-1?BD:BD_INNER}}>
                  <HallCell name={hall.hallName} slots={[]} sw={D_SW} rh={D_MRH}/>
                  {days.map(d=><MonthPillCell key={d} slots={hall.slots.filter(s=>s.date===mdk(d))} pal={g.pal} tod={isCM&&d===today.getDate()} wknd={wknd(d)} onBook={onBook} onDrill={onDrill?()=>onDrill(mdk(d)):undefined} rh={D_MRH}/>)}
                </div>
              ))}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ─── Mobile Day View (MD1 — compressed timeline) ─────────────────────────────

function MobileDay({groups,selDate,exp,toggle,onBook}:{groups:VenueGroup[];selDate:string;exp:Set<string>;toggle:(n:string)=>void;onBook:(id:string)=>void}) {
  return (
    <div style={{width:'100%',overflowX:'hidden'}}>
      <div style={{display:'flex',height:20,background:'#f9fafb',borderBottom:BD,position:'sticky',top:0,zIndex:10}}>
        <div style={{width:M_SW,flexShrink:0,borderRight:BD}}/>
        <div style={{flex:1,position:'relative'}}>
          {[8,11,14,17,20,23].map(h=>(
            <div key={h} style={{position:'absolute',left:`${pL(h*60)}%`,top:0,bottom:0,display:'flex',alignItems:'center',paddingLeft:2,fontSize:8,color:'#c0c5d0',pointerEvents:'none',userSelect:'none'}}>{fmtH(h)}</div>
          ))}
        </div>
      </div>
      {groups.map(g=>{
        const open=exp.has(g.name);
        const vSlots=assignLanes(g.halls.flatMap(h=>h.slots.filter(s=>s.date===selDate)));
        return (
          <React.Fragment key={g.name}>
            <div style={{display:'flex',height:M_RH,background:'#f4f6fc',borderBottom:BD}}>
              <button type="button" onClick={()=>toggle(g.name)}
                style={{width:M_SW,flexShrink:0,height:M_RH,display:'flex',alignItems:'center',gap:4,padding:'0 6px',cursor:'pointer',background:'transparent',border:'none',borderRight:BD,userSelect:'none',textAlign:'left'}}>
                <Chevron open={open}/>
                <div style={{width:20,height:20,borderRadius:5,background:g.pal.solid,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,color:'#fff',flexShrink:0}}>{venueInitials(g.name)}</div>
              </button>
              <div style={{flex:1,position:'relative',overflow:'hidden'}}><GridLines/><NowLine/>
                {vSlots.map(s=><Bar key={s.bookingId||s.functionName+s.date} s={s} pal={g.pal} rh={M_RH} onClick={()=>s.bookingId&&onBook(s.bookingId)}/>)}
              </div>
            </div>
            {open&&g.halls.map((hall,i)=>{
              const hSlots=assignLanes(hall.slots.filter(s=>s.date===selDate));
              return (
                <div key={hall.hallName} style={{display:'flex',height:M_RH,background:'#fff',borderBottom:i===g.halls.length-1?BD:BD_INNER}}>
                  <div style={{width:M_SW,flexShrink:0,display:'flex',alignItems:'center',padding:'0 6px 0 18px',borderRight:BD,fontSize:9,color:'#aab0c0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{hall.hallName}</div>
                  <div style={{flex:1,position:'relative',overflow:'hidden'}}><GridLines/><NowLine/>
                    {hSlots.map(s=><Bar key={s.bookingId||s.functionName+s.date} s={s} pal={g.pal} rh={M_RH} onClick={()=>s.bookingId&&onBook(s.bookingId)}/>)}
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Mobile Week View (booking chips + drill-down headers) ────────────────────

function MobileWeek({groups,wdays,exp,toggle,onBook,onDrill}:{groups:VenueGroup[];wdays:Date[];exp:Set<string>;toggle:(n:string)=>void;onBook:(id:string)=>void;onDrill?:(d:string)=>void}) {
  return (
    <div style={{width:'100%',overflowX:'hidden'}}>
      <div style={{display:'flex',height:32,background:'#f9fafb',borderBottom:BD,position:'sticky',top:0,zIndex:10}}>
        <div style={{width:M_SW,flexShrink:0,borderRight:BD}}/>
        {wdays.map(day=>{
          const tod=isToday(day);
          return (
            <button key={dk(day)} type="button" onClick={()=>onDrill?.(dk(day))}
              style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',borderLeft:BD,background:tod?'rgba(239,68,68,.04)':undefined,cursor:'pointer',border:'none',padding:'3px 0'}}>
              <span style={{fontSize:8,color:tod?'rgb(239,68,68)':'#c0c5d0',lineHeight:1,textTransform:'uppercase'}}>{day.toLocaleDateString('en-IN',{weekday:'narrow'})}</span>
              <div style={{fontSize:11,fontWeight:tod?700:400,width:tod?17:undefined,height:tod?17:undefined,borderRadius:tod?'50%':undefined,background:tod?'rgb(239,68,68)':undefined,color:tod?'#fff':'#555',display:'flex',alignItems:'center',justifyContent:'center'}}>{day.getDate()}</div>
            </button>
          );
        })}
      </div>
      {groups.map(g=>{
        const open=exp.has(g.name);
        return (
          <React.Fragment key={g.name}>
            <div style={{display:'flex',minHeight:M_RH+4,background:'#f4f6fc',borderBottom:BD}}>
              <button type="button" onClick={()=>toggle(g.name)}
                style={{width:M_SW,flexShrink:0,display:'flex',alignItems:'flex-start',gap:4,padding:'6px',cursor:'pointer',background:'transparent',border:'none',borderRight:BD,userSelect:'none',textAlign:'left'}}>
                <Chevron open={open}/>
                <div style={{width:18,height:18,borderRadius:5,background:g.pal.solid,display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:700,color:'#fff',flexShrink:0}}>{venueInitials(g.name)}</div>
              </button>
              {wdays.map(day=>{
                const d=dk(day),tod=isToday(day);
                const slots=g.halls.flatMap(h=>h.slots.filter(s=>s.date===d)).sort((a,b)=>a.startMinutes-b.startMinutes);
                return (
                  <div key={d} style={{flex:1,borderLeft:BD,padding:'3px 2px',display:'flex',flexDirection:'column',gap:2,background:tod?'rgba(239,68,68,.04)':undefined,minHeight:M_RH+4}}>
                    {slots.slice(0,3).map(s=>{
                      const p=s.isPencilBooking||s.status==='pencil';
                      return (
                        <button key={s.bookingId||s.functionName} type="button" onClick={()=>s.bookingId&&onBook(s.bookingId)}
                          style={{padding:'1px 3px',borderRadius:3,background:p?'transparent':g.pal.solid,border:p?`1px dashed ${g.pal.solid}`:'none',cursor:'pointer',textAlign:'left',display:'flex',flexDirection:'column'}}>
                          <span style={{fontSize:8,fontWeight:600,color:p?g.pal.solid:'#fff',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',lineHeight:1.3}}>{s.functionName}</span>
                          {s.functionType&&<span style={{fontSize:7,color:p?g.pal.soft:'rgba(255,255,255,.75)',lineHeight:1.2}}>{s.functionType}</span>}
                        </button>
                      );
                    })}
                    {slots.length>3&&<span style={{fontSize:7,color:'#9ca3af',paddingLeft:2}}>+{slots.length-3}</span>}
                  </div>
                );
              })}
            </div>
            {open&&g.halls.map((hall,i)=>(
              <div key={hall.hallName} style={{display:'flex',minHeight:M_RH,background:'#fff',borderBottom:i===g.halls.length-1?BD:BD_INNER}}>
                <div style={{width:M_SW,flexShrink:0,display:'flex',alignItems:'flex-start',padding:'5px 6px 4px 18px',borderRight:BD,fontSize:8.5,color:'#aab0c0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{hall.hallName}</div>
                {wdays.map(day=>{
                  const d=dk(day),tod=isToday(day);
                  const slots=hall.slots.filter(s=>s.date===d).sort((a,b)=>a.startMinutes-b.startMinutes);
                  return (
                    <div key={d} style={{flex:1,borderLeft:BD,padding:'3px 2px',display:'flex',flexDirection:'column',gap:2,background:tod?'rgba(239,68,68,.04)':undefined,minHeight:M_RH}}>
                      {slots.slice(0,3).map(s=>{
                        const p=s.isPencilBooking||s.status==='pencil';
                        return (
                          <button key={s.bookingId||s.functionName} type="button" onClick={()=>s.bookingId&&onBook(s.bookingId)}
                            style={{padding:'1px 3px',borderRadius:3,background:p?'transparent':g.pal.solid,border:p?`1px dashed ${g.pal.solid}`:'none',cursor:'pointer',textAlign:'left',display:'flex',flexDirection:'column'}}>
                            <span style={{fontSize:8,fontWeight:600,color:p?g.pal.solid:'#fff',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',lineHeight:1.3}}>{s.functionName}</span>
                            {s.functionType&&<span style={{fontSize:7,color:p?g.pal.soft:'rgba(255,255,255,.75)',lineHeight:1.2}}>{s.functionType}</span>}
                          </button>
                        );
                      })}
                      {slots.length>3&&<span style={{fontSize:7,color:'#9ca3af',paddingLeft:2}}>+{slots.length-3}</span>}
                    </div>
                  );
                })}
              </div>
            ))}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Mobile Month View (split: grid top + detail bottom) ─────────────────────

function MobileMonth({groups,vdate,onBook,onCreate,onDrill}:{groups:VenueGroup[];vdate:Date;onBook:(id:string)=>void;onCreate:()=>void;onDrill?:(d:string)=>void}) {
  const yr=vdate.getFullYear(),mo=vdate.getMonth();
  const dim=new Date(yr,mo+1,0).getDate();
  const firstDow=new Date(yr,mo,1).getDay();
  const today=new Date(),isCM=today.getMonth()===mo&&today.getFullYear()===yr;
  const [selDay,setSelDay]=useState<number>(isCM?today.getDate():1);
  const mdk=(d:number)=>`${yr}-${String(mo+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const DOW=['S','M','T','W','T','F','S'];
  const totalCells=Math.ceil((firstDow+dim)/7)*7;
  const cells=Array.from({length:totalCells},(_,i)=>{const d=i-firstDow+1;return(d>=1&&d<=dim)?d:null;});
  const selKey=mdk(selDay);
  const selSlots=groups.flatMap(g=>g.halls.flatMap(h=>h.slots.filter(s=>s.date===selKey).map(s=>({...s,pal:g.pal,hallName:h.hallName})))).sort((a,b)=>a.startMinutes-b.startMinutes);

  return (
    <div style={{display:'flex',flexDirection:'column',height:'calc(100dvh - 148px)',minHeight:480}}>
      <div style={{flexShrink:0}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',padding:'2px 4px 0'}}>
          {DOW.map((d,i)=>(<div key={i} style={{textAlign:'center',fontSize:10,fontWeight:500,color:i===0||i===6?'rgba(239,68,68,.55)':'#9ca3af',paddingBottom:2}}>{d}</div>))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',padding:'0 3px',gap:'1px 0'}}>
          {cells.map((d,i)=>{
            if(!d)return<div key={i} style={{minHeight:46}}/>;
            const dkey=mdk(d),daySlots=groups.flatMap(g=>g.halls.flatMap(h=>h.slots.filter(s=>s.date===dkey)));
            const venuesHere=groups.filter(g=>g.halls.some(h=>h.slots.some(s=>s.date===dkey)));
            const isSel=d===selDay,isTod=isCM&&d===today.getDate(),isWk=i%7===0||i%7===6;
            return (
              <button key={i} type="button" onClick={()=>{setSelDay(d);onDrill?.(dkey);}}
                style={{padding:'2px 1px',borderRadius:5,background:isSel?'#111':isTod?'rgba(239,68,68,.07)':'transparent',border:isTod&&!isSel?'1.5px solid rgba(239,68,68,.35)':'1.5px solid transparent',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:2,minHeight:46}}>
                <span style={{fontSize:12,fontWeight:isSel?700:isTod?600:400,color:isSel?'#fff':isTod?'rgb(239,68,68)':isWk?'rgba(239,68,68,.45)':'#374151',lineHeight:1.4}}>{d}</span>
                <div style={{display:'flex',gap:2,flexWrap:'wrap',justifyContent:'center'}}>
                  {venuesHere.slice(0,3).map(g=>(<div key={g.name} style={{width:5,height:5,borderRadius:'50%',background:isSel?'rgba(255,255,255,.75)':g.pal.solid}}/>))}
                  {daySlots.length>3&&!isSel&&<span style={{fontSize:6.5,color:'#9ca3af',lineHeight:1}}>+{daySlots.length-3}</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div style={{flex:1,overflowY:'auto',borderTop:BD,background:'#f9fafb'}}>
        <div style={{padding:'8px 12px 4px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,background:'#f9fafb',zIndex:2,borderBottom:BD}}>
          <span style={{fontSize:12,fontWeight:600,color:'#374151'}}>
            {new Date(yr,mo,selDay).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}
            {selSlots.length>0&&<span style={{fontSize:10,fontWeight:400,color:'#9ca3af',marginLeft:6}}>{selSlots.length} booking{selSlots.length>1?'s':''}</span>}
          </span>
          <button type="button" onClick={onCreate} style={{fontSize:11,fontWeight:600,color:'#0d9488',background:'rgba(13,148,136,.09)',border:'1px solid rgba(13,148,136,.2)',borderRadius:6,padding:'3px 10px',cursor:'pointer'}}>+ Booking</button>
        </div>
        {selSlots.length===0?(
          <div style={{padding:'24px 16px',textAlign:'center'}}>
            <p style={{fontSize:13,color:'#9ca3af',marginBottom:12}}>No bookings on this day</p>
            <button type="button" onClick={onCreate} style={{fontSize:12,fontWeight:600,color:'#fff',background:'#0d9488',border:'none',borderRadius:8,padding:'8px 20px',cursor:'pointer'}}>Create Booking</button>
          </div>
        ):(
          <div style={{padding:'6px 8px 16px',display:'flex',flexDirection:'column',gap:6}}>
            {selSlots.map(s=>{
              const p=s.isPencilBooking||s.status==='pencil';
              return (
                <button key={s.bookingId||s.functionName} type="button" onClick={()=>s.bookingId&&onBook(s.bookingId)}
                  style={{display:'flex',alignItems:'stretch',gap:10,padding:'8px 10px',background:'#fff',borderRadius:8,border:BD,cursor:'pointer',textAlign:'left',boxShadow:'0 1px 2px rgba(0,0,0,.04)'}}>
                  <div style={{width:3,borderRadius:2,background:p?'transparent':s.pal.solid,border:p?`1.5px dashed ${s.pal.solid}`:'none',flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    {p&&<span style={{fontSize:8.5,fontWeight:700,letterSpacing:'.04em',color:s.pal.solid,display:'block',lineHeight:1.4}}>{pencilCD(s.pencilExpiresAt)}</span>}
                    <p style={{fontSize:13,fontWeight:600,color:'#111',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.functionName}</p>
                    <p style={{fontSize:11,color:'#6b7280',margin:0}}>{[s.functionType,s.guests?`${s.guests} pax`:null].filter(Boolean).join(' · ')}</p>
                    <p style={{fontSize:10,color:'#9ca3af',margin:0}}>{s.hallName}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Create Booking FAB ───────────────────────────────────────────────────────

function CreateFAB({onClick}:{onClick:()=>void}) {
  return (
    <div style={{position:'sticky',bottom:0,display:'flex',justifyContent:'flex-end',padding:'8px 12px',background:'linear-gradient(to top,rgba(255,255,255,.95) 60%,transparent)',pointerEvents:'none',zIndex:6}}>
      <button type="button" onClick={onClick} style={{pointerEvents:'auto',fontSize:12,fontWeight:600,color:'#fff',background:'#0d9488',border:'none',borderRadius:20,padding:'7px 16px',cursor:'pointer',boxShadow:'0 2px 8px rgba(13,148,136,.4)',display:'flex',alignItems:'center',gap:5}}>
        <span style={{fontSize:15,lineHeight:1}}>+</span> New Booking
      </button>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function VenueTimelineBoard({rows,viewMode,viewDate,weekDays,selectedDate,onBookingClick,onCreateBooking,onDateDrillDown}:VenueTimelineBoardProps) {
  const groups=useGroups(rows);
  const [exp,setExp]=useState<Set<string>>(()=>{const f=rows[0]?.banquetName?.trim()||'';return new Set(f?[f]:[]);});
  const toggle=(n:string)=>setExp(p=>{const nx=new Set(p);nx.has(n)?nx.delete(n):nx.add(n);return nx;});

  if(rows.length===0) return (
    <div className="empty-state py-10">
      <div className="empty-state-icon">
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"/>
        </svg>
      </div>
      <p className="empty-state-title">No venues or bookings found</p>
      <p className="empty-state-desc">Try adjusting filters or date range.</p>
      <button type="button" onClick={onCreateBooking} className="mt-3 text-sm font-semibold text-teal-600 underline">Create a booking</button>
    </div>
  );

  const shared={groups,exp,toggle,onBook:onBookingClick};

  return (
    <>
      {/* Desktop */}
      <div className="hidden sm:block border border-[var(--border)] rounded-xl overflow-hidden">
        {viewMode==='day'&&<DesktopDay {...shared} selDate={selectedDate} onCreate={onCreateBooking}/>}
        {viewMode==='week'&&<DesktopWeek {...shared} wdays={weekDays} onDrill={onDateDrillDown}/>}
        {viewMode==='month'&&<DesktopMonth {...shared} vdate={viewDate} onDrill={onDateDrillDown}/>}
        <CreateFAB onClick={onCreateBooking}/>
      </div>
      {/* Mobile */}
      <div className="sm:hidden">
        {viewMode==='day'&&<div className="border border-[var(--border)] rounded-xl overflow-hidden"><MobileDay {...shared} selDate={selectedDate}/><CreateFAB onClick={onCreateBooking}/></div>}
        {viewMode==='week'&&<div className="border border-[var(--border)] rounded-xl overflow-hidden"><MobileWeek {...shared} wdays={weekDays} onDrill={onDateDrillDown}/><CreateFAB onClick={onCreateBooking}/></div>}
        {viewMode==='month'&&<MobileMonth groups={groups} vdate={viewDate} onBook={onBookingClick} onCreate={onCreateBooking} onDrill={onDateDrillDown}/>}
      </div>
    </>
  );
}
