'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart2,
  BookOpen,
  Calendar,
  LucideIcon,
  MessageCircle,
  Plus,
  Search,
  User,
  UserPlus,
} from 'lucide-react';
import {
  buildBookingEditorHref,
  buildEnquiryEditorHref,
} from '@/lib/dashboardNavigation';

// ── Types ──────────────────────────────────────────────────────────────────────

type SearchResultType = 'booking' | 'customer' | 'enquiry';

type SearchResult = {
  id: string;
  label: string;
  secondary?: string;
  href: string;
  type: SearchResultType;
};

type QuickAction = {
  id: string;
  label: string;
  icon: LucideIcon;
  action: () => void;
};

type CommandPaletteProps = {
  open: boolean;
  onClose: () => void;
  // Legacy props kept for backward compatibility but no longer used
  recentBookings?: unknown[];
  customers?: unknown[];
};

// ── Icon map per result type ───────────────────────────────────────────────────

const TYPE_ICON: Record<SearchResultType, LucideIcon> = {
  booking: BookOpen,
  customer: User,
  enquiry: MessageCircle,
};

const TYPE_LABEL: Record<SearchResultType, string> = {
  booking: 'Bookings',
  customer: 'Customers',
  enquiry: 'Enquiries',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Quick actions shown when query is empty
  const quickActions: QuickAction[] = [
    {
      id: 'new-booking',
      label: 'Create New Booking',
      icon: Plus,
      action: () => { router.push('/dashboard/bookings?new=1'); onClose(); },
    },
    {
      id: 'calendar',
      label: 'Go to Calendar',
      icon: Calendar,
      action: () => { router.push('/dashboard/calendar'); onClose(); },
    },
    {
      id: 'new-customer',
      label: 'Add New Customer',
      icon: UserPlus,
      action: () => { router.push('/dashboard/customers?new=1'); onClose(); },
    },
    {
      id: 'new-enquiry',
      label: 'New Enquiry',
      icon: MessageCircle,
      action: () => { router.push('/dashboard/enquiries?new=1'); onClose(); },
    },
    {
      id: 'reports',
      label: 'Go to Reports',
      icon: BarChart2,
      action: () => { router.push('/dashboard/reports'); onClose(); },
    },
  ];

  // Focus input when palette opens, reset state
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setResults([]);
    setSelectedIndex(0);
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Debounced live search — min 2 chars, no localStorage
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';
    const cleanApiBase = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase;
    const t = window.setTimeout(async () => {
      try {
        const resp = await fetch(
          `${cleanApiBase}/api/search?q=${encodeURIComponent(trimmed)}`,
          { credentials: 'include' }
        );
        if (!resp.ok) throw new Error('search failed');
        const json = await resp.json();
        const data = json?.data ?? json;
        const flat: SearchResult[] = [
          ...(data.bookings ?? []).map((b: any) => ({
            id: b.id,
            label: b.label ?? b.functionName ?? 'Booking',
            secondary: b.secondary ?? b.customerName,
            href: b.href ?? buildBookingEditorHref(b.id),
            type: 'booking' as const,
          })),
          ...(data.customers ?? []).map((c: any) => ({
            id: c.id,
            label: c.label ?? c.name ?? 'Customer',
            secondary: c.secondary ?? c.phone,
            href: c.href ?? `/dashboard/customers/${c.id}`,
            type: 'customer' as const,
          })),
          ...(data.enquiries ?? []).map((e: any) => ({
            id: e.id,
            label: e.label ?? e.functionName ?? 'Enquiry',
            secondary: e.secondary ?? e.customerName,
            href: e.href ?? buildEnquiryEditorHref(e.id),
            type: 'enquiry' as const,
          })),
        ];
        setResults(flat);
        setSelectedIndex(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => window.clearTimeout(t);
  }, [query]);

  // ── Keyboard navigation ──────────────────────────────────────────────────────

  const isQueryEmpty = query.trim().length < 2;
  const totalItems = isQueryEmpty ? quickActions.length : results.length;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, totalItems));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + Math.max(1, totalItems)) % Math.max(1, totalItems));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isQueryEmpty) {
        quickActions[selectedIndex]?.action();
      } else {
        const result = results[selectedIndex];
        if (result) { router.push(result.href); onClose(); }
      }
    }
  };

  if (!open) return null;

  const isDark =
    typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark';

  // ── Grouped results by type ──────────────────────────────────────────────────

  const groups = (['booking', 'customer', 'enquiry'] as SearchResultType[])
    .map((type) => ({ type, items: results.filter((r) => r.type === type) }))
    .filter((g) => g.items.length > 0);

  // flat ordered list for selectedIndex mapping
  const flatForIndex = isQueryEmpty
    ? quickActions
    : results.map((r) => ({ id: r.id, label: r.label }));

  let globalIndex = 0;

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
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px 20px',
            borderBottom: '1px solid var(--border)',
            color: 'var(--text-3)',
          }}
        >
          <Search size={16} aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search bookings, customers, enquiries…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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
          {loading && (
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                border: '2px solid var(--border-2)',
                borderTopColor: 'var(--teal-500)',
                animation: 'spin 0.7s linear infinite',
                flexShrink: 0,
              }}
            />
          )}
        </div>

        <div style={{ maxHeight: 380, overflowY: 'auto', padding: '8px 0' }}>
          {/* Quick actions (empty query) */}
          {isQueryEmpty && (
            <>
              <div
                style={{
                  padding: '6px 16px',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text-4)',
                  fontWeight: 600,
                }}
              >
                Quick Actions
              </div>
              {quickActions.map((action, idx) => {
                const isActive = idx === selectedIndex;
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={action.action}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 16px',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      background: isActive
                        ? isDark ? 'rgba(20,184,166,0.08)' : 'var(--teal-50)'
                        : 'transparent',
                      color: 'var(--text-1)',
                      fontFamily: 'inherit',
                    }}
                  >
                    <span style={{ color: 'var(--teal-600)', flexShrink: 0 }}>
                      <action.icon size={16} />
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{action.label}</span>
                  </button>
                );
              })}
            </>
          )}

          {/* Live search results — grouped by type */}
          {!isQueryEmpty && !loading && results.length === 0 && (
            <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--text-4)', fontSize: 14 }}>
              No results for &ldquo;{query.trim()}&rdquo;
            </div>
          )}

          {!isQueryEmpty && groups.map(({ type, items }) => {
            const TypeIcon = TYPE_ICON[type];
            return (
              <div key={type}>
                <div
                  style={{
                    padding: '8px 16px 4px',
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--text-4)',
                    fontWeight: 600,
                  }}
                >
                  {TYPE_LABEL[type]}
                </div>
                {items.map((item) => {
                  const idx = globalIndex++;
                  const isActive = idx === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => { router.push(item.href); onClose(); }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '9px 16px',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        background: isActive
                          ? isDark ? 'rgba(20,184,166,0.08)' : 'var(--teal-50)'
                          : 'transparent',
                        color: 'var(--text-1)',
                        fontFamily: 'inherit',
                      }}
                    >
                      <span style={{ color: 'var(--text-4)', flexShrink: 0 }}>
                        <TypeIcon size={15} />
                      </span>
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
                        {item.secondary && (
                          <span
                            style={{
                              fontSize: 12,
                              color: 'var(--text-4)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.secondary}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div
          style={{
            padding: '8px 16px',
            borderTop: '1px solid var(--border)',
            fontSize: 11,
            color: 'var(--text-4)',
            display: 'flex',
            gap: 12,
          }}
        >
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
        </div>
      </div>

      {/* Spin keyframe — injected inline so it works without Tailwind animation plugin */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
