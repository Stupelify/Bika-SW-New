'use client';

import { ChevronLeft, ChevronRight, Plus, RefreshCw, Search } from 'lucide-react';
import type { CalendarViewMode, EventSourceFilter } from '../_lib/types';
import type { HallStat } from './HallLegend';
import { formatDateKey, parseDateKey, startOfDay } from '../_lib/calendar-helpers';

// Status legend pills — clickable to toggle the status filter. Keys match the
// values stored in `selectedStatuses` (see calendar/page.tsx).
const STATUS_PILLS = [
  { key: 'confirmed', label: 'Confirmed', bg: 'var(--cal-confirmed-bg)', text: 'var(--cal-confirmed-text)', accent: 'var(--cal-confirmed-accent)' },
  { key: 'pending', label: 'Pending', bg: 'var(--cal-quotation-bg)', text: 'var(--cal-quotation-text)', accent: 'var(--cal-quotation-accent)' },
  { key: 'quotation', label: 'Quotation', bg: 'var(--cal-quotation-bg)', text: 'var(--cal-quotation-text)', accent: 'var(--cal-quotation-accent)' },
  { key: 'enquiry', label: 'Enquiry', bg: 'var(--cal-enquiry-bg)', text: 'var(--cal-enquiry-text)', accent: 'var(--cal-enquiry-accent)' },
  { key: 'pencil', label: 'Pencil', bg: 'var(--cal-pencil-bg)', text: 'var(--cal-pencil-text)', accent: 'var(--cal-pencil-accent)' },
  { key: 'cancelled', label: 'Cancelled', bg: 'var(--cal-cancelled-bg)', text: 'var(--cal-cancelled-text)', accent: 'var(--cal-cancelled-accent)' },
] as const;

interface CalendarToolbarProps {
  viewMode: CalendarViewMode;
  setViewMode: (mode: CalendarViewMode) => void;
  setViewDate: React.Dispatch<React.SetStateAction<Date>>;
  setSelectedDate: React.Dispatch<React.SetStateAction<string>>;
  selectedDate: string;
  todayKey: string;
  viewLabel: string;
  viewSubtitle: string;
  sourceFilter: EventSourceFilter;
  setSourceFilter: (mode: EventSourceFilter) => void;
  search: string;
  setSearch: (value: string) => void;
  loading: boolean;
  onJumpToDate: (dateKey: string) => void;
  onReload: () => void;
  onNewBooking: () => void;
  // Hall filter (header pills, grouped by banquet/location).
  hallStatsByLocation: Array<[string, HallStat[]]>;
  selectedHallIds: Set<string> | null;
  toggleHall: (hallId: string) => void;
  // Status filter (clickable legend pills).
  selectedStatuses: Set<string>;
  toggleStatus: (status: string) => void;
}

