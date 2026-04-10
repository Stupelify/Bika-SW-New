'use client';

import { Search, X } from 'lucide-react';

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search
        size={15}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-4)] pointer-events-none"
      />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="input pl-9 h-9"
      />
      {value.length > 0 ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-4)] hover:bg-surface-2 hover:text-text-2"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      ) : null}
    </div>
  );
}
