'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { shouldPrefetchDashboardRoute } from '@/lib/navigationPrefetch';
import {
    CalendarDays,
    CalendarCheck,
    LayoutDashboard,
    Menu,
    ClipboardList,
} from 'lucide-react';
import { useMemo } from 'react';

interface BottomNavProps {
    permissions: string[];
    onMoreClick: () => void;
    bookingsCount?: number;
    enquiriesCount?: number;
}

const navItems = [
    {
        name: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        permissions: ['view_dashboard'],
        exact: true,
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
        name: 'Enquiries',
        href: '/dashboard/enquiries',
        icon: ClipboardList,
        permissions: ['view_enquiry', 'add_enquiry', 'edit_enquiry', 'manage_enquiries'],
    },
];

function hasAccess(userPerms: string[], requiredPerms: string[]): boolean {
    if (!requiredPerms.length) return true;
    return requiredPerms.some((p) => userPerms.includes(p));
}

export default function BottomNav({
    permissions,
    onMoreClick,
    bookingsCount = 0,
    enquiriesCount = 0,
}: BottomNavProps) {
    const pathname = usePathname();

    const visibleItems = useMemo(
        () => navItems.filter((item) => hasAccess(permissions, item.permissions)),
        [permissions]
    );

    return (
        <nav className="bottom-nav lg:hidden" aria-label="Quick navigation">
            {visibleItems.map((item) => {
                const isActive = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                const badge =
                    item.name === 'Bookings'
                        ? bookingsCount
                        : item.name === 'Enquiries'
                        ? enquiriesCount
                        : 0;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        prefetch={shouldPrefetchDashboardRoute(item.href)}
                        className={`bottom-nav-item${isActive ? ' active' : ''}`}
                        aria-current={isActive ? 'page' : undefined}
                    >
                        <item.icon className="bottom-nav-icon" aria-hidden="true" />
                        <span>{item.name}</span>
                        {badge > 0 && (
                            <span className="bottom-nav-badge" aria-label={`${badge} ${item.name.toLowerCase()}`}>
                                {badge > 99 ? '99+' : badge}
                            </span>
                        )}
                    </Link>
                );
            })}
            <button
                type="button"
                className="bottom-nav-item"
                onClick={onMoreClick}
                aria-label="More navigation options"
            >
                <Menu className="bottom-nav-icon" aria-hidden="true" />
                <span>More</span>
            </button>
        </nav>
    );
}