export default function CalendarToolbar({
  viewMode,
  setViewMode,
  setViewDate,
  setSelectedDate,
  selectedDate,
  todayKey,
  viewLabel,
  viewSubtitle,
  sourceFilter,
  setSourceFilter,
  search,
  setSearch,
  loading,
  onJumpToDate,
  onReload,
  onNewBooking,
  hallStatsByLocation,
  selectedHallIds,
  toggleHall,
  selectedStatuses,
  toggleStatus,
}: CalendarToolbarProps) {
  const step = (dir: -1 | 1) =>
    setViewDate((prev) => {
      if (viewMode === 'month') {
        return new Date(prev.getFullYear(), prev.getMonth() + dir, 1);
      }
      const next = new Date(prev);
      next.setDate(next.getDate() + dir * (viewMode === 'week' ? 7 : 1));
      return next;
    });

  return (
    <div className="calendar-toolbar card overflow-hidden p-0">
      {/* ── Row 1: nav + title + view switcher + actions ───────────────── */}
      <div className="flex flex-col gap-3 px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex gap-1 shrink-0">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-3)] hover:bg-[var(--surface-2)] transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-3)] hover:bg-[var(--surface-2)] transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                setViewDate(startOfDay(now));
                setSelectedDate(formatDateKey(now));
              }}
              className="ml-1 inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-semibold text-[var(--text-2)] hover:bg-[var(--surface-2)] transition"
              style={{ position: 'relative' }}
            >
              Today
              {selectedDate === todayKey && (
                <span className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[var(--teal-500)]" />
              )}
            </button>
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-extrabold tracking-tight text-[var(--text-1)] leading-none">
              {viewLabel}
            </h2>
            {viewSubtitle && (
              <p className="mt-1 truncate text-[11px] font-medium text-[var(--text-4)]">{viewSubtitle}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Segmented Month/Week/Day */}
          <div className="ops-inline-tabs" role="tablist" aria-label="Calendar view">
            {(['month', 'week', 'day'] as CalendarViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setViewMode(mode);
                  setViewDate(startOfDay(parseDateKey(selectedDate)));
                }}
                role="tab"
                aria-selected={viewMode === mode}
                className={`ops-inline-tab capitalize ${viewMode === mode ? 'active' : ''}`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Source filter (kept) */}
          <div className="ops-inline-tabs" role="tablist" aria-label="Calendar source">
            {(
              [
                ['all', 'All'],
                ['software', 'Software'],
                ['google', 'Google'],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setSourceFilter(mode)}
                role="tab"
                aria-selected={sourceFilter === mode}
                className={`ops-inline-tab ${sourceFilter === mode ? 'active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Go to date */}
          <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5">
            <span className="whitespace-nowrap text-xs font-semibold text-[var(--text-2)]">Go to</span>
            <input
              type="date"
              className="input h-7 min-h-0 border-0 p-0 text-sm shadow-none focus:shadow-none"
              value={selectedDate}
              onChange={(event) => onJumpToDate(event.target.value)}
              aria-label="Jump to date"
            />
          </div>

          {/* Search (kept) */}
          <div className="relative w-full sm:w-auto sm:min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-4)]" />
            <input
              className="input pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search function, hall, customer, status..."
            />
          </div>

          <button
            type="button"
            onClick={onReload}
            disabled={loading}
            aria-label="Refresh"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-3)] hover:bg-[var(--surface-2)] transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* New Booking (teal) */}
          <button
            type="button"
            onClick={onNewBooking}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--teal-600)] px-3.5 py-2 text-sm font-bold text-white shadow-sm transition hover:brightness-110"
          >
            <Plus className="w-4 h-4" />
            New Booking
          </button>
        </div>
      </div>

      {/* ── Row 2: hall pills (grouped) + status legend ─────────────────── */}
      <div className="flex items-center gap-3 border-t border-[var(--border)] px-4 py-2.5 max-[859px]:flex-wrap">
        {/* Hall pills — horizontally scrollable WITHIN this container only */}
        <div className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto no-scrollbar max-[859px]:flex-wrap max-[859px]:overflow-x-visible max-[859px]:gap-y-1.5">
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--text-4)]">
            Halls
          </span>
          {hallStatsByLocation.length === 0 && (
            <span className="shrink-0 text-[11px] italic text-[var(--text-4)]">No halls</span>
          )}
          {hallStatsByLocation.map(([locationName, locationHalls]) => (
            <div key={locationName} className="flex shrink-0 items-center gap-1.5 max-[859px]:flex-wrap max-[859px]:shrink max-[859px]:gap-y-1.5">
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.04em] text-[var(--text-4)]">
                {locationName}
              </span>
              {locationHalls.map((hall) => {
                const active = selectedHallIds === null || selectedHallIds.has(hall.id);
                const color = hall.palette.solid;
                return (
                  <button
                    key={hall.id}
                    type="button"
                    onClick={() => toggleHall(hall.id)}
                    title={hall.name}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition"
                    style={{
                      border: `1.5px solid ${active ? `${color}66` : 'var(--border)'}`,
                      background: active ? `${color}1a` : 'var(--surface)',
                      color: active ? color : 'var(--text-4)',
                      opacity: active ? 1 : 0.7,
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: active ? color : 'var(--text-4)' }}
                    />
                    {hall.name}
                    <span className="text-[10px] font-semibold tabular-nums opacity-70">· {hall.count}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Status legend — clickable to toggle status filter */}
        <div className="flex shrink-0 items-center gap-1 max-[859px]:w-full max-[859px]:flex-wrap">
          {STATUS_PILLS.map(({ key, label, bg, text, accent }) => {
            const active = selectedStatuses.has(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleStatus(key)}
                title={`Toggle ${label}`}
                className="rounded-full px-2.5 py-1 text-[10.5px] font-bold transition"
                style={{
                  background: active ? bg : 'var(--surface)',
                  color: active ? text : 'var(--text-4)',
                  border: `1px solid ${active ? `color-mix(in srgb, ${accent} 45%, transparent)` : 'var(--border)'}`,
                  opacity: active ? 1 : 0.55,
                  ...(key === 'pencil' && active
                    ? { backgroundImage: 'var(--cal-stripe)' }
                    : {}),
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
