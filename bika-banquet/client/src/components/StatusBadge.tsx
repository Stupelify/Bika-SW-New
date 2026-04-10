'use client';

import {
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  MessageCircle,
  PenLine,
  XCircle,
} from 'lucide-react';

type StatusBadgeProps = {
  status: string;
  size?: 'sm' | 'md';
};

const STATUS_CONFIG = {
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircle2,
    cssClass: 'status-confirmed',
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    cssClass: 'status-pending',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    cssClass: 'status-cancelled',
  },
  quotation: {
    label: 'Quotation',
    icon: FileText,
    cssClass: 'status-quotation',
  },
  pencil: {
    label: 'Pencil',
    icon: PenLine,
    cssClass: 'status-pencil',
  },
  enquiry: {
    label: 'Enquiry',
    icon: MessageCircle,
    cssClass: 'status-enquiry',
  },
} as const;

function capitalizeStatus(status: string): string {
  if (!status) return 'Pending';
  return status
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export default function StatusBadge({
  status,
  size = 'md',
}: StatusBadgeProps) {
  const normalizedStatus = status.trim().toLowerCase();
  const config =
    STATUS_CONFIG[normalizedStatus as keyof typeof STATUS_CONFIG] ?? {
      label: capitalizeStatus(status),
      icon: Circle,
      cssClass: 'status-pending',
    };
  const Icon = config.icon;

  return (
    <span
      className={`status-pill ${config.cssClass} ${
        size === 'sm' ? 'text-[11px] px-2 py-0.5' : ''
      }`}
    >
      <Icon size={10} strokeWidth={2.5} />
      {config.label}
    </span>
  );
}
