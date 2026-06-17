'use client';

import React, { useMemo, useState } from 'react';
import { dedupeSlotsByBookingId } from '@/lib/calendarConcurrency';

// ════════════════════════════════════════════════════════════════════════════
//  VenueTimelineBoard — refined venue-rows board
//  Venue → hall rows, bookings as timeline bars. High-density, sleek, modern.
//  Drop-in: identical prop contract + exported types. All pure logic (lane
//  assignment, conflict detection, date keys, dedupe) is preserved verbatim;
//  only the presentation layer was rebuilt.
// ════════════════════════════════════════════════════════════════════════════

// ─── Constants ────────────────────────────────────────────────────────────────

const SH = 9, EH = 22, TOTAL_MIN = (EH - SH) * 60;
const SH_MIN = SH * 60, EH_MIN = EH * 60;
const HOURS = Array.from({ length: EH - SH + 1 }, (_, i) => SH + i);

// ─── Time slots (Morning/Lunch/Evening/Dinner) ─────────────────────────────────

interface Slot { id: string; label: string; startH: number; endH: number }
const SLOTS: Slot[] = [
  { id: 'morning', label: 'Morning', startH: 9,  endH: 12 },
  { id: 'lunch',   label: 'Lunch',   startH: 12, endH: 16 },
  { id: 'evening', label: 'Evening', startH: 16, endH: 19 },
  { id: 'dinner',  label: 'Dinner',  startH: 19, endH: 22 },
];
function bucketSlot(startMinutes: number): Slot | undefined {
  const h = startMinutes / 60;
  return SLOTS.find(s => h >= s.startH && h < s.endH);
}

// ─── Status colors ──────────────────────────────────────────────────────────
// Read from --cal-* CSS vars (tokens.css) so they flip with the app theme.

interface StatusStyle { label: string; bg: string; text: string; accent: string }
const STATUS: Record<string, StatusStyle> = {
  confirmed: { label: 'Confirmed', bg: 'var(--cal-confirmed-bg)', text: 'var(--cal-confirmed-text)', accent: 'var(--cal-confirmed-accent)' },
  pencil:    { label: 'Pencil',    bg: 'var(--cal-pencil-bg)',    text: 'var(--cal-pencil-text)',    accent: 'var(--cal-pencil-accent)' },
  quotation: { label: 'Quotation', bg: 'var(--cal-quotation-bg)', text: 'var(--cal-quotation-text)', accent: 'var(--cal-quotation-accent)' },
  enquiry:   { label: 'Enquiry',   bg: 'var(--cal-enquiry-bg)',   text: 'var(--cal-enquiry-text)',   accent: 'var(--cal-enquiry-accent)' },
  cancelled: { label: 'Cancelled', bg: 'var(--cal-cancelled-bg)', text: 'var(--cal-cancelled-text)', accent: 'var(--cal-cancelled-accent)' },
};
const STATUS_FALLBACK: StatusStyle = { label: 'Booking', bg: 'var(--cal-fallback-bg)', text: 'var(--cal-fallback-text)', accent: 'var(--cal-fallback-accent)' };
function statusOf(status?: string): StatusStyle {
  if (!status) return STATUS_FALLBACK;
  return STATUS[status.toLowerCase()] || STATUS_FALLBACK;
}
const STRIPE = 'var(--cal-stripe)';
const CONFLICT = 'var(--cal-conflict-accent)';

// ─── Dimensions (density-tuned) ───────────────────────────────────────────────

const D_SW = 196;   // desktop frozen sidebar width
const M_SW = 74;    // mobile sidebar width
const D_HEAD = 42;  // desktop header height
const D_VRH = 50;   // desktop day/week venue (aggregate) row height
const D_HRH = 44;   // desktop day/week hall row height
const M_RH = 40;    // mobile row height
const WEEK_HRH = 118; // week matrix hall row height (fits a 4-slot cell)

// ─── Palette (mirrored by CalendarLegend) ───────────────────────────────────

const PALETTE = [
  { solid: '#0d9488', soft: 'rgba(13,148,136,0.13)',  text: '#115e59', border: '#14b8a6' },
  { solid: '#4f46e5', soft: 'rgba(79,70,229,0.13)',   text: '#3730a3', border: '#6366f1' },
  { solid: '#d97706', soft: 'rgba(217,119,6,0.14)',   text: '#92400e', border: '#f59e0b' },
  { solid: '#e11d48', soft: 'rgba(225,29,72,0.13)',   text: '#9f1239', border: '#fb7185' },
  { solid: '#0284c7', soft: 'rgba(2,132,199,0.13)',   text: '#075985', border: '#38bdf8' },
  { solid: '#16a34a', soft: 'rgba(22,163,74,0.13)',   text: '#14532d', border: '#4ade80' },
  { solid: '#9333ea', soft: 'rgba(147,51,234,0.13)',  text: '#581c87', border: '#c084fc' },
  { solid: '#b45309', soft: 'rgba(180,83,9,0.13)',    text: '#78350f', border: '#fbbf24' },
];
type Pal = typeof PALETTE[number];
function venueInitials(name: string): string {
  const w = name.trim().split(/\s+/);
  if (w.length === 1) return name.slice(0, 2).toUpperCase();
  return (w[0][0] + w[w.length - 1][0]).toUpperCase();
}

// ─── Types (exported — consumed by page.tsx + CalendarLegend) ────────────────

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

export interface CreateBookingArgs {
  date?: string; hallId?: string; slot?: string;
}

