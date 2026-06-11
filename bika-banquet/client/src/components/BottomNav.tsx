'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { shouldPrefetchDashboardRoute } from '@/lib/navigationPrefetch';
import {
    CalendarDays,
    DollarSign,
    CalendarCheck,
    LayoutDashboard,
    Menu,
    Users,
    ClipboardList,
} from 'lucide-react';
import { useMemo } from 'react';

interface BottomNavProps {
    permissions: string[];
    onMoreClick: () => void;
}

const navItems = [
    {
        name: 'Home',
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
        name: 'Enquiries',
        href: '/dashboard/enquiries',
        icon: ClipboardList,
        permissions: ['view_enquiry', 'add_enquiry', 'edit_enquiry', 'manage_enquiries'],
    },
    {
        name: 'Customers',
        href: '/dashboard/customers',
        icon: Users,
        permissions: ['view_customer', 'add_customer', 'edit_customer', 'manage_customers'],
    },
    {
        name: 'Calendar',
        href: '/dashboard/calendar',
        icon: CalendarDays,
        permissions: ['view_calendar', 'view_booking', 'view_enquiry', 'manage_bookings', 'manage_enquiries'],
    },
    {
        name: 'Payments',
        href: '/dashboard/payments',
        icon: DollarSign,
        permissions: ['manage_payments'],
    },
];

function hasAccess(userPerms: string[], requiredPerms: string[]): boolean {
    if (!requiredPerms.length) return true;
    return requiredPerms.some((p) => userPerms.includes(p));
}

// 4 items + "More" = 5 well-spaced touch targets. Items beyond the cap stay
// one tap away in the full menu that "More" opens; priority is array order.
const MAX_VISIBLE_ITEMS = 4;

export default function BottomNav({ permissions, onMoreClick }: BottomNavProps) {
    const pathname = usePathname();

    const visibleItems = useMemo(
        () =>
            navItems
                .filter((item) => hasAccess(permissions, item.permissions))
                .slice(0, MAX_VISIBLE_ITEMS),
        [permissions]
    );

    return (
        <nav className="bottom-nav lg:hidden" aria-label="Quick navigation">
            {visibleItems.map((item) => {
                const isActive = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
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
