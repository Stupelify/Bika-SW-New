'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import {
  BarChart3,
  Building2,
  CalendarCheck,
  CalendarDays,
  DollarSign,
  LayoutDashboard,
  LogOut,
  Menu,
  PhoneCall,
  Settings,
  UserCircle2,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react';

const navigation = [
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
  },
  {
    name: 'Menu & Items',
    href: '/dashboard/menu',
    icon: UtensilsCrossed,
    permissions: ['view_item', 'view_itemtype', 'view_templatemenu', 'manage_menu'],
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
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loadUser, logout, isAuthenticated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      navigation.find(
        (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
      ),
    [pathname]
  );

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
          className="fixed inset-0 z-40 bg-slate-900/45 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[84vw] max-w-[19rem] sm:w-72 border-r border-gray-200 bg-white/90 backdrop-blur-xl shadow-xl transform transition-transform duration-300 ease-out lg:translate-x-0 ${
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
            {navigation
              .filter((item) => {
                if (!item.permissions || item.permissions.length === 0) return true;
                const userPermissions = user?.permissions || [];
                return item.permissions.some((permission) =>
                  userPermissions.includes(permission)
                );
              })
              .map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
                    isActive
                      ? 'bg-primary-50 text-primary-800 shadow-sm border border-primary-100'
                      : 'text-gray-700 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <span
                    className={`w-8 h-8 rounded-lg grid place-items-center ${
                      isActive
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-500 group-hover:bg-primary-100 group-hover:text-primary-700'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                  </span>
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
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
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/75 backdrop-blur-xl">
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
                {activeNav?.name || 'Dashboard'}
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
