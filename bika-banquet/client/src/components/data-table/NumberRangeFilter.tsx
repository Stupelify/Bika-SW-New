'use client';

import * as Popover from '@radix-ui/react-popover';
import { useEffect, useState } from 'react';
import FilterChip from './FilterChip';
import type { FilterValue } from '@/lib/data-table/types';

interface NumberRangeFilterProps {
  label: string;
  value: { type: 'numberRange'; min: number | null; max: number | null };
  onChange: (next: FilterValue) => void;
  format?: 'currency' | 'number';
  step?: number;
}

function formatNumber(n: number, fmt: 'currency' | 'number'): string {
  if (fmt === 'currency') {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(n);
  }
  return String(n);
}

export default function NumberRangeFilter({
  label,
  value,
  onChange,
  format = 'number',
  step,
}: NumberRangeFilterProps) {
  const active = value.min !== null || value.max !== null;

  const [minInput, setMinInput] = useState(value.min === null ? '' : String(value.min));
  const [maxInput, setMaxInput] = useState(value.max === null ? '' : String(value.max));

  // Resync local inputs if URL state changes externally (e.g. clear-all).
  useEffect(() => {
    setMinInput(value.min === null ? '' : String(value.min));
    setMaxInput(value.max === null ? '' : String(value.max));
  }, [value.min, value.max]);

  const valueLabel = (() => {
    if (!active) return null;
    const prefix = format === 'currency' ? '₹' : '';
    const min = value.min !== null ? prefix + formatNumber(value.min, format) : null;
    const max = value.max !== null ? prefix + formatNumber(value.max, format) : null;
    if (min && max) return `${min} – ${max}`;
    if (min) return `≥ ${min}`;
    if (max) return `≤ ${max}`;
    return null;
  })();

  const commit = () => {
    const parse = (s: string): number | null => {
      if (s.trim() === '') return null;
      const n = Number(s);
      return Number.isFinite(n) ? n : null;
    };
    let min = parse(minInput);
    let max = parse(maxInput);
    if (min !== null && max !== null && min > max) {
      [min, max] = [max, min];
    }
    onChange({ type: 'numberRange', min, max });
  };

  return (
    <FilterChip
      label={label}
      valueLabel={valueLabel}
      active={active}
      onClear={() => onChange({ type: 'numberRange', min: null, max: null })}
    >
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[var(--text-3)]">Min</span>
            <input
              type="number"
              inputMode="numeric"
              step={step}
              value={minInput}
              onChange={(e) => setMinInput(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  commit();
                }
              }}
              className="input"
              placeholder={format === 'currency' ? '₹0' : '0'}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[var(--text-3)]">Max</span>
            <input
              type="number"
              inputMode="numeric"
              step={step}
              value={maxInput}
              onChange={(e) => setMaxInput(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  commit();
                }
              }}
              className="input"
              placeholder={format === 'currency' ? '₹∞' : '∞'}
            />
          </label>
        </div>
        <div className="flex items-center justify-between border-t border-[var(--border)] pt-2">
          <button
            type="button"
            onClick={() => {
              setMinInput('');
              setMaxInput('');
              onChange({ type: 'numberRange', min: null, max: null });
            }}
            className="text-sm text-teal-600 hover:underline disabled:opacity-50"
            disabled={!active}
          >
            Clear
          </button>
          <Popover.Close asChild>
            <button
              type="button"
              onClick={commit}
              className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700"
            >
              Apply
            </button>
          </Popover.Close>
        </div>
      </div>
    </FilterChip>
  );
}
