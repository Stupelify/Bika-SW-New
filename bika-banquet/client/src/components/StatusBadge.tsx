'use client';

import { statusToken } from '@/lib/statusToken';

type StatusBadgeProps = {
  status: string;
  size?: 'sm' | 'md';
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const { label, className } = statusToken(status);

  return (
    <span
      className={`status-pill ${className} ${
        size === 'sm' ? 'text-[10px] px-2 py-0.5' : ''
      }`}
    >
      <span className="status-dot" aria-hidden="true" />
      {label}
    </span>
  );
}
