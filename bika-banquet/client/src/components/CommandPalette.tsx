'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  CalendarCheck,
  CalendarDays,
  LayoutDashboard,
  Users,
  PhoneCall,
  Building2,
  UtensilsCrossed,
  DollarSign,
  BarChart3,
  Settings,
  Search,
} from 'lucide-react';

type PaletteItem = {
  id: string;
  label: string;
  href?: string;
  description?: string;
  icon?: React.ReactNode;
};

type CommandPaletteProps = {
  open: boolean;
  onClose: () => void;
  recentBookings?: Array<{ id: string; name: string; subtitle?: string; href?: string }>;
  customers?: Array<{ id: string; name: string; subtitle?: string; href?: string }>;
};

const PAGES: PaletteItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={16} /> },
  { id: 'customers', label: 'Customers', href: '/dashboard/customers', icon: <Users size={16} /> },
  { id: 'enquiries', label: 'Enquiries', href: '/dashboard/enquiries', icon: <PhoneCall size={16} /> },
  { id: 'bookings', label: 'Bookings', href: '/dashboard/bookings', icon: <CalendarCheck size={16} /> },
  { id: 'calendar', label: 'Calendar', href: '/dashboard/calendar', icon: <CalendarDays size={16} /> },
  { id: 'venues', label: 'Venues', href: '/dashboard/halls', icon: <Building2 size={16} /> },
  { id: 'menu', label: 'Menu & Items', href: '/dashboard/menu', icon: <UtensilsCrossed size={16} /> },
  { id: 'payments', label: 'Payments', href: '/dashboard/payments', icon: <DollarSign size={16} /> },
  { id: 'reports', label: 'Reports', href: '/dashboard/reports', icon: <BarChart3 size={16} /> },
  { id: 'settings', label: 'Settings', href: '/dashboard/settings', icon: <Settings size={16} /> },
];

export default function CommandPalette({
  open,
  onClose,
  recentBookings = [],
  customers = [],
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIndex(0);
    const id = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredPages = useMemo(() => {
    if (!normalizedQuery) return PAGES;
    return PAGES.filter((page) => page.label.toLowerCase().includes(normalizedQuery));
  }, [normalizedQuery]);

  const filteredBookings = useMemo(() => {
    if (!normalizedQuery) return recentBookings.slice(0, 5);
    return recentBookings
      .filter((item) => {
        const nameMatch = item.name.toLowerCase().includes(normalizedQuery);
        const subtitleMatch = item.subtitle?.toLowerCase().includes(normalizedQuery);
        return nameMatch || subtitleMatch;
      })
      .slice(0, 5);
  }, [normalizedQuery, recentBookings]);

  const filteredCustomers = useMemo(() => {
    if (!normalizedQuery) return customers.slice(0, 5);
    return customers
      .filter((item) => {
        const nameMatch = item.name.toLowerCase().includes(normalizedQuery);
        const subtitleMatch = item.subtitle?.toLowerCase().includes(normalizedQuery);
        return nameMatch || subtitleMatch;
      })
      .slice(0, 5);
  }, [normalizedQuery, customers]);

  const sections = [
    {
      id: 'pages',
      label: 'Pages',
      items: filteredPages.map((page) => ({
        ...page,
        id: `page-${page.id}`,
      })),
    },
    {
      id: 'bookings',
      label: 'Recent Bookings',
      items: filteredBookings.map((booking) => ({
        id: `booking-${booking.id}`,
        label: booking.name,
        description: booking.subtitle,
        href: booking.href ?? `/dashboard/bookings/${booking.id}`,
        icon: <CalendarCheck size={16} />,
      })),
    },
    {
      id: 'customers',
      label: 'Customers',
      items: filteredCustomers.map((customer) => ({
        id: `customer-${customer.id}`,
        label: customer.name,
        description: customer.subtitle,
        href: customer.href ?? `/dashboard/customers/${customer.id}`,
        icon: <Users size={16} />,
      })),
    },
  ].filter((section) => section.items.length > 0);

  const rows = sections.flatMap((section) => section.items);

  useEffect(() => {
    if (activeIndex >= rows.length) {
      setActiveIndex(0);
    }
  }, [rows.length, activeIndex]);

  const isDark =
    typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark';

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (rows.length ? (prev + 1) % rows.length : 0));
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (rows.length ? (prev - 1 + rows.length) % rows.length : 0));
    }
    if (event.key === 'Enter' && rows[activeIndex]?.href) {
      event.preventDefault();
      window.location.href = rows[activeIndex].href as string;
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      className="command-palette-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(15,23,42,0.5)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        className="modal-panel command-palette"
        style={{
          width: 'min(560px, 90vw)',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 18,
          boxShadow: 'var(--shadow-md)',
          overflow: 'hidden',
          backdropFilter: 'blur(20px) saturate(160%)',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            color: 'var(--text-3)',
          }}
        >
          <Search size={16} aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search bookings, customers, pages…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: 15,
              padding: 0,
              background: 'transparent',
              color: 'var(--text-1)',
            }}
          />
        </div>

        <div style={{ maxHeight: 380, overflowY: 'auto', padding: '8px 0' }}>
          {rows.length === 0 ? (
            <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--text-4)' }}>
              No results{normalizedQuery ? ` for "${normalizedQuery}"` : ''}
            </div>
          ) : (
            sections.reduce<React.ReactNode[]>((acc, section) => {
              const startIndex = acc.filter(Boolean).length === 0 ? 0 : rows.length;
              acc.push(
                <div
                  key={`section-${section.id}`}
                  style={{
                    padding: '6px 16px',
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--text-4)',
                  }}
                >
                  {section.label}
                </div>
              );
              section.items.forEach((item) => {
                const index = rows.findIndex((row) => row.id === item.id);
                const isActive = index === activeIndex;
                acc.push(
                  <Link
                    key={item.id}
                    href={item.href ?? '#'}
                    onClick={onClose}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 16px',
                      textDecoration: 'none',
                      color: 'var(--text-1)',
                      background: isActive
                        ? isDark
                          ? 'rgba(20,184,166,0.08)'
                          : 'var(--teal-50)'
                        : 'transparent',
                    }}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    <span style={{ color: 'var(--text-4)' }}>{item.icon}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: 'var(--text-1)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.label}
                      </span>
                      {item.description && (
                        <span
                          style={{
                            fontSize: 12,
                            color: 'var(--text-4)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.description}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              });
              return acc;
            }, [])
          )}
        </div>
      </div>
    </div>
  );
}
