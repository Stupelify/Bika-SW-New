'use client';

import { Check } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import FilterChip from './FilterChip';
import type { FilterOption, FilterValue } from '@/lib/data-table/types';

interface MultiSelectFilterProps {
  label: string;
  options: FilterOption[];
  value: { type: 'multiSelect'; values: string[] };
  onChange: (next: FilterValue) => void;
  placeholder?: string;
}

export default function MultiSelectFilter({
  label,
  options,
  value,
  onChange,
  placeholder,
}: MultiSelectFilterProps) {
  const selected = new Set(value.values);
  const active = selected.size > 0;

  const valueLabel = (() => {
    if (!active) return null;
    if (selected.size === 1) {
      const v = Array.from(selected)[0];
      return options.find((o) => o.value === v)?.label ?? v;
    }
    return `${selected.size} selected`;
  })();

  const toggle = (val: string) => {
    const next = new Set(selected);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    onChange({ type: 'multiSelect', values: Array.from(next) });
  };

  return (
    <FilterChip
      label={label}
      valueLabel={valueLabel}
      active={active}
      onClear={() => onChange({ type: 'multiSelect', values: [] })}
    >
      <div className="flex flex-col gap-1">
        {options.length === 0 ? (
          <p className="px-2 py-3 text-sm text-[var(--text-3)]">{placeholder ?? 'No options'}</p>
        ) : (
          options.map((opt) => {
            const isOn = selected.has(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                  isOn
                    ? 'bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-200'
                    : 'text-[var(--text-2)] hover:bg-[var(--surface-2)]'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isOn ? <Check className="h-4 w-4" /> : null}
              </button>
            );
          })
        )}
        {active ? (
          <div className="mt-1 flex justify-end border-t border-[var(--border)] pt-2">
            <Popover.Close asChild>
              <button
                type="button"
                onClick={() => onChange({ type: 'multiSelect', values: [] })}
                className="text-sm text-teal-600 hover:underline"
              >
                Clear
              </button>
            </Popover.Close>
          </div>
        ) : null}
      </div>
    </FilterChip>
  );
}
