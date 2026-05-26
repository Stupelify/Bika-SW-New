'use client';

import { ChevronLeft } from 'lucide-react';
import type { HallCalendarOption } from '../_lib/types';
import { getLocationPalette } from '../_lib/calendar-helpers';

type HallPalette = ReturnType<typeof getLocationPalette>;

export interface HallStat extends HallCalendarOption {
  count: number;
  palette: HallPalette;
  pct: number;
}

const STATUS_FILTERS = [
  { key: 'confirmed', label: 'Confirmed', color: '#10b981', icon: '✓' },
  { key: 'pending', label: 'Pending', color: '#f59e0b', icon: '•' },
  { key: 'quotation', label: 'Quotation', color: '#6366f1', icon: '◎' },
  { key: 'enquiry', label: 'Enquiry', color: '#f59e0b', icon: '?' },
  { key: 'pencil', label: 'Pencil', color: '#6b7280', icon: '✏' },
  { key: 'cancelled', label: 'Cancelled', color: '#ef4444', icon: '×' },
] as const;

interface HallLegendProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  halls: HallCalendarOption[];
  hallStats: HallStat[];
  hallStatsByLocation: Array<[string, HallStat[]]>;
  selectedHallIds: Set<string> | null;
  setSelectedHallIds: React.Dispatch<React.SetStateAction<Set<string> | null>>;
  toggleHall: (hallId: string) => void;
  selectedStatuses: Set<string>;
  toggleStatus: (status: string) => void;
}

