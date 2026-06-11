'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import QueryProvider from '@/components/QueryProvider';
import { shouldPrefetchDashboardRoute } from '@/lib/navigationPrefetch';
import { getStoredAuthToken, useAuthStore } from '@/store/authStore';
import BottomNav from '@/components/BottomNav';
import Avatar from '@/components/Avatar';
import CommandPalette from '@/components/CommandPalette';
import IdleTimeoutModal from '@/components/IdleTimeoutModal';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { useSSE } from '@/hooks/useSSE';
import SseStatusChip from '@/components/SseStatusChip';
import {
  getDefaultDashboardRoute,
  hasAccessForRequiredPermissions,
  isPathAllowedForUser,
  routeMatches,
} from '@/lib/routeAccess';
import {
  BarChart3,
  Building2,
  CalendarCheck,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  DollarSign,
  LayoutDashboard,
  LucideIcon,
  LogOut,
  Menu,
  Moon,
  PhoneCall,
  Search,
  Settings,
  Sun,
  Users,
  UtensilsCrossed,
  X,
  Activity,
} from 'lucide-react';

interface NavigationChild {
  name: string;
  href: string;
  permissions: string[];
}

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  permissions: string[];
  children?: NavigationChild[];
}

// PRIMARY operational nav — shown prominently
const primaryNavigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    permissions: ['view_dashboard'],
  },
  {
    name: 'Bookings',
    href: '/dashboard/bookings',
    icon: CalendarCheck,
    permissions: ['view_booking', 'manage_bookings'],
  },
  {
    name: 'Calendar',
    href: '/dashboard/calendar',
    icon: CalendarDays,
    permissions: ['view_calendar', 'view_booking', 'view_enquiry', 'manage_bookings', 'manage_enquiries'],
  },
  {
    name: 'Customers',
    href: '/dashboard/customers',
    icon: Users,
    permissions: ['view_customer', 'manage_customers'],
  },
  {
    name: 'Enquiries',
    href: '/dashboard/enquiries',
    icon: PhoneCall,
    permissions: ['view_enquiry', 'manage_enquiries'],
  },
  {
    name: 'Payments',
    href: '/dashboard/payments',
    icon: DollarSign,
    permissions: ['manage_payments'],
  },
];

// SECONDARY admin/config nav — de-emphasised below divider
const secondaryNavigation: NavigationItem[] = [
  {
    name: 'Venues',
    href: '/dashboard/halls',
    icon: Building2,
    permissions: ['view_hall', 'view_banquet', 'manage_halls'],
    children: [
      {
        name: 'Banquet',
        href: '/dashboard/halls?section=banquet',
        permissions: ['view_banquet', 'manage_halls'],
      },
      {
        name: 'Hall',
        href: '/dashboard/halls?section=hall',
        permissions: ['view_hall', 'manage_halls'],
      },
    ],
  },
  {
    name: 'Menu & Items',
    href: '/dashboard/menu',
    icon: UtensilsCrossed,
    permissions: ['view_item', 'view_itemtype', 'view_templatemenu', 'manage_menu'],
    children: [
      {
        name: 'Item Types',
        href: '/dashboard/menu?section=itemType',
        permissions: ['view_itemtype', 'manage_menu'],
      },
      {
        name: 'Items',
        href: '/dashboard/menu?section=item',
        permissions: ['view_item', 'manage_menu'],
      },
      {
        name: 'Template Menus',
        href: '/dashboard/menu?section=template',
        permissions: ['view_templatemenu', 'manage_menu'],
      },
      {
        name: 'Ingredients',
        href: '/dashboard/menu/ingredients',
        permissions: ['view_item', 'manage_menu'],
      },
      {
        name: 'Vendors',
        href: '/dashboard/menu/vendors',
        permissions: ['view_item', 'manage_menu'],
      },
    ],
  },
  {
    name: 'Reports',
    href: '/dashboard/reports',
    icon: BarChart3,
    permissions: ['view_reports'],
  },
  {
    name: 'Activity Logs',
    href: '/dashboard/logs',
    icon: Activity,
    permissions: ['view_audit_logs', 'manage_users'],
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    permissions: [
      'add_user',
      'view_user',
      'delete_user',
      'add_role',
      'view_role',
      'delete_role',
      'add_permission',
      'view_permission',
      'delete_permission',
      'assign_role',
      'manage_permission',
      'manage_roles',
      'manage_users',
    ],
    children: [
      {
        name: 'Users',
        href: '/dashboard/settings?section=users',
        permissions: ['view_user', 'add_user', 'delete_user', 'manage_users'],
      },
      {
        name: 'Roles',
        href: '/dashboard/settings?section=roles',
        permissions: [
          'view_role',
          'add_role',
          'edit_role',
          'delete_role',
          'manage_roles',
          'manage_permission',
        ],
      },
    ],
  },
];

