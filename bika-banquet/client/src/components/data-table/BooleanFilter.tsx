'use client';

import * as Popover from '@radix-ui/react-popover';
import { Check } from 'lucide-react';
import FilterChip from './FilterChip';
import type { FilterValue } from '@/lib/data-table/types';

interface BooleanFilterProps {
  label: string;
  value: { type: 'boolean'; value: boolean | null };
  onChange: (next: FilterValue) => void;
  trueLabel?: string;
  falseLabel?: string;
}

export default function BooleanFilter({
  label,
  value,
  onChange,
  trueLabel = 'Yes',
  falseLabel = 'No',
}: BooleanFilterProps) {
  const active = value.value !== null;
  const valueLabel = !active ? null : value.value ? trueLabel : falseLabel;

  const choose = (v: boolean) => onChange({ type: 'boolean', value: v });

  return (
    <FilterChip
      label={label}
      valueLabel={valueLabel}
      active={active}
      onClear={() => onChange({ type: 'boolean', value: null })}
    >
      <div className="flex flex-col gap-1">
        {[
          { v: true, text: trueLabel },
          { v: false, text: falseLabel },
        ].map((opt) => {
          const isOn = value.value === opt.v;
          return (
            <Popover.Close key={String(opt.v)} asChild>
              <button
                type="button"
                onClick={() => choose(opt.v)}
                className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                  isOn
                    ? 'bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-200'
                    : 'text-[var(--text-2)] hover:bg-[var(--surface-2)]'
                }`}
              >
                <span>{opt.text}</span>
                {isOn ? <Check className="h-4 w-4" /> : null}
              </button>
            </Popover.Close>
          );
        })}
        {active ? (
          <div className="mt-1 flex justify-end border-t border-[var(--border)] pt-2">
            <Popover.Close asChild>
              <button
                type="button"
                onClick={() => onChange({ type: 'boolean', value: null })}
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