export default function HallLegend({
  sidebarOpen,
  toggleSidebar,
  halls,
  hallStats,
  hallStatsByLocation,
  selectedHallIds,
  setSelectedHallIds,
  toggleHall,
  selectedStatuses,
  toggleStatus,
}: HallLegendProps) {
  return (
    <aside
      className={`hidden lg:block shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${sidebarOpen ? 'w-64' : 'w-12'
        }`}
    >
      <div
        className={`rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm flex flex-col h-full ${sidebarOpen ? 'p-4' : 'p-2'
          }`}
      >
        {/* Toggle button */}
        <button
          type="button"
          onClick={toggleSidebar}
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          className="mb-3 flex items-center justify-center w-8 h-8 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface-2)] text-[var(--text-4)] hover:text-[var(--text-1)] transition self-end shrink-0"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${sidebarOpen ? '' : 'rotate-180'}`} />
        </button>

        {sidebarOpen ? (
          <div className="flex flex-col gap-5 overflow-y-auto no-scrollbar flex-1">

            {/* Halls section — grouped by location */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-4)]">Halls</p>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedHallIds(new Set(halls.map((h) => h.id)))}
                    className="text-[9px] font-semibold text-indigo-600 hover:underline"
                  >All</button>
                  <span className="text-gray-300 text-[9px]">|</span>
                  <button
                    type="button"
                    onClick={() => setSelectedHallIds(new Set())}
                    className="text-[9px] font-semibold text-[var(--text-4)] hover:underline"
                  >None</button>
                </div>
              </div>

              {hallStatsByLocation.length === 0 && (
                <p className="text-[11px] text-[var(--text-4)] italic">No halls configured</p>
              )}

              <div className="space-y-4">
                {hallStatsByLocation.map(([locationName, locationHalls]) => {
                  const locationHallIds = locationHalls.map((h) => h.id);
                  const allChecked = locationHallIds.every(
                    (id) => selectedHallIds === null || selectedHallIds.has(id)
                  );
                  const someChecked = locationHallIds.some(
                    (id) => selectedHallIds === null || selectedHallIds.has(id)
                  );
                  const toggleLocation = () => {
                    setSelectedHallIds((prev) => {
                      const base = prev ?? new Set(halls.map((h) => h.id));
                      const next = new Set(base);
                      if (allChecked) {
                        locationHallIds.forEach((id) => next.delete(id));
                      } else {
                        locationHallIds.forEach((id) => next.add(id));
                      }
                      return next;
                    });
                  };

                  return (
                    <div key={locationName}>
                      {/* Location group header */}
                      <div className="flex items-center gap-1.5 mb-2">
                        <button
                          type="button"
                          onClick={toggleLocation}
                          title={allChecked ? `Deselect all halls in ${locationName}` : `Select all halls in ${locationName}`}
                          className={`h-3.5 w-3.5 rounded border shrink-0 flex items-center justify-center transition-colors ${allChecked
                              ? 'bg-indigo-50 dark:bg-indigo-500/100 border-indigo-500 text-white'
                              : someChecked
                                ? 'bg-indigo-200 border-indigo-400'
                                : 'bg-[var(--surface)] border-[var(--border-2)]'
                            }`}
                          style={{ fontSize: 8 }}
                        >
                          {(allChecked || someChecked) && (
                            <span style={{ lineHeight: 1 }}>{allChecked ? '✓' : '−'}</span>
                          )}
                        </button>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-4)] truncate flex-1">
                          {locationName}
                        </span>
                        <span className="text-[9px] text-[var(--text-4)] tabular-nums shrink-0">
                          {locationHalls.reduce((s, h) => s + h.count, 0)}
                        </span>
                      </div>

                      {/* Halls in this location */}
                      <div className="space-y-2.5 pl-1">
                        {locationHalls.map((hall) => {
                          const checked = selectedHallIds === null || selectedHallIds.has(hall.id);
                          return (
                            <label key={hall.id} className="flex flex-col gap-1 cursor-pointer group">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleHall(hall.id)}
                                  className="h-3.5 w-3.5 rounded border-[var(--border-2)] shrink-0"
                                  style={{ accentColor: hall.palette.solid }}
                                />
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ background: hall.palette.solid }}
                                />
                                <span className={`text-xs font-medium truncate flex-1 transition-colors ${checked ? 'text-[var(--text-1)]' : 'text-[var(--text-4)]'
                                  }`}>
                                  {hall.name}
                                </span>
                                <span
                                  className="text-[10px] font-bold tabular-nums shrink-0"
                                  style={{ color: hall.count > 0 ? hall.palette.text : '#9ca3af' }}
                                >
                                  {hall.count}
                                </span>
                              </div>
                              {/* Mini utilization bar */}
                              <div className="ml-[22px] h-1 rounded-full bg-[var(--surface-2)] overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${hall.pct}%`,
                                    background: hall.palette.solid,
                                    opacity: checked ? 1 : 0.3,
                                  }}
                                />
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[var(--border)]" />

            {/* Status section */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-4)] mb-3">Status</p>
              <div className="space-y-2.5">
                {STATUS_FILTERS.map(({ key, label, color, icon }) => {
                  const checked = selectedStatuses.has(key);
                  return (
                    <label key={key} className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleStatus(key)}
                        className="h-3.5 w-3.5 rounded border-[var(--border-2)] shrink-0"
                        style={{ accentColor: color }}
                      />
                      <span
                        className="flex h-5 w-5 items-center justify-center rounded-md text-[11px] font-bold shrink-0"
                        style={{
                          background: checked ? `${color}18` : '#f3f4f6',
                          color: checked ? color : '#9ca3af',
                        }}
                      >
                        {icon}
                      </span>
                      <span className={`text-xs font-medium transition-colors ${checked ? 'text-[var(--text-1)]' : 'text-[var(--text-4)]'
                        }`}>
                        {label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[var(--border)]" />

            {/* Active filters summary */}
            {selectedHallIds !== null && selectedHallIds.size < halls.length && (
              <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-900/50 p-2.5">
                <p className="text-[10px] font-bold text-amber-700 dark:text-amber-200 uppercase tracking-wide mb-1">Filtered</p>
                <p className="text-[11px] text-amber-800 dark:text-amber-200">
                  {selectedHallIds.size} of {halls.length} halls visible
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedHallIds(new Set(halls.map((h) => h.id)))}
                  className="mt-1.5 text-[10px] font-semibold text-amber-700 dark:text-amber-200 hover:text-amber-900 dark:text-amber-200 underline"
                >
                  Show all halls
                </button>
              </div>
            )}

          </div>
        ) : (
          /* Collapsed state — colored dots only */
          <div className="flex flex-col items-center gap-2 mt-1">
            {hallStats.map((hall) => {
              const checked = selectedHallIds === null || selectedHallIds.has(hall.id);
              return (
                <button
                  key={hall.id}
                  type="button"
                  title={`${hall.name} (${hall.count})`}
                  onClick={() => toggleHall(hall.id)}
                  className="w-5 h-5 rounded-full border-2 transition-all"
                  style={{
                    background: checked ? hall.palette.solid : 'transparent',
                    borderColor: hall.palette.solid,
                    opacity: checked ? 1 : 0.45,
                  }}
                />
              );
            })}
            <div className="my-1 w-4 border-t border-[var(--border)]" />
            {STATUS_FILTERS.map(({ key, color, icon }) => {
              const checked = selectedStatuses.has(key);
              return (
                <button
                  key={key}
                  type="button"
                  title={key}
                  onClick={() => toggleStatus(key)}
                  className="w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center transition-all"
                  style={{
                    background: checked ? `${color}20` : '#f3f4f6',
                    color: checked ? color : '#d1d5db',
                  }}
                >
                  {icon}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
