'use client';

import { useState, type ReactNode } from 'react';
import { Filter } from 'lucide-react';
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { cn } from '@/lib/cn';

export interface FilterOption {
  value: string;
  label: string;
}

/**
 * Column-header filter affordance: a small funnel button with an active dot,
 * opening a popover that hosts one of the control bodies below. Reused for
 * every filterable column so the bookings table gets a consistent "click the
 * header to filter" experience.
 */
export function ColumnFilter({
  active,
  title,
  align = 'start',
  children,
}: {
  active?: boolean;
  title: string;
  align?: 'start' | 'center' | 'end';
  children: ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Filter by ${title}`}
          className={cn(
            'relative inline-flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-4)] hover:bg-surface-2 hover:text-[var(--text-2)]',
            active && 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300'
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          {active && (
            <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-teal-600" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align={align}>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-4)]">
          {title}
        </div>
        {children}
      </PopoverContent>
    </Popover>
  );
}

export function MultiSelectFilter({
  options,
  selected,
  onChange,
  searchable = false,
  emptyLabel = 'No options',
}: {
  options: FilterOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  searchable?: boolean;
  emptyLabel?: string;
}) {
  const [query, setQuery] = useState('');
  const visible =
    searchable && query
      ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
      : options;
  const toggle = (value: string) =>
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    );

  return (
    <div>
      {searchable && (
        <input
          className="input mb-2 h-8 text-sm"
          placeholder="Search…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}
      <div className="flex max-h-56 flex-col gap-0.5 overflow-y-auto pr-1">
        {visible.length === 0 ? (
          <p className="px-1 py-2 text-xs text-[var(--text-4)]">{emptyLabel}</p>
        ) : (
          visible.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 text-sm hover:bg-surface-2"
            >
              <input
                type="checkbox"
                className="accent-teal-600"
                checked={selected.includes(option.value)}
                onChange={() => toggle(option.value)}
              />
              <span className="truncate">{option.label}</span>
            </label>
          ))
        )}
      </div>
      {selected.length > 0 && (
        <button
          type="button"
          onClick={() => onChange([])}
          className="mt-2 text-xs text-teal-700 hover:underline dark:text-teal-300"
        >
          Clear ({selected.length})
        </button>
      )}
    </div>
  );
}

function PresetButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-[var(--border-2)] px-2 py-0.5 text-[11px] text-[var(--text-3)] hover:border-teal-600 hover:text-teal-700"
    >
      {children}
    </button>
  );
}

const ymd = (date: Date) => format(date, 'yyyy-MM-dd');

export function DateRangeFilter({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (next: { from: string; to: string }) => void;
}) {
  const today = new Date();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1">
        <PresetButton
          onClick={() =>
            onChange({
              from: ymd(startOfWeek(today, { weekStartsOn: 1 })),
              to: ymd(endOfWeek(today, { weekStartsOn: 1 })),
            })
          }
        >
          This week
        </PresetButton>
        <PresetButton
          onClick={() => onChange({ from: ymd(startOfMonth(today)), to: ymd(endOfMonth(today)) })}
        >
          This month
        </PresetButton>
        <PresetButton onClick={() => onChange({ from: ymd(today), to: ymd(addDays(today, 30)) })}>
          Next 30d
        </PresetButton>
      </div>
      <label className="text-xs text-[var(--text-3)]">
        From
        <input
          type="date"
          className="input mt-1 h-8 text-sm"
          value={from}
          onChange={(e) => onChange({ from: e.target.value, to })}
        />
      </label>
      <label className="text-xs text-[var(--text-3)]">
        To
        <input
          type="date"
          className="input mt-1 h-8 text-sm"
          value={to}
          onChange={(e) => onChange({ from, to: e.target.value })}
        />
      </label>
      {(from || to) && (
        <button
          type="button"
          onClick={() => onChange({ from: '', to: '' })}
          className="self-start text-xs text-teal-700 hover:underline dark:text-teal-300"
        >
          Clear dates
        </button>
      )}
    </div>
  );
}

const digitsOnly = (value: string) => value.replace(/[^0-9]/g, '');

export function NumberRangeFilter({
  min,
  max,
  onChange,
  minPlaceholder = 'Min',
  maxPlaceholder = 'Max',
}: {
  min: string;
  max: string;
  onChange: (next: { min: string; max: string }) => void;
  minPlaceholder?: string;
  maxPlaceholder?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          inputMode="numeric"
          className="input h-8 text-sm"
          placeholder={minPlaceholder}
          value={min}
          onChange={(e) => onChange({ min: digitsOnly(e.target.value), max })}
        />
        <span className="text-[var(--text-4)]">–</span>
        <input
          inputMode="numeric"
          className="input h-8 text-sm"
          placeholder={maxPlaceholder}
          value={max}
          onChange={(e) => onChange({ min, max: digitsOnly(e.target.value) })}
        />
      </div>
      {(min || max) && (
        <button
          type="button"
          onClick={() => onChange({ min: '', max: '' })}
          className="self-start text-xs text-teal-700 hover:underline dark:text-teal-300"
        >
          Clear
        </button>
      )}
    </div>
  );
}

export function ChoiceFilter({
  value,
  options,
  onChange,
  name,
}: {
  value: string;
  options: FilterOption[];
  onChange: (next: string) => void;
  name: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      {options.map((option) => (
        <label
          key={option.value}
          className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 text-sm hover:bg-surface-2"
        >
          <input
            type="radio"
            name={name}
            className="accent-teal-600"
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}
