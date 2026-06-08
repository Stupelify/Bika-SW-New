// variantB.jsx — "Hall-Coded Editorial" — bolder, hall identity prominent
// Exports: VB_Month, VB_Week, VB_Day, VB_Mobile

const { useState: useStateB } = React;

const B_ICONS = {
  chevL:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  chevR:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  chevDn: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  plus:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  warn:   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  users:  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>,
};

/* ─── Hall chip used everywhere ──────────────────────────────── */
function VB_HallChip({ hall, dense }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: dense ? '1px 5px' : '2px 7px',
      borderRadius: 9999,
      background: `${hall.color}14`,
      color: hall.color,
      fontSize: dense ? 9.5 : 10.5, fontWeight: 700,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: hall.color }} />
      {hall.name.replace(' Hall','').replace(' Banquet','').replace(' Room','').replace(' Garden','')}
    </span>
  );
}

/* ─── Toolbar (Variant B) ────────────────────────────────────── */
function VB_Toolbar({ view, title, subtitle, hallSummary }) {
  return (
    <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 18px', gap: 14, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <button style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{B_ICONS.chevL}</button>
            <button style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{B_ICONS.chevR}</button>
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.025em', lineHeight: 1, fontFamily: "'Inter', sans-serif" }}>{title}</h1>
            <p style={{ fontSize: 11.5, color: 'var(--text-4)', marginTop: 3, fontWeight: 500 }}>{subtitle}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'inline-flex', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            {['Month','Week','Day'].map(v => {
              const isActive = v.toLowerCase() === view;
              return (
                <button key={v} style={{
                  padding: '6px 13px', border: 'none',
                  background: isActive ? 'var(--text-1)' : 'var(--surface)',
                  color: isActive ? 'white' : 'var(--text-3)',
                  fontSize: 12, fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>{v}</button>
              );
            })}
          </div>
          <button style={{
            padding: '6px 14px', borderRadius: 10, border: 'none',
            background: 'var(--teal-600)', color: 'white',
            fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            display: 'inline-flex', alignItems: 'center', gap: 5,
            boxShadow: '0 1px 3px rgba(13,148,136,0.25)',
          }}>{B_ICONS.plus}New Booking</button>
        </div>
      </div>
      {/* Hall row — clickable filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 18px 12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-4)', marginRight: 4 }}>Halls</span>
        {HALLS.map(h => (
          <button key={h.id} style={{
            padding: '4px 10px 4px 8px', borderRadius: 9999,
            border: `1.5px solid ${h.color}40`,
            background: `${h.color}10`,
            color: h.color,
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: h.color }} />
            {h.name}
            <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.7, fontVariantNumeric: 'tabular-nums' }}>· {hallSummary ? hallSummary[h.id] || 0 : 0}</span>
          </button>
        ))}
        <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 4 }}>
          {['Confirmed','Pencil','Quotation'].map(label => {
            const k = label.toLowerCase();
            const s = statusOf(k);
            return (
              <span key={k} style={{
                fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 9999,
                background: s.bg, color: s.text,
                ...(k === 'pencil' ? { backgroundImage: 'repeating-linear-gradient(135deg, transparent 0, transparent 3px, rgba(146,64,14,0.18) 3px, rgba(146,64,14,0.18) 4px)' } : {}),
              }}>{label}</span>
            );
          })}
        </span>
      </div>
    </div>
  );
}

/* ─── Booking card for Variant B — denser editorial card ────── */
function VB_Card({ booking, compact }) {
  const hall = hallById(booking.hall);
  const slot = slotById(booking.slot);
  const s = statusOf(booking.status);
  const isPencil = booking.status === 'pencil';
  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: compact ? 5 : 8,
      border: isPencil ? `1.5px dashed ${s.accent}` : `1px solid ${s.accent}66`,
      borderLeft: `3px solid ${hall.color}`,
      padding: compact ? '3px 5px 3px 5px' : '5px 7px',
      display: 'flex', flexDirection: 'column', gap: compact ? 0 : 1,
      overflow: 'hidden', minWidth: 0, cursor: 'pointer',
      position: 'relative',
      boxShadow: booking.conflict ? '0 0 0 2px #ef4444' : 'none',
    }}>
      {booking.conflict && (
        <span style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: 'white', width: 14, height: 14, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{B_ICONS.warn}</span>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.accent, flexShrink: 0 }} />
        <span style={{ fontSize: compact ? 10 : 11, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{booking.function}</span>
      </div>
      <div style={{ fontSize: compact ? 9 : 10, color: 'var(--text-3)', lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: 9 }}>
        {booking.customer} · {booking.type}
      </div>
    </div>
  );
}

/* ─── MONTH VIEW (Variant B) ─────────────────────────────────── */
function VB_Month() {
  const year = 2026, month = 4;
  const days = buildMonthGrid(year, month);
  const dayHeaders = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  // Hall counts for the month
  const hallCounts = {};
  HALLS.forEach(h => { hallCounts[h.id] = BOOKINGS.filter(b => b.hall === h.id && b.date.startsWith('2026-05')).length; });

  return (
    <div style={{ height: '100%', background: 'var(--bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
      <VB_Toolbar view="month" title="May 2026" subtitle="43 bookings · 4 halls · peak Sat 23 (10 events)" hallSummary={hallCounts} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        {dayHeaders.map((d, i) => (
          <div key={d} style={{
            padding: '8px 12px',
            fontSize: 10.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
            color: (i === 0 || i === 6) ? '#dc2626' : 'var(--text-3)',
            borderRight: i < 6 ? '1px solid var(--border)' : 'none',
            background: 'var(--surface)',
          }}>{d}</div>
        ))}
      </div>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: 'repeat(6, 1fr)', background: 'var(--surface)', minHeight: 0 }}>
        {days.map((d, i) => {
          const inMonth = d.getMonth() === month;
          const iso = isoDate(d);
          const isToday = iso === TODAY_ISO;
          const list = bookingsForDate(iso);
          const isWk = d.getDay() === 0 || d.getDay() === 6;
          const visible = list.slice(0, 4);
          const extra = list.length - visible.length;
          // Hall composition strip
          const hallBars = HALLS.map(h => ({ hall: h, count: list.filter(b => b.hall === h.id).length }));
          return (
            <div key={i} style={{
              borderRight: (i % 7) < 6 ? '1px solid var(--border)' : 'none',
              borderBottom: i < 35 ? '1px solid var(--border)' : 'none',
              padding: '5px 6px 6px',
              background: !inMonth ? 'rgba(0,0,0,0.025)' : isToday ? 'rgba(20,184,166,0.06)' : 'var(--surface)',
              opacity: inMonth ? 1 : 0.6,
              display: 'flex', flexDirection: 'column', gap: 3, minHeight: 0, overflow: 'hidden',
              cursor: 'pointer', position: 'relative',
            }}>
              {/* Hall bars at top — visualizes hall usage at a glance */}
              <div style={{ display: 'flex', gap: 1, height: 3, marginBottom: 1 }}>
                {hallBars.map(({ hall, count }) => (
                  <div key={hall.id} style={{
                    flex: 1,
                    background: count > 0 ? hall.color : 'transparent',
                    opacity: count > 0 ? 0.85 : 0,
                    borderRadius: 1,
                  }} />
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 4 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span style={{
                    fontSize: isToday ? 14 : 13, fontWeight: 800,
                    color: isWk ? '#dc2626' : 'var(--text-1)',
                    fontVariantNumeric: 'tabular-nums', lineHeight: 1,
                    ...(isToday ? { background: 'var(--teal-600)', color: 'white', padding: '2px 7px', borderRadius: 9 } : {}),
                  }}>{d.getDate()}</span>
                  {list.length > 0 && (
                    <span style={{ fontSize: 9.5, color: 'var(--text-4)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                      · {list.length}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden', flex: 1 }}>
                {visible.map(b => <VB_Card key={b.id} booking={b} compact />)}
                {extra > 0 && (
                  <span style={{ fontSize: 9.5, color: 'var(--text-4)', fontWeight: 700, marginTop: 2, paddingLeft: 2 }}>
                    + {extra} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── WEEK VIEW (Variant B) — Halls × 7 days ──────────────── */
function VB_Week() {
  const weekStart = new Date(2026, 4, 17);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d; });

  const hallCounts = {};
  HALLS.forEach(h => { hallCounts[h.id] = BOOKINGS.filter(b => b.hall === h.id && b.date >= '2026-05-17' && b.date <= '2026-05-23').length; });

  return (
    <div style={{ height: '100%', background: 'var(--bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
      <VB_Toolbar view="week" title="17 – 23 May 2026" subtitle="22 bookings · 1 overbooking on Sat 23 May" hallSummary={hallCounts} />
      <div style={{ display: 'grid', gridTemplateColumns: '170px repeat(7, 1fr)', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ padding: '10px 12px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-4)', borderRight: '1px solid var(--border)' }}>Hall</div>
        {days.map((d, i) => {
          const isToday = isoDate(d) === TODAY_ISO;
          const isWk = d.getDay() === 0 || d.getDay() === 6;
          return (
            <div key={i} style={{
              padding: '8px 10px',
              borderRight: i < 6 ? '1px solid var(--border)' : 'none',
              background: isToday ? 'rgba(20,184,166,0.06)' : 'var(--surface)',
              textAlign: 'center',
              position: 'relative',
            }}>
              {isToday && <div style={{ position: 'absolute', left: 0, right: 0, bottom: -1, height: 2, background: 'var(--teal-500)' }} />}
              <div style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: isWk ? '#dc2626' : 'var(--text-4)', lineHeight: 1 }}>{dayName(d)}</div>
              <div style={{ marginTop: 4, fontSize: isToday ? 18 : 16, fontWeight: isToday ? 800 : 700, color: isToday ? 'var(--teal-700)' : 'var(--text-1)', fontVariantNumeric: 'tabular-nums', lineHeight: 1, letterSpacing: '-0.02em' }}>{d.getDate()}</div>
            </div>
          );
        })}
      </div>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '170px repeat(7, 1fr)', gridTemplateRows: `repeat(${HALLS.length}, 1fr)`, background: 'var(--surface)', minHeight: 0 }}>
        {HALLS.map((hall, hIdx) => (
          <React.Fragment key={hall.id}>
            <div style={{
              padding: '10px 0 10px 14px',
              borderRight: '1px solid var(--border)',
              borderBottom: hIdx < HALLS.length - 1 ? '1px solid var(--border)' : 'none',
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'var(--surface)',
              position: 'relative',
            }}>
              <div style={{ position: 'absolute', left: 0, top: 6, bottom: 6, width: 4, borderRadius: '0 3px 3px 0', background: hall.color }} />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.015em' }}>{hall.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 2, fontWeight: 600 }}>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{hallCounts[hall.id]}</span> events · cap. <span style={{ fontVariantNumeric: 'tabular-nums' }}>{hall.capacity}</span>
                </div>
              </div>
            </div>
            {days.map((d, dIdx) => {
              const iso = isoDate(d);
              const isToday = iso === TODAY_ISO;
              const dayBookings = bookingsForDate(iso).filter(b => b.hall === hall.id);
              return (
                <div key={dIdx} style={{
                  borderRight: dIdx < 6 ? '1px solid var(--border)' : 'none',
                  borderBottom: hIdx < HALLS.length - 1 ? '1px solid var(--border)' : 'none',
                  background: isToday ? 'rgba(20,184,166,0.04)' : 'var(--surface)',
                  display: 'grid', gridTemplateRows: 'repeat(4, 1fr)',
                  padding: 3, gap: 2,
                }}>
                  {SLOTS.map((slot, sIdx) => {
                    const slotList = dayBookings.filter(b => b.slot === slot.id);
                    const b = slotList[0];
                    const conflict = slotList.length > 1;
                    if (!b) return (
                      <div key={slot.id} style={{
                        borderRadius: 4,
                        background: `repeating-linear-gradient(45deg, transparent 0, transparent 5px, rgba(15,23,42,0.025) 5px, rgba(15,23,42,0.025) 6px)`,
                        display: 'flex', alignItems: 'center', paddingLeft: 5,
                        fontSize: 9, color: 'var(--text-4)', opacity: 0.7, fontWeight: 600,
                      }}>{slot.shortLabel}</div>
                    );
                    return <VB_Card key={slot.id} booking={{ ...b, conflict }} compact />;
                  })}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/* ─── DAY VIEW (Variant B) — Halls × hour columns ─────────── */
function VB_Day() {
  const hours = Array.from({ length: 15 }, (_, i) => i + 9);
  const dayBookings = bookingsForDate(TODAY_ISO);
  const COL_WIDTH = 75;
  const HALL_COL_WIDTH = 180;
  const ROW_HEIGHT = 116;

  const hallCounts = {};
  HALLS.forEach(h => { hallCounts[h.id] = dayBookings.filter(b => b.hall === h.id).length; });

  return (
    <div style={{ height: '100%', background: 'var(--bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
      <VB_Toolbar view="day" title={`Thursday, 21 May 2026`} subtitle={`${dayBookings.length} bookings today · current time 14:32`} hallSummary={hallCounts} />
      <div style={{ flex: 1, overflow: 'auto', background: 'var(--surface)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `${HALL_COL_WIDTH}px 1fr`, position: 'relative' }}>
          {/* Hour header */}
          <div style={{ borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--surface)', padding: '10px 14px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-4)', position: 'sticky', left: 0, zIndex: 3 }}>
            Hall
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${hours.length}, ${COL_WIDTH}px)`, borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
            {hours.map(h => {
              const slot = SLOTS.find(s => h >= s.startH && h < s.endH);
              const isSlotStart = SLOTS.some(s => s.startH === h);
              return (
                <div key={h} style={{
                  padding: '6px 9px',
                  borderRight: isSlotStart ? '2px solid var(--border)' : '1px solid var(--border)',
                  textAlign: 'left',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-1)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em', lineHeight: 1 }}>
                    {h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`}
                  </div>
                  <div style={{ fontSize: 9, marginTop: 2, color: slot ? hallById('crystal').color : 'var(--text-4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', visibility: isSlotStart ? 'visible' : 'hidden' }}>
                    {slot ? slot.label : ''}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hall rows */}
          {HALLS.map((hall, hIdx) => {
            const hallBookings = dayBookings.filter(b => b.hall === hall.id);
            return (
              <React.Fragment key={hall.id}>
                <div style={{
                  padding: 0,
                  borderRight: '1px solid var(--border)',
                  borderBottom: hIdx < HALLS.length - 1 ? '1px solid var(--border)' : 'none',
                  background: 'var(--surface)',
                  position: 'sticky', left: 0, zIndex: 3,
                  display: 'flex', alignItems: 'stretch',
                  height: ROW_HEIGHT,
                }}>
                  <div style={{ width: 6, background: hall.color, flexShrink: 0 }} />
                  <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4, flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{hall.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10.5, color: 'var(--text-4)', fontWeight: 600 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>{B_ICONS.users}<span style={{ fontVariantNumeric: 'tabular-nums' }}>{hall.capacity}</span></span>
                      <span style={{ color: 'var(--text-4)' }}>·</span>
                      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{hallBookings.length} today</span>
                    </div>
                  </div>
                </div>
                <div style={{
                  position: 'relative',
                  borderBottom: hIdx < HALLS.length - 1 ? '1px solid var(--border)' : 'none',
                  height: ROW_HEIGHT,
                  background: `${hall.tint}80`,
                  backgroundImage: `linear-gradient(to right, var(--border) 1px, transparent 1px)`,
                  backgroundSize: `${COL_WIDTH}px 100%`,
                }}>
                  {/* Slot dividers */}
                  {SLOTS.slice(1).map(slot => (
                    <div key={slot.id} style={{
                      position: 'absolute', left: (slot.startH - 9) * COL_WIDTH, top: 0, bottom: 0, width: 2,
                      background: 'var(--border-2)', opacity: 0.7,
                    }} />
                  ))}
                  {/* Bookings */}
                  {hallBookings.map(b => {
                    const slot = slotById(b.slot);
                    const left = (slot.startH - 9) * COL_WIDTH + 4;
                    const width = (slot.endH - slot.startH) * COL_WIDTH - 8;
                    const s = statusOf(b.status);
                    const isPencil = b.status === 'pencil';
                    return (
                      <div key={b.id} style={{
                        position: 'absolute', left, width, top: 8, bottom: 8,
                        background: 'var(--surface)',
                        borderRadius: 10,
                        border: isPencil ? `2px dashed ${s.accent}` : `1px solid ${s.accent}80`,
                        boxShadow: '0 2px 6px rgba(15,23,42,0.06)',
                        padding: '8px 11px',
                        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                        cursor: 'pointer', overflow: 'hidden',
                        borderLeft: `4px solid ${hall.color}`,
                      }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.accent, flexShrink: 0 }} />
                            <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{b.function}</span>
                          </div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{b.customer} · {b.type}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                          <span style={{
                            fontSize: 9.5, fontWeight: 700, padding: '1px 7px', borderRadius: 9999,
                            background: s.bg, color: s.text,
                          }}>{s.label.toUpperCase()}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>{B_ICONS.users}{b.guests}</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {/* Now line */}
                  {hIdx === 0 && (
                    <div style={{ position: 'absolute', left: (14.5 - 9) * COL_WIDTH, top: 0, height: ROW_HEIGHT * HALLS.length + (HALLS.length - 1), width: 2, background: 'var(--teal-600)', zIndex: 4, boxShadow: '0 0 8px rgba(13,148,136,0.4)', pointerEvents: 'none' }}>
                      <div style={{ position: 'absolute', top: -8, left: -5, width: 12, height: 12, borderRadius: '50%', background: 'var(--teal-600)', border: '2px solid white' }} />
                      <div style={{ position: 'absolute', top: -22, left: -16, fontSize: 9.5, fontWeight: 800, color: 'white', background: 'var(--teal-600)', padding: '2px 7px', borderRadius: 9999, whiteSpace: 'nowrap', boxShadow: '0 2px 4px rgba(13,148,136,0.3)' }}>NOW · 14:32</div>
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── MOBILE (Variant B) — Today as hall-grouped cards ───── */
function VB_Mobile() {
  const dayBookings = bookingsForDate(TODAY_ISO);
  const stripDays = Array.from({ length: 7 }, (_, i) => new Date(2026, 4, 18 + i));

  return (
    <div style={{ height: '100%', background: '#f7f8fb', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
      {/* Status bar */}
      <div style={{ height: 28, background: 'var(--surface)', padding: '0 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: 'var(--text-1)', fontVariantNumeric: 'tabular-nums' }}>
        <span>9:41</span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 10 }}>
          <span>●●●●</span><span>5G</span>
          <span style={{ display: 'inline-block', width: 22, height: 10, border: '1px solid var(--text-1)', borderRadius: 2, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 1, top: 1, bottom: 1, width: 16, background: 'var(--text-1)', borderRadius: 1 }} />
          </span>
        </div>
      </div>

      {/* Big editorial date header */}
      <div style={{ padding: '14px 18px 12px', background: 'var(--surface)' }}>
        <p style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--teal-600)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Today · Calendar</p>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.025em', lineHeight: 1.05, marginTop: 4 }}>Thu, 21 May</h1>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4, fontWeight: 500 }}>
          <span style={{ fontWeight: 700, color: 'var(--text-1)' }}>{dayBookings.length} events</span> across {new Set(dayBookings.map(b => b.hall)).size} halls
        </p>
      </div>

      {/* Day strip */}
      <div style={{ display: 'flex', gap: 6, padding: '0 14px 12px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
        {stripDays.map((d, i) => {
          const iso = isoDate(d);
          const isToday = iso === TODAY_ISO;
          const count = bookingsForDate(iso).length;
          // tiny hall dots
          const hallSet = new Set(bookingsForDate(iso).map(b => b.hall));
          return (
            <button key={i} style={{
              flex: '0 0 48px', padding: '8px 4px 6px', borderRadius: 14,
              border: isToday ? '2px solid var(--teal-600)' : '1px solid transparent',
              background: isToday ? 'var(--teal-50)' : 'transparent',
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: isToday ? 'var(--teal-700)' : 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{dayName(d)}</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: isToday ? 'var(--teal-700)' : 'var(--text-1)', fontVariantNumeric: 'tabular-nums', lineHeight: 1, letterSpacing: '-0.02em' }}>{d.getDate()}</span>
              <div style={{ display: 'flex', gap: 2, marginTop: 1 }}>
                {HALLS.map(h => (
                  <span key={h.id} style={{
                    width: 4, height: 4, borderRadius: '50%',
                    background: hallSet.has(h.id) ? h.color : 'var(--surface-3)',
                    opacity: hallSet.has(h.id) ? 1 : 0.4,
                  }} />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Hall summary chips */}
      <div style={{ padding: '10px 14px 8px', display: 'flex', gap: 6, overflowX: 'auto', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        {HALLS.map(h => {
          const count = dayBookings.filter(b => b.hall === h.id).length;
          return (
            <div key={h.id} style={{
              flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 11px 6px 9px', borderRadius: 9999,
              background: `${h.color}14`,
              border: `1px solid ${h.color}40`,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: h.color }} />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: h.color }}>{h.name.replace(' Hall','').replace(' Banquet','').replace(' Room','').replace(' Garden','')}</span>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: h.color, background: 'white', padding: '1px 5px', borderRadius: 9999, fontVariantNumeric: 'tabular-nums' }}>{count}</span>
            </div>
          );
        })}
      </div>

      {/* Bookings — grouped by slot, larger editorial cards */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px 90px' }}>
        {SLOTS.map(slot => {
          const list = dayBookings.filter(b => b.slot === slot.id);
          if (list.length === 0) return null;
          return (
            <div key={slot.id} style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 8 }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{slot.label}</p>
                  <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em', lineHeight: 1, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>{slot.startLabel} → {slot.endLabel}</p>
                </div>
                <span style={{ marginBottom: 1, fontSize: 11.5, fontWeight: 700, color: 'var(--text-3)' }}>{list.length} event{list.length > 1 ? 's' : ''}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {list.map(b => {
                  const hall = hallById(b.hall);
                  const s = statusOf(b.status);
                  const isPencil = b.status === 'pencil';
                  return (
                    <div key={b.id} style={{
                      background: 'var(--surface)',
                      borderRadius: 14,
                      border: isPencil ? `2px dashed ${s.accent}` : '1px solid var(--border)',
                      padding: '12px 14px',
                      display: 'flex', flexDirection: 'column', gap: 8,
                      position: 'relative', overflow: 'hidden',
                      boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
                    }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, background: hall.color }} />
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, paddingLeft: 4 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.015em', lineHeight: 1.2 }}>{b.function}</p>
                          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2, fontWeight: 500 }}>{b.customer}</p>
                        </div>
                        <span style={{
                          fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 9999,
                          background: s.bg, color: s.text, textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0,
                        }}>{s.label}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 4 }}>
                        <VB_HallChip hall={hall} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-4)' }}>{b.type}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: 'var(--text-2)', display: 'inline-flex', alignItems: 'center', gap: 4, fontVariantNumeric: 'tabular-nums' }}>
                          {B_ICONS.users}{b.guests}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom tab bar */}
      <div style={{ height: 60, background: 'var(--surface)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexShrink: 0, position: 'relative' }}>
        {[['home','Home'],['calendar','Calendar',true],['users','Customers'],['menu','More']].map(([k, l, active]) => (
          <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: active ? 'var(--teal-700)' : 'var(--text-4)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              {k === 'calendar' && <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>}
              {k === 'home' && <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>}
              {k === 'users' && <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></>}
              {k === 'menu' && <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>}
            </svg>
            <span style={{ fontSize: 10, fontWeight: active ? 800 : 600 }}>{l}</span>
          </div>
        ))}
        {/* FAB-style center action */}
        <div style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', width: 48, height: 48, borderRadius: 16, background: 'linear-gradient(135deg, #0d9488, #14b8a6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 14px rgba(13,148,136,0.4)', color: 'white' }}>
          {B_ICONS.plus}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { VB_Month, VB_Week, VB_Day, VB_Mobile });
