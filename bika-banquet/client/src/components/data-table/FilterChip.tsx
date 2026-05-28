'use client';

import * as Popover from '@radix-ui/react-popover';
import { ChevronDown, X } from 'lucide-react';
import type { ReactNode } from 'react';

interface FilterChipProps {
  label: string;
  valueLabel: string | null;
  active: boolean;
  onClear: () => void;
  children: ReactNode | ((close: () => void) => ReactNode);
  align?: 'start' | 'center' | 'end';
}

export default function FilterChip({
  label,
  valueLabel,
  active,
  onClear,
  children,
  align = 'start',
}: FilterChipProps) {
  return (
    <Popover.Root>
      <div
        className={`inline-flex items-center rounded-full border text-sm transition ${
          active
            ? 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-200'
            : 'border-[var(--border-2)] bg-[var(--surface)] text-[var(--text-2)] hover:border-[var(--text-4)]'
        }`}
      >
        <Popover.Trigger asChild>
          <button
            type="button"
            className="flex min-h-9 items-center gap-1.5 px-3 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded-full"
          >
            <span className="font-medium">{label}</span>
            {valueLabel ? (
              <>
                <span className="text-[var(--text-4)]">·</span>
                <span className="max-w-[12rem] truncate">{valueLabel}</span>
              </>
            ) : null}
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </Popover.Trigger>
        {active ? (
          <button
            type="button"
            onClick={onClear}
            aria-label={`Clear ${label} filter`}
            className="mr-1 flex h-6 w-6 items-center justify-center rounded-full hover:bg-teal-100 dark:hover:bg-teal-500/25"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
      <Popover.Portal>
        <Popover.Content
          align={align}
          sideOffset={6}
          className="z-50 min-w-[16rem] rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-lg outline-none"
        >
          {(() => {
            if (typeof children === 'function') {
              return (children as (close: () => void) => ReactNode)(() => {
                // Radix exposes no imperative close; rely on Popover.Close inside content.
              });
            }
            return children;
          })()}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