// Combined for existing usages that expect a flat array
const navigation: NavigationItem[] = [...primaryNavigation, ...secondaryNavigation];

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  customers: 'Customers',
  enquiries: 'Enquiries',
  bookings: 'Bookings',
  calendar: 'Calendar',
  halls: 'Venues',
  menu: 'Menu & Items',
  ingredients: 'Ingredients',
  vendors: 'Vendors',
  payments: 'Payments',
  reports: 'Reports',
  logs: 'Activity Logs',
  settings: 'Settings',
  create: 'Create',
  edit: 'Edit',
};

function Breadcrumb({ pathname }: { pathname: string }) {
  const segments = pathname.split('/').filter(Boolean);

  return (
    <nav aria-label="breadcrumb" className="breadcrumb">
      <ol className="breadcrumb-list">
        {segments.map((seg, index) => {
          const isLast = index === segments.length - 1;
          return (
            <li
              key={`${seg}-${index}`}
              className="breadcrumb-item"
            >
              {index > 0 && (
                <ChevronRight
                  aria-hidden="true"
                  className="breadcrumb-chevron"
                />
              )}
              {isLast ? (
                <span className="breadcrumb-current">{ROUTE_LABELS[seg] ?? seg}</span>
              ) : (
                <span className="breadcrumb-seg">{ROUTE_LABELS[seg] ?? seg}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function SearchShortcut() {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const platform = (navigator as any).userAgentData?.platform || (navigator.platform ?? '');
    setIsMac(/mac/i.test(platform));
  }, []);

  return <span className="kbd">{isMac ? '⌘K' : 'Ctrl K'}</span>;
}

function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('theme');
    const osPref = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initial = stored === 'dark' || stored === 'light' ? stored : osPref;
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('theme', next);
    }
    document.documentElement.dataset.theme = next;
  };

  return (
    <button
      type="button"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggleTheme}
      className="sidebar-icon-btn inline-flex items-center justify-center cursor-pointer theme-toggle-btn"
    >
      {theme === 'dark' ? (
        <Sun width={16} height={16} aria-hidden="true" />
      ) : (
        <Moon width={16} height={16} aria-hidden="true" />
      )}
    </button>
  );
}

// ── Idle timeout config ───────────────────────────────────────────────────────
// Defined at module scope so they are stable references (no useCallback deps churn).
const IDLE_TIMEOUT_MS = 4 * 60 * 60 * 1000; // 4 hours total idle window
const IDLE_WARN_MS = 60 * 1000;         // show warning 60 s before logout
const IDLE_WARN_SECONDS = IDLE_WARN_MS / 1000; // countdown start value (60)
// ─────────────────────────────────────────────────────────────────────────────

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, logout, isAuthenticated, isAuthReady } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteBookings, setPaletteBookings] = useState<
    Array<{ id: string; name: string; subtitle?: string; href?: string }>
  >([]);
  const [paletteCustomers, setPaletteCustomers] = useState<
    Array<{ id: string; name: string; subtitle?: string; href?: string }>
  >([]);
  const [pendingEnquiries, setPendingEnquiries] = useState(0);
  const [outstandingPayments, setOutstandingPayments] = useState(0);

  const sectionParam = searchParams.get('section');

  // ── Idle timeout ────────────────────────────────────────────────────────────
  // 4-hour idle window (IDLE_TIMEOUT_MS). 60-second warning before auto-logout.
  // Staff share computers so we need to protect against walk-away sessions.
  const [idleWarningOpen, setIdleWarningOpen] = useState(false);
  const [idleCountdown, setIdleCountdown] = useState(IDLE_WARN_SECONDS);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearCountdownInterval = useCallback(() => {
    if (countdownIntervalRef.current !== null) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const handleIdleWarn = useCallback(() => {
    setIdleCountdown(IDLE_WARN_SECONDS);
    setIdleWarningOpen(true);
    clearCountdownInterval();
    countdownIntervalRef.current = setInterval(() => {
      setIdleCountdown((prev) => {
        if (prev <= 1) {
          clearCountdownInterval();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearCountdownInterval]);

  const handleIdleActivity = useCallback(() => {
    clearCountdownInterval();
    setIdleWarningOpen(false);
  }, [clearCountdownInterval]);

  const handleIdleTimeout = useCallback(async () => {
    clearCountdownInterval();
    setIdleWarningOpen(false);
    await logout();
    router.push('/login');
  }, [clearCountdownInterval, logout, router]);

  const handleStayLoggedIn = useCallback(() => {
    // Dismissing the modal counts as activity — the hook will reschedule timers
    // via the next real activity event. We also directly close the modal here.
    clearCountdownInterval();
    setIdleWarningOpen(false);
  }, [clearCountdownInterval]);

  useIdleTimeout({
    timeoutMs: IDLE_TIMEOUT_MS,
    warnBeforeMs: IDLE_WARN_MS,
    onWarn: handleIdleWarn,
    onTimeout: handleIdleTimeout,
    onActivity: handleIdleActivity,
    enabled: isAuthenticated,
  });

  // Clean up countdown interval on unmount
  useEffect(() => {
    return () => clearCountdownInterval();
  }, [clearCountdownInterval]);
  // ── End idle timeout ─────────────────────────────────────────────────────────

  const isHrefActive = (href: string) => {
    const [targetPath, queryString] = href.split('?');
    if (!routeMatches(pathname, targetPath)) {
      return false;
    }
    if (!queryString) {
      return true;
    }
    const expectedParams = new URLSearchParams(queryString);
    return Array.from(expectedParams.entries()).every(
      ([key, value]) => searchParams.get(key) === value
    );
  };

  const visiblePrimary = useMemo(() => {
    return primaryNavigation
      .filter((item) =>
        hasAccessForRequiredPermissions(user?.permissions, item.permissions)
      )
      .map((item) => ({
        ...item,
        children: (item.children || []).filter((child) =>
          hasAccessForRequiredPermissions(user?.permissions, child.permissions)
        ),
      }));
  }, [user?.permissions]);

  const visibleSecondary = useMemo(() => {
    return secondaryNavigation
      .filter((item) =>
        hasAccessForRequiredPermissions(user?.permissions, item.permissions)
      )
      .map((item) => ({
        ...item,
        children: (item.children || []).filter((child) =>
          hasAccessForRequiredPermissions(user?.permissions, child.permissions)
        ),
      }));
  }, [user?.permissions]);

  const visibleNavigation = useMemo(
    () => [...visiblePrimary, ...visibleSecondary],
    [visiblePrimary, visibleSecondary]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('sidebar-collapsed');
    setSidebarCollapsed(stored === 'true');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('sidebar-collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const cores = navigator.hardwareConcurrency ?? 4;
    const memory = (navigator as any).deviceMemory ?? 4;
    const conn = (navigator as any).connection;
    const slowNet = conn?.effectiveType === '2g' || conn?.effectiveType === 'slow-2g';
    let tier: 'low' | 'mid' | 'high' = 'high';
    if (cores <= 2 || memory <= 1 || slowNet) tier = 'low';
    else if (cores <= 4 || memory <= 2) tier = 'mid';
    document.documentElement.dataset.deviceTier = tier;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (!paletteOpen || typeof window === 'undefined') return;
    const readList = (key: string) => {
      try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };
    setPaletteBookings(readList('bika_palette_bookings'));
    setPaletteCustomers(readList('bika_palette_customers'));
  }, [paletteOpen]);

  // Task 6.3 — fetch pending counts for nav badges
  const refreshNavBadges = useCallback(() => {
    if (!isAuthenticated) return;
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';
    void Promise.all([
      fetch(`${apiBase}/api/enquiries/count?status=pending`, { credentials: 'include' })
        .then((r) => r.ok ? r.json() : { count: 0 })
        .then((d) => setPendingEnquiries(d?.data?.count ?? d?.count ?? 0))
        .catch(() => setPendingEnquiries(0)),
      fetch(`${apiBase}/api/bookings/count?status=outstanding`, { credentials: 'include' })
        .then((r) => r.ok ? r.json() : { count: 0 })
        .then((d) => setOutstandingPayments(d?.data?.count ?? d?.count ?? 0))
        .catch(() => setOutstandingPayments(0)),
    ]);
  }, [isAuthenticated]);

  useEffect(() => {
    refreshNavBadges();
  }, [refreshNavBadges]);

  // Keep badges live: refresh on enquiry/booking realtime events (debounced so
  // bulk updates trigger one refetch) with a slow interval fallback for
  // sessions where SSE is down.
  const badgeRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedRefreshNavBadges = useCallback(() => {
    if (badgeRefreshTimerRef.current) clearTimeout(badgeRefreshTimerRef.current);
    badgeRefreshTimerRef.current = setTimeout(() => {
      badgeRefreshTimerRef.current = null;
      refreshNavBadges();
    }, 2000);
  }, [refreshNavBadges]);

  useEffect(() => () => {
    if (badgeRefreshTimerRef.current) clearTimeout(badgeRefreshTimerRef.current);
  }, []);

  useSSE(['enquiry:', 'booking:'], debouncedRefreshNavBadges, isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(refreshNavBadges, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated, refreshNavBadges]);

  useEffect(() => {
    if (!isAuthReady || typeof window === 'undefined') return;
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isAuthReady, router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    const fallbackRoute = getDefaultDashboardRoute(user.permissions);
    if (!fallbackRoute) {
      void logout();
      router.replace('/login');
      return;
    }

    if (!isPathAllowedForUser(pathname, user.permissions)) {
      router.replace(fallbackRoute);
    }
  }, [isAuthenticated, user, pathname, router, logout]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const previousOverflow = document.body.style.overflow;
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen]);

  const activeNav = useMemo(
    () =>
      visibleNavigation.find(
        (item) => routeMatches(pathname, item.href)
      ),
    [visibleNavigation, pathname]
  );

  useEffect(() => {
    if (!activeNav?.children?.length) return;
    setOpenGroups((prev) => {
      if (prev[activeNav.name]) return prev;
      return { ...prev, [activeNav.name]: true };
    });
  }, [activeNav?.name, activeNav?.children?.length, sectionParam]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const navToggleButton = (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
          setSidebarCollapsed((prev) => !prev);
          return;
        }
        setSidebarOpen(true);
      }}
      aria-label={sidebarCollapsed ? 'Expand navigation' : 'Toggle navigation'}
      className="header-icon-btn header-icon-hover nav-toggle-btn"
    >
      <Menu className="icon-18" aria-hidden="true" />
    </button>
  );

  const renderNavItem = (item: NavigationItem, secondary: boolean, isCollapsed: boolean) => {
    const isActive = routeMatches(pathname, item.href);
    const hasChildren = Boolean(item.children && item.children.length > 0);
    const isOpen = hasChildren ? (openGroups[item.name] ?? isActive) : false;
    const badge =
      !secondary && item.name === 'Enquiries' && pendingEnquiries > 0
        ? { count: pendingEnquiries, toneClass: 'nav-badge-danger' }
        : !secondary && item.name === 'Payments' && outstandingPayments > 0
        ? { count: outstandingPayments, toneClass: 'nav-badge-warning' }
        : null;

    return (
      <div key={item.name} className="nav-item-wrapper">
        <div className={`nav-row${isActive ? ' active' : ''}`}>
          {isActive && <div className="nav-active-bar" />}
          <Link
            href={item.href}
            prefetch={shouldPrefetchDashboardRoute(item.href)}
            aria-current={isActive ? 'page' : undefined}
            title={isCollapsed ? item.name : undefined}
            className={`nav-link${secondary ? ' nav-link-secondary' : ''}${isActive ? ' active' : ''}`}
          >
            <item.icon className="nav-link-icon" aria-hidden="true" />
            <span className="sidebar-label sidebar-nav-label nav-link-text">{item.name}</span>
            {badge && !isCollapsed && (
              <span className={`nav-badge ${badge.toneClass}`}>
                {badge.count > 99 ? '99+' : badge.count}
              </span>
            )}
          </Link>
          {hasChildren && !isCollapsed && (
            <button
              type="button"
              aria-label={`Toggle ${item.name} submenu`}
              aria-expanded={isOpen}
              onClick={() =>
                setOpenGroups((prev) => ({
                  ...prev,
                  [item.name]: !isOpen,
                }))
              }
              className="nav-caret-btn"
            >
              <ChevronDown
                aria-hidden="true"
                className={`nav-caret-icon${isOpen ? ' open' : ''}`}
              />
            </button>
          )}
        </div>

        {hasChildren && isOpen && (
          <div className={`nav-children${secondary ? ' nav-children-secondary' : ''}`}>
            {item.children?.map((child) => {
              const childActive = isHrefActive(child.href);
              return (
                <Link
                  key={`${item.name}-${child.name}`}
                  href={child.href}
                  prefetch={shouldPrefetchDashboardRoute(child.href)}
                  className={`nav-child-link${childActive ? ' active' : ''}`}
                >
                  {child.name}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderSidebarContent = (isMobile: boolean, isCollapsed: boolean) => (
    <div
      className={isCollapsed ? 'sidebar-collapsed sidebar-inner' : 'sidebar-inner'}
    >
      <div className="sidebar-header">
        {isMobile && (
          <button
            type="button"
            className="lg:hidden sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X className="icon-16" aria-hidden="true" />
          </button>
        )}
      </div>

      <nav aria-label="Main navigation" className="sidebar-nav">
        {/* PRIMARY nav group */}
        {visiblePrimary.map((item) => renderNavItem(item, false, isCollapsed))}

        {/* Divider between primary and secondary nav */}
        {visibleSecondary.length > 0 && (
          <div className="nav-divider" />
        )}

        {/* SECONDARY nav group — de-emphasised admin/config items */}
        {visibleSecondary.map((item) => renderNavItem(item, true, isCollapsed))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user-row">
          <Avatar name={user?.name} size="sm" />
          <button
            type="button"
            onClick={() => router.push('/dashboard/profile')}
            className="sidebar-label sidebar-user-info text-left"
            title="My profile & password"
          >
            <p className="sidebar-user-name">{user?.name || 'User'}</p>
            <p className="sidebar-user-email">{user?.email}</p>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Log out"
            title={isCollapsed ? 'Log out' : undefined}
            className="header-icon-btn logout-btn-hover logout-btn"
          >
            <LogOut className="icon-15" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );

  if (!isAuthReady) {
    return (
      <div className="loading-screen">
        <div className="loading-stack">
          <div className="skeleton loading-avatar" />
          <p className="loading-text">Loading workspace…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="loading-screen">
        <div className="loading-stack">
          <div className="skeleton loading-avatar" />
          <p className="loading-text">Redirecting to sign in…</p>
        </div>
      </div>
    );
  }

  const currentSidebarWidth = sidebarCollapsed ? '72px' : 'var(--sidebar-w)';

  return (
    <div
      className={sidebarCollapsed ? 'sidebar-collapsed dashboard-root' : 'dashboard-root'}
      style={{ '--current-sidebar-w': currentSidebarWidth } as React.CSSProperties}
    >
      <a href="#main-content" className="skip-nav">Skip to main content</a>
      <div className="hidden lg:flex sidebar-toggle-container">
        {navToggleButton}
      </div>
      {sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation"
          className="sidebar-overlay"
        />
      )}

      <aside
        className="hidden lg:block desktop-sidebar"
        style={{ width: 'var(--current-sidebar-w)' }}
      >
        {renderSidebarContent(false, sidebarCollapsed)}
      </aside>

      <aside
        className="lg:hidden mobile-sidebar"
        aria-hidden={!sidebarOpen}
        style={{ transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)' }}
      >
        {renderSidebarContent(true, false)}
      </aside>

      <div className="ml-0 lg:ml-[var(--current-sidebar-w)] content-wrapper">
        <header className="dashboard-header">
          <div className="lg:hidden">{navToggleButton}</div>
          <div className="header-logo-group">
            <img
              src="https://assets.zyrosite.com/MBlLcEqY2yw3y2EF/1-2-removebg-scaled-e1752152009924-7iV2qZXAcVUCou9o.png"
              alt="Bika Banquet"
              className="header-logo-img"
            />
            <span aria-hidden="true" className="header-logo-divider">|</span>
          </div>

          <Breadcrumb pathname={pathname} />

          <div className="flex-spacer" />

          <button
            className="header-search hidden md:flex"
            aria-label="Quick search"
            type="button"
            onClick={() => setPaletteOpen(true)}
          >
            <Search className="icon-13" aria-hidden="true" />
            <span>Quick search…</span>
            <SearchShortcut />
          </button>

          <button
            type="button"
            aria-label="Quick search"
            className="md:hidden mobile-search-btn"
            onClick={() => setPaletteOpen(true)}
          >
            <Search className="icon-16" aria-hidden="true" />
          </button>

          <SseStatusChip />
          <ThemeToggle />

          <div className="hidden md:flex">
            <Avatar name={user?.name} size="md" />
          </div>
        </header>

        <main
          id="main-content"
          className="has-bottom-nav lg:!pb-0 dashboard-main"
          style={{
            maxWidth: pathname.startsWith('/dashboard/calendar') ? '100%' : 1400,
            paddingLeft: pathname.startsWith('/dashboard/calendar') ? '0' : 'clamp(16px, 2.5vw, 28px)',
            paddingRight: pathname.startsWith('/dashboard/calendar') ? '0' : 'clamp(16px, 2.5vw, 28px)',
            /* paddingBottom is intentionally omitted here so the
               .has-bottom-nav class can apply the correct bottom
               clearance (nav height + safe-area + extra breathing room).
               On desktop, lg:!pb-0 resets it back to zero. */
          }}
          data-active-nav={activeNav?.name || ''}
        >
          <div className="page-content">
            {children}
          </div>
        </main>
      </div>

      <BottomNav
        permissions={user?.permissions || []}
        onMoreClick={() => setSidebarOpen(true)}
      />

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
      />

      <IdleTimeoutModal
        open={idleWarningOpen}
        secondsRemaining={idleCountdown}
        onStayLoggedIn={handleStayLoggedIn}
        onLogoutNow={handleIdleTimeout}
      />
    </div>
  );
}

function DashboardLayoutFallback() {
  return (
    <div
      className="loading-screen"
    >
      <div className="loading-stack">
        <div className="skeleton loading-avatar" />
        <p className="loading-text">Loading workspace…</p>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <Suspense fallback={<DashboardLayoutFallback />}>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </Suspense>
    </QueryProvider>
  );
}
