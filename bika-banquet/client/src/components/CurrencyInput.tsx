'use client';

import { useRef, useState } from 'react';

function formatInr(v: string | number): string {
  const raw = String(v ?? '').replace(/,/g, '').trim();
  if (raw === '' || raw === '-') return raw;
  const n = parseFloat(raw);
  if (!isFinite(n)) return raw;
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value: string | number;
  onChange: (rawValue: string) => void;
}

export default function CurrencyInput({
  value,
  onChange,
  onFocus,
  onBlur,
  className,
  ...props
}: CurrencyInputProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const rawValue = String(value ?? '').replace(/,/g, '');
  const displayValue = focused ? rawValue : formatInr(value ?? '');

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      className={className}
      value={displayValue}
      onChange={(e) => onChange(e.target.value.replace(/,/g, ''))}
      onFocus={(e) => {
        setFocused(true);
        const el = e.currentTarget;
        // Select after React re-renders to plain value
        requestAnimationFrame(() => el.select());
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      {...props}
    />
  );
}
