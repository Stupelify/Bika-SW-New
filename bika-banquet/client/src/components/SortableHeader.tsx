'use client';

import { ArrowDownAZ, ArrowUpAZ, ArrowUpDown } from 'lucide-react';
import { SortState } from '@/lib/tableUtils';

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  sort: SortState;
  onSort: (key: string) => void;
  className?: string;
}

export default function SortableHeader({
  label,
  sortKey,
  sort,
  onSort,
  className = 'text-left py-3 px-4 text-sm font-semibold text-gray-700',
}: SortableHeaderProps) {
  const isActive = sort.key === sortKey;

  return (
    <th className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 text-inherit hover:text-primary-700"
      >
        <span>{label}</span>
        {!isActive ? (
          <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
        ) : sort.direction === 'asc' ? (
          <ArrowUpAZ className="w-3.5 h-3.5 text-primary-700" />
        ) : (
          <ArrowDownAZ className="w-3.5 h-3.5 text-primary-700" />
        )}
      </button>
    </th>
  );
}
