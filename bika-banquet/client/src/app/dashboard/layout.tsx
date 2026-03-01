'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
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
  HelpCircle,
  LayoutDashboard,
  LucideIcon,
  LogOut,
  Menu,
  PhoneCall,
  Search,
  Settings,
  Users,
  UtensilsCrossed,
  X,
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

const navigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    permissions: ['view_dashboard'],
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
    ],
  },
  {
    name: 'Payments',
    href: '/dashboard/payments',
    icon: DollarSign,
    permissions: ['manage_payments'],
  },
  {
    name: 'Reports',
    href: '/dashboard/reports',
    icon: BarChart3,
    permissions: ['view_reports'],
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
        name: 'Access Mapping',
        href: '/dashboard/settings?section=access',
        permissions: ['assign_role', 'manage_permission', 'manage_roles'],
      },
      {
        name: 'Users',
        href: '/dashboard/settings?section=users',
        permissions: ['view_user', 'add_user', 'delete_user', 'manage_users'],
      },
      {
        name: 'Roles',
        href: '/dashboard/settings?section=roles',
        permissions: ['view_role', 'add_role', 'delete_role', 'manage_roles'],
      },
      {
        name: 'Permissions',
        href: '/dashboard/settings?section=permissions',
        permissions: [
          'view_permission',
          'add_permission',
          'delete_permission',
          'manage_permission',
          'manage_roles',
        ],
      },
    ],
  },
];

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  customers: 'Customers',
  enquiries: 'Enquiries',
  bookings: 'Bookings',
  calendar: 'Calendar',
  halls: 'Venues',
  menu: 'Menu & Items',
  payments: 'Payments',
  reports: 'Reports',
  settings: 'Settings',
  create: 'Create',
  edit: 'Edit',
};

