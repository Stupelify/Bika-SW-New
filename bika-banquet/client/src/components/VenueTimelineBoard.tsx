'use client';

import React, { useMemo, useState } from 'react';

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

// ─── Status colors (matches Calendar.html) ─────────────────────────────────────

interface StatusStyle { label: string; bg: string; text: string; accent: string }
// Colors read from --cal-* CSS vars (defined in globals.css) so they flip with
// the app's light/dark theme. Light values equal the original hardcoded hex.
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
  { solid: '#0284c7', soft: 'rgba(2,132,199,0.13)',   text: '#075985', border: '#38bdf8', heat: 'rgba(2,132,199,' },
  { solid: '#16a34a', soft: 'rgba(22,163,74,0.13)',   text: '#14532d', border: '#4ade80', heat: 'rgba(22,163,74,' },
  { solid: '#9333ea', soft: 'rgba(147,51,234,0.13)',  text: '#581c87', border: '#c084fc', heat: 'rgba(147,51,234,' },
  { solid: '#b45309', soft: 'rgba(180,83,9,0.13)',    text: '#78350f', border: '#fbbf24', heat: 'rgba(180,83,9,'  },
];
type Pal = typeof PALETTE[number];
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
function fmtH(h: number) { if(h===12)return'12pm'; if(h===0||h===24)return'12am'; return h>12?`${h-12}pm`:`${h}am`; }
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

// ─── Shared atoms ─────────────────────────────────────────────────────────────

const BD = '1px solid var(--border)';
const BD_INNER = '1px solid var(--border-2)';
// Translucent accent for soft status borders (var-safe alternative to `${hex}80`).
const softBorder = (accent: string) => `color-mix(in srgb, ${accent} 50%, transparent)`;

