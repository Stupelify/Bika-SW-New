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
  DollarSign,
  LayoutDashboard,
  LucideIcon,
  LogOut,
  Menu,
  PhoneCall,
  Settings,
  UserCircle2,
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="card py-10 px-12 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/45 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[84vw] max-w-[19rem] sm:w-72 border-r border-gray-200 bg-white shadow-lg transform transition-transform duration-200 ease-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-5 border-b border-gray-200">
            <div className="rounded-2xl bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 p-4 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display text-lg tracking-tight">Bika Banquet</p>
                  <p className="text-xs text-primary-100 mt-1">Operations Console</p>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden text-white/90 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
            {visibleNavigation.map((item) => {
              const isActive = routeMatches(pathname, item.href);
              const hasChildren = Boolean(item.children && item.children.length > 0);
              const isOpen = hasChildren ? (openGroups[item.name] ?? isActive) : false;

              return (
                <div key={item.name} className="space-y-1">
                  <div
                    className={`group flex items-center gap-2 rounded-xl px-3 py-2 transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-800 shadow-sm border border-primary-100'
                        : 'text-gray-700 hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    <Link href={item.href} className="flex items-center gap-3 flex-1 min-w-0">
                      <span
                        className={`w-8 h-8 rounded-lg grid place-items-center ${
                          isActive
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-500 group-hover:bg-primary-100 group-hover:text-primary-700'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                      </span>
                      <span className="text-sm font-medium truncate">{item.name}</span>
                    </Link>
                    {hasChildren && (
                      <button
                        type="button"
                        aria-label={`Toggle ${item.name} submenu`}
                        className="p-1.5 rounded-md text-gray-500 hover:text-primary-700 hover:bg-primary-100"
                        onClick={() =>
                          setOpenGroups((prev) => ({
                            ...prev,
                            [item.name]: !isOpen,
                          }))
                        }
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    )}
                  </div>

                  {hasChildren && isOpen && (
                    <div className="ml-11 space-y-1">
                      {item.children?.map((child) => {
                        const childActive = isHrefActive(child.href);
                        return (
                          <Link
                            key={`${item.name}-${child.name}`}
                            href={child.href}
                            className={`block rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                              childActive
                                ? 'bg-primary-100 text-primary-800'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                            }`}
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

          <div className="p-4 border-t border-gray-200">
            <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 grid place-items-center">
                  <UserCircle2 className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-secondary w-full justify-center text-red-600 border-red-200 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
          <div className="max-w-[1500px] mx-auto h-16 px-3 sm:px-6 flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-lg font-display font-semibold text-gray-900 truncate">
                {activeNav?.name || 'Workspace'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                Manage banquet operations with faster workflows.
              </p>
            </div>
          </div>
        </header>

        <main className="max-w-[1500px] mx-auto px-3 sm:px-6 py-5 sm:py-6 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function DashboardLayoutFallback() {
  return (
    <div className="min-h-screen grid place-items-center">
      <div className="card py-10 px-12 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-sm text-gray-600">Loading workspace...</p>
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
