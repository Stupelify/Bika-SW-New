// variantA.jsx — "Resource Matrix" — lean, on-brand, dense Gantt
// Exports: VA_Month, VA_Week, VA_Day, VA_Mobile

const { useState: useStateA } = React;

/* ─── Shared icon glyphs ─────────────────────────────────────── */
const A_ICONS = {
  chevL:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  chevR:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  chevDn: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  filter: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  plus:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  warn:   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
};

/* Diagonal stripe pattern for pencil bookings */
const A_STRIPE = 'repeating-linear-gradient(135deg, transparent 0, transparent 4px, rgba(146,64,14,0.18) 4px, rgba(146,64,14,0.18) 5px)';

/* ─── Toolbar ────────────────────────────────────────────────── */
function VA_Toolbar({ view, onView, title, subtitle }) {
  const Btn = ({ children, onClick, active, style }) => (
    <button onClick={onClick} style={{
      padding: '6px 11px', borderRadius: 9, border: '1px solid var(--border-2)',
      background: active ? 'var(--teal-600)' : 'var(--surface)',
      color: active ? 'white' : 'var(--text-2)',
      fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
      display: 'inline-flex', alignItems: 'center', gap: 5, ...style,
    }}>{children}</button>
  );
  const ChipFilter = ({ label }) => (
    <button style={{
      padding: '5px 10px', borderRadius: 9, border: '1px solid var(--border-2)',
      background: 'var(--surface)', color: 'var(--text-3)', fontSize: 11.5, fontWeight: 600,
      cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 5,
    }}>{A_ICONS.filter}{label}{A_ICONS.chevDn}</button>
  );
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 16px', borderBottom: '1px solid var(--border)',
      background: 'var(--surface)', gap: 12, flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Btn>{A_ICONS.chevL}</Btn>
        <Btn>{A_ICONS.chevR}</Btn>
        <Btn style={{ padding: '6px 12px' }}>Today</Btn>
        <div style={{ marginLeft: 10 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em', lineHeight: 1.1 }}>{title}</p>
          <p style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 1 }}>{subtitle}</p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ display: 'inline-flex', background: 'var(--surface-2)', padding: 3, borderRadius: 10, gap: 2 }}>
          {['month','week','day'].map(v => (
            <button key={v} onClick={() => onView && onView(v)} style={{
              padding: '5px 13px', borderRadius: 7, border: 'none',
              background: view === v ? 'var(--surface)' : 'transparent',
              color: view === v ? 'var(--text-1)' : 'var(--text-3)',
              fontSize: 12, fontWeight: view === v ? 600 : 500,
              cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize',
              boxShadow: view === v ? '0 1px 2px rgba(15,23,42,0.06)' : 'none',
            }}>{v}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <ChipFilter label="All halls" />
        <ChipFilter label="Status" />
        <ChipFilter label="Type" />
        <button style={{
          padding: '6px 13px', borderRadius: 10, border: 'none', background: 'var(--teal-600)',
          color: 'white', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          display: 'inline-flex', alignItems: 'center', gap: 5, boxShadow: '0 1px 3px rgba(13,148,136,0.25)',
        }}>{A_ICONS.plus}Booking</button>
      </div>
    </div>
  );
}

/* ─── Status legend ──────────────────────────────────────────── */
function VA_Legend() {
  const items = [
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'pencil',    label: 'Pencil' },
    { key: 'quotation', label: 'Quotation' },
    { key: 'enquiry',   label: 'Enquiry' },
  ];
  return (
    <div style={{ display: 'flex', gap: 12, padding: '6px 16px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', fontSize: 11 }}>
      {items.map(i => {
        const s = statusOf(i.key);
        const stripe = i.key === 'pencil';
        return (
          <span key={i.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-3)' }}>
            <span style={{
              width: 12, height: 12, borderRadius: 3, background: s.bg, border: `1px solid ${s.accent}`,
              backgroundImage: stripe ? A_STRIPE : 'none',
            }} />
            {i.label}
          </span>
        );
      })}
      <span style={{ marginLeft: 'auto', color: 'var(--text-4)' }}>● Today {TODAY.getDate()} {shortMonth(TODAY)}</span>
    </div>
  );
}