function Breadcrumb({ pathname }: { pathname: string }) {
  const segments = pathname.split('/').filter(Boolean);

  return (
    <nav aria-label="breadcrumb" className="breadcrumb">
      <ol
        style={{
          listStyle: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          margin: 0,
          padding: 0,
        }}
      >
        {segments.map((seg, index) => {
          const isLast = index === segments.length - 1;
          return (
            <li
              key={`${seg}-${index}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {index > 0 && (
                <ChevronRight
                  aria-hidden="true"
                  style={{ width: 12, height: 12, color: 'var(--text-4)' }}
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

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loadUser, logout, isAuthenticated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const sectionParam = searchParams.get('section');

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

  const visibleNavigation = useMemo(() => {
    return navigation
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

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!isAuthenticated && typeof window !== 'undefined') {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

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

  const renderSidebarContent = (isMobile: boolean) => (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div
        style={{
          padding: '18px 16px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            background: 'linear-gradient(135deg, var(--teal-600), var(--teal-500))',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 15,
            fontWeight: 700,
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(13,148,136,0.28)',
          }}
        >
          B
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              fontSize: 14,
              fontWeight: 650,
              color: 'var(--text-1)',
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
            }}
          >
            Bika Banquet
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 1 }}>Operations Suite</p>
        </div>
        {isMobile && (
          <button
            type="button"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
            style={{
              border: 'none',
              background: 'none',
              color: 'var(--text-4)',
              cursor: 'pointer',
              padding: 6,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
            }}
          >
            <X style={{ width: 16, height: 16 }} aria-hidden="true" />
          </button>
        )}
      </div>

      <nav aria-label="Main navigation" style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        {visibleNavigation.map((item) => {
          const isActive = routeMatches(pathname, item.href);
          const hasChildren = Boolean(item.children && item.children.length > 0);
          const isOpen = hasChildren ? (openGroups[item.name] ?? isActive) : false;

          return (
            <div key={item.name} style={{ marginBottom: 2 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0,
                  borderRadius: 10,
                  marginBottom: 1,
                  background: isActive ? 'var(--teal-50)' : 'transparent',
                  position: 'relative',
                }}
              >
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '22%',
                      bottom: '22%',
                      width: 3,
                      background: 'var(--teal-500)',
                      borderRadius: '0 3px 3px 0',
                    }}
                  />
                )}
                <Link
                  href={item.href}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    padding: '7px 10px',
                    fontSize: 13.5,
                    fontWeight: isActive ? 600 : 450,
                    color: isActive ? 'var(--teal-700)' : 'var(--text-3)',
                    textDecoration: 'none',
                    borderRadius: 10,
                    minWidth: 0,
                    transition: 'color 0.15s',
                  }}
                >
                  <item.icon
                    style={{
                      width: 16,
                      height: 16,
                      opacity: isActive ? 1 : 0.65,
                      flexShrink: 0,
                      color: isActive ? 'var(--teal-600)' : 'currentColor',
                    }}
                    aria-hidden="true"
                  />
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.name}
                  </span>
                </Link>
                {hasChildren && (
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
                    style={{
                      padding: '7px 8px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: isActive ? 'var(--teal-600)' : 'var(--text-4)',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'color 0.15s',
                    }}
                  >
                    <ChevronDown
                      aria-hidden="true"
                      style={{
                        width: 14,
                        height: 14,
                        transition: 'transform 0.2s',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    />
                  </button>
                )}
              </div>

              {hasChildren && isOpen && (
                <div style={{ marginLeft: 35, marginBottom: 4 }}>
                  {item.children?.map((child) => {
                    const childActive = isHrefActive(child.href);
                    return (
                      <Link
                        key={`${item.name}-${child.name}`}
                        href={child.href}
                        style={{
                          display: 'block',
                          padding: '6px 10px',
                          borderRadius: 8,
                          fontSize: 12.5,
                          fontWeight: childActive ? 600 : 450,
                          color: childActive ? 'var(--teal-700)' : 'var(--text-3)',
                          background: childActive ? 'var(--teal-100)' : 'transparent',
                          textDecoration: 'none',
                          marginBottom: 1,
                          transition: 'background 0.15s, color 0.15s',
                        }}
                      >
                        {child.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div style={{ padding: '10px 8px', borderTop: '1px solid var(--border)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            padding: '8px 10px',
            borderRadius: 10,
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--teal-600), var(--teal-400))',
              color: 'white',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: 'var(--text-1)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.name || 'User'}
            </p>
            <p
              style={{
                fontSize: 11,
                color: 'var(--text-4)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.email}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Log out"
            style={{
              border: 'none',
              background: 'none',
              color: 'var(--text-4)',
              cursor: 'pointer',
              borderRadius: 8,
              width: 28,
              height: 28,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseOver={(event) => {
              event.currentTarget.style.color = '#ef4444';
              event.currentTarget.style.background = '#fef2f2';
            }}
            onMouseOut={(event) => {
              event.currentTarget.style.color = 'var(--text-4)';
              event.currentTarget.style.background = 'none';
            }}
          >
            <LogOut style={{ width: 15, height: 15 }} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg)',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
          <p style={{ fontSize: 13, color: 'var(--text-4)' }}>Loading workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 40,
            background: 'rgba(15,23,42,0.4)',
            border: 'none',
            cursor: 'pointer',
          }}
        />
      )}

      <aside
        className="hidden lg:block"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: 'var(--sidebar-w)',
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          zIndex: 50,
          overflowY: 'auto',
        }}
      >
        {renderSidebarContent(false)}
      </aside>

      <aside
        className="lg:hidden"
        aria-hidden={!sidebarOpen}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: 'min(84vw, 232px)',
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          zIndex: 50,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.2s ease-out',
          overflowY: 'auto',
        }}
      >
        {renderSidebarContent(true)}
      </aside>

      <div className="ml-0 lg:ml-[var(--sidebar-w)]">
        <header
          style={{
            height: 52,
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 20px',
            gap: 12,
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}
        >
          <button
            type="button"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--text-3)',
              borderRadius: 8,
              width: 30,
              height: 30,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            onMouseOver={(event) => {
              event.currentTarget.style.background = 'var(--surface-2)';
              event.currentTarget.style.color = 'var(--text-1)';
            }}
            onMouseOut={(event) => {
              event.currentTarget.style.background = 'transparent';
              event.currentTarget.style.color = 'var(--text-3)';
            }}
          >
            <Menu style={{ width: 18, height: 18 }} aria-hidden="true" />
          </button>

          <Breadcrumb pathname={pathname} />

          <div style={{ flex: 1 }} />

          <button className="header-search hidden md:flex" aria-label="Quick search" type="button">
            <Search style={{ width: 13, height: 13 }} aria-hidden="true" />
            <span>Quick search…</span>
            <SearchShortcut />
          </button>

          <button
            type="button"
            aria-label="Help"
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--text-3)',
              borderRadius: 8,
              width: 30,
              height: 30,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            onMouseOver={(event) => {
              event.currentTarget.style.background = 'var(--surface-2)';
              event.currentTarget.style.color = 'var(--text-1)';
            }}
            onMouseOut={(event) => {
              event.currentTarget.style.background = 'transparent';
              event.currentTarget.style.color = 'var(--text-3)';
            }}
          >
            <HelpCircle style={{ width: 16, height: 16 }} aria-hidden="true" />
          </button>

          <div
            className="hidden md:flex"
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--teal-600), var(--teal-400))',
              color: 'white',
              fontSize: 11,
              fontWeight: 600,
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              cursor: 'default',
            }}
            title={user?.name ?? 'User'}
            aria-label={user?.name ?? 'User'}
          >
            {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>
        </header>

        <main
          style={{
            maxWidth: 1400,
            margin: '0 auto',
            padding: 'clamp(16px, 2.5vw, 28px)',
          }}
          data-active-nav={activeNav?.name || ''}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

function DashboardLayoutFallback() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
        <p style={{ fontSize: 13, color: 'var(--text-4)' }}>Loading workspace…</p>
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
    <Suspense fallback={<DashboardLayoutFallback />}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}
