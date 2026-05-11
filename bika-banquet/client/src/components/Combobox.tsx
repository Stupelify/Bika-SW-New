'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Loader2, Search } from 'lucide-react';

type ComboboxOption = {
  value: string;
  label: string;
  secondary?: string;
};

type ComboboxProps = {
  options: readonly ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  onSearch?: (query: string) => Promise<readonly ComboboxOption[]>;
  loading?: boolean;
};

export default function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search...',
  disabled = false,
  className = '',
  onSearch,
  loading = false,
}: ComboboxProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [asyncOptions, setAsyncOptions] = useState<ComboboxOption[]>([...options]);
  const [asyncLoading, setAsyncLoading] = useState(false);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) || asyncOptions.find((option) => option.value === value),
    [asyncOptions, options, value]
  );

  const filteredOptions = useMemo(() => {
    if (onSearch) {
      return asyncOptions;
    }

    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) =>
      option.label.toLowerCase().includes(normalizedQuery)
    );
  }, [asyncOptions, onSearch, options, query]);

  useEffect(() => {
    setAsyncOptions([...options]);
  }, [options]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open || !onSearch) return;

    const handle = window.setTimeout(async () => {
      setAsyncLoading(true);
      try {
        const nextOptions = await onSearch(query.trim());
        setAsyncOptions([...nextOptions]);
        setActiveIndex(0);
      } finally {
        setAsyncLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(handle);
  }, [open, onSearch, query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, filteredOptions.length - 1));
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const option = filteredOptions[activeIndex];
      if (option) {
        onChange(option.value);
        setOpen(false);
      }
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        className="input flex items-center justify-between text-left"
        onClick={() => !disabled && setOpen((current) => !current)}
        disabled={disabled}
      >
        <span className={selectedOption ? 'text-text-1' : 'text-text-4'}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown size={16} className="text-text-4" />
      </button>

      {open ? (
        <div className="absolute z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-border bg-surface shadow-lg">
          <div className="sticky top-0 border-b border-border bg-surface p-2">
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-4"
              />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="input pl-8"
              />
            </div>
          </div>
          {(loading || asyncLoading) ? (
            <div className="flex items-center justify-center gap-2 p-4 text-sm text-text-3">
              <Loader2 size={14} className="animate-spin" />
              Loading...
            </div>
          ) : filteredOptions.length === 0 ? (
            <div className="p-4 text-sm text-text-3">No options found.</div>
          ) : (
            filteredOptions.map((option, index) => (
              <button
                key={option.value}
                type="button"
                className={`flex w-full items-start justify-between gap-3 px-3 py-2 text-left ${
                  index === activeIndex ? 'bg-surface-2' : 'bg-transparent'
                }`}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <span>
                  <span className="block text-sm text-text-1">{option.label}</span>
                  {option.secondary ? (
                    <span className="block text-xs text-text-4">{option.secondary}</span>
                  ) : null}
                </span>
                {option.value === value ? <Check size={14} className="mt-0.5 text-teal-600" /> : null}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