function Chevron({open}:{open:boolean}) {
  return (
    <svg width={9} height={9} viewBox="0 0 11 11" fill="none"
      style={{transform:open?'rotate(90deg)':'none',transition:'transform .15s',flexShrink:0,color:'var(--text-4)'}}>
      <path d="M3 2l5 3.5L3 9" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function GridLines() {
  return <>{HOURS.map(h=>(
    <div key={h} style={{position:'absolute',left:`${pL(h*60)}%`,top:0,bottom:0,width:1,background:'var(--border)',opacity:.5,pointerEvents:'none'}}/>
  ))}</>;
}

// Alternating subtle tint per slot band (Day view, Variant A).
function SlotBands() {
  return <>{SLOTS.map((sl,i)=>i%2===1?(
    <div key={sl.id} style={{position:'absolute',left:`${pL(sl.startH*60)}%`,width:`${pW(sl.startH*60,sl.endH*60)}%`,top:0,bottom:0,background:'var(--surface-2)',opacity:.5,pointerEvents:'none'}}/>
  ):null)}</>;
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

function Bar({s,pal,rh,onClick,useStatus}:{s:Laned;pal:Pal;rh:number;onClick:()=>void;useStatus?:boolean}) {
  const [tip,setTip]=useState<{x:number;y:number}|null>(null);
  const isPencil=s.isPencilBooking||s.status==='pencil';
  const laneH=(rh-6)/s.totalLanes, top=3+s.lane*laneH, h=laneH-2;

  let barStyle:React.CSSProperties;
  let textColor:string;
  if (useStatus) {
    // Status-colored card with hall-color left bar (Day view design).
    const st=statusOf(s.status);
    textColor=st.text;
    barStyle={
      background:st.bg,
      backgroundImage:isPencil?STRIPE:undefined,
      border:s.conflict?`1.5px solid ${CONFLICT}`:isPencil?`1.5px dashed ${st.accent}`:`1.5px solid ${softBorder(st.accent)}`,
      borderLeft:`4px solid ${pal.solid}`,
      color:st.text,
    };
  } else {
    textColor=isPencil?pal.solid:'#fff';
    barStyle=isPencil
      ?{background:'transparent',border:`1.5px dashed ${pal.solid}`,color:pal.solid}
      :s.nt?{background:`${pal.solid}66`,border:`1px dashed ${pal.border}`,color:'#fff'}
      :{background:pal.solid,color:'#fff'};
  }
  return (
    <>
      <button type="button" onClick={onClick}
        onMouseEnter={e=>setTip({x:e.clientX,y:e.clientY})}
        onMouseMove={e=>setTip({x:e.clientX,y:e.clientY})}
        onMouseLeave={()=>setTip(null)}
        style={{
          position:'absolute',left:`${pL(s.ns)}%`,width:`${pW(s.ns,s.ne)}%`,
          top,height:h,minWidth:3,borderRadius:useStatus?6:4,overflow:'hidden',cursor:'pointer',zIndex:2,
          display:'flex',flexDirection:'column',justifyContent:'center',padding:'0 5px',
          textAlign:'left',...barStyle,
        }}
      >
        {h>=13&&<>
          {isPencil&&<span style={{fontSize:8,fontWeight:700,letterSpacing:'.04em',lineHeight:1.3,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',color:textColor}}>{pencilCD(s.pencilExpiresAt)}</span>}
          <span style={{fontSize:10,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',lineHeight:1.3,display:'flex',alignItems:'center',gap:3,color:textColor}}>
            {useStatus&&s.conflict&&<span style={{color:CONFLICT,flexShrink:0}}>⚠</span>}
            <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.functionName}</span>
          </span>
          {h>=26&&<span style={{fontSize:9,opacity:.8,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',lineHeight:1.2,color:textColor}}>{[s.functionType,s.guests?`${s.guests} pax`:null].filter(Boolean).join(' · ')}</span>}
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
        <div style={{fontSize:11,fontWeight:700,color:'var(--text-1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',letterSpacing:'-.01em'}}>{name}</div>
        {totalHalls>0&&<div style={{fontSize:9,color:'var(--text-4)',marginTop:1}}>{busyCount}/{totalHalls} busy</div>}
      </div>
      {busyCount>0&&<div style={{width:16,height:16,borderRadius:'50%',background:pal.solid,display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:700,color:'#fff',flexShrink:0}}>{busyCount}</div>}
    </button>
  );
}

function HallCell({name,slots,sw,rh,showStatus,pal,subLine}:{name:string;slots:TimelineSlot[];sw:number;rh:number;showStatus?:boolean;pal?:Pal;subLine?:boolean}) {
  const busy=slots.length>0;
  return (
    <div style={{width:sw,flexShrink:0,height:rh,display:'flex',alignItems:'center',padding:'0 8px 0 24px',borderRight:BD,gap:4,position:'relative'}}>
      {pal&&<div style={{position:'absolute',left:0,top:6,bottom:6,width:4,borderRadius:'0 3px 3px 0',background:pal.solid}}/>}
      <div style={{flex:1,minWidth:0,display:'flex',flexDirection:'column',gap:1}}>
        <span style={{fontSize:subLine?11:10,fontWeight:subLine?700:400,color:subLine?'var(--text-1)':'var(--text-4)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',letterSpacing:subLine?'-.01em':undefined}}>{name}</span>
        {subLine&&<span style={{fontSize:9,color:'var(--text-4)',fontWeight:600}}>{slots.length} event{slots.length!==1?'s':''}</span>}
      </div>
      {showStatus&&<div style={{flexShrink:0,padding:'1px 5px',borderRadius:6,fontSize:8,fontWeight:700,background:busy?'var(--cal-cancelled-bg)':'var(--cal-confirmed-bg)',color:busy?'var(--cal-cancelled-text)':'var(--cal-confirmed-text)',border:`1px solid ${busy?softBorder('var(--cal-cancelled-accent)'):softBorder('var(--cal-confirmed-accent)')}`}}>
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
      <div style={{minWidth:D_SW+600}}>
        <div style={{display:'flex',height:38,background:'var(--surface-2)',borderBottom:BD,position:'sticky',top:0,zIndex:10}}>
          <div style={{width:D_SW,flexShrink:0,borderRight:BD,display:'flex',alignItems:'center',paddingLeft:10,fontSize:10,fontWeight:600,color:'var(--text-4)',textTransform:'uppercase',letterSpacing:'.06em'}}>Venue / Hall</div>
          <div style={{flex:1,position:'relative'}}>
            {SLOTS.map(sl=>(
              <div key={sl.id} style={{position:'absolute',left:`${pL(sl.startH*60)}%`,top:3,paddingLeft:3,fontSize:9,fontWeight:700,color:'var(--teal-600)',textTransform:'uppercase',letterSpacing:'.04em',pointerEvents:'none',userSelect:'none'}}>{sl.label}</div>
            ))}
            {HOURS.map(h=>(
              <div key={h} style={{position:'absolute',left:`${pL(h*60)}%`,bottom:2,display:'flex',alignItems:'center',paddingLeft:3,fontSize:9,fontWeight:500,color:'var(--text-4)',pointerEvents:'none',userSelect:'none'}}>{fmtH(h)}</div>
            ))}
          </div>
        </div>
        {groups.map(g=>{
          const open=exp.has(g.name);
          const vSlots=assignLanes(g.halls.flatMap(h=>h.slots.filter(s=>s.date===selDate)));
          const busyHalls=g.halls.filter(h=>h.slots.some(s=>s.date===selDate)).length;
          return (
            <React.Fragment key={g.name}>
              <div style={{display:'flex',height:D_RH,background:'var(--surface-2)',borderBottom:BD}}>
                <VenueCell name={g.name} pal={g.pal} open={open} toggle={()=>toggle(g.name)} busyCount={busyHalls} totalHalls={g.halls.length} sw={D_SW} rh={D_RH}/>
                <div style={{flex:1,position:'relative',overflow:'visible',cursor:'crosshair'}}
                  onClick={e=>{if((e.target as Element).tagName==='DIV'&&vSlots.length===0)onCreate({date:selDate});}}>
                  <SlotBands/><GridLines/><NowLine/>
                  {vSlots.map(s=><Bar key={s.bookingId||s.functionName+s.date} s={{...s,conflict:false}} pal={g.pal} rh={D_RH} useStatus onClick={()=>s.bookingId&&onBook(s.bookingId)}/>)}
                </div>
              </div>
              {open&&g.halls.map((hall,i)=>{
                const hSlots=assignLanes(hall.slots.filter(s=>s.date===selDate));
                return (
                  <div key={hall.hallName} style={{display:'flex',height:D_RH,background:'var(--surface)',borderBottom:i===g.halls.length-1?BD:BD_INNER}}>
                    <HallCell name={hall.hallName} slots={hall.slots.filter(s=>s.date===selDate)} sw={D_SW} rh={D_RH} showStatus/>
                    <div style={{flex:1,position:'relative',overflow:'visible',cursor:'crosshair'}}
                      onClick={e=>{if((e.target as Element).tagName==='DIV'&&hSlots.length===0)onCreate({date:selDate,hallId:hall.hallId});}}>
                      <SlotBands/><GridLines/><NowLine/>
                      {hSlots.length===0&&(
                        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none'}}>
                          <span style={{fontSize:9,color:'var(--text-4)',fontStyle:'italic'}}>Free — click to create booking</span>
                        </div>
                      )}
                      {hSlots.map(s=><Bar key={s.bookingId||s.functionName+s.date} s={s} pal={g.pal} rh={D_RH} useStatus onClick={()=>s.bookingId&&onBook(s.bookingId)}/>)}
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

// ─── Desktop Week View (WV2 — halls × 7 days, 4-slot matrix) ─────────────────
// Each hall row × day cell is a 4-row grid (Morning/Lunch/Evening/Dinner). A
// booking lands in a slot by bucketSlot(startMinutes). >1 booking in the same
// hall+day+slot ⇒ conflict (red border + ⚠). Empty slot = faint placeholder
// (slot's first letter) that drills into that day to create.

const WEEK_DRH = 116;   // week matrix row height (fits a 4-slot cell)

function WeekSlotChip({s,pal,conflict,onBook}:{s:TimelineSlot;pal:Pal;conflict:boolean;onBook:(id:string)=>void}) {
  const st=statusOf(s.status);
  const isPencil=s.isPencilBooking||s.status==='pencil';
  const slot=bucketSlot(s.startMinutes);
  return (
    <button type="button"
      onClick={e=>{e.stopPropagation();s.bookingId&&onBook(s.bookingId);}}
      title={`${s.functionName}${s.customerName?` · ${s.customerName}`:''}`}
      style={{
        background:st.bg,color:st.text,
        backgroundImage:isPencil?STRIPE:undefined,
        border:conflict?`1.5px solid ${CONFLICT}`:isPencil?`1px dashed ${st.accent}`:'none',
        borderLeft:`3px solid ${pal.solid}`,
        borderRadius:4,padding:'2px 5px',display:'flex',flexDirection:'column',gap:1,
        minHeight:0,overflow:'hidden',cursor:'pointer',textAlign:'left',width:'100%',height:'100%',justifyContent:'center',
      }}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:2}}>
        <span style={{fontSize:8,fontWeight:700,opacity:.65,textTransform:'uppercase',letterSpacing:'.03em'}}>{slot?.label.slice(0,3)}</span>
        {conflict&&<span style={{color:CONFLICT,flexShrink:0,lineHeight:1}}>⚠</span>}
      </div>
      <div style={{fontSize:10,fontWeight:700,lineHeight:1.15,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.functionName}</div>
      {s.customerName&&<div style={{fontSize:9,opacity:.8,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.customerName}</div>}
    </button>
  );
}

function WeekMatrixCell({slots,pal,today,onBook,onEmptyClick,aggregate}:{
  slots:TimelineSlot[];pal:Pal;today:boolean;onBook:(id:string)=>void;onEmptyClick?:(slotId:string)=>void;aggregate?:boolean;
}) {
  // Bucket this day's slots into the 4 SLOTS.
  const byBucket=useMemo(()=>{
    const m=new Map<string,TimelineSlot[]>();
    for(const s of slots){const b=bucketSlot(s.startMinutes);if(!b)continue;if(!m.has(b.id))m.set(b.id,[]);m.get(b.id)!.push(s);}
    return m;
  },[slots]);
  return (
    <div style={{flex:1,borderLeft:BD,background:today?'rgba(239,68,68,.04)':undefined,display:'grid',gridTemplateRows:'repeat(4,1fr)',padding:3,gap:2,minWidth:0}}>
      {SLOTS.map(slot=>{
        const list=byBucket.get(slot.id)||[];
        const b=list[0];
        // Aggregate (venue header) rows mix halls, so >1 here isn't a real
        // overbooking — only flag conflicts within a single hall's cell.
        const conflict=!aggregate&&list.length>1;
        if(!b) return (
          <button key={slot.id} type="button" onClick={()=>onEmptyClick?.(slot.id)} title={`${slot.label} — click to add`}
            style={{borderRadius:4,background:'var(--cal-hatch)',border:'none',display:'flex',alignItems:'center',paddingLeft:5,cursor:onEmptyClick?'pointer':'default',opacity:.8}}>
            <span style={{fontSize:8.5,color:'var(--text-4)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.03em'}}>{slot.label.slice(0,3)}</span>
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
      <div style={{minWidth:D_SW+wdays.length*120}}>
        <div style={{display:'flex',height:46,background:'var(--surface-2)',borderBottom:BD,position:'sticky',top:0,zIndex:10}}>
          <div style={{width:D_SW,flexShrink:0,borderRight:BD,display:'flex',alignItems:'center',paddingLeft:10,fontSize:10,fontWeight:600,color:'var(--text-4)',textTransform:'uppercase',letterSpacing:'.06em'}}>Venue / Hall</div>
          {wdays.map(day=>{
            const tod=isToday(day);
            return (
              <button key={dk(day)} type="button"
                onClick={()=>onDrill?.(dk(day))}
                title={onDrill?'Click to see day view':undefined}
                style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',borderLeft:BD,background:tod?'rgba(239,68,68,.04)':undefined,cursor:onDrill?'pointer':'default',border:'none',padding:'4px 0',transition:'background .1s',position:'relative'}}
                onMouseEnter={e=>{if(onDrill)(e.currentTarget as HTMLElement).style.background=tod?'rgba(239,68,68,.09)':'var(--surface-2)';}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background=tod?'rgba(239,68,68,.04)':'';}}
              >
                {tod&&<div style={{position:'absolute',left:0,right:0,bottom:-1,height:2,background:'rgb(239,68,68)'}}/>}
                <span style={{fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:tod?'rgb(239,68,68)':'var(--text-4)',lineHeight:1}}>{day.toLocaleDateString('en-IN',{weekday:'short'})}</span>
                <div style={{fontSize:16,fontWeight:tod?700:600,width:tod?24:undefined,height:tod?24:undefined,borderRadius:tod?'50%':undefined,background:tod?'rgb(239,68,68)':undefined,color:tod?'#fff':'var(--text-2)',display:'flex',alignItems:'center',justifyContent:'center',marginTop:2}}>{day.getDate()}</div>
              </button>
            );
          })}
        </div>
        {groups.map(g=>{
          const open=exp.has(g.name);
          const busyHalls=g.halls.filter(h=>wdays.some(d=>h.slots.some(s=>s.date===dk(d)))).length;
          return (
            <React.Fragment key={g.name}>
              <div style={{display:'flex',minHeight:D_RH,background:'var(--surface-2)',borderBottom:BD}}>
                <VenueCell name={g.name} pal={g.pal} open={open} toggle={()=>toggle(g.name)} busyCount={busyHalls} totalHalls={g.halls.length} sw={D_SW} rh={D_RH}/>
                {wdays.map(day=><WeekMatrixCell key={dk(day)} slots={g.halls.flatMap(h=>h.slots.filter(s=>s.date===dk(day)))} pal={g.pal} today={isToday(day)} onBook={onBook} onEmptyClick={(slotId)=>onCreate({date:dk(day),slot:slotId})} aggregate/>)}
              </div>
              {open&&g.halls.map((hall,i)=>(
                <div key={hall.hallName} style={{display:'flex',minHeight:WEEK_DRH,background:'var(--surface)',borderBottom:i===g.halls.length-1?BD:BD_INNER}}>
                  <HallCell name={hall.hallName} slots={wdays.flatMap(d=>hall.slots.filter(s=>s.date===dk(d)))} sw={D_SW} rh={WEEK_DRH} pal={g.pal} subLine/>
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

// ─── Desktop Month View (Variant B — standard 7×6 calendar grid) ──────────────

// A day's bookings flattened across every venue group / hall, each tagged with
// its venue-group palette and hall identity (for the hall-color left border and
// per-hall conflict detection).
interface MonthDaySlot extends TimelineSlot { pal:Pal; hallKey:string }

// One day tile in the month grid (Variant B VB_Month + VB_Card). Renders the top
// hall-composition strip (one segment per venue GROUP with ≥1 booking that day),
// the date number (today = teal pill, weekend = red, out-of-month dimmed) + count,
// up to 4 booking pills and a "+ N more" overflow.
function MonthDayTile({day,inMonth,groups,onBook,onDrill,onCreate}:{
  day:Date;inMonth:boolean;groups:VenueGroup[];onBook:(id:string)=>void;onDrill?:(d:string)=>void;onCreate:(args?:CreateBookingArgs)=>void;
}) {
  const iso=dk(day);
  const tod=isToday(day);
  const dow=day.getDay();
  const wknd=dow===0||dow===6;

  // Flatten this day's bookings across all groups/halls, tagged with palette +
  // hall key, sorted by start time. Dedupe by bookingId so a multi-hall
  // booking (replicated across hall rows in hallBoardRows) only shows once.
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
  // Cross-hall same-slot is NOT a conflict.
  const conflictKeys=new Map<string,number>();
  for(const s of list){const b=bucketSlot(s.startMinutes);if(b)conflictKeys.set(`${s.hallKey}|${b.id}`,(conflictKeys.get(`${s.hallKey}|${b.id}`)||0)+1);}
  const isConflict=(s:MonthDaySlot)=>{const b=bucketSlot(s.startMinutes);return!!b&&(conflictKeys.get(`${s.hallKey}|${b.id}`)||0)>1;};

  // Hall-composition strip: one segment per venue GROUP with ≥1 booking today.
  const busyGroups=groups.filter(g=>g.halls.some(h=>h.slots.some(s=>s.date===iso)));

  const bg=!inMonth?'var(--surface-2)':tod?'rgba(20,184,166,0.06)':'var(--surface)';
  const visible=list.slice(0,4);
  const extra=n-visible.length;

  return (
    <div
      onClick={inMonth?()=>onCreate({date:iso}):undefined}
      style={{
        borderRight:BD,borderBottom:BD,padding:'5px 6px 6px',background:bg,
        opacity:inMonth?1:.55,display:'flex',flexDirection:'column',gap:3,minHeight:0,
        overflow:'hidden',cursor:inMonth?'pointer':'default',position:'relative',
      }}>
      {/* Hall-composition strip */}
      <div style={{display:'flex',gap:1,height:3,flexShrink:0}}>
        {busyGroups.map(g=>(
          <div key={g.name} style={{flex:1,borderRadius:1,background:g.pal.solid,opacity:.85}}/>
        ))}
      </div>
      {/* Date number + count */}
      <div style={{display:'flex',alignItems:'baseline',gap:5,flexShrink:0}}>
        <button type="button"
          onClick={inMonth&&onDrill?(e)=>{e.stopPropagation();onDrill(iso);}:undefined}
          style={{
            border:'none',background:tod?'var(--teal-600)':'transparent',padding:tod?'2px 7px':0,
            borderRadius:tod?9:0,cursor:inMonth&&onDrill?'pointer':'default',
            fontSize:tod?14:13,fontWeight:800,fontVariantNumeric:'tabular-nums',lineHeight:1,
            color:tod?'#fff':wknd?'rgb(220,38,38)':'var(--text-1)',
          }}>{day.getDate()}</button>
        {n>0&&<span style={{fontSize:9.5,color:'var(--text-4)',fontWeight:700,fontVariantNumeric:'tabular-nums'}}>· {n}</span>}
      </div>
      {/* Booking pills (VB_Card) */}
      <div style={{display:'flex',flexDirection:'column',gap:2,overflow:'hidden',flex:1}}>
        {visible.map((s,i)=>{
          const p=s.isPencilBooking||s.status==='pencil';
          const st=statusOf(s.status);
          const conflict=isConflict(s);
          return (
            <button key={s.bookingId||i} type="button"
              onClick={e=>{e.stopPropagation();s.bookingId&&onBook(s.bookingId);}}
              title={[s.functionName,s.customerName,s.functionType].filter(Boolean).join(' · ')}
              style={{display:'flex',flexDirection:'column',gap:0,padding:'3px 5px',borderRadius:5,background:'var(--surface)',backgroundImage:p?STRIPE:undefined,border:conflict?`1px solid ${CONFLICT}`:p?`1.5px dashed ${st.accent}`:`1px solid ${softBorder(st.accent)}`,borderLeft:`3px solid ${s.pal.solid}`,boxShadow:conflict?`0 0 0 1.5px ${CONFLICT}`:undefined,cursor:'pointer',textAlign:'left',overflow:'hidden',flexShrink:0,position:'relative'}}>
              <span style={{display:'flex',alignItems:'center',gap:4,minWidth:0}}>
                <span style={{width:5,height:5,borderRadius:'50%',background:st.accent,flexShrink:0}}/>
                <span style={{fontSize:10,fontWeight:800,color:'var(--text-1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',lineHeight:1.15,flex:1}}>{s.functionName}</span>
                {conflict&&<span style={{color:CONFLICT,flexShrink:0,lineHeight:1,fontSize:10}}>⚠</span>}
              </span>
              {(s.customerName||s.functionType)&&<span style={{fontSize:9,color:'var(--text-3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',lineHeight:1.1,paddingLeft:9}}>{[s.customerName,s.functionType].filter(Boolean).join(' · ')}</span>}
            </button>
          );
        })}
        {extra>0&&<span style={{fontSize:9.5,color:'var(--text-4)',fontWeight:700,marginTop:2,paddingLeft:2}}>+ {extra} more</span>}
      </div>
    </div>
  );
}

function DesktopMonth({groups,vdate,exp,toggle,onBook,onDrill,onCreate}:{
  groups:VenueGroup[];vdate:Date;exp:Set<string>;toggle:(n:string)=>void;onBook:(id:string)=>void;onDrill?:(d:string)=>void;onCreate:(args?:CreateBookingArgs)=>void;
}) {
  void exp; void toggle; // unused in the calendar-grid month view (kept in prop type for caller stability)
  const yr=vdate.getFullYear(),mo=vdate.getMonth();
  // 6-week (42 cell) Sun-start grid: from the 1st minus its weekday offset.
  const first=new Date(yr,mo,1);
  const start=new Date(yr,mo,1-first.getDay());
  const days=Array.from({length:42},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return d;});
  const headers=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  return (
    <div style={{display:'flex',flexDirection:'column',width:'100%'}}>
      {/* Weekday header */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',background:'var(--surface)',borderBottom:BD}}>
        {headers.map((h,i)=>(
          <div key={h} style={{padding:'8px 12px',fontSize:10.5,fontWeight:800,letterSpacing:'.1em',textTransform:'uppercase',color:(i===0||i===6)?'rgb(220,38,38)':'var(--text-3)',borderRight:i<6?BD:'none'}}>{h}</div>
        ))}
      </div>
      {/* 6×7 day grid */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gridTemplateRows:'repeat(6,1fr)',background:'var(--surface)',minHeight:0}}>
        {days.map((day,i)=>(
          <MonthDayTile key={i} day={day} inMonth={day.getMonth()===mo} groups={groups} onBook={onBook} onDrill={onDrill} onCreate={onCreate}/>
        ))}
      </div>
    </div>
  );
}

// ─── Mobile Day View (MD2 — slot-grouped agenda, hall-as-rows re-skin) ───────
// Date header (weekday + date + booking-count summary) + hall-occupancy chips,
// optional red conflict banner, then bookings GROUPED BY SLOT (bucketSlot). Each
// group: slot label + time range + count, then large status-colored cards with a
// hall-color dot. Pencil = dashed border + STRIPE. Conflict (within a single hall,
// >1 booking in the same slot — matches the Week/Month proxy) → red accent + note.
// NOTE: TimelineSlot carries no revenue/amount field, so the "₹revenue" summary
// from the prototype is omitted gracefully.

const SLOT_RANGE: Record<string,string> = {
  morning:'9 AM–12 PM', lunch:'12–4 PM', evening:'4–7 PM', dinner:'7–10 PM',
};

// Flatten this venue-group set into the day's bookings, tagged with hall context.
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

  // Conflict = within a single hall, >1 booking in the same slot.
  const conflictKeys=useMemo(()=>{
    const counts=new Map<string,number>();
    for(const b of dayBks){const sl=bucketSlot(b.startMinutes);if(!sl)continue;const k=`${b.hallId||b.hallName}|${sl.id}`;counts.set(k,(counts.get(k)||0)+1);}
    return new Set(Array.from(counts.entries()).filter(([,n])=>n>1).map(([k])=>k));
  },[dayBks]);
  const isConflict=(b:DaySlot)=>{const sl=bucketSlot(b.startMinutes);return!!sl&&conflictKeys.has(`${b.hallId||b.hallName}|${sl.id}`);};
  const hasConflict=conflictKeys.size>0;

  // Hall-occupancy chips: one per hall that has at least one booking today.
  const occupancy=useMemo(()=>{
    const m=new Map<string,{name:string;pal:Pal;count:number}>();
    for(const g of groups)for(const h of g.halls){
      const c=h.slots.filter(s=>s.date===selDate).length;
      if(c>0){const k=h.hallId||h.hallName;m.set(k,{name:h.hallName,pal:g.pal,count:c});}
    }
    return Array.from(m.values());
  },[groups,selDate]);

  // Group by SLOT (Morning/Lunch/Evening/Dinner).
  const grouped=SLOTS.map(sl=>({slot:sl,list:dayBks.filter(b=>bucketSlot(b.startMinutes)?.id===sl.id)}));

  return (
    <div style={{width:'100%',overflowX:'hidden',display:'flex',flexDirection:'column'}}>
      {/* Date header + summary */}
      <div style={{padding:'12px 14px 10px',background:'var(--surface)',borderBottom:BD}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:10}}>
          <div>
            <p style={{fontSize:11,fontWeight:700,color:'#0d9488',textTransform:'uppercase',letterSpacing:'.08em',margin:0}}>{tod?`Today · ${weekday}`:weekday}</p>
            <p style={{fontSize:21,fontWeight:800,color:'var(--text-1)',letterSpacing:'-.02em',lineHeight:1.1,margin:'2px 0 0'}}>{dateLabel}</p>
          </div>
          <div style={{textAlign:'right',flexShrink:0}}>
            <p style={{fontSize:13,fontWeight:700,color:'var(--text-1)',fontVariantNumeric:'tabular-nums',margin:0}}>{dayBks.length} booking{dayBks.length!==1?'s':''}</p>
          </div>
        </div>
        {/* Hall-occupancy chips */}
        {occupancy.length>0&&(
          <div style={{display:'flex',gap:8,marginTop:10,flexWrap:'wrap'}}>
            {occupancy.map(o=>(
              <div key={o.name} style={{display:'flex',alignItems:'center',gap:5,padding:'4px 9px',borderRadius:9999,background:o.pal.soft,border:`1px solid ${o.pal.border}40`}}>
                <span style={{width:6,height:6,borderRadius:'50%',background:o.pal.solid,flexShrink:0}}/>
                <span style={{fontSize:11,fontWeight:700,color:o.pal.solid,whiteSpace:'nowrap'}}>{o.name}</span>
                <span style={{fontSize:10.5,fontWeight:800,color:o.pal.solid,background:'var(--surface)',borderRadius:9999,padding:'0 5px',fontVariantNumeric:'tabular-nums'}}>{o.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Conflict alert banner */}
      {hasConflict&&(
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'9px 14px',background:'var(--cal-conflict-bg)',borderBottom:'1px solid var(--cal-conflict-border)',fontSize:12,fontWeight:600,color:'var(--cal-conflict-text)'}}>
          <span style={{flexShrink:0}}>⚠</span>
          {conflictKeys.size===1?'A hall has a double-booked slot on this date':`${conflictKeys.size} slots are double-booked on this date`}
        </div>
      )}

      {/* Slot-grouped agenda */}
      <div style={{flex:1,padding:'12px 12px 8px'}}>
        {dayBks.length===0?(
          <div style={{padding:'28px 16px',textAlign:'center'}}>
            <p style={{fontSize:13,color:'var(--text-4)',marginBottom:12}}>No bookings on this day</p>
            <button type="button" onClick={()=>onCreate({date:selDate})} style={{fontSize:12,fontWeight:600,color:'#fff',background:'#0d9488',border:'none',borderRadius:8,padding:'8px 20px',cursor:'pointer'}}>Create Booking</button>
          </div>
        ):grouped.map(g=>g.list.length===0?null:(
          <div key={g.slot.id} style={{marginBottom:16}}>
            <div style={{display:'flex',alignItems:'flex-end',gap:8,marginBottom:7}}>
              <div>
                <p style={{fontSize:9.5,fontWeight:800,color:'var(--text-4)',textTransform:'uppercase',letterSpacing:'.08em',margin:0}}>{g.slot.label}</p>
                <p style={{fontSize:16,fontWeight:800,color:'var(--text-1)',letterSpacing:'-.02em',lineHeight:1.1,margin:'1px 0 0',fontVariantNumeric:'tabular-nums'}}>{SLOT_RANGE[g.slot.id]||''}</p>
              </div>
              <span style={{marginBottom:2,fontSize:11,color:'var(--text-4)',fontWeight:600}}>{g.list.length} event{g.list.length!==1?'s':''}</span>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:7}}>
              {g.list.map(b=>{
                const st=statusOf(b.status);
                const isPencil=b.isPencilBooking||b.status==='pencil';
                const conflict=isConflict(b);
                return (
                  <button key={b.bookingId||b.functionName} type="button"
                    onClick={()=>b.bookingId&&onBook(b.bookingId)}
                    style={{
                      textAlign:'left',width:'100%',cursor:'pointer',
                      background:st.bg,borderRadius:14,
                      backgroundImage:isPencil?STRIPE:undefined,
                      border:conflict?`1.5px solid ${CONFLICT}`:isPencil?`1.5px dashed ${st.accent}`:`1.5px solid ${softBorder(st.accent)}`,
                      borderLeft:`5px solid ${b.pal.solid}`,
                      padding:'11px 12px',display:'flex',flexDirection:'column',gap:6,
                    }}>
                    {isPencil&&<span style={{fontSize:8.5,fontWeight:700,letterSpacing:'.04em',color:st.text,lineHeight:1.3}}>{pencilCD(b.pencilExpiresAt)}</span>}
                    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8}}>
                      <span style={{fontSize:14,fontWeight:800,color:'var(--text-1)',lineHeight:1.2,flex:1}}>{b.functionName}</span>
                      <span style={{fontSize:10,fontWeight:800,padding:'3px 8px',borderRadius:9999,background:st.bg,color:st.text,flexShrink:0,textTransform:'uppercase',letterSpacing:'.04em',border:`1px solid ${softBorder(st.accent)}`}}>{st.label}</span>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:10,fontSize:11.5,color:'var(--text-2)',flexWrap:'wrap'}}>
                      <span style={{display:'inline-flex',alignItems:'center',gap:5}}><span style={{width:6,height:6,borderRadius:'50%',background:b.pal.solid,flexShrink:0}}/>{b.hallName}</span>
                      {b.functionType&&<span>{b.functionType}</span>}
                      {!!b.guests&&<span style={{display:'inline-flex',alignItems:'center',gap:4}}>{b.guests} pax</span>}
                      <span style={{marginLeft:'auto',fontWeight:700,color:'var(--text-1)',fontVariantNumeric:'tabular-nums'}}>{fmtMins(b.startMinutes)}</span>
                    </div>
                    {conflict&&<div style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:11,color:'var(--cal-conflict-text)',fontWeight:600}}>⚠ Conflict on this slot</div>}
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

// ─── Mobile Week View (booking chips + drill-down headers) ────────────────────

function MobileWeek({groups,wdays,exp,toggle,onBook,onDrill}:{groups:VenueGroup[];wdays:Date[];exp:Set<string>;toggle:(n:string)=>void;onBook:(id:string)=>void;onDrill?:(d:string)=>void}) {
  return (
    <div style={{width:'100%',overflowX:'hidden'}}>
      <div style={{display:'flex',height:32,background:'var(--surface-2)',borderBottom:BD,position:'sticky',top:0,zIndex:10}}>
        <div style={{width:M_SW,flexShrink:0,borderRight:BD}}/>
        {wdays.map(day=>{
          const tod=isToday(day);
          return (
            <button key={dk(day)} type="button" onClick={()=>onDrill?.(dk(day))}
              style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',borderLeft:BD,background:tod?'rgba(239,68,68,.04)':undefined,cursor:'pointer',border:'none',padding:'3px 0'}}>
              <span style={{fontSize:8,color:tod?'rgb(239,68,68)':'var(--text-4)',lineHeight:1,textTransform:'uppercase'}}>{day.toLocaleDateString('en-IN',{weekday:'narrow'})}</span>
              <div style={{fontSize:11,fontWeight:tod?700:400,width:tod?17:undefined,height:tod?17:undefined,borderRadius:tod?'50%':undefined,background:tod?'rgb(239,68,68)':undefined,color:tod?'#fff':'var(--text-2)',display:'flex',alignItems:'center',justifyContent:'center'}}>{day.getDate()}</div>
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
                    {slots.length>3&&<span style={{fontSize:7,color:'var(--text-4)',paddingLeft:2}}>+{slots.length-3}</span>}
                  </div>
                );
              })}
            </div>
            {open&&g.halls.map((hall,i)=>(
              <div key={hall.hallName} style={{display:'flex',minHeight:M_RH,background:'var(--surface)',borderBottom:i===g.halls.length-1?BD:BD_INNER}}>
                <div style={{width:M_SW,flexShrink:0,display:'flex',alignItems:'flex-start',padding:'5px 6px 4px 18px',borderRight:BD,fontSize:8.5,color:'var(--text-4)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{hall.hallName}</div>
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
                      {slots.length>3&&<span style={{fontSize:7,color:'var(--text-4)',paddingLeft:2}}>+{slots.length-3}</span>}
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
  const selSlots=groups.flatMap(g=>g.halls.flatMap(h=>h.slots.filter(s=>s.date===selKey).map(s=>({...s,pal:g.pal,hallName:h.hallName})))).sort((a,b)=>a.startMinutes-b.startMinutes);

  return (
    <div style={{display:'flex',flexDirection:'column',height:'calc(100dvh - 148px)',minHeight:480}}>
      <div style={{flexShrink:0}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',padding:'2px 4px 0'}}>
          {DOW.map((d,i)=>(<div key={i} style={{textAlign:'center',fontSize:10,fontWeight:500,color:i===0||i===6?'rgba(239,68,68,.55)':'var(--text-4)',paddingBottom:2}}>{d}</div>))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',padding:'0 3px',gap:'1px 0'}}>
          {cells.map((d,i)=>{
            if(!d)return<div key={i} style={{minHeight:46}}/>;
            const dkey=mdk(d),daySlots=groups.flatMap(g=>g.halls.flatMap(h=>h.slots.filter(s=>s.date===dkey)));
            const venuesHere=groups.filter(g=>g.halls.some(h=>h.slots.some(s=>s.date===dkey)));
            const isSel=d===selDay,isTod=isCM&&d===today.getDate(),isWk=i%7===0||i%7===6;
            return (
              <button key={i} type="button" onClick={()=>{setSelDay(d);onDrill?.(dkey);}}
                style={{padding:'2px 1px',borderRadius:5,background:isSel?'var(--teal-600)':isTod?'rgba(239,68,68,.07)':'transparent',border:isTod&&!isSel?'1.5px solid rgba(239,68,68,.35)':'1.5px solid transparent',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:2,minHeight:46}}>
                <span style={{fontSize:12,fontWeight:isSel?700:isTod?600:400,color:isSel?'#fff':isTod?'rgb(239,68,68)':isWk?'rgba(239,68,68,.45)':'var(--text-2)',lineHeight:1.4}}>{d}</span>
                <div style={{display:'flex',gap:2,flexWrap:'wrap',justifyContent:'center'}}>
                  {venuesHere.slice(0,3).map(g=>(<div key={g.name} style={{width:5,height:5,borderRadius:'50%',background:isSel?'rgba(255,255,255,.75)':g.pal.solid}}/>))}
                  {daySlots.length>3&&!isSel&&<span style={{fontSize:6.5,color:'var(--text-4)',lineHeight:1}}>+{daySlots.length-3}</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div style={{flex:1,overflowY:'auto',borderTop:BD,background:'var(--surface-2)'}}>
        <div style={{padding:'8px 12px 4px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,background:'var(--surface-2)',zIndex:2,borderBottom:BD}}>
          <span style={{fontSize:12,fontWeight:600,color:'var(--text-2)'}}>
            {new Date(yr,mo,selDay).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}
            {selSlots.length>0&&<span style={{fontSize:10,fontWeight:400,color:'var(--text-4)',marginLeft:6}}>{selSlots.length} booking{selSlots.length>1?'s':''}</span>}
          </span>
          <button type="button" onClick={()=>onCreate({date:selKey})} style={{fontSize:11,fontWeight:600,color:'#0d9488',background:'rgba(13,148,136,.09)',border:'1px solid rgba(13,148,136,.2)',borderRadius:6,padding:'3px 10px',cursor:'pointer'}}>+ Booking</button>
        </div>
        {selSlots.length===0?(
          <div style={{padding:'24px 16px',textAlign:'center'}}>
            <p style={{fontSize:13,color:'var(--text-4)',marginBottom:12}}>No bookings on this day</p>
            <button type="button" onClick={()=>onCreate({date:selKey})} style={{fontSize:12,fontWeight:600,color:'#fff',background:'#0d9488',border:'none',borderRadius:8,padding:'8px 20px',cursor:'pointer'}}>Create Booking</button>
          </div>
        ):(
          <div style={{padding:'6px 8px 16px',display:'flex',flexDirection:'column',gap:6}}>
            {selSlots.map(s=>{
              const p=s.isPencilBooking||s.status==='pencil';
              return (
                <button key={s.bookingId||s.functionName} type="button" onClick={()=>s.bookingId&&onBook(s.bookingId)}
                  style={{display:'flex',alignItems:'stretch',gap:10,padding:'8px 10px',background:'var(--surface)',borderRadius:8,border:BD,cursor:'pointer',textAlign:'left',boxShadow:'0 1px 2px rgba(0,0,0,.04)'}}>
                  <div style={{width:3,borderRadius:2,background:p?'transparent':s.pal.solid,border:p?`1.5px dashed ${s.pal.solid}`:'none',flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    {p&&<span style={{fontSize:8.5,fontWeight:700,letterSpacing:'.04em',color:s.pal.solid,display:'block',lineHeight:1.4}}>{pencilCD(s.pencilExpiresAt)}</span>}
                    <p style={{fontSize:13,fontWeight:600,color:'var(--text-1)',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.functionName}</p>
                    <p style={{fontSize:11,color:'var(--text-4)',margin:0}}>{[s.functionType,s.guests?`${s.guests} pax`:null].filter(Boolean).join(' · ')}</p>
                    <p style={{fontSize:10,color:'var(--text-4)',margin:0}}>{s.hallName}</p>
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
    <div style={{position:'sticky',bottom:0,display:'flex',justifyContent:'flex-end',padding:'8px 12px',background:'var(--cal-fab-fade)',pointerEvents:'none',zIndex:6}}>
      <button type="button" onClick={()=>onClick()} style={{pointerEvents:'auto',fontSize:12,fontWeight:600,color:'#fff',background:'#0d9488',border:'none',borderRadius:20,padding:'7px 16px',cursor:'pointer',boxShadow:'0 2px 8px rgba(13,148,136,.4)',display:'flex',alignItems:'center',gap:5}}>
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
      <button type="button" onClick={()=>onCreateBooking()} className="mt-3 text-sm font-semibold text-teal-600 underline">Create a booking</button>
    </div>
  );

  const shared={groups,exp,toggle,onBook:onBookingClick};

  return (
    <>
      {/* Desktop */}
      <div className="hidden sm:block border border-[var(--border)] rounded-xl overflow-hidden">
        {viewMode==='day'&&<DesktopDay {...shared} selDate={selectedDate} onCreate={onCreateBooking}/>}
        {viewMode==='week'&&<DesktopWeek {...shared} wdays={weekDays} onCreate={onCreateBooking} onDrill={onDateDrillDown}/>}
        {viewMode==='month'&&<DesktopMonth {...shared} vdate={viewDate} onDrill={onDateDrillDown} onCreate={onCreateBooking}/>}
        <CreateFAB onClick={onCreateBooking}/>
      </div>
      {/* Mobile */}
      <div className="sm:hidden">
        {viewMode==='day'&&<div className="border border-[var(--border)] rounded-xl overflow-hidden"><MobileDay {...shared} selDate={selectedDate} onCreate={onCreateBooking}/><CreateFAB onClick={onCreateBooking}/></div>}
        {viewMode==='week'&&<div className="border border-[var(--border)] rounded-xl overflow-hidden"><MobileWeek {...shared} wdays={weekDays} onDrill={onDateDrillDown}/><CreateFAB onClick={onCreateBooking}/></div>}
        {viewMode==='month'&&<MobileMonth groups={groups} vdate={viewDate} onBook={onBookingClick} onCreate={onCreateBooking} onDrill={onDateDrillDown}/>}
      </div>
    </>
  );
}
