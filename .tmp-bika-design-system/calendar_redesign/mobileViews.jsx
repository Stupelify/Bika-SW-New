// mobileViews.jsx — Mobile Week + Month for both Variant A & B
// Exports: VA_MobileWeek, VA_MobileMonth, VB_MobileWeek, VB_MobileMonth

const { useState: useMVState } = React;

/* ─── Shared mobile shell ────────────────────────────────────── */
function MobileShell({ children, bg = 'var(--bg)' }) {
  return (
    <div style={{ height: '100%', background: bg, display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: "'Inter', sans-serif", position: 'relative' }}>
      {/* status bar */}
      <div style={{ height: 26, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', fontSize: 11, fontWeight: 700, color: 'var(--text-1)', flexShrink: 0 }}>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>9:41</span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 10 }}>
          <span>●●●●</span><span>5G</span>
          <span style={{ display: 'inline-block', width: 20, height: 9, border: '1.5px solid var(--text-1)', borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
            <span style={{ position: 'absolute', left: 1, top: 1, bottom: 1, right: 2, background: 'var(--text-1)', borderRadius: 1 }} />
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}

/* ─── Shared mobile nav header ───────────────────────────────── */
function MobileNavHeader({ title, subtitle, onPrev, onNext, view, onViewChange }) {
  return (
    <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px 8px' }}>
        <button onClick={onPrev} style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.015em', lineHeight: 1.1 }}>{title}</p>
          {subtitle && <p style={{ fontSize: 10.5, color: 'var(--text-4)', marginTop: 2, fontWeight: 500 }}>{subtitle}</p>}
        </div>
        <button onClick={onNext} style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
      {/* View switcher */}
      <div style={{ display: 'flex', padding: '0 14px 10px', gap: 6 }}>
        {['Day','Week','Month'].map(v => (
          <button key={v} onClick={() => onViewChange && onViewChange(v.toLowerCase())}
            style={{ flex: 1, padding: '7px 0', borderRadius: 9, border: 'none', fontFamily: 'inherit', fontWeight: 700, fontSize: 12.5, cursor: 'pointer',
              background: view === v.toLowerCase() ? 'var(--teal-600)' : 'var(--surface-2)',
              color: view === v.toLowerCase() ? 'white' : 'var(--text-3)' }}>{v}</button>
        ))}
        <button style={{ width: 36, borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
        </button>
        <button style={{ width: 36, borderRadius: 9, border: 'none', background: 'var(--teal-600)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </div>
    </div>
  );
}

/* ─── Mobile bottom tab bar ──────────────────────────────────── */
function MobileTabBar() {
  return (
    <div style={{ height: 56, background: 'var(--surface)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexShrink: 0 }}>
      {[['home','Home'],['calendar','Calendar',true],['users','Guests'],['menu','More']].map(([k,l,active]) => (
        <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2.5, color: active ? 'var(--teal-700)' : 'var(--text-4)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            {k === 'calendar' && <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>}
            {k === 'home' && <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>}
            {k === 'users' && <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></>}
            {k === 'menu' && <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>}
          </svg>
          <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{l}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Day detail bottom sheet ────────────────────────────────── */
function DaySheet({ iso, onClose }) {
  const list = bookingsForDate(iso);
  const d = getDate(iso);
  if (!iso || list.length === 0) return null;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 56, background: 'var(--surface)', borderTop: '2px solid var(--border)', borderRadius: '16px 16px 0 0', boxShadow: '0 -8px 32px rgba(15,23,42,0.12)', zIndex: 50, maxHeight: '60%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 8px' }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--teal-600)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{fullDayName(d)}</p>
          <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em', lineHeight: 1 }}>{d.getDate()} {shortMonth(d)}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 600 }}>{list.length} bookings</span>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-3)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
      <div style={{ overflowY: 'auto', padding: '4px 12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {list.map(b => {
          const hall = hallById(b.hall);
          const slot = slotById(b.slot);
          const s = statusOf(b.status);
          return (
            <div key={b.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', borderLeft: `4px solid ${hall.color}` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.function}</p>
                <p style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 1 }}>{slot.label} · {hall.name} · {b.guests} pax</p>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 9999, background: s.bg, color: s.text, flexShrink: 0 }}>{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
/* VARIANT A — MOBILE WEEK                                        */
/* Halls as rows (sticky left), 7 days as scrollable columns     */
/* ══════════════════════════════════════════════════════════════ */
function VA_MobileWeek() {
  const [selectedDay, setSelectedDay] = useMVState(null);
  const weekStart = new Date(2026, 4, 17);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; });
  const HALL_COL = 90; // px, sticky
  const DAY_COL  = 72; // px each day

  return (
    <MobileShell>
      <MobileNavHeader view="week" title="17 – 23 May" subtitle="Week 21 · 4 halls" />

      {/* Summary strip */}
      <div style={{ display: 'flex', background: 'var(--surface)', borderBottom: '1px solid var(--border)', overflowX: 'auto', flexShrink: 0 }}>
        {days.map((d, i) => {
          const iso = isoDate(d);
          const isToday = iso === TODAY_ISO;
          const count = bookingsForDate(iso).length;
          const isWk = d.getDay() === 0 || d.getDay() === 6;
          const hallSet = new Set(bookingsForDate(iso).map(b => b.hall));
          return (
            <div key={i} onClick={() => setSelectedDay(selectedDay === iso ? null : iso)}
              style={{ flex: `0 0 ${DAY_COL}px`, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '7px 4px 6px', cursor: 'pointer',
                background: isToday ? 'var(--teal-50)' : selectedDay === iso ? 'var(--surface-2)' : 'transparent',
                borderBottom: isToday ? '2px solid var(--teal-500)' : '2px solid transparent' }}>
              <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: isWk ? '#dc2626' : isToday ? 'var(--teal-700)' : 'var(--text-4)' }}>{dayName(d)}</span>
              <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, marginTop: 2, fontVariantNumeric: 'tabular-nums', color: isToday ? 'var(--teal-700)' : 'var(--text-1)' }}>{d.getDate()}</span>
              <div style={{ display: 'flex', gap: 2, marginTop: 3 }}>
                {HALLS.map(h => <span key={h.id} style={{ width: 4, height: 4, borderRadius: '50%', background: hallSet.has(h.id) ? h.color : 'var(--surface-3)' }} />)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Matrix: hall rows × day cols */}
      <div style={{ flex: 1, overflow: 'auto', background: 'var(--surface)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `${HALL_COL}px repeat(7, ${DAY_COL}px)`, minWidth: HALL_COL + DAY_COL * 7 }}>
          {/* Column header spacer */}
          <div style={{ borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', position: 'sticky', left: 0, zIndex: 3, padding: '5px 8px', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-4)' }}>Hall</div>
          {days.map((d, i) => {
            const iso = isoDate(d);
            const isToday = iso === TODAY_ISO;
            const isWk = d.getDay() === 0 || d.getDay() === 6;
            return (
              <div key={i} style={{ borderRight: i < 6 ? '1px solid var(--border)' : 'none', borderBottom: '1px solid var(--border)', padding: '5px 3px', textAlign: 'center', background: isToday ? 'var(--teal-50)' : 'var(--surface-2)' }}>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: isWk ? '#dc2626' : isToday ? 'var(--teal-700)' : 'var(--text-4)' }}>{dayName(d)}</div>
                <div style={{ fontSize: 14, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: isToday ? 'var(--teal-600)' : 'var(--text-1)', lineHeight: 1, marginTop: 1 }}>{d.getDate()}</div>
              </div>
            );
          })}

          {/* Hall rows */}
          {HALLS.map((hall, hIdx) => (
            <React.Fragment key={hall.id}>
              {/* Hall label cell — sticky */}
              <div style={{ position: 'sticky', left: 0, zIndex: 2, background: 'var(--surface-2)', borderRight: '1px solid var(--border)', borderBottom: hIdx < HALLS.length - 1 ? '1px solid var(--border)' : 'none', padding: '8px 6px 8px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: hall.color, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1.1, whiteSpace: 'nowrap' }}>{hall.name.replace(' Banquet','').replace(' Hall','').replace(' Room','').replace(' Garden','')}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-4)', marginTop: 1 }}>{hall.capacity}</div>
                </div>
              </div>

              {/* Day cells */}
              {days.map((d, dIdx) => {
                const iso = isoDate(d);
                const isToday = iso === TODAY_ISO;
                const dayHallBooks = bookingsForDate(iso).filter(b => b.hall === hall.id);
                const hasConflict = SLOTS.some(sl => dayHallBooks.filter(b => b.slot === sl.id).length > 1);
                return (
                  <div key={dIdx} onClick={() => setSelectedDay(selectedDay === iso ? null : iso)}
                    style={{
                      borderRight: dIdx < 6 ? '1px solid var(--border)' : 'none',
                      borderBottom: hIdx < HALLS.length - 1 ? '1px solid var(--border)' : 'none',
                      background: isToday ? 'rgba(20,184,166,0.04)' : 'var(--surface)',
                      padding: 4, cursor: 'pointer',
                      display: 'grid', gridTemplateRows: 'repeat(4,1fr)', gap: 2,
                    }}>
                    {SLOTS.map(sl => {
                      const list = dayHallBooks.filter(b => b.slot === sl.id);
                      const b = list[0];
                      const conflict = list.length > 1;
                      if (!b) return (
                        <div key={sl.id} style={{ borderRadius: 3, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                          <span style={{ fontSize: 8, color: 'var(--text-4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{sl.shortLabel.charAt(0)}</span>
                        </div>
                      );
                      const s = statusOf(b.status);
                      const isPencil = b.status === 'pencil';
                      return (
                        <div key={sl.id} style={{
                          borderRadius: 3, background: s.bg, color: s.text,
                          backgroundImage: isPencil ? 'repeating-linear-gradient(135deg, transparent 0, transparent 3px, rgba(146,64,14,0.2) 3px, rgba(146,64,14,0.2) 4px)' : 'none',
                          border: conflict ? '1px solid #ef4444' : 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                        }}>
                          {conflict ? (
                            <span style={{ fontSize: 8, color: '#ef4444' }}>⚠</span>
                          ) : (
                            <span style={{ width: 4, height: 4, borderRadius: '50%', background: s.accent }} />
                          )}
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

      {/* Legend bar */}
      <div style={{ padding: '6px 14px', background: 'var(--surface)', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
        {[['confirmed','#22c55e'],['pencil','#f59e0b'],['quotation','#3b82f6']].map(([k,c]) => (
          <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-3)' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: statusOf(k).bg, border: `1px solid ${c}` }} />{statusOf(k).label}
          </span>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-4)' }}>M/L/E/D slots</span>
      </div>

      {/* Day detail sheet */}
      {selectedDay && <DaySheet iso={selectedDay} onClose={() => setSelectedDay(null)} />}

      <MobileTabBar />
    </MobileShell>
  );
}

/* ══════════════════════════════════════════════════════════════ */
/* VARIANT A — MOBILE MONTH                                       */
/* Standard month grid, status-coded pills, tap for day sheet    */
/* ══════════════════════════════════════════════════════════════ */
function VA_MobileMonth() {
  const [selectedDay, setSelectedDay] = useMVState(null);
  const year = 2026, month = 4;
  const days = buildMonthGrid(year, month);
  const weekdays = ['S','M','T','W','T','F','S'];

  return (
    <MobileShell>
      <MobileNavHeader view="month" title="May 2026" subtitle="43 bookings · 4 halls" />

      {/* Weekday row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', background: 'var(--surface)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        {weekdays.map((w, i) => (
          <div key={i} style={{ padding: '6px 0', textAlign: 'center', fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: (i === 0 || i === 6) ? '#dc2626' : 'var(--text-4)' }}>{w}</div>
        ))}
      </div>

      {/* Month grid */}
      <div style={{ flex: selectedDay ? '0 0 auto' : 1, display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gridAutoRows: '1fr', background: 'var(--surface)', flexShrink: 0 }}>
        {days.map((d, i) => {
          const iso = isoDate(d);
          const inMonth = d.getMonth() === month;
          const isToday = iso === TODAY_ISO;
          const isSel = selectedDay === iso;
          const list = bookingsForDate(iso);
          const isWk = d.getDay() === 0 || d.getDay() === 6;
          const visible = list.slice(0, 2);
          const extra = list.length - visible.length;
          return (
            <div key={i} onClick={() => inMonth && setSelectedDay(isSel ? null : iso)}
              style={{
                borderRight: (i % 7) < 6 ? '1px solid var(--border)' : 'none',
                borderBottom: i < 35 ? '1px solid var(--border)' : 'none',
                padding: '4px 3px 3px',
                background: isSel ? 'var(--teal-50)' : isToday ? 'rgba(20,184,166,0.06)' : isWk && inMonth ? '#fafbfc' : 'var(--surface)',
                opacity: inMonth ? 1 : 0.4,
                cursor: inMonth ? 'pointer' : 'default',
                display: 'flex', flexDirection: 'column', gap: 2, minHeight: 0,
                outline: isToday ? '2px solid var(--teal-500)' : 'none', outlineOffset: -2,
                position: 'relative',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1,
                  color: isToday ? 'var(--teal-700)' : isWk ? '#dc2626' : 'var(--text-1)',
                  ...(isToday ? { background: 'var(--teal-600)', color: 'white', padding: '1px 5px', borderRadius: 7, fontWeight: 800 } : {}),
                }}>{d.getDate()}</span>
                {list.length > 2 && <span style={{ fontSize: 8.5, fontWeight: 700, color: 'var(--text-4)', background: 'var(--surface-2)', padding: '0 4px', borderRadius: 5, fontVariantNumeric: 'tabular-nums' }}>+{extra + (visible.length - visible.length)}</span>}
              </div>
              {/* Mini pills */}
              {visible.map(b => {
                const s = statusOf(b.status);
                const hall = hallById(b.hall);
                return (
                  <div key={b.id} style={{
                    background: s.bg, color: s.text, borderLeft: `2px solid ${hall.color}`,
                    borderRadius: 2, padding: '1px 3px', fontSize: 8.5, fontWeight: 700,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3,
                  }}>{b.function}</div>
                );
              })}
              {extra > 0 && <span style={{ fontSize: 8.5, color: 'var(--text-4)', fontWeight: 600, paddingLeft: 2 }}>+{extra}</span>}
            </div>
          );
        })}
      </div>

      {/* Day sheet */}
      {selectedDay ? (
        <div style={{ flex: 1, overflowY: 'auto', borderTop: '2px solid var(--teal-500)', background: 'var(--surface)', padding: '0 0 8px' }}>
          {(() => {
            const list = bookingsForDate(selectedDay);
            const d = getDate(selectedDay);
            return (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px 8px' }}>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--teal-600)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{fullDayName(d)}</p>
                    <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em', lineHeight: 1.1, marginTop: 1 }}>{d.getDate()} {shortMonth(d)} · {list.length} bookings</p>
                  </div>
                  <button onClick={() => setSelectedDay(null)} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: '0 10px' }}>
                  {list.map(b => {
                    const hall = hallById(b.hall);
                    const slot = slotById(b.slot);
                    const s = statusOf(b.status);
                    return (
                      <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border)', borderLeft: `4px solid ${hall.color}`, background: 'var(--surface)' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.function}</p>
                          <p style={{ fontSize: 10.5, color: 'var(--text-4)', marginTop: 1 }}>{slot.label} · {hall.name} · {b.guests} pax</p>
                        </div>
                        <span style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 6px', borderRadius: 9999, background: s.bg, color: s.text, flexShrink: 0 }}>{s.label}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </div>
      ) : null}

      <MobileTabBar />
    </MobileShell>
  );
}

/* ══════════════════════════════════════════════════════════════ */
/* VARIANT B — MOBILE WEEK                                        */
/* Hall-coded: big day cards, hall chips, slot bars per day       */
/* ══════════════════════════════════════════════════════════════ */
function VB_MobileWeek() {
  const [activeDay, setActiveDay] = useMVState(TODAY_ISO);
  const weekStart = new Date(2026, 4, 17);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; });

  const activeDayBookings = bookingsForDate(activeDay).sort((a, b) => slotById(a.slot).startH - slotById(b.slot).startH);

  return (
    <MobileShell>
      <MobileNavHeader view="week" title="17 – 23 May" subtitle="Week 21" />

      {/* Day selector strip — big day cards */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '10px 12px', display: 'flex', gap: 7, overflowX: 'auto', flexShrink: 0 }}>
        {days.map((d, i) => {
          const iso = isoDate(d);
          const isActive = iso === activeDay;
          const isToday = iso === TODAY_ISO;
          const list = bookingsForDate(iso);
          const hallsActive = HALLS.filter(h => list.some(b => b.hall === h.id));
          const isWk = d.getDay() === 0 || d.getDay() === 6;
          return (
            <button key={i} onClick={() => setActiveDay(iso)} style={{
              flex: isActive ? '0 0 78px' : '0 0 54px',
              padding: isActive ? '10px 6px' : '8px 4px',
              borderRadius: 14,
              border: isToday ? '2px solid var(--teal-500)' : '1px solid var(--border)',
              background: isActive ? 'var(--teal-600)' : isToday ? 'var(--teal-50)' : 'var(--surface)',
              cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              transition: 'flex 0.2s, background 0.15s',
            }}>
              <span style={{ fontSize: isActive ? 9.5 : 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: isActive ? 'rgba(255,255,255,0.8)' : isWk ? '#dc2626' : 'var(--text-4)' }}>{dayName(d)}</span>
              <span style={{ fontSize: isActive ? 22 : 17, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: isActive ? 'white' : 'var(--text-1)' }}>{d.getDate()}</span>
              {isActive ? (
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{list.length} events</span>
              ) : (
                <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 40 }}>
                  {HALLS.map(h => {
                    const booked = list.some(b => b.hall === h.id);
                    return <span key={h.id} style={{ width: booked ? 5 : 4, height: booked ? 5 : 4, borderRadius: '50%', background: booked ? h.color : 'var(--surface-3)', opacity: booked ? 1 : 0.5 }} />;
                  })}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Hall slot grid for active day */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 0' }}>
        {/* Hall rows */}
        {HALLS.map(hall => {
          const hallBooks = activeDayBookings.filter(b => b.hall === hall.id);
          return (
            <div key={hall.id} style={{ marginBottom: 10, background: 'var(--surface)', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)', borderLeft: `5px solid ${hall.color}` }}>
              {/* Hall header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderBottom: hallBooks.length > 0 ? '1px solid var(--border)' : 'none', background: `${hall.tint}60` }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>{hall.name}</p>
                  <p style={{ fontSize: 10.5, color: 'var(--text-4)', marginTop: 1, fontWeight: 500 }}>cap. {hall.capacity} · {hallBooks.length} booking{hallBooks.length !== 1 ? 's' : ''}</p>
                </div>
                {/* Slot availability mini-grid */}
                <div style={{ display: 'flex', gap: 3 }}>
                  {SLOTS.map(sl => {
                    const b = hallBooks.find(bk => bk.slot === sl.id);
                    const s = b ? statusOf(b.status) : null;
                    return (
                      <div key={sl.id} title={sl.label} style={{ width: 22, height: 22, borderRadius: 6, background: s ? s.bg : 'var(--surface-2)', border: `1px solid ${s ? s.accent + '80' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 7.5, fontWeight: 800, color: s ? s.text : 'var(--text-4)', textTransform: 'uppercase' }}>{sl.shortLabel.charAt(0)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Booking cards for this hall */}
              {hallBooks.length > 0 && (
                <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {hallBooks.map(b => {
                    const slot = slotById(b.slot);
                    const s = statusOf(b.status);
                    const isPencil = b.status === 'pencil';
                    return (
                      <div key={b.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                        borderRadius: 10, background: s.soft,
                        border: isPencil ? `1.5px dashed ${s.accent}` : `1px solid ${s.accent}50`,
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.function}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{slot.label} · {b.customer} · {b.guests} pax</p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <span style={{ fontSize: 9.5, fontWeight: 800, padding: '2px 7px', borderRadius: 9999, background: s.bg, color: s.text, display: 'block', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{s.label}</span>
                          <span style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 3, display: 'block', fontVariantNumeric: 'tabular-nums' }}>{formatINR(b.grand)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {hallBooks.length === 0 && (
                <div style={{ padding: '10px 12px', fontSize: 11, color: 'var(--text-4)', fontStyle: 'italic' }}>
                  All slots available — tap to book
                </div>
              )}
            </div>
          );
        })}
        <div style={{ height: 12 }} />
      </div>

      <MobileTabBar />
    </MobileShell>
  );
}

/* ══════════════════════════════════════════════════════════════ */
/* VARIANT B — MOBILE MONTH                                       */
/* Editorial month: hall-dot strip per day, big tap-to-expand     */
/* ══════════════════════════════════════════════════════════════ */
function VB_MobileMonth() {
  const [selectedDay, setSelectedDay] = useMVState(null);
  const year = 2026, month = 4;
  const days = buildMonthGrid(year, month);
  const weekdays = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  // Build per-day hall occupancy
  const dayData = {};
  days.forEach(d => {
    if (d.getMonth() !== month) return;
    const iso = isoDate(d);
    const list = bookingsForDate(iso);
    dayData[iso] = {
      count: list.length,
      halls: HALLS.map(h => ({ hall: h, slots: list.filter(b => b.hall === h.id) })),
    };
  });

  return (
    <MobileShell>
      <MobileNavHeader view="month" title="May 2026" subtitle="43 bookings · peak Sat 23" />

      {/* Hall legend */}
      <div style={{ display: 'flex', gap: 6, padding: '6px 12px 8px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', overflowX: 'auto', flexShrink: 0 }}>
        {HALLS.map(h => (
          <span key={h.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 9999, background: `${h.color}14`, border: `1px solid ${h.color}40`, fontSize: 10.5, fontWeight: 700, color: h.color, whiteSpace: 'nowrap' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: h.color }} />
            {h.name.replace(' Hall','').replace(' Banquet','').replace(' Room','').replace(' Garden','')}
          </span>
        ))}
      </div>

      {/* Weekday headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', background: 'var(--surface)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        {weekdays.map((w, i) => (
          <div key={i} style={{ padding: '5px 0', textAlign: 'center', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', color: (i === 0 || i === 6) ? '#dc2626' : 'var(--text-4)' }}>{w}</div>
        ))}
      </div>

      {/* Month grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gridAutoRows: selectedDay ? undefined : '1fr', flex: selectedDay ? '0 0 auto' : 1, background: 'var(--surface)', flexShrink: 0 }}>
        {days.map((d, i) => {
          const inMonth = d.getMonth() === month;
          const iso = isoDate(d);
          const isToday = iso === TODAY_ISO;
          const isSel = selectedDay === iso;
          const data = dayData[iso] || { count: 0, halls: [] };
          const isWk = d.getDay() === 0 || d.getDay() === 6;
          return (
            <div key={i} onClick={() => inMonth && setSelectedDay(isSel ? null : iso)}
              style={{
                borderRight: (i % 7) < 6 ? '1px solid var(--border)' : 'none',
                borderBottom: i < 35 ? '1px solid var(--border)' : 'none',
                padding: '5px 4px 6px',
                background: isSel ? 'var(--teal-50)' : isToday ? 'rgba(20,184,166,0.05)' : 'var(--surface)',
                opacity: inMonth ? 1 : 0.35,
                cursor: inMonth ? 'pointer' : 'default',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                minHeight: selectedDay ? 68 : 0,
                outline: isToday ? '2px solid var(--teal-500)' : isSel ? '2px solid var(--teal-300)' : 'none',
                outlineOffset: -2,
              }}>
              <span style={{
                fontSize: 13, fontWeight: 800, fontVariantNumeric: 'tabular-nums', lineHeight: 1,
                color: isToday ? 'white' : isWk ? '#dc2626' : 'var(--text-1)',
                background: isToday ? 'var(--teal-600)' : 'transparent',
                padding: isToday ? '2px 5px' : 0, borderRadius: isToday ? 8 : 0,
              }}>{d.getDate()}</span>
              {/* 4-dot hall strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 2, width: '100%' }}>
                {HALLS.map(h => {
                  const booked = data.halls.find(hd => hd.hall.id === h.id);
                  const count = booked ? booked.slots.length : 0;
                  return (
                    <div key={h.id} style={{ height: 4, borderRadius: 2, background: count > 0 ? h.color : 'var(--surface-2)', opacity: count > 0 ? 1 : 0.4 }} />
                  );
                })}
              </div>
              {/* Count badge */}
              {data.count > 0 && (
                <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-4)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{data.count}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected day detail panel — inline expand */}
      {selectedDay && (
        <div style={{ flex: 1, overflowY: 'auto', borderTop: '2px solid var(--teal-500)', background: 'var(--surface)' }}>
          {(() => {
            const d = getDate(selectedDay);
            const list = bookingsForDate(selectedDay);
            const grouped = SLOTS.map(sl => ({ slot: sl, list: list.filter(b => b.slot === sl.id) })).filter(g => g.list.length > 0);
            return (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px 8px', position: 'sticky', top: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', zIndex: 5 }}>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--teal-600)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{fullDayName(d)}</p>
                    <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.025em', lineHeight: 1.1, marginTop: 2 }}>{d.getDate()} {shortMonth(d)} · {list.length} events</p>
                  </div>
                  <button onClick={() => setSelectedDay(null)} style={{ width: 30, height: 30, borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                <div style={{ padding: '10px 12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {grouped.map(g => (
                    <div key={g.slot.id}>
                      <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{g.slot.label} · {g.slot.startLabel}–{g.slot.endLabel}</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {g.list.map(b => {
                          const hall = hallById(b.hall);
                          const s = statusOf(b.status);
                          return (
                            <div key={b.id} style={{ display: 'flex', gap: 8, padding: '9px 11px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', borderLeft: `5px solid ${hall.color}` }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.function}</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: hall.color }} />
                                  <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>{hall.name} · {b.type} · {b.guests} pax</span>
                                </div>
                              </div>
                              <span style={{ fontSize: 9.5, fontWeight: 800, padding: '2px 8px', borderRadius: 9999, background: s.bg, color: s.text, alignSelf: 'flex-start', textTransform: 'uppercase', letterSpacing: '0.03em', flexShrink: 0 }}>{s.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      )}

      <MobileTabBar />
    </MobileShell>
  );
}

Object.assign(window, { VA_MobileWeek, VA_MobileMonth, VB_MobileWeek, VB_MobileMonth });
