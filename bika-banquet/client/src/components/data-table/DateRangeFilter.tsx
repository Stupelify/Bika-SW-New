'use client';

import * as Popover from '@radix-ui/react-popover';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import FilterChip from './FilterChip';
import type { FilterValue } from '@/lib/data-table/types';

interface DateRangeFilterProps {
  label: string;
  value: { type: 'dateRange'; from: string | null; to: string | null };
  onChange: (next: FilterValue) => void;
}

function toISO(date: Date | undefined): string | null {
  if (!date) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseISO(value: string | null): Date | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDisplay(value: string | null): string | null {
  if (!value) return null;
  const date = parseISO(value);
  if (!date) return null;
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function startOfWeek(d: Date): Date {
  const out = new Date(d);
  const day = out.getDay();
  const diff = (day + 6) % 7; // Mon = 0
  out.setDate(out.getDate() - diff);
  out.setHours(0, 0, 0, 0);
  return out;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export default function DateRangeFilter({ label, value, onChange }: DateRangeFilterProps) {
  const active = value.from !== null || value.to !== null;
  const fromDate = parseISO(value.from);
  const toDate = parseISO(value.to);

  const valueLabel = (() => {
    if (!active) return null;
    const f = formatDisplay(value.from);
    const t = formatDisplay(value.to);
    if (f && t) return `${f} – ${t}`;
    if (f) return `from ${f}`;
    if (t) return `until ${t}`;
    return null;
  })();

  const setRange = (from: Date | undefined, to: Date | undefined) => {
    onChange({ type: 'dateRange', from: toISO(from), to: toISO(to) });
  };

  const presets = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = startOfWeek(today);
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const last30 = new Date(today);
    last30.setDate(today.getDate() - 29);
    return [
      { label: 'Today', from: today, to: today },
      { label: 'This week', from: weekStart, to: today },
      { label: 'This month', from: monthStart, to: monthEnd },
      { label: 'Last 30 days', from: last30, to: today },
    ];
  })();

  return (
    <FilterChip
      label={label}
      valueLabel={valueLabel}
      active={active}
      onClear={() => onChange({ type: 'dateRange', from: null, to: null })}
    >
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-1">
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setRange(p.from, p.to)}
              className="rounded-lg px-2 py-1.5 text-left text-sm text-[var(--text-2)] hover:bg-[var(--surface-2)]"
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="border-t border-[var(--border)] pt-2">
          <DayPicker
            mode="range"
            selected={{ from: fromDate, to: toDate }}
            onSelect={(range) => setRange(range?.from, range?.to)}
            numberOfMonths={1}
            weekStartsOn={1}
          />
        </div>
        <div className="flex items-center justify-between border-t border-[var(--border)] pt-2">
          <button
            type="button"
            onClick={() => onChange({ type: 'dateRange', from: null, to: null })}
            className="text-sm text-teal-600 hover:underline disabled:opacity-50"
            disabled={!active}
          >
            Clear
          </button>
          <Popover.Close asChild>
            <button type="button" className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700">
              Done
            </button>
          </Popover.Close>
        </div>
      </div>
    </FilterChip>
  );
}
