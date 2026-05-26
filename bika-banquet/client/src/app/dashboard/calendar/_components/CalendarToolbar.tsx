'use client';

import { ChevronLeft, ChevronRight, RefreshCw, Search } from 'lucide-react';
import type { CalendarViewMode, EventSourceFilter } from '../_lib/types';
import { formatDateKey, parseDateKey, startOfDay } from '../_lib/calendar-helpers';

interface CalendarToolbarProps {
  viewMode: CalendarViewMode;
  setViewMode: (mode: CalendarViewMode) => void;
  setViewDate: React.Dispatch<React.SetStateAction<Date>>;
  setSelectedDate: React.Dispatch<React.SetStateAction<string>>;
  selectedDate: string;
  todayKey: string;
  viewLabel: string;
  sourceFilter: EventSourceFilter;
  setSourceFilter: (mode: EventSourceFilter) => void;
  search: string;
  setSearch: (value: string) => void;
  loading: boolean;
  onJumpToDate: (dateKey: string) => void;
  onReload: () => void;
  googleImportEnabled: boolean;
  googleImportConfigured: boolean;
  googleSourceCount: number;
}

export default function CalendarToolbar({
  viewMode,
  setViewMode,
  setViewDate,
  setSelectedDate,
  selectedDate,
  todayKey,
  viewLabel,
  sourceFilter,
  setSourceFilter,
  search,
  setSearch,
  loading,
  onJumpToDate,
  onReload,
  googleImportEnabled,
  googleImportConfigured,
  googleSourceCount,
}: CalendarToolbarProps) {
  return (
    <div className="card">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setViewDate((prev) => {
                if (viewMode === 'month') {
                  return new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
                }
                if (viewMode === 'week') {
                  const next = new Date(prev);
                  next.setDate(next.getDate() - 7);
                  return next;
                }
                const next = new Date(prev);
                next.setDate(next.getDate() - 1);
                return next;
              })
            }
            className="btn btn-secondary px-3"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="w-full sm:w-auto sm:min-w-[220px] text-center">
            <p className="text-lg font-semibold text-[var(--text-1)]">{viewLabel}</p>
          </div>
          <button
            type="button"
            onClick={() =>
              setViewDate((prev) => {
                if (viewMode === 'month') {
                  return new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
                }
                if (viewMode === 'week') {
                  const next = new Date(prev);
                  next.setDate(next.getDate() + 7);
                  return next;
                }
                const next = new Date(prev);
                next.setDate(next.getDate() + 1);
                return next;
              })
            }
            className="btn btn-secondary px-3"
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
            className="btn btn-secondary"
            style={{ position: 'relative' }}
          >
            <span>Today</span>
            {selectedDate === todayKey && (
              <span
                style={{
                  position: 'absolute',
                  bottom: 4,
                  left: '50%',
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: 'var(--teal-500)',
                  transform: 'translateX(-50%)',
                }}
              />
            )}
          </button>
          <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
            <span className="text-xs font-semibold text-[var(--text-2)] whitespace-nowrap">Go to</span>
            <input
              type="date"
              className="input h-8 min-h-0 border-0 p-0 text-sm shadow-none focus:shadow-none"
              value={selectedDate}
              onChange={(event) => onJumpToDate(event.target.value)}
              aria-label="Jump to date"
            />
          </div>
          <div className="inline-flex rounded-xl border border-[var(--border)] overflow-hidden">
            {(['month', 'week', 'day'] as CalendarViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setViewMode(mode);
                  setViewDate(startOfDay(parseDateKey(selectedDate)));
                }}
                className={`px-3 py-2 text-sm font-semibold capitalize transition ${viewMode === mode
                  ? 'bg-primary-600 text-white'
                  : 'bg-[var(--surface)] text-[var(--text-2)] hover:bg-[var(--surface-2)]'
                  }`}
              >
                {mode}
              </button>
            ))}
          </div>
          <div className="inline-flex rounded-xl border border-[var(--border)] overflow-hidden">
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
                className={`px-3 py-2 text-sm font-semibold transition ${sourceFilter === mode
                  ? 'bg-primary-600 text-white'
                  : 'bg-[var(--surface)] text-[var(--text-2)] hover:bg-[var(--surface-2)]'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:min-w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-4)]" />
            <input
              className="input pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search function, hall, customer name or phone, status..."
            />
          </div>
          <button
            type="button"
            onClick={onReload}
            className="btn btn-primary w-full sm:w-auto"
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5">
          Software
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 text-sky-800 px-2 py-0.5">
          Google
        </span>
        <span className="text-[var(--text-2)]">
          {googleImportEnabled
            ? googleImportConfigured
              ? `Google import active for ${googleSourceCount} venue calendars (read-only).`
              : 'Google import enabled, but configuration is incomplete.'
            : 'Google import is currently disabled.'}
        </span>
      </div>
    </div>
  );
}