export interface VenueTimelineBoardProps {
  rows: TimelineHallRow[]; viewMode: 'day' | 'week' | 'month';
  viewDate: Date; weekDays: Date[]; selectedDate: string;
  onBookingClick: (id: string) => void;
  onCreateBooking: (args?: CreateBookingArgs) => void;
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
function fmtH(h: number) { if(h===12)return'12p'; if(h===0||h===24)return'12a'; return h>12?`${h-12}p`:`${h}a`; }
function fmtMins(m: number) { const h=Math.floor(m/60),mn=m%60; return `${h>12?h-12:h===0?12:h}:${String(mn).padStart(2,'0')}${h>=12?'pm':'am'}`; }
function pencilCD(exp?: string|null) {
  if(!exp)return'PENCIL'; const ms=new Date(exp).getTime()-Date.now();
  if(ms<=0)return'PENCIL · expired'; const h=Math.floor(ms/3600000),m=Math.floor((ms%3600000)/60000);
  return h>0?`PENCIL · ${h}h ${m}m`:`PENCIL · ${m}m`;
}

// ─── Lane assignment ──────────────────────────────────────────────────────────

interface Laned extends TimelineSlot { lane: number; totalLanes: number; ns: number; ne: number; nt: boolean; conflict: boolean }

function assignLanes(slots: TimelineSlot[]): Laned[] {
  if (!slots.length) return [];
  const prep = slots.map((s,i) => { const [ns,ne]=norm(s.startMinutes,s.endMinutes); return {...s,ns,ne,nt:noTime(s.startMinutes,s.endMinutes),_i:i}; });
  const sorted=[...prep].sort((a,b)=>a.ns-b.ns);
  const ends:number[]=[];
  const wl=sorted.map(s=>{ let lane=ends.findIndex(e=>e<=s.ns); if(lane===-1)lane=ends.length; ends[lane]=s.ne; return{...s,lane}; });
  const total=ends.length;
  // Conflict = this slot's time range overlaps any other slot in the same set.
  const conflictIdx = new Set<number>();
  for (let a=0;a<prep.length;a++) for (let b=a+1;b<prep.length;b++) {
    if (prep[a].ns < prep[b].ne && prep[b].ns < prep[a].ne) { conflictIdx.add(prep[a]._i); conflictIdx.add(prep[b]._i); }
  }
  return wl.map(({_i,...s})=>({...s,totalLanes:total,conflict:conflictIdx.has(_i)}));
}

// ─── Venue grouping ───────────────────────────────────────────────────────────

function useGroups(rows: TimelineHallRow[]): VenueGroup[] {
  return useMemo(() => {
    const m=new Map<string,TimelineHallRow[]>();
    for(const r of rows){const k=r.banquetName?.trim()||'Unassigned';if(!m.has(k))m.set(k,[]);m.get(k)!.push(r);}
    return Array.from(m.entries()).map(([name,halls],idx)=>({name,pal:PALETTE[idx%PALETTE.length],halls}));
  },[rows]);
}

// ─── Shared style atoms ───────────────────────────────────────────────────────

const BD = '1px solid var(--border)';
const BD_INNER = '1px solid var(--border-2)';
// Translucent accent (var-safe alternative to `${hex}80`).
const softBorder = (accent: string) => `color-mix(in srgb, ${accent} 50%, transparent)`;
const tint = (color: string, pct: number) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

// Scoped CSS for hover/elevation/transitions. Injected once at the board root so
// interactions are GPU-smooth and don't trigger per-pointer React re-renders.
const BOARD_CSS = `
.vtb{--vtb-ease:var(--motion-ease,cubic-bezier(.25,.46,.45,.94))}
.vtb-bar{transition:box-shadow .15s var(--vtb-ease),transform .15s var(--vtb-ease),filter .15s var(--vtb-ease)}
.vtb-bar:hover{transform:translateY(-1px);box-shadow:0 6px 16px rgba(15,23,42,.18);filter:brightness(1.03);z-index:6}
.vtb-bar:focus-visible{outline:2px solid var(--teal-500);outline-offset:1px}
.vtb-pill{transition:transform .14s var(--vtb-ease),box-shadow .14s var(--vtb-ease),border-color .14s var(--vtb-ease)}
.vtb-pill:hover{transform:translateX(2px);box-shadow:0 3px 10px rgba(15,23,42,.12);z-index:2}
.vtb-chip{transition:transform .14s var(--vtb-ease),box-shadow .14s var(--vtb-ease),filter .14s var(--vtb-ease)}
.vtb-chip:hover{transform:translateY(-1px);box-shadow:0 5px 14px rgba(15,23,42,.16);filter:brightness(1.03);z-index:3}
.vtb-empty{transition:background .14s var(--vtb-ease),border-color .14s var(--vtb-ease)}
.vtb-empty:hover{background:var(--surface-2)}
.vtb-empty .vtb-plus{opacity:0;transition:opacity .14s var(--vtb-ease)}
.vtb-empty:hover .vtb-plus{opacity:1}
.vtb-venue{transition:background .12s var(--vtb-ease)}
.vtb-venue:hover{background:var(--surface-3)}
.vtb-nav{transition:background .12s var(--vtb-ease)}
.vtb-tile{transition:background .12s var(--vtb-ease),box-shadow .12s var(--vtb-ease)}
.vtb-tile:hover{box-shadow:inset 0 0 0 1.5px var(--teal-500)}
.vtb-mcard{transition:transform .14s var(--vtb-ease),box-shadow .14s var(--vtb-ease)}
.vtb-mcard:active{transform:scale(.985)}
@media (prefers-reduced-motion:reduce){.vtb *{transition:none!important}}
`;
function BoardStyles() { return <style dangerouslySetInnerHTML={{ __html: BOARD_CSS }} />; }

function Chevron({open}:{open:boolean}) {
  return (
    <svg width={9} height={9} viewBox="0 0 11 11" fill="none"
      style={{transform:open?'rotate(90deg)':'none',transition:'transform .15s var(--motion-ease)',flexShrink:0,color:'var(--text-4)'}}>
      <path d="M3 2l5 3.5L3 9" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// Tiny occupancy meter (busy/total) used in venue header cells.
function OccMeter({busy,total,color}:{busy:number;total:number;color:string}) {
  const pct = total > 0 ? Math.round((busy/total)*100) : 0;
  return (
    <div style={{height:3,borderRadius:2,background:'var(--surface-3)',overflow:'hidden',marginTop:3}}>
      <div style={{height:'100%',width:`${pct}%`,background:color,borderRadius:2,transition:'width .25s var(--motion-ease)'}}/>
    </div>
  );
}

function GridLines() {
  return <>{HOURS.map(h=>(
    <div key={h} style={{position:'absolute',left:`${pL(h*60)}%`,top:0,bottom:0,width:1,background:'var(--border)',opacity:h%2?.35:.6,pointerEvents:'none'}}/>
  ))}</>;
}

// Alternating slot band tint for vertical rhythm.
function SlotBands() {
  return <>{SLOTS.map((sl,i)=>i%2===1?(
    <div key={sl.id} style={{position:'absolute',left:`${pL(sl.startH*60)}%`,width:`${pW(sl.startH*60,sl.endH*60)}%`,top:0,bottom:0,background:'var(--surface-2)',opacity:.4,pointerEvents:'none'}}/>
  ):null)}</>;
}

function NowLine() {
  const n=new Date(),m=n.getHours()*60+n.getMinutes();
  if(m<SH_MIN||m>EH_MIN)return null;
  return (
    <div style={{position:'absolute',left:`${pL(m)}%`,top:0,bottom:0,width:2,background:'rgb(239,68,68)',zIndex:5,pointerEvents:'none',boxShadow:'0 0 8px rgba(239,68,68,.5)'}}>
      <div style={{position:'absolute',top:-2,left:-3,width:8,height:8,borderRadius:'50%',background:'rgb(239,68,68)',boxShadow:'0 0 0 3px rgba(239,68,68,.2)'}}/>
    </div>
  );
}

// ─── Hover tooltip ──────────────────────────────────────────────────────────

function TooltipRow({label,val}:{label:string;val:string}) {
  return (
    <div style={{display:'flex',gap:8,marginBottom:3,alignItems:'flex-start'}}>
      <span style={{color:'#94a3b8',width:38,flexShrink:0,fontSize:10,fontWeight:600,textTransform:'uppercase',letterSpacing:'.03em'}}>{label}</span>
      <span style={{color:'#e2e8f0',flex:1,fontWeight:500}}>{val}</span>
    </div>
  );
}

function Tooltip({s,x,y}:{s:Laned;x:number;y:number}) {
  const isPencil=s.isPencilBooking||s.status==='pencil';
  const st=statusOf(s.status);
  const flip=typeof window!=='undefined'&&y>window.innerHeight-170;
  return (
    <div style={{
      position:'fixed',left:Math.min(x+14,(typeof window!=='undefined'?window.innerWidth:9999)-256),top:flip?y-156:y+12,zIndex:9999,
      background:'rgba(15,23,42,.97)',color:'#fff',borderRadius:12,padding:'11px 13px',
      fontSize:11,boxShadow:'0 12px 32px rgba(0,0,0,.4)',minWidth:200,maxWidth:248,
      pointerEvents:'none',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,.08)',
    }}>
      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:7}}>
        <span style={{width:8,height:8,borderRadius:3,background:st.accent,flexShrink:0,boxShadow:`0 0 0 3px ${tint(st.accent,25)}`}}/>
        <span style={{fontSize:9,fontWeight:800,letterSpacing:'.06em',textTransform:'uppercase',color:'#cbd5e1'}}>{isPencil?pencilCD(s.pencilExpiresAt):st.label}</span>
      </div>
      <div style={{fontWeight:800,fontSize:13,marginBottom:7,color:'#f8fafc',lineHeight:1.3}}>{s.functionName}</div>
      {s.customerName&&<TooltipRow label="Client" val={s.customerName}/>}
      {s.functionType&&<TooltipRow label="Event" val={s.functionType}/>}
      <TooltipRow label="Time" val={`${fmtMins(s.ns)} – ${fmtMins(s.ne)}`}/>
      {!!s.guests&&<TooltipRow label="Pax" val={`${s.guests} guests`}/>}
      <div style={{marginTop:7,paddingTop:7,borderTop:'1px solid rgba(255,255,255,.1)',fontSize:9,color:'#64748b',fontWeight:600}}>Click to open full details →</div>
    </div>
  );
}

// ─── Booking bar (day timeline) ───────────────────────────────────────────────

