// Sidebar.jsx — Bika Banquet UI Kit
// Exports: Sidebar to window

const { useState } = React;

const NAV_PRIMARY = [
  { name: 'Dashboard', icon: 'layout-dashboard', href: 'dashboard' },
  { name: 'Bookings',  icon: 'calendar-check',   href: 'bookings' },
  { name: 'Calendar',  icon: 'calendar-days',     href: 'calendar' },
  { name: 'Customers', icon: 'users',             href: 'customers' },
  { name: 'Enquiries', icon: 'phone-call',        href: 'enquiries', badge: 3 },
  { name: 'Payments',  icon: 'indian-rupee',      href: 'payments' },
];

const NAV_SECONDARY = [
  { name: 'Venues',        icon: 'building-2',       href: 'venues' },
  { name: 'Menu & Items',  icon: 'utensils-crossed', href: 'menu' },
  { name: 'Reports',       icon: 'bar-chart-3',      href: 'reports' },
  { name: 'Activity Logs', icon: 'activity',         href: 'logs' },
  { name: 'Settings',      icon: 'settings',         href: 'settings' },
];

const sidebarStyles = {
  sidebar: {
    width: '208px',
    background: 'var(--surface)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    flexShrink: 0,
    position: 'relative',
    zIndex: 20,
    transition: 'width 0.2s ease',
  },
  sidebarCollapsed: { width: '64px' },
  logo: {
    padding: '16px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minHeight: '52px',
  },
  nav: { flex: 1, padding: '10px 8px', overflowY: 'auto' },
  item: {
    display: 'flex', alignItems: 'center', gap: '9px',
    padding: '7px 10px', borderRadius: '10px',
    fontSize: '13.5px', fontWeight: 450,
    color: 'var(--text-3)', cursor: 'pointer',
    textDecoration: 'none', marginBottom: '2px',
    position: 'relative', transition: 'color 0.15s, background 0.15s',
    background: 'transparent', border: 'none', fontFamily: 'inherit',
    width: '100%', textAlign: 'left',
  },
  itemActive: {
    background: 'var(--teal-50)', color: 'var(--teal-700)', fontWeight: 600,
  },
  activeBar: {
    position: 'absolute', left: 0, top: '22%', bottom: '22%',
    width: '3px', background: 'var(--teal-500)', borderRadius: '0 3px 3px 0',
  },
  itemSecondary: { fontSize: '12.5px', fontWeight: 450 },
  divider: { height: '1px', background: 'var(--border)', margin: '8px 4px' },
  badge: {
    marginLeft: 'auto', fontSize: '10px', fontWeight: 700,
    background: '#ef4444', color: 'white', borderRadius: '100px',
    padding: '1px 5px', minWidth: '16px', textAlign: 'center', lineHeight: '14px',
  },
  userRow: {
    padding: '10px 10px', borderTop: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', gap: '8px',
  },
  avatar: {
    width: '28px', height: '28px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
    color: 'white', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0,
  },
  label: { overflow: 'hidden', transition: 'opacity 0.2s, width 0.2s' },
  labelCollapsed: { opacity: 0, width: 0, pointerEvents: 'none', display: 'none' },
};

function NavIcon({ name, size = 15 }) {
  const icons = {
    'layout-dashboard': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    'calendar-check': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="9 16 11 18 15 14"/></svg>,
    'calendar-days': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    'users': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    'phone-call': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94m-1 7.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.12 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l1.65-1.65a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
    'indian-rupee': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12M6 8h12M6 13l8.5 8L18 13"/><path d="M6 13c0-2.21 1.79-5 6-5"/></svg>,
    'building-2': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>,
    'utensils-crossed': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8"/><path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7"/><path d="m2.1 21.8 6.4-6.3"/><path d="m19 5-7 7"/></svg>,
    'bar-chart-3': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    'activity': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    'settings': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>,
    'log-out': <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  };
  return icons[name] || <svg width={size} height={size} viewBox="0 0 24 24"/>;
}

function Sidebar({ active, onNavigate, collapsed, onLogout }) {
  return (
    <aside style={{ ...sidebarStyles.sidebar, ...(collapsed ? sidebarStyles.sidebarCollapsed : {}) }}>
      <div style={sidebarStyles.logo}>
        <img src="https://assets.zyrosite.com/MBlLcEqY2yw3y2EF/1-2-removebg-scaled-e1752152009924-7iV2qZXAcVUCou9o.png"
          alt="Bika Banquet" style={{ width: 28, height: 28, objectFit: 'contain', flexShrink: 0 }} />
        {!collapsed && <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', whiteSpace: 'nowrap' }}>Bika Banquet</span>}
      </div>

      <nav style={sidebarStyles.nav}>
        {NAV_PRIMARY.map(item => {
          const isActive = active === item.href;
          return (
            <button key={item.href} onClick={() => onNavigate(item.href)}
              style={{ ...sidebarStyles.item, ...(isActive ? sidebarStyles.itemActive : {}), flexDirection: collapsed ? 'column' : 'row', justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '8px 4px' : '7px 10px' }}>
              {isActive && <div style={sidebarStyles.activeBar} />}
              <span style={{ color: isActive ? 'var(--teal-600)' : 'currentColor', flexShrink: 0 }}><NavIcon name={item.icon} /></span>
              {!collapsed && <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>}
              {!collapsed && item.badge && <span style={sidebarStyles.badge}>{item.badge}</span>}
              {collapsed && <span style={{ fontSize: 9, lineHeight: 1.1, marginTop: 2, color: isActive ? 'var(--teal-700)' : 'var(--text-4)', textAlign: 'center' }}>{item.name}</span>}
            </button>
          );
        })}

        <div style={sidebarStyles.divider} />

        {NAV_SECONDARY.map(item => {
          const isActive = active === item.href;
          return (
            <button key={item.href} onClick={() => onNavigate(item.href)}
              style={{ ...sidebarStyles.item, ...sidebarStyles.itemSecondary, ...(isActive ? sidebarStyles.itemActive : {}), flexDirection: collapsed ? 'column' : 'row', justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '8px 4px' : '6px 10px' }}>
              {isActive && <div style={sidebarStyles.activeBar} />}
              <span style={{ color: isActive ? 'var(--teal-600)' : 'currentColor', flexShrink: 0 }}><NavIcon name={item.icon} size={14} /></span>
              {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>}
              {collapsed && <span style={{ fontSize: 9, lineHeight: 1.1, marginTop: 2, color: isActive ? 'var(--teal-700)' : 'var(--text-4)', textAlign: 'center' }}>{item.name}</span>}
            </button>
          );
        })}
      </nav>

      <div style={sidebarStyles.userRow}>
        <div style={sidebarStyles.avatar}>A</div>
        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Admin User</p>
            <p style={{ fontSize: 10, color: 'var(--text-4)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>admin@bikabanquet.com</p>
          </div>
        )}
        {!collapsed && (
          <button onClick={onLogout} title="Log out" style={{ border: 'none', background: 'none', color: 'var(--text-4)', cursor: 'pointer', padding: '4px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <NavIcon name="log-out" />
          </button>
        )}
      </div>
    </aside>
  );
}

Object.assign(window, { Sidebar, NavIcon });
