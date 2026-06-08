// Sidebar nav
function Sidebar({ route, setRoute, collapsed, counts }) {
  const main = [
    { id:'dashboard', label:'Dashboard',  icon:'layout-dashboard' },
    { id:'bookings',  label:'Bookings',   icon:'calendar-check',  count: counts.bookings },
    { id:'calendar',  label:'Calendar',   icon:'calendar-days' },
    { id:'enquiries', label:'Enquiries',  icon:'phone-call',      count: counts.enquiries },
    { id:'customers', label:'Customers',  icon:'users' },
    { id:'payments',  label:'Payments',   icon:'indian-rupee',    count: counts.duePayments },
  ];
  const ops = [
    { id:'venues',   label:'Venues',      icon:'building-2' },
    { id:'menu',     label:'Menu & Items',icon:'utensils-crossed' },
    { id:'reports',  label:'Reports',     icon:'bar-chart-3' },
    { id:'logs',     label:'Activity',    icon:'activity' },
    { id:'settings', label:'Settings',    icon:'settings' },
  ];

  const Item = ({ it }) => (
    <div className={"side-item " + (route === it.id ? 'active' : '')}
         onClick={() => setRoute(it.id)} title={it.label}>
      <Icon name={it.icon} size={16}/>
      <span>{it.label}</span>
      {it.count != null && <span className="count">{it.count}</span>}
    </div>
  );

  return (
    <aside className="side">
      <div className="side-brand">
        <div className="brand-mark">B</div>
        {!collapsed && <span>Bika Banquet</span>}
      </div>
      {!collapsed && <div className="side-section">Operate</div>}
      <div className="side-nav">{main.map(it => <Item key={it.id} it={it}/>)}</div>
      {!collapsed && <div className="side-section">Catalog</div>}
      <div className="side-nav">{ops.map(it => <Item key={it.id} it={it}/>)}</div>

      <div className="side-footer">
        <div className="avatar">PN</div>
        {!collapsed && (
          <>
            <div className="who">
              <div className="name">Priya Nambiar</div>
              <div className="role">Operations Lead · Andheri</div>
            </div>
            <Icon name="chevrons-up-down" size={14}/>
          </>
        )}
      </div>
    </aside>
  );
}

function TopBar({ crumbs, onOpenCmd, live, toggleLive, theme, toggleTheme, toggleSide }) {
  return (
    <header className="top">
      <button className="icon-btn" onClick={toggleSide} title="Toggle sidebar">
        <Icon name="panel-left" size={16}/>
      </button>
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="sep">/</span>}
            <span className={i === crumbs.length - 1 ? 'leaf' : ''}>{c}</span>
          </React.Fragment>
        ))}
      </div>

      <button className="search-trigger" onClick={onOpenCmd}>
        <Icon name="search" size={13}/>
        <span>Search bookings, customers, halls…</span>
        <span className="kbd">⌘ K</span>
      </button>

      <div className={"live-dot " + (live ? '' : 'off')} onClick={toggleLive} style={{ cursor: 'pointer' }} title="Toggle live feed">
        <span className="dot"></span>
        {live ? 'Live' : 'Paused'}
      </div>

      <button className="icon-btn" onClick={toggleTheme} title="Toggle theme">
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16}/>
      </button>
      <button className="icon-btn" title="Notifications">
        <Icon name="bell" size={16}/>
      </button>
    </header>
  );
}

function CommandPalette({ onClose, setRoute, openBookingById }) {
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const groups = useMemo(() => {
    const navItems = [
      { kind:'nav', label:'Go to Dashboard',  hint:'G then D', icon:'layout-dashboard', action: () => setRoute('dashboard') },
      { kind:'nav', label:'Go to Bookings',   hint:'G then B', icon:'calendar-check',   action: () => setRoute('bookings')  },
      { kind:'nav', label:'Go to Calendar',   hint:'G then C', icon:'calendar-days',    action: () => setRoute('calendar')  },
      { kind:'nav', label:'Go to Customers',  hint:'G then U', icon:'users',            action: () => setRoute('customers') },
      { kind:'nav', label:'Go to Payments',   hint:'G then P', icon:'indian-rupee',     action: () => setRoute('payments')  },
    ];
    const acts = [
      { kind:'action', label:'New booking',     hint:'N',  icon:'plus',          action: () => { setRoute('bookings'); setTimeout(() => window.dispatchEvent(new CustomEvent('bika:new-booking')), 50); } },
      { kind:'action', label:'New enquiry',     hint:'E',  icon:'phone-call',    action: () => setRoute('enquiries') },
      { kind:'action', label:'Record payment',  hint:'⇧P', icon:'indian-rupee',  action: () => setRoute('payments')  },
      { kind:'action', label:'Toggle theme',    hint:'⇧T', icon:'sun-moon',      action: () => window.dispatchEvent(new CustomEvent('bika:toggle-theme')) },
    ];
    const bks = BIKA.bookings.slice(0, 8).map(b => ({
      kind:'booking', label: `${b.ref} · ${b.customer}`, hint: fmtDate(b.date), icon:'calendar-check',
      action: () => openBookingById(b.id)
    }));
    const filter = (xs) => q ? xs.filter(x => x.label.toLowerCase().includes(q.toLowerCase())) : xs;
    return [
      { lbl:'Navigate', items: filter(navItems) },
      { lbl:'Actions',  items: filter(acts) },
      { lbl:'Recent bookings', items: filter(bks) },
    ];
  }, [q]);

  const flat = groups.flatMap(g => g.items);
  useEffect(() => { if (idx >= flat.length) setIdx(0); }, [q]);

  function onKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(i+1, flat.length-1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(i => Math.max(i-1, 0)); }
    else if (e.key === 'Enter') { flat[idx]?.action?.(); onClose(); }
    else if (e.key === 'Escape') { onClose(); }
  }

  let global = -1;
  return (
    <div className="cmd-scrim" onClick={onClose}>
      <div className="cmd" onClick={e => e.stopPropagation()}>
        <input ref={inputRef} className="cmd-input" placeholder="Search or run a command…"
               value={q} onChange={e => setQ(e.target.value)} onKeyDown={onKey}/>
        <div className="cmd-list">
          {groups.map((g, gi) => g.items.length > 0 && (
            <div key={gi}>
              <div className="cmd-group-lbl">{g.lbl}</div>
              {g.items.map(it => {
                global += 1;
                const i = global;
                return (
                  <div key={i} className={"cmd-item " + (i === idx ? 'active' : '')}
                       onMouseEnter={() => setIdx(i)}
                       onClick={() => { it.action(); onClose(); }}>
                    <Icon name={it.icon} size={15}/>
                    <span>{it.label}</span>
                    <span className="where">{it.hint}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.Sidebar = Sidebar;
window.TopBar = TopBar;
window.CommandPalette = CommandPalette;