function Bar({s,pal,rh,onClick}:{s:Laned;pal:Pal;rh:number;onClick:()=>void}) {
  const [tip,setTip]=useState<{x:number;y:number}|null>(null);
  const isPencil=s.isPencilBooking||s.status==='pencil';
  const laneH=(rh-7)/s.totalLanes, top=4+s.lane*laneH, h=laneH-2;
  const st=statusOf(s.status);

  return (
    <>
      <button type="button" onClick={onClick} className="vtb-bar"
        onMouseEnter={e=>setTip({x:e.clientX,y:e.clientY})}
        onMouseMove={e=>setTip({x:e.clientX,y:e.clientY})}
        onMouseLeave={()=>setTip(null)}
        style={{
          position:'absolute',left:`${pL(s.ns)}%`,width:`${pW(s.ns,s.ne)}%`,
          top,height:h,minWidth:4,borderRadius:7,overflow:'hidden',cursor:'pointer',zIndex:2,
          display:'flex',flexDirection:'column',justifyContent:'center',padding:'0 7px 0 8px',
          textAlign:'left',color:st.text,
          background:st.bg,backgroundImage:isPencil?STRIPE:undefined,
          border:s.conflict?`1.5px solid ${CONFLICT}`:isPencil?`1.5px dashed ${st.accent}`:`1px solid ${softBorder(st.accent)}`,
          borderLeft:`4px solid ${pal.solid}`,
          boxShadow:s.conflict?`0 0 0 2px ${tint(CONFLICT,30)}`:'0 1px 2px rgba(15,23,42,.06)',
        }}
      >
        {h>=12&&<>
          {isPencil&&h>=24&&<span style={{fontSize:8,fontWeight:800,letterSpacing:'.04em',lineHeight:1.3,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',color:st.text,opacity:.85}}>{pencilCD(s.pencilExpiresAt)}</span>}
          <span style={{fontSize:10.5,fontWeight:700,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',lineHeight:1.25,display:'flex',alignItems:'center',gap:4,color:st.text}}>
            {s.conflict&&<span style={{color:CONFLICT,flexShrink:0,fontSize:10}}>⚠</span>}
            <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.functionName}</span>
          </span>
          {h>=26&&<span style={{fontSize:9,opacity:.78,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',lineHeight:1.2,color:st.text,fontWeight:600}}>{[fmtMins(s.ns),s.guests?`${s.guests} pax`:s.functionType].filter(Boolean).join(' · ')}</span>}
        </>}
      </button>
      {tip&&<Tooltip s={s} x={tip.x} y={tip.y}/>}
    </>
  );
}

// ─── Frozen sidebar cells ─────────────────────────────────────────────────────

function VenueCell({name,pal,open,toggle,busyCount,totalHalls,sw,rh,z=7}:{name:string;pal:Pal;open:boolean;toggle:()=>void;busyCount:number;totalHalls:number;sw:number;rh:number;z?:number}) {
  return (
    <button type="button" onClick={toggle} className="vtb-venue"
      style={{position:'sticky',left:0,zIndex:z,width:sw,flexShrink:0,minHeight:rh,display:'flex',alignItems:'center',gap:8,padding:'0 10px',cursor:'pointer',background:'var(--surface-2)',border:'none',borderRight:BD,userSelect:'none',textAlign:'left'}}>
      <Chevron open={open}/>
      <div style={{width:28,height:28,borderRadius:8,background:pal.solid,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10.5,fontWeight:800,color:'#fff',flexShrink:0,letterSpacing:'-.02em',boxShadow:`0 2px 6px ${tint(pal.solid,40)}`}}>
        {venueInitials(name)}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:11.5,fontWeight:800,color:'var(--text-1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',letterSpacing:'-.01em'}}>{name}</div>
        {totalHalls>0&&<>
          <div style={{fontSize:9,color:'var(--text-4)',marginTop:1,fontWeight:600,fontVariantNumeric:'tabular-nums'}}>{busyCount}/{totalHalls} halls busy</div>
          <OccMeter busy={busyCount} total={totalHalls} color={pal.solid}/>
        </>}
      </div>
    </button>
  );
}

function HallCell({name,slots,sw,rh,showStatus,pal,subLine}:{name:string;slots:TimelineSlot[];sw:number;rh:number;showStatus?:boolean;pal?:Pal;subLine?:boolean}) {
  const busy=slots.length>0;
  return (
    <div style={{position:'sticky',left:0,zIndex:7,width:sw,flexShrink:0,minHeight:rh,display:'flex',alignItems:'center',padding:'0 8px 0 26px',background:'var(--surface)',borderRight:BD,gap:5,overflow:'hidden'}}>
      {pal&&<div style={{position:'absolute',left:0,top:'18%',bottom:'18%',width:4,borderRadius:'0 3px 3px 0',background:pal.solid,opacity:busy?1:.45}}/>}
      <div style={{flex:1,minWidth:0,display:'flex',flexDirection:'column',gap:1}}>
        <span style={{fontSize:subLine?11:10.5,fontWeight:subLine?700:600,color:busy?'var(--text-1)':'var(--text-3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',letterSpacing:subLine?'-.01em':undefined}}>{name}</span>
        {subLine&&<span style={{fontSize:9,color:'var(--text-4)',fontWeight:600,fontVariantNumeric:'tabular-nums'}}>{slots.length} event{slots.length!==1?'s':''}</span>}
      </div>
      {showStatus&&<div style={{flexShrink:0,padding:'2px 7px',borderRadius:999,fontSize:8,fontWeight:800,letterSpacing:'.04em',textTransform:'uppercase',background:busy?'var(--cal-cancelled-bg)':'var(--cal-confirmed-bg)',color:busy?'var(--cal-cancelled-text)':'var(--cal-confirmed-text)',border:`1px solid ${busy?softBorder('var(--cal-cancelled-accent)'):softBorder('var(--cal-confirmed-accent)')}`}}>
        {busy?'Busy':'Free'}
      </div>}
    </div>
  );
}

// ─── Desktop Day View ─────────────────────────────────────────────────────────

function DesktopDay({groups,selDate,exp,toggle,onBook,onCreate}:{
  groups:VenueGroup[];selDate:string;exp:Set<string>;toggle:(n:string)=>void;onBook:(id:string)=>void;onCreate:(args?:CreateBookingArgs)=>void;
}) {
  return (
    <div style={{overflowX:'auto'}}>
      <div style={{minWidth:D_SW+640}}>
        <div style={{display:'flex',height:D_HEAD,background:'linear-gradient(var(--surface-2),var(--surface))',borderBottom:BD,position:'sticky',top:0,zIndex:12}}>
          <div style={{position:'sticky',left:0,zIndex:13,width:D_SW,flexShrink:0,borderRight:BD,background:'var(--surface-2)',display:'flex',alignItems:'center',paddingLeft:12,fontSize:10,fontWeight:800,color:'var(--text-4)',textTransform:'uppercase',letterSpacing:'.08em'}}>Venue / Hall</div>
          <div style={{flex:1,position:'relative'}}>
            {SLOTS.map(sl=>(
              <div key={sl.id} style={{position:'absolute',left:`${pL(sl.startH*60)}%`,top:4,paddingLeft:4,fontSize:9,fontWeight:800,color:'var(--teal-600)',textTransform:'uppercase',letterSpacing:'.05em',pointerEvents:'none',userSelect:'none'}}>{sl.label}</div>
            ))}
            {HOURS.map(h=>(
              <div key={h} style={{position:'absolute',left:`${pL(h*60)}%`,bottom:3,display:'flex',alignItems:'center',paddingLeft:4,fontSize:9,fontWeight:600,color:'var(--text-4)',pointerEvents:'none',userSelect:'none',fontVariantNumeric:'tabular-nums'}}>{fmtH(h)}</div>
            ))}
          </div>
        </div>
        {groups.map(g=>{
          const open=exp.has(g.name);
          // Dedupe by bookingId: a multi-hall booking appears in each hall's slot
          // list, so flattening across halls would render it multiple times here.
          const vSlots=assignLanes(dedupeSlotsByBookingId(g.halls.flatMap(h=>h.slots.filter(s=>s.date===selDate))));
          const busyHalls=g.halls.filter(h=>h.slots.some(s=>s.date===selDate)).length;
          return (
            <React.Fragment key={g.name}>
              <div style={{display:'flex',minHeight:D_VRH,background:'var(--surface-2)',borderBottom:BD}}>
                <VenueCell name={g.name} pal={g.pal} open={open} toggle={()=>toggle(g.name)} busyCount={busyHalls} totalHalls={g.halls.length} sw={D_SW} rh={D_VRH}/>
                <div style={{flex:1,position:'relative',overflow:'visible',cursor:'crosshair',minHeight:D_VRH}}
                  onClick={e=>{if((e.target as Element).tagName==='DIV'&&vSlots.length===0)onCreate({date:selDate});}}>
                  <SlotBands/><GridLines/><NowLine/>
                  {vSlots.map((s,si)=><Bar key={`${s.bookingId||s.functionName}-${s.date}-${si}`} s={{...s,conflict:false}} pal={g.pal} rh={D_VRH} onClick={()=>s.bookingId&&onBook(s.bookingId)}/>)}
                </div>
              </div>
              {open&&g.halls.map((hall,i)=>{
                const hSlots=assignLanes(hall.slots.filter(s=>s.date===selDate));
                return (
                  <div key={hall.hallName} style={{display:'flex',minHeight:D_HRH,background:'var(--surface)',borderBottom:i===g.halls.length-1?BD:BD_INNER}}>
                    <HallCell name={hall.hallName} slots={hall.slots.filter(s=>s.date===selDate)} sw={D_SW} rh={D_HRH} showStatus/>
                    <div style={{flex:1,position:'relative',overflow:'visible',cursor:'crosshair',minHeight:D_HRH}}
                      onClick={e=>{if((e.target as Element).tagName==='DIV'&&hSlots.length===0)onCreate({date:selDate,hallId:hall.hallId});}}>
                      <SlotBands/><GridLines/><NowLine/>
                      {hSlots.length===0&&(
                        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none'}}>
                          <span style={{fontSize:9,color:'var(--text-4)',fontStyle:'italic',opacity:.7}}>Free — click to create booking</span>
                        </div>
                      )}
                      {hSlots.map((s,si)=><Bar key={`${hall.hallId||hall.hallName}-${s.bookingId||s.functionName}-${s.date}-${si}`} s={s} pal={g.pal} rh={D_HRH} onClick={()=>s.bookingId&&onBook(s.bookingId)}/>)}
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

// ─── Desktop Week View (halls × 7 days, 4-slot matrix) ───────────────────────
// Each hall row × day cell is a 4-row grid (Morning/Lunch/Evening/Dinner). A
// booking lands in a slot by bucketSlot(startMinutes). >1 booking in the same
// hall+day+slot ⇒ conflict. Empty slot = faint placeholder that drills in.

function WeekSlotChip({s,pal,conflict,onBook}:{s:TimelineSlot;pal:Pal;conflict:boolean;onBook:(id:string)=>void}) {
  const st=statusOf(s.status);
  const isPencil=s.isPencilBooking||s.status==='pencil';
  const slot=bucketSlot(s.startMinutes);
  return (
    <button type="button" className="vtb-chip"
      onClick={e=>{e.stopPropagation();s.bookingId&&onBook(s.bookingId);}}
      title={`${s.functionName}${s.customerName?` · ${s.customerName}`:''}`}
      style={{
        background:st.bg,color:st.text,
        backgroundImage:isPencil?STRIPE:undefined,
        border:conflict?`1.5px solid ${CONFLICT}`:isPencil?`1px dashed ${st.accent}`:`1px solid ${softBorder(st.accent)}`,
        borderLeft:`3px solid ${pal.solid}`,
        borderRadius:6,padding:'3px 6px',display:'flex',flexDirection:'column',gap:1,
        minHeight:0,overflow:'hidden',cursor:'pointer',textAlign:'left',width:'100%',height:'100%',justifyContent:'center',
        boxShadow:conflict?`0 0 0 1.5px ${tint(CONFLICT,30)}`:undefined,
      }}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:2}}>
        <span style={{fontSize:8,fontWeight:800,opacity:.6,textTransform:'uppercase',letterSpacing:'.04em'}}>{slot?.label.slice(0,3)}</span>
        {conflict&&<span style={{color:CONFLICT,flexShrink:0,lineHeight:1}}>⚠</span>}
      </div>
      <div style={{fontSize:10,fontWeight:800,lineHeight:1.15,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.functionName}</div>
      {s.customerName&&<div style={{fontSize:9,opacity:.8,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontWeight:600}}>{s.customerName}</div>}
    </button>
  );
}

function WeekMatrixCell({slots,pal,today,onBook,onEmptyClick,aggregate}:{
  slots:TimelineSlot[];pal:Pal;today:boolean;onBook:(id:string)=>void;onEmptyClick?:(slotId:string)=>void;aggregate?:boolean;
}) {
  // Bucket this day's slots into the 4 SLOTS. In aggregate (venue-row) mode the
  // same multi-hall booking appears once per hall, so dedupe by bookingId first.
  const byBucket=useMemo(()=>{
    const source=aggregate?dedupeSlotsByBookingId(slots):slots;
    const m=new Map<string,TimelineSlot[]>();
    for(const s of source){const b=bucketSlot(s.startMinutes);if(!b)continue;if(!m.has(b.id))m.set(b.id,[]);m.get(b.id)!.push(s);}
    return m;
  },[slots,aggregate]);
  return (
    <div style={{flex:1,borderLeft:BD,background:today?tint('#ef4444',5):undefined,display:'grid',gridTemplateRows:'repeat(4,1fr)',padding:3,gap:3,minWidth:0}}>
      {SLOTS.map(slot=>{
        const list=byBucket.get(slot.id)||[];
        const b=list[0];
        // Aggregate (venue header) rows mix halls, so >1 here isn't a real
        // overbooking — only flag conflicts within a single hall's cell.
        const conflict=!aggregate&&list.length>1;
        if(!b) return (
          <button key={slot.id} type="button" className="vtb-empty" onClick={()=>onEmptyClick?.(slot.id)} title={`${slot.label} — click to add`}
            style={{borderRadius:5,background:'var(--cal-hatch)',border:'1px dashed transparent',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 6px',cursor:onEmptyClick?'pointer':'default'}}>
            <span style={{fontSize:8.5,color:'var(--text-4)',fontWeight:800,textTransform:'uppercase',letterSpacing:'.04em'}}>{slot.label.slice(0,3)}</span>
            <span className="vtb-plus" style={{fontSize:12,color:'var(--teal-600)',fontWeight:700,lineHeight:1}}>+</span>
          </button>
        );
        return <WeekSlotChip key={slot.id} s={b} pal={pal} conflict={conflict} onBook={onBook}/>;
      })}
    </div>
  );
}

function DesktopWeek({groups,wdays,exp,toggle,onBook,onCreate,onDrill}:{
  groups:VenueGroup[];wdays:Date[];exp:Set<string>;toggle:(n:string)=>void;onBook:(id:string)=>void;onCreate:(args?:CreateBookingArgs)=>void;onDrill?:(d:string)=>void;
}) {
  return (
    <div style={{overflowX:'auto'}}>
      <div style={{minWidth:D_SW+wdays.length*124}}>
        <div style={{display:'flex',height:48,background:'linear-gradient(var(--surface-2),var(--surface))',borderBottom:BD,position:'sticky',top:0,zIndex:12}}>
          <div style={{position:'sticky',left:0,zIndex:13,width:D_SW,flexShrink:0,borderRight:BD,background:'var(--surface-2)',display:'flex',alignItems:'center',paddingLeft:12,fontSize:10,fontWeight:800,color:'var(--text-4)',textTransform:'uppercase',letterSpacing:'.08em'}}>Venue / Hall</div>
          {wdays.map(day=>{
            const tod=isToday(day);
            return (
              <button key={dk(day)} type="button" className="vtb-nav"
                onClick={()=>onDrill?.(dk(day))}
                title={onDrill?'Click to see day view':undefined}
                style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',borderLeft:BD,background:tod?tint('#ef4444',6):undefined,cursor:onDrill?'pointer':'default',border:'none',padding:'4px 0',position:'relative'}}
              >
                {tod&&<div style={{position:'absolute',left:0,right:0,bottom:-1,height:2.5,background:'rgb(239,68,68)'}}/>}
                <span style={{fontSize:9,fontWeight:800,textTransform:'uppercase',letterSpacing:'.07em',color:tod?'rgb(239,68,68)':'var(--text-4)',lineHeight:1}}>{day.toLocaleDateString('en-IN',{weekday:'short'})}</span>
                <div style={{fontSize:16,fontWeight:tod?800:700,width:tod?26:undefined,height:tod?26:undefined,borderRadius:tod?'50%':undefined,background:tod?'rgb(239,68,68)':undefined,color:tod?'#fff':'var(--text-2)',display:'flex',alignItems:'center',justifyContent:'center',marginTop:3,fontVariantNumeric:'tabular-nums',boxShadow:tod?'0 2px 6px rgba(239,68,68,.35)':undefined}}>{day.getDate()}</div>
              </button>
            );
          })}
        </div>
        {groups.map(g=>{
          const open=exp.has(g.name);
          const busyHalls=g.halls.filter(h=>wdays.some(d=>h.slots.some(s=>s.date===dk(d)))).length;
          return (
            <React.Fragment key={g.name}>
              <div style={{display:'flex',minHeight:D_VRH,background:'var(--surface-2)',borderBottom:BD}}>
                <VenueCell name={g.name} pal={g.pal} open={open} toggle={()=>toggle(g.name)} busyCount={busyHalls} totalHalls={g.halls.length} sw={D_SW} rh={D_VRH}/>
                {wdays.map(day=><WeekMatrixCell key={dk(day)} slots={g.halls.flatMap(h=>h.slots.filter(s=>s.date===dk(day)))} pal={g.pal} today={isToday(day)} onBook={onBook} onEmptyClick={(slotId)=>onCreate({date:dk(day),slot:slotId})} aggregate/>)}
              </div>
              {open&&g.halls.map((hall,i)=>(
                <div key={hall.hallName} style={{display:'flex',minHeight:WEEK_HRH,background:'var(--surface)',borderBottom:i===g.halls.length-1?BD:BD_INNER}}>
                  <HallCell name={hall.hallName} slots={wdays.flatMap(d=>hall.slots.filter(s=>s.date===dk(d)))} sw={D_SW} rh={WEEK_HRH} pal={g.pal} subLine/>
                  {wdays.map(day=><WeekMatrixCell key={dk(day)} slots={hall.slots.filter(s=>s.date===dk(day))} pal={g.pal} today={isToday(day)} onBook={onBook} onEmptyClick={(slotId)=>onCreate({date:dk(day),hallId:hall.hallId,slot:slotId})}/>)}
                </div>
              ))}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ─── Desktop Month View (7×6 calendar grid) ──────────────────────────────────

interface MonthDaySlot extends TimelineSlot { pal:Pal; hallKey:string }

function MonthDayTile({day,inMonth,groups,onBook,onDrill,onCreate}:{
  day:Date;inMonth:boolean;groups:VenueGroup[];onBook:(id:string)=>void;onDrill?:(d:string)=>void;onCreate:(args?:CreateBookingArgs)=>void;
}) {
  const iso=dk(day);
  const tod=isToday(day);
  const dow=day.getDay();
  const wknd=dow===0||dow===6;

  // Flatten this day's bookings across all groups/halls, tagged with palette +
  // hall key, sorted by start time. Dedupe by bookingId so a multi-hall booking
  // only shows once.
  const seen=new Set<string>();
  const list:MonthDaySlot[]=groups.flatMap(g=>g.halls.flatMap(h=>
    h.slots.filter(s=>s.date===iso).map(s=>({...s,pal:g.pal,hallKey:h.hallId||h.hallName}))
  )).filter(s=>{
    const key=s.bookingId||`${s.functionName}|${s.startMinutes}|${s.hallKey}`;
    if(seen.has(key))return false;
    seen.add(key);
    return true;
  }).sort((a,b)=>a.startMinutes-b.startMinutes);
  const n=list.length;

  // Conflict (month): within a single hall, >1 booking in the same bucketSlot.
  const conflictKeys=new Map<string,number>();
  for(const s of list){const b=bucketSlot(s.startMinutes);if(b)conflictKeys.set(`${s.hallKey}|${b.id}`,(conflictKeys.get(`${s.hallKey}|${b.id}`)||0)+1);}
  const isConflict=(s:MonthDaySlot)=>{const b=bucketSlot(s.startMinutes);return!!b&&(conflictKeys.get(`${s.hallKey}|${b.id}`)||0)>1;};
  const anyConflict=list.some(isConflict);

  // Hall-composition strip: one segment per venue GROUP with ≥1 booking today.
  const busyGroups=groups.filter(g=>g.halls.some(h=>h.slots.some(s=>s.date===iso)));

  const bg=!inMonth?'var(--surface-2)':tod?tint('#14b8a6',7):'var(--surface)';
  const visible=list.slice(0,3);
  const extra=n-visible.length;

  return (
    <div className="vtb-tile"
      onClick={inMonth?()=>onCreate({date:iso}):undefined}
      style={{
        borderRight:BD,borderBottom:BD,padding:'5px 6px 6px',background:bg,
        opacity:inMonth?1:.5,display:'flex',flexDirection:'column',gap:3,minHeight:0,
        overflow:'hidden',cursor:inMonth?'pointer':'default',position:'relative',
      }}>
      {/* Hall-composition strip */}
      <div style={{display:'flex',gap:1.5,height:3,flexShrink:0}}>
        {busyGroups.map(g=>(
          <div key={g.name} style={{flex:1,borderRadius:2,background:g.pal.solid,opacity:.9}}/>
        ))}
      </div>
      {/* Date number + count */}
      <div style={{display:'flex',alignItems:'center',gap:5,flexShrink:0}}>
        <button type="button"
          onClick={inMonth&&onDrill?(e)=>{e.stopPropagation();onDrill(iso);}:undefined}
          style={{
            border:'none',background:tod?'var(--teal-600)':'transparent',
            display:'inline-flex',alignItems:'center',justifyContent:'center',
            minWidth:tod?22:18,height:tod?22:18,padding:tod?'0 6px':0,
            borderRadius:tod?999:0,cursor:inMonth&&onDrill?'pointer':'default',
            fontSize:tod?13:13,fontWeight:800,fontVariantNumeric:'tabular-nums',lineHeight:1,
            color:tod?'#fff':wknd?'rgb(220,38,38)':'var(--text-1)',
            boxShadow:tod?'0 2px 6px rgba(13,148,136,.35)':undefined,
          }}>{day.getDate()}</button>
        {n>0&&<span style={{fontSize:9.5,color:'var(--text-4)',fontWeight:700,fontVariantNumeric:'tabular-nums'}}>{n} event{n!==1?'s':''}</span>}
        {anyConflict&&<span title="Overlapping bookings in the same hall on this day" style={{marginLeft:'auto',fontSize:10,color:CONFLICT,fontWeight:800,lineHeight:1}}>⚠</span>}
      </div>
      {/* Booking pills */}
      <div style={{display:'flex',flexDirection:'column',gap:2.5,overflow:'hidden',flex:1}}>
        {visible.map((s,i)=>{
          const p=s.isPencilBooking||s.status==='pencil';
          const st=statusOf(s.status);
          const conflict=isConflict(s);
          return (
            <button key={s.bookingId||i} type="button" className="vtb-pill"
              onClick={e=>{e.stopPropagation();s.bookingId&&onBook(s.bookingId);}}
              title={[s.functionName,s.customerName,s.functionType].filter(Boolean).join(' · ')}
              style={{display:'flex',flexDirection:'column',gap:0,padding:'3px 6px',borderRadius:6,background:'var(--surface)',backgroundImage:p?STRIPE:undefined,border:conflict?`1px solid ${CONFLICT}`:p?`1.5px dashed ${st.accent}`:`1px solid ${softBorder(st.accent)}`,borderLeft:`3px solid ${s.pal.solid}`,boxShadow:conflict?`0 0 0 1.5px ${tint(CONFLICT,30)}`:'0 1px 1px rgba(15,23,42,.04)',cursor:'pointer',textAlign:'left',overflow:'hidden',flexShrink:0,position:'relative'}}>
              <span style={{display:'flex',alignItems:'center',gap:4,minWidth:0}}>
                <span style={{width:5,height:5,borderRadius:'50%',background:st.accent,flexShrink:0}}/>
                <span style={{fontSize:10,fontWeight:800,color:'var(--text-1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',lineHeight:1.2,flex:1}}>{s.functionName}</span>
                {conflict&&<span style={{color:CONFLICT,flexShrink:0,lineHeight:1,fontSize:10}}>⚠</span>}
              </span>
              {(s.customerName||s.functionType)&&<span style={{fontSize:9,color:'var(--text-3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',lineHeight:1.15,paddingLeft:9,fontWeight:600}}>{[fmtMins(s.startMinutes),s.customerName||s.functionType].filter(Boolean).join(' · ')}</span>}
            </button>
          );
        })}
        {extra>0&&<button type="button" className="vtb-pill" onClick={e=>{e.stopPropagation();onDrill?.(iso);}} style={{fontSize:9.5,color:'var(--teal-700)',fontWeight:800,marginTop:1,paddingLeft:3,background:'none',border:'none',textAlign:'left',cursor:'pointer'}}>+ {extra} more</button>}
      </div>
    </div>
  );
}

function DesktopMonth({groups,vdate,exp,toggle,onBook,onDrill,onCreate}:{
  groups:VenueGroup[];vdate:Date;exp:Set<string>;toggle:(n:string)=>void;onBook:(id:string)=>void;onDrill?:(d:string)=>void;onCreate:(args?:CreateBookingArgs)=>void;
}) {
  void exp; void toggle; // unused in calendar-grid month view (kept for caller stability)
  const yr=vdate.getFullYear(),mo=vdate.getMonth();
  const first=new Date(yr,mo,1);
  const start=new Date(yr,mo,1-first.getDay());
  const days=Array.from({length:42},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return d;});
  const headers=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  return (
    <div style={{display:'flex',flexDirection:'column',width:'100%'}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',background:'linear-gradient(var(--surface-2),var(--surface))',borderBottom:BD}}>
        {headers.map((h,i)=>(
          <div key={h} style={{padding:'9px 12px',fontSize:10.5,fontWeight:800,letterSpacing:'.1em',textTransform:'uppercase',color:(i===0||i===6)?'rgb(220,38,38)':'var(--text-3)',borderRight:i<6?BD:'none'}}>{h}</div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gridTemplateRows:'repeat(6,minmax(112px,1fr))',background:'var(--surface)',minHeight:0}}>
        {days.map((day,i)=>(
          <MonthDayTile key={i} day={day} inMonth={day.getMonth()===mo} groups={groups} onBook={onBook} onDrill={onDrill} onCreate={onCreate}/>
        ))}
      </div>
    </div>
  );
}

// ─── Mobile Day View (slot-grouped agenda) ───────────────────────────────────

const SLOT_RANGE: Record<string,string> = {
  morning:'9 AM–12 PM', lunch:'12–4 PM', evening:'4–7 PM', dinner:'7–10 PM',
};

interface DaySlot extends TimelineSlot { pal:Pal; hallName:string; hallId?:string }

function MobileDay({groups,selDate,onBook,onCreate}:{
  groups:VenueGroup[];selDate:string;exp:Set<string>;toggle:(n:string)=>void;onBook:(id:string)=>void;onCreate:(args?:CreateBookingArgs)=>void;
}) {
  const dayBks:DaySlot[]=groups.flatMap(g=>g.halls.flatMap(h=>
    h.slots.filter(s=>s.date===selDate).map(s=>({...s,pal:g.pal,hallName:h.hallName,hallId:h.hallId}))
  )).sort((a,b)=>a.startMinutes-b.startMinutes);

  const d=new Date(selDate+'T00:00:00');
  const tod=isToday(d);
  const weekday=d.toLocaleDateString('en-IN',{weekday:'long'});
  const dateLabel=d.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});

  const conflictKeys=useMemo(()=>{
    const counts=new Map<string,number>();
    for(const b of dayBks){const sl=bucketSlot(b.startMinutes);if(!sl)continue;const k=`${b.hallId||b.hallName}|${sl.id}`;counts.set(k,(counts.get(k)||0)+1);}
    return new Set(Array.from(counts.entries()).filter(([,n])=>n>1).map(([k])=>k));
  },[dayBks]);
  const isConflict=(b:DaySlot)=>{const sl=bucketSlot(b.startMinutes);return!!sl&&conflictKeys.has(`${b.hallId||b.hallName}|${sl.id}`);};
  const hasConflict=conflictKeys.size>0;

  const occupancy=useMemo(()=>{
    const m=new Map<string,{name:string;pal:Pal;count:number}>();
    for(const g of groups)for(const h of g.halls){
      const c=h.slots.filter(s=>s.date===selDate).length;
      if(c>0){const k=h.hallId||h.hallName;m.set(k,{name:h.hallName,pal:g.pal,count:c});}
    }
    return Array.from(m.values());
  },[groups,selDate]);

  const grouped=SLOTS.map(sl=>({slot:sl,list:dayBks.filter(b=>bucketSlot(b.startMinutes)?.id===sl.id)}));

  return (
    <div style={{width:'100%',overflowX:'hidden',display:'flex',flexDirection:'column'}}>
      <div style={{padding:'13px 15px 11px',background:'linear-gradient(var(--surface-2),var(--surface))',borderBottom:BD}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:10}}>
          <div>
            <p style={{fontSize:11,fontWeight:800,color:'var(--teal-600)',textTransform:'uppercase',letterSpacing:'.08em',margin:0}}>{tod?`Today · ${weekday}`:weekday}</p>
            <p style={{fontSize:22,fontWeight:800,color:'var(--text-1)',letterSpacing:'-.02em',lineHeight:1.1,margin:'2px 0 0'}}>{dateLabel}</p>
          </div>
          <div style={{textAlign:'right',flexShrink:0,marginTop:2}}>
            <p style={{fontSize:20,fontWeight:800,color:'var(--text-1)',fontVariantNumeric:'tabular-nums',margin:0,lineHeight:1}}>{dayBks.length}</p>
            <p style={{fontSize:10,fontWeight:700,color:'var(--text-4)',textTransform:'uppercase',letterSpacing:'.05em',margin:'2px 0 0'}}>booking{dayBks.length!==1?'s':''}</p>
          </div>
        </div>
        {occupancy.length>0&&(
          <div style={{display:'flex',gap:7,marginTop:11,flexWrap:'wrap'}}>
            {occupancy.map(o=>(
              <div key={o.name} style={{display:'flex',alignItems:'center',gap:5,padding:'4px 9px',borderRadius:999,background:o.pal.soft,border:`1px solid ${tint(o.pal.border,40)}`}}>
                <span style={{width:6,height:6,borderRadius:'50%',background:o.pal.solid,flexShrink:0}}/>
                <span style={{fontSize:11,fontWeight:700,color:o.pal.solid,whiteSpace:'nowrap'}}>{o.name}</span>
                <span style={{fontSize:10.5,fontWeight:800,color:'#fff',background:o.pal.solid,borderRadius:999,padding:'0 6px',fontVariantNumeric:'tabular-nums'}}>{o.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {hasConflict&&(
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'9px 15px',background:'var(--cal-conflict-bg)',borderBottom:'1px solid var(--cal-conflict-border)',fontSize:12,fontWeight:700,color:'var(--cal-conflict-text)'}}>
          <span style={{flexShrink:0}}>⚠</span>
          {conflictKeys.size===1?'A hall has a double-booked slot on this date':`${conflictKeys.size} slots are double-booked on this date`}
        </div>
      )}

      <div style={{flex:1,padding:'12px 12px 8px'}}>
        {dayBks.length===0?(
          <div style={{padding:'32px 16px',textAlign:'center'}}>
            <p style={{fontSize:13,color:'var(--text-4)',marginBottom:12}}>No bookings on this day</p>
            <button type="button" onClick={()=>onCreate({date:selDate})} style={{fontSize:12,fontWeight:700,color:'#fff',background:'var(--teal-600)',border:'none',borderRadius:10,padding:'9px 22px',cursor:'pointer',boxShadow:'0 2px 8px rgba(13,148,136,.3)'}}>Create Booking</button>
          </div>
        ):grouped.map(g=>g.list.length===0?null:(
          <div key={g.slot.id} style={{marginBottom:16}}>
            <div style={{display:'flex',alignItems:'flex-end',gap:8,marginBottom:8}}>
              <div>
                <p style={{fontSize:9.5,fontWeight:800,color:'var(--teal-600)',textTransform:'uppercase',letterSpacing:'.08em',margin:0}}>{g.slot.label}</p>
                <p style={{fontSize:16,fontWeight:800,color:'var(--text-1)',letterSpacing:'-.02em',lineHeight:1.1,margin:'1px 0 0',fontVariantNumeric:'tabular-nums'}}>{SLOT_RANGE[g.slot.id]||''}</p>
              </div>
              <span style={{marginBottom:2,fontSize:11,color:'var(--text-4)',fontWeight:700}}>{g.list.length} event{g.list.length!==1?'s':''}</span>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {g.list.map(b=>{
                const st=statusOf(b.status);
                const isPencil=b.isPencilBooking||b.status==='pencil';
                const conflict=isConflict(b);
                return (
                  <button key={b.bookingId||b.functionName} type="button" className="vtb-mcard"
                    onClick={()=>b.bookingId&&onBook(b.bookingId)}
                    style={{
                      textAlign:'left',width:'100%',cursor:'pointer',
                      background:st.bg,borderRadius:14,
                      backgroundImage:isPencil?STRIPE:undefined,
                      border:conflict?`1.5px solid ${CONFLICT}`:isPencil?`1.5px dashed ${st.accent}`:`1.5px solid ${softBorder(st.accent)}`,
                      borderLeft:`5px solid ${b.pal.solid}`,
                      padding:'11px 13px',display:'flex',flexDirection:'column',gap:6,
                      boxShadow:'0 1px 3px rgba(15,23,42,.06)',
                    }}>
                    {isPencil&&<span style={{fontSize:8.5,fontWeight:800,letterSpacing:'.04em',color:st.text,lineHeight:1.3}}>{pencilCD(b.pencilExpiresAt)}</span>}
                    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8}}>
                      <span style={{fontSize:14,fontWeight:800,color:'var(--text-1)',lineHeight:1.2,flex:1}}>{b.functionName}</span>
                      <span style={{fontSize:9.5,fontWeight:800,padding:'3px 8px',borderRadius:999,background:st.bg,color:st.text,flexShrink:0,textTransform:'uppercase',letterSpacing:'.04em',border:`1px solid ${softBorder(st.accent)}`}}>{st.label}</span>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:10,fontSize:11.5,color:'var(--text-2)',flexWrap:'wrap',fontWeight:600}}>
                      <span style={{display:'inline-flex',alignItems:'center',gap:5}}><span style={{width:6,height:6,borderRadius:'50%',background:b.pal.solid,flexShrink:0}}/>{b.hallName}</span>
                      {b.functionType&&<span>{b.functionType}</span>}
                      {!!b.guests&&<span>{b.guests} pax</span>}
                      <span style={{marginLeft:'auto',fontWeight:800,color:'var(--text-1)',fontVariantNumeric:'tabular-nums'}}>{fmtMins(b.startMinutes)}</span>
                    </div>
                    {conflict&&<div style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:11,color:'var(--cal-conflict-text)',fontWeight:700}}>⚠ Conflict on this slot</div>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Mobile Week View (booking chips + drill-down headers) ───────────────────

function MobileWeek({groups,wdays,exp,toggle,onBook,onDrill}:{groups:VenueGroup[];wdays:Date[];exp:Set<string>;toggle:(n:string)=>void;onBook:(id:string)=>void;onDrill?:(d:string)=>void}) {
  return (
    <div style={{width:'100%',overflowX:'hidden'}}>
      <div style={{display:'flex',height:34,background:'var(--surface-2)',borderBottom:BD,position:'sticky',top:0,zIndex:10}}>
        <div style={{width:M_SW,flexShrink:0,borderRight:BD}}/>
        {wdays.map(day=>{
          const tod=isToday(day);
          return (
            <button key={dk(day)} type="button" onClick={()=>onDrill?.(dk(day))}
              style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',borderLeft:BD,background:tod?tint('#ef4444',6):undefined,cursor:'pointer',border:'none',padding:'3px 0'}}>
              <span style={{fontSize:8,color:tod?'rgb(239,68,68)':'var(--text-4)',lineHeight:1,textTransform:'uppercase',fontWeight:700}}>{day.toLocaleDateString('en-IN',{weekday:'narrow'})}</span>
              <div style={{fontSize:11,fontWeight:tod?800:600,width:tod?18:undefined,height:tod?18:undefined,borderRadius:tod?'50%':undefined,background:tod?'rgb(239,68,68)':undefined,color:tod?'#fff':'var(--text-2)',display:'flex',alignItems:'center',justifyContent:'center',fontVariantNumeric:'tabular-nums'}}>{day.getDate()}</div>
            </button>
          );
        })}
      </div>
      {groups.map(g=>{
        const open=exp.has(g.name);
        return (
          <React.Fragment key={g.name}>
            <div style={{display:'flex',minHeight:M_RH+4,background:'var(--surface-2)',borderBottom:BD}}>
              <button type="button" onClick={()=>toggle(g.name)}
                style={{width:M_SW,flexShrink:0,display:'flex',alignItems:'flex-start',gap:4,padding:'6px',cursor:'pointer',background:'transparent',border:'none',borderRight:BD,userSelect:'none',textAlign:'left'}}>
                <Chevron open={open}/>
                <div style={{width:20,height:20,borderRadius:6,background:g.pal.solid,display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:800,color:'#fff',flexShrink:0}}>{venueInitials(g.name)}</div>
              </button>
              {wdays.map(day=>{
                const d=dk(day),tod=isToday(day);
                const slots=dedupeSlotsByBookingId(g.halls.flatMap(h=>h.slots.filter(s=>s.date===d))).sort((a,b)=>a.startMinutes-b.startMinutes);
                return (
                  <div key={d} style={{flex:1,borderLeft:BD,padding:'3px 2px',display:'flex',flexDirection:'column',gap:2,background:tod?tint('#ef4444',6):undefined,minHeight:M_RH+4}}>
                    {slots.slice(0,3).map((s,si)=>{
                      const p=s.isPencilBooking||s.status==='pencil';
                      const st=statusOf(s.status);
                      return (
                        <button key={`${s.bookingId||s.functionName}-${si}`} type="button" onClick={()=>s.bookingId&&onBook(s.bookingId)}
                          style={{padding:'2px 4px',borderRadius:4,background:st.bg,backgroundImage:p?STRIPE:undefined,border:p?`1px dashed ${st.accent}`:'none',borderLeft:`2px solid ${g.pal.solid}`,cursor:'pointer',textAlign:'left',display:'flex',flexDirection:'column'}}>
                          <span style={{fontSize:8,fontWeight:800,color:st.text,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',lineHeight:1.3}}>{s.functionName}</span>
                        </button>
                      );
                    })}
                    {slots.length>3&&<span style={{fontSize:7.5,color:'var(--text-4)',paddingLeft:2,fontWeight:700}}>+{slots.length-3}</span>}
                  </div>
                );
              })}
            </div>
            {open&&g.halls.map((hall,i)=>(
              <div key={hall.hallName} style={{display:'flex',minHeight:M_RH,background:'var(--surface)',borderBottom:i===g.halls.length-1?BD:BD_INNER}}>
                <div style={{width:M_SW,flexShrink:0,display:'flex',alignItems:'flex-start',padding:'5px 6px 4px 18px',borderRight:BD,fontSize:8.5,color:'var(--text-4)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontWeight:600}}>{hall.hallName}</div>
                {wdays.map(day=>{
                  const d=dk(day),tod=isToday(day);
                  const slots=hall.slots.filter(s=>s.date===d).sort((a,b)=>a.startMinutes-b.startMinutes);
                  return (
                    <div key={d} style={{flex:1,borderLeft:BD,padding:'3px 2px',display:'flex',flexDirection:'column',gap:2,background:tod?tint('#ef4444',6):undefined,minHeight:M_RH}}>
                      {slots.slice(0,3).map((s,si)=>{
                        const p=s.isPencilBooking||s.status==='pencil';
                        const st=statusOf(s.status);
                        return (
                          <button key={`${s.bookingId||s.functionName}-${si}`} type="button" onClick={()=>s.bookingId&&onBook(s.bookingId)}
                            style={{padding:'2px 4px',borderRadius:4,background:st.bg,backgroundImage:p?STRIPE:undefined,border:p?`1px dashed ${st.accent}`:'none',borderLeft:`2px solid ${g.pal.solid}`,cursor:'pointer',textAlign:'left',display:'flex',flexDirection:'column'}}>
                            <span style={{fontSize:8,fontWeight:800,color:st.text,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',lineHeight:1.3}}>{s.functionName}</span>
                          </button>
                        );
                      })}
                      {slots.length>3&&<span style={{fontSize:7.5,color:'var(--text-4)',paddingLeft:2,fontWeight:700}}>+{slots.length-3}</span>}
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

// ─── Mobile Month View (grid top + detail bottom) ────────────────────────────

function MobileMonth({groups,vdate,onBook,onCreate,onDrill}:{groups:VenueGroup[];vdate:Date;onBook:(id:string)=>void;onCreate:(args?:CreateBookingArgs)=>void;onDrill?:(d:string)=>void}) {
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
  const selSlots=dedupeSlotsByBookingId(groups.flatMap(g=>g.halls.flatMap(h=>h.slots.filter(s=>s.date===selKey).map(s=>({...s,pal:g.pal,hallName:h.hallName}))))).sort((a,b)=>a.startMinutes-b.startMinutes);

  return (
    <div style={{display:'flex',flexDirection:'column',height:'calc(100dvh - 148px)',minHeight:480}}>
      <div style={{flexShrink:0,padding:'4px 4px 0'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',padding:'2px 4px 0'}}>
          {DOW.map((d,i)=>(<div key={i} style={{textAlign:'center',fontSize:10,fontWeight:700,color:i===0||i===6?'rgba(239,68,68,.6)':'var(--text-4)',paddingBottom:3}}>{d}</div>))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',padding:'0 3px',gap:'2px 0'}}>
          {cells.map((d,i)=>{
            if(!d)return<div key={i} style={{minHeight:48}}/>;
            const dkey=mdk(d),daySlots=dedupeSlotsByBookingId(groups.flatMap(g=>g.halls.flatMap(h=>h.slots.filter(s=>s.date===dkey))));
            const venuesHere=groups.filter(g=>g.halls.some(h=>h.slots.some(s=>s.date===dkey)));
            const cKeys=new Map<string,number>();
            let dayConflict=false;
            for(const g of groups)for(const h of g.halls)for(const s of h.slots){
              if(s.date!==dkey)continue;
              const b=bucketSlot(s.startMinutes);if(!b)continue;
              const k=`${h.hallId||h.hallName}|${b.id}`;const cnt=(cKeys.get(k)||0)+1;
              if(cnt>1){dayConflict=true;break;}
              cKeys.set(k,cnt);
            }
            const isSel=d===selDay,isTod=isCM&&d===today.getDate(),isWk=i%7===0||i%7===6;
            return (
              <button key={i} type="button" onClick={()=>{setSelDay(d);onDrill?.(dkey);}}
                style={{padding:'3px 1px',borderRadius:8,background:isSel?'var(--teal-600)':isTod?tint('#ef4444',8):'transparent',border:isTod&&!isSel?`1.5px solid ${tint('#ef4444',40)}`:'1.5px solid transparent',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:2,minHeight:48,boxShadow:isSel?'0 2px 8px rgba(13,148,136,.35)':undefined}}>
                <span style={{fontSize:12.5,fontWeight:isSel?800:isTod?700:500,color:isSel?'#fff':isTod?'rgb(239,68,68)':isWk?'rgba(239,68,68,.5)':'var(--text-2)',lineHeight:1.4,fontVariantNumeric:'tabular-nums'}}>{d}</span>
                <div style={{display:'flex',gap:2,flexWrap:'wrap',justifyContent:'center',alignItems:'center'}}>
                  {dayConflict&&<span style={{fontSize:8,color:isSel?'#fff':CONFLICT,lineHeight:1,fontWeight:800}}>⚠</span>}
                  {venuesHere.slice(0,3).map(g=>(<div key={g.name} style={{width:5,height:5,borderRadius:'50%',background:isSel?'rgba(255,255,255,.8)':g.pal.solid}}/>))}
                  {daySlots.length>3&&!isSel&&<span style={{fontSize:6.5,color:'var(--text-4)',lineHeight:1,fontWeight:700}}>+{daySlots.length-3}</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div style={{flex:1,overflowY:'auto',borderTop:BD,background:'var(--surface-2)',marginTop:6}}>
        <div style={{padding:'9px 13px 5px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,background:'var(--surface-2)',zIndex:2,borderBottom:BD}}>
          <span style={{fontSize:12.5,fontWeight:800,color:'var(--text-1)'}}>
            {new Date(yr,mo,selDay).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}
            {selSlots.length>0&&<span style={{fontSize:10,fontWeight:600,color:'var(--text-4)',marginLeft:6}}>{selSlots.length} booking{selSlots.length>1?'s':''}</span>}
          </span>
          <button type="button" onClick={()=>onCreate({date:selKey})} style={{fontSize:11,fontWeight:800,color:'var(--teal-700)',background:'var(--teal-50)',border:`1px solid ${tint('#14b8a6',35)}`,borderRadius:8,padding:'4px 11px',cursor:'pointer'}}>+ Booking</button>
        </div>
        {selSlots.length===0?(
          <div style={{padding:'26px 16px',textAlign:'center'}}>
            <p style={{fontSize:13,color:'var(--text-4)',marginBottom:12}}>No bookings on this day</p>
            <button type="button" onClick={()=>onCreate({date:selKey})} style={{fontSize:12,fontWeight:700,color:'#fff',background:'var(--teal-600)',border:'none',borderRadius:10,padding:'9px 22px',cursor:'pointer',boxShadow:'0 2px 8px rgba(13,148,136,.3)'}}>Create Booking</button>
          </div>
        ):(
          <div style={{padding:'8px 9px 16px',display:'flex',flexDirection:'column',gap:7}}>
            {selSlots.map((s,si)=>{
              const p=s.isPencilBooking||s.status==='pencil';
              const st=statusOf(s.status);
              return (
                <button key={`${s.bookingId||s.functionName}-${si}`} type="button" className="vtb-mcard" onClick={()=>s.bookingId&&onBook(s.bookingId)}
                  style={{display:'flex',alignItems:'stretch',gap:10,padding:'9px 11px',background:'var(--surface)',borderRadius:12,border:BD,borderLeft:`4px solid ${s.pal.solid}`,cursor:'pointer',textAlign:'left',boxShadow:'0 1px 3px rgba(15,23,42,.05)'}}>
                  <div style={{flex:1,minWidth:0}}>
                    {p&&<span style={{fontSize:8.5,fontWeight:800,letterSpacing:'.04em',color:st.text,display:'block',lineHeight:1.4}}>{pencilCD(s.pencilExpiresAt)}</span>}
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <span style={{width:6,height:6,borderRadius:'50%',background:st.accent,flexShrink:0}}/>
                      <p style={{fontSize:13.5,fontWeight:800,color:'var(--text-1)',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.functionName}</p>
                    </div>
                    <p style={{fontSize:11,color:'var(--text-3)',margin:'3px 0 0',paddingLeft:12,fontWeight:600}}>{[fmtMins(s.startMinutes),s.functionType,s.guests?`${s.guests} pax`:null].filter(Boolean).join(' · ')}</p>
                    <p style={{fontSize:10,color:'var(--text-4)',margin:'1px 0 0',paddingLeft:12}}>{s.hallName}</p>
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
    <div style={{position:'sticky',bottom:0,display:'flex',justifyContent:'flex-end',padding:'10px 12px',background:'var(--cal-fab-fade)',pointerEvents:'none',zIndex:6}}>
      <button type="button" onClick={()=>onClick()} style={{pointerEvents:'auto',fontSize:12.5,fontWeight:800,color:'#fff',background:'var(--teal-600)',border:'none',borderRadius:999,padding:'8px 18px',cursor:'pointer',boxShadow:'0 4px 14px rgba(13,148,136,.45)',display:'flex',alignItems:'center',gap:6}}>
        <span style={{fontSize:16,lineHeight:1}}>+</span> New Booking
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
      <button type="button" onClick={()=>onCreateBooking()} className="mt-3 text-sm font-semibold text-teal-600 underline">Create a booking</button>
    </div>
  );

  const shared={groups,exp,toggle,onBook:onBookingClick};

  return (
    <div className="vtb">
      <BoardStyles/>
      {/* Desktop */}
      <div className="venue-timeline-shell hidden sm:block border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
        {viewMode==='day'&&<DesktopDay {...shared} selDate={selectedDate} onCreate={onCreateBooking}/>}
        {viewMode==='week'&&<DesktopWeek {...shared} wdays={weekDays} onCreate={onCreateBooking} onDrill={onDateDrillDown}/>}
        {viewMode==='month'&&<DesktopMonth {...shared} vdate={viewDate} onDrill={onDateDrillDown} onCreate={onCreateBooking}/>}
        <CreateFAB onClick={onCreateBooking}/>
      </div>
      {/* Mobile */}
      <div className="sm:hidden">
        {viewMode==='day'&&<div className="border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm"><MobileDay {...shared} selDate={selectedDate} onCreate={onCreateBooking}/><CreateFAB onClick={onCreateBooking}/></div>}
        {viewMode==='week'&&<div className="border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm"><MobileWeek {...shared} wdays={weekDays} onDrill={onDateDrillDown}/><CreateFAB onClick={onCreateBooking}/></div>}
        {viewMode==='month'&&<MobileMonth groups={groups} vdate={viewDate} onBook={onBookingClick} onCreate={onCreateBooking} onDrill={onDateDrillDown}/>}
      </div>
    </div>
  );
}