/* ─── Booking pill (compact) ─────────────────────────────────── */
function VA_Pill({ booking, slim }) {
  const s = statusOf(booking.status);
  const hall = hallById(booking.hall);
  const slot = slotById(booking.slot);
  const isPencil = booking.status === 'pencil';
  return (
    <div title={`${booking.function} · ${booking.customer} · ${booking.guests} guests`} style={{
      display: 'flex', alignItems: 'center', gap: 4, minWidth: 0,
      padding: slim ? '2px 6px' : '3px 7px',
      borderRadius: 5,
      background: s.bg, color: s.text,
      border: `1px solid ${booking.conflict ? '#ef4444' : 'transparent'}`,
      backgroundImage: isPencil ? A_STRIPE : 'none',
      fontSize: 10.5, fontWeight: 600, lineHeight: 1.2,
      cursor: 'pointer', position: 'relative',
    }}>
      <span style={{ width: 4, height: 4, borderRadius: '50%', background: hall.color, flexShrink: 0 }} />
      {!slim && <span style={{ fontSize: 9.5, opacity: 0.7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{slot.shortLabel}</span>}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{booking.function}</span>
      {booking.conflict && <span style={{ color: '#ef4444' }}>{A_ICONS.warn}</span>}
    </div>
  );
}

/* ─── MONTH VIEW ─────────────────────────────────────────────── */
function VA_Month() {
  const year = 2026, month = 4; // May
  const days = buildMonthGrid(year, month);
  const dayHeaders = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  return (
    <div style={{ height: '100%', background: 'var(--bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <VA_Toolbar view="month" title="May 2026" subtitle="43 bookings · 4 halls · 31 days" />
      <VA_Legend />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
        {dayHeaders.map((d, i) => (
          <div key={d} style={{ padding: '5px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: (i === 0 || i === 6) ? '#dc2626' : 'var(--text-4)', borderRight: i < 6 ? '1px solid var(--border)' : 'none' }}>{d}</div>
        ))}
      </div>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: 'repeat(6, 1fr)', background: 'var(--surface)', minHeight: 0 }}>
        {days.map((d, i) => {
          const inMonth = d.getMonth() === month;
          const iso = isoDate(d);
          const isToday = iso === TODAY_ISO;
          const list = bookingsForDate(iso);
          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
          const visible = list.slice(0, 5);
          const extra = list.length - visible.length;
          return (
            <div key={i} style={{
              borderRight: (i % 7) < 6 ? '1px solid var(--border)' : 'none',
              borderBottom: i < 35 ? '1px solid var(--border)' : 'none',
              padding: '4px 5px 3px',
              background: !inMonth ? 'var(--surface-2)' : isToday ? 'var(--teal-50)' : isWeekend ? '#fafbfc' : 'var(--surface)',
              opacity: inMonth ? 1 : 0.55,
              display: 'flex', flexDirection: 'column', gap: 2, minHeight: 0, overflow: 'hidden',
              outline: isToday ? '2px solid var(--teal-500)' : 'none', outlineOffset: -2,
              cursor: 'pointer', position: 'relative',
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 4 }}>
                <span style={{
                  fontSize: isToday ? 13 : 12, fontWeight: isToday ? 800 : 600,
                  color: isToday ? 'var(--teal-700)' : isWeekend ? '#dc2626' : 'var(--text-1)',
                  fontVariantNumeric: 'tabular-nums', lineHeight: 1,
                  background: isToday ? 'var(--teal-600)' : 'transparent',
                  color2: isToday ? 'white' : undefined,
                  ...(isToday ? { color: 'white', padding: '2px 6px', borderRadius: 8 } : {}),
                }}>{d.getDate()}</span>
                {list.length > 0 && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-4)', background: 'var(--surface-2)', padding: '1px 5px', borderRadius: 9, fontVariantNumeric: 'tabular-nums' }}>
                    {list.length}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden', flex: 1 }}>
                {visible.map(b => <VA_Pill key={b.id} booking={b} slim={list.length > 4} />)}
                {extra > 0 && <span style={{ fontSize: 10, color: 'var(--text-4)', fontWeight: 600, paddingLeft: 4, marginTop: 1 }}>+ {extra} more</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── WEEK VIEW (Halls × 7 days) ─────────────────────────────── */
function VA_Week() {
  // Week of May 17-23, 2026 (Sun-Sat)
  const weekStart = new Date(2026, 4, 17);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d; });

  return (
    <div style={{ height: '100%', background: 'var(--bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <VA_Toolbar view="week" title="Week of 17 – 23 May 2026" subtitle="22 bookings · 4 halls · 1 conflict on Sat 23 May" />
      <VA_Legend />
      <div style={{ display: 'grid', gridTemplateColumns: '170px repeat(7, 1fr)', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ padding: '8px 12px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-4)', borderRight: '1px solid var(--border)' }}>Hall</div>
        {days.map((d, i) => {
          const isToday = isoDate(d) === TODAY_ISO;
          const isWk = d.getDay() === 0 || d.getDay() === 6;
          return (
            <div key={i} style={{
              padding: '6px 10px',
              borderRight: i < 6 ? '1px solid var(--border)' : 'none',
              background: isToday ? 'var(--teal-50)' : 'transparent',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: isWk ? '#dc2626' : 'var(--text-4)', lineHeight: 1 }}>{dayName(d)}</div>
              <div style={{ marginTop: 3, fontSize: isToday ? 16 : 14, fontWeight: isToday ? 800 : 600, color: isToday ? 'var(--teal-700)' : 'var(--text-1)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{d.getDate()}</div>
            </div>
          );
        })}
      </div>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '170px repeat(7, 1fr)', gridTemplateRows: `repeat(${HALLS.length}, 1fr)`, background: 'var(--surface)', minHeight: 0 }}>
        {HALLS.map((hall, hIdx) => (
          <React.Fragment key={hall.id}>
            <div style={{
              padding: '8px 12px', borderRight: '1px solid var(--border)',
              borderBottom: hIdx < HALLS.length - 1 ? '1px solid var(--border)' : 'none',
              display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2,
              background: 'var(--surface-2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: hall.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>{hall.name}</span>
              </div>
              <span style={{ fontSize: 10.5, color: 'var(--text-4)', fontVariantNumeric: 'tabular-nums', paddingLeft: 15 }}>cap. {hall.capacity}</span>
            </div>
            {days.map((d, dIdx) => {
              const iso = isoDate(d);
              const isToday = iso === TODAY_ISO;
              const isWk = d.getDay() === 0 || d.getDay() === 6;
              const dayBookings = bookingsForDate(iso).filter(b => b.hall === hall.id);
              return (
                <div key={dIdx} style={{
                  borderRight: dIdx < 6 ? '1px solid var(--border)' : 'none',
                  borderBottom: hIdx < HALLS.length - 1 ? '1px solid var(--border)' : 'none',
                  background: isToday ? 'rgba(20,184,166,0.04)' : isWk ? '#fafbfc' : 'var(--surface)',
                  display: 'grid', gridTemplateRows: 'repeat(4, 1fr)', gap: 0,
                  padding: 2,
                }}>
                  {SLOTS.map((slot, sIdx) => {
                    const slotBookings = dayBookings.filter(b => b.slot === slot.id);
                    const b = slotBookings[0];
                    const conflict = slotBookings.length > 1;
                    if (!b) return (
                      <div key={slot.id} style={{
                        borderTop: sIdx > 0 ? '1px dashed var(--surface-3)' : 'none',
                        display: 'flex', alignItems: 'center', paddingLeft: 4,
                        fontSize: 9, color: 'var(--text-4)', opacity: 0.5,
                      }}>{slot.shortLabel}</div>
                    );
                    const s = statusOf(b.status);
                    const isPencil = b.status === 'pencil';
                    return (
                      <div key={slot.id} style={{
                        margin: '1px 0',
                        background: s.bg, color: s.text,
                        backgroundImage: isPencil ? A_STRIPE : 'none',
                        borderRadius: 4, border: `1px solid ${conflict ? '#ef4444' : s.accent}40`,
                        padding: '3px 5px', display: 'flex', flexDirection: 'column', gap: 1, minHeight: 0, overflow: 'hidden',
                        position: 'relative',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                          <span style={{ fontSize: 9, fontWeight: 700, opacity: 0.6, letterSpacing: '0.02em', textTransform: 'uppercase' }}>{slot.shortLabel}</span>
                          {conflict && <span style={{ color: '#ef4444', display: 'flex' }}>{A_ICONS.warn}</span>}
                        </div>
                        <div style={{ fontSize: 10.5, fontWeight: 700, lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.function}</div>
                        <div style={{ fontSize: 9.5, opacity: 0.75, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.customer} · {b.type}</div>
                      </div>
                    );
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

/* ─── DAY VIEW (Halls × hour columns) ────────────────────────── */
function VA_Day() {
  const hours = Array.from({ length: 15 }, (_, i) => i + 9); // 9am to 11pm
  const dayBookings = bookingsForDate(TODAY_ISO);
  // Each hour = 1 unit. Total width = 15 units.
  const COL_WIDTH = 75; // px per hour
  const HALL_COL_WIDTH = 160;

  return (
    <div style={{ height: '100%', background: 'var(--bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <VA_Toolbar view="day" title={`${fullDayName(TODAY)}, 21 May 2026`} subtitle={`${dayBookings.length} bookings today · Now 14:32`} />
      <VA_Legend />
      <div style={{ flex: 1, overflow: 'auto', background: 'var(--surface)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `${HALL_COL_WIDTH}px 1fr`, position: 'relative' }}>
          {/* Hour header */}
          <div style={{ borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', padding: '8px 12px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-4)', position: 'sticky', left: 0, zIndex: 2 }}>
            Hall
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${hours.length}, ${COL_WIDTH}px)`, borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
            {hours.map(h => {
              const slot = SLOTS.find(s => h >= s.startH && h < s.endH);
              const isNow = h === 14;
              return (
                <div key={h} style={{
                  padding: '6px 8px', borderRight: '1px solid var(--border)',
                  fontSize: 10.5, color: isNow ? 'var(--teal-700)' : 'var(--text-4)', fontWeight: isNow ? 700 : 600,
                  textAlign: 'left', position: 'relative',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-1)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                    {h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`}
                  </div>
                  <div style={{ fontSize: 9, marginTop: 1, opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{slot ? slot.label : ''}</div>
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
                  padding: '12px', borderRight: '1px solid var(--border)',
                  borderBottom: hIdx < HALLS.length - 1 ? '1px solid var(--border)' : 'none',
                  background: 'var(--surface-2)', position: 'sticky', left: 0, zIndex: 2,
                  display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: hall.color }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>{hall.name}</span>
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-4)', paddingLeft: 17 }}>
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>{hallBookings.length}</span> bookings · cap. <span style={{ fontVariantNumeric: 'tabular-nums' }}>{hall.capacity}</span>
                  </div>
                </div>
                <div style={{
                  position: 'relative',
                  borderBottom: hIdx < HALLS.length - 1 ? '1px solid var(--border)' : 'none',
                  height: 110,
                  backgroundImage: `linear-gradient(to right, var(--border) 1px, transparent 1px)`,
                  backgroundSize: `${COL_WIDTH}px 100%`,
                  backgroundPosition: '0 0',
                }}>
                  {/* Slot bg tints */}
                  {SLOTS.map((slot, sIdx) => {
                    const left = (slot.startH - 9) * COL_WIDTH;
                    const width = (slot.endH - slot.startH) * COL_WIDTH;
                    return (
                      <div key={slot.id} style={{
                        position: 'absolute', left, top: 0, bottom: 0, width,
                        background: sIdx % 2 === 0 ? 'transparent' : 'rgba(15,23,42,0.015)',
                      }} />
                    );
                  })}
                  {/* Bookings as bars */}
                  {hallBookings.map(b => {
                    const slot = slotById(b.slot);
                    const left = (slot.startH - 9) * COL_WIDTH + 3;
                    const width = (slot.endH - slot.startH) * COL_WIDTH - 6;
                    const s = statusOf(b.status);
                    const isPencil = b.status === 'pencil';
                    return (
                      <div key={b.id} style={{
                        position: 'absolute', left, width, top: 6, bottom: 6,
                        background: s.bg, color: s.text,
                        backgroundImage: isPencil ? A_STRIPE : 'none',
                        borderRadius: 7, border: `1.5px solid ${s.accent}`,
                        borderLeft: `4px solid ${hall.color}`,
                        padding: '6px 9px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                        cursor: 'pointer', overflow: 'hidden',
                      }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.function}</div>
                          <div style={{ fontSize: 10.5, opacity: 0.85, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.customer} · {b.type}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                          <span style={{ fontSize: 9.5, opacity: 0.75, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{slot.startLabel}–{slot.endLabel}</span>
                          <span style={{ fontSize: 9.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums', background: 'rgba(255,255,255,0.55)', padding: '1px 6px', borderRadius: 7 }}>{b.guests} guests</span>
                        </div>
                      </div>
                    );
                  })}
                  {/* Current time line */}
                  {hIdx === 0 && (
                    <div style={{ position: 'absolute', left: ((14.5 - 9) * COL_WIDTH), top: 0, bottom: -((HALLS.length - 1) * 110 + (HALLS.length - 1)), width: 2, background: 'var(--teal-600)', zIndex: 5, pointerEvents: 'none' }}>
                      <div style={{ position: 'absolute', top: -2, left: -4, width: 10, height: 10, borderRadius: '50%', background: 'var(--teal-600)' }} />
                      <div style={{ position: 'absolute', top: -16, left: 4, fontSize: 9.5, fontWeight: 700, color: 'white', background: 'var(--teal-600)', padding: '1px 5px', borderRadius: 4, whiteSpace: 'nowrap' }}>Now 14:32</div>
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

/* ─── MOBILE — Today's agenda ────────────────────────────────── */
function VA_Mobile() {
  const dayBookings = bookingsForDate(TODAY_ISO).sort((a, b) => slotById(a.slot).startH - slotById(b.slot).startH);
  const grouped = SLOTS.map(slot => ({ slot, list: dayBookings.filter(b => b.slot === slot.id) }));

  // 7-day strip centered on today (May 18-24)
  const stripDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(2026, 4, 18 + i); return d; });

  return (
    <div style={{ height: '100%', background: 'var(--bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
      {/* Status bar */}
      <div style={{ height: 28, background: 'var(--surface)', padding: '0 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: 'var(--text-1)', fontVariantNumeric: 'tabular-nums' }}>
        <span>9:41</span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 10 }}>
          <span>●●●●</span>
          <span>5G</span>
          <span style={{ display: 'inline-block', width: 22, height: 10, border: '1px solid var(--text-1)', borderRadius: 2, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 1, top: 1, bottom: 1, width: 16, background: 'var(--text-1)', borderRadius: 1 }} />
          </span>
        </div>
      </div>

      {/* Header */}
      <div style={{ padding: '12px 16px 10px', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--teal-600)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Today</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em', lineHeight: 1.1, marginTop: 2 }}>Thu, 21 May</p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', cursor: 'pointer' }}>{A_ICONS.filter}</button>
            <button style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'var(--teal-600)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>{A_ICONS.plus}</button>
          </div>
        </div>
      </div>

      {/* Day strip */}
      <div style={{ display: 'flex', gap: 6, padding: '10px 14px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
        {stripDays.map((d, i) => {
          const iso = isoDate(d);
          const isToday = iso === TODAY_ISO;
          const count = bookingsForDate(iso).length;
          return (
            <button key={i} style={{
              flex: '0 0 46px', padding: '8px 4px', borderRadius: 12,
              border: 'none',
              background: isToday ? 'var(--teal-600)' : 'transparent',
              color: isToday ? 'white' : 'var(--text-2)',
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            }}>
              <span style={{ fontSize: 9.5, fontWeight: 600, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{dayName(d)}</span>
              <span style={{ fontSize: 17, fontWeight: 800, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{d.getDate()}</span>
              {count > 0 && <span style={{ width: 4, height: 4, borderRadius: '50%', background: isToday ? 'white' : 'var(--teal-500)' }} />}
            </button>
          );
        })}
      </div>

      {/* View pills */}
      <div style={{ display: 'flex', gap: 4, padding: '8px 14px', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        {['Day','Week','Month'].map((v, i) => (
          <button key={v} style={{
            padding: '6px 14px', borderRadius: 9,
            background: i === 0 ? 'var(--teal-50)' : 'transparent',
            color: i === 0 ? 'var(--teal-700)' : 'var(--text-3)',
            fontSize: 12, fontWeight: i === 0 ? 700 : 500,
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          }}>{v}</button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-4)', alignSelf: 'center' }}>
          {bookingsForDate(TODAY_ISO).length} bookings
        </span>
      </div>

      {/* Booking list grouped by slot */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px 80px' }}>
        {grouped.map(g => g.list.length === 0 ? null : (
          <div key={g.slot.id} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, padding: '0 2px' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{g.slot.label}</span>
              <span style={{ fontSize: 10.5, color: 'var(--text-4)', fontVariantNumeric: 'tabular-nums' }}>{g.slot.startLabel} – {g.slot.endLabel}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: 'var(--text-4)', background: 'var(--surface-2)', padding: '1px 7px', borderRadius: 8 }}>{g.list.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {g.list.map(b => {
                const hall = hallById(b.hall);
                const s = statusOf(b.status);
                const isPencil = b.status === 'pencil';
                return (
                  <div key={b.id} style={{
                    background: 'var(--surface)', borderRadius: 12, padding: '10px 12px',
                    border: '1px solid var(--border)',
                    borderLeft: `4px solid ${hall.color}`,
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    backgroundImage: isPencil ? `repeating-linear-gradient(135deg, transparent 0, transparent 8px, rgba(146,64,114,0.04) 8px, rgba(146,64,114,0.04) 9px)` : 'none',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.function}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{b.customer}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 600 }}>{hall.name}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-4)' }}>·</span>
                        <span style={{ fontSize: 11, color: 'var(--text-4)' }}>{b.type}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-4)' }}>·</span>
                        <span style={{ fontSize: 11, color: 'var(--text-4)', fontVariantNumeric: 'tabular-nums' }}>{b.guests} pax</span>
                      </div>
                    </div>
                    <span style={{
                      flexShrink: 0,
                      fontSize: 10.5, fontWeight: 700,
                      padding: '2px 8px', borderRadius: 9999,
                      background: s.bg, color: s.text,
                      backgroundImage: isPencil ? A_STRIPE : 'none',
                    }}>{s.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{ height: 56, background: 'var(--surface)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexShrink: 0 }}>
        {[['home','Home'],['calendar','Calendar',true],['users','Customers'],['menu','More']].map(([k, l, active]) => (
          <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, color: active ? 'var(--teal-700)' : 'var(--text-4)' }}>
            <div style={{ width: 18, height: 18, borderRadius: 4, background: active ? 'var(--teal-50)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 2 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                {k === 'calendar' && <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>}
                {k === 'home' && <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>}
                {k === 'users' && <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></>}
                {k === 'menu' && <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>}
              </svg>
            </div>
            <span style={{ fontSize: 9.5, fontWeight: active ? 700 : 500 }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { VA_Month, VA_Week, VA_Day, VA_Mobile });
