'use client';

import { X } from 'lucide-react';

type FilterPanelProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  activeCount?: number;
  onClearAll?: () => void;
};

export default function FilterPanel({
  open,
  onClose,
  children,
  title = 'Filters',
  activeCount = 0,
  onClearAll,
}: FilterPanelProps) {
  return (
    <>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/20"
          onClick={onClose}
          aria-label="Close filters"
        />
      ) : null}
      <aside
        className={`fixed right-0 top-0 z-40 h-full w-80 border-l border-border bg-surface shadow-lg transition-transform duration-200 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <h2 className="page-title text-[18px]">{title}</h2>
          {activeCount > 0 ? (
            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-text-3">
              {activeCount}
            </span>
          ) : null}
          <div className="ml-auto flex items-center gap-3">
            {onClearAll ? (
              <button type="button" className="text-sm text-teal-600" onClick={onClearAll}>
                Clear all
              </button>
            ) : null}
            <button type="button" onClick={onClose} className="text-text-4">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="h-[calc(100%-65px)] overflow-y-auto p-5">{children}</div>
      </aside>
    </>
  );
}
