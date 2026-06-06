export type StatusKey =
  | 'confirmed'
  | 'pending'
  | 'cancelled'
  | 'quotation'
  | 'pencil'
  | 'enquiry';

export interface StatusToken {
  key: StatusKey;
  label: string;
  className: string;
}

const LABELS: Record<StatusKey, string> = {
  confirmed: 'Confirmed',
  pending: 'Pending',
  cancelled: 'Cancelled',
  quotation: 'Quotation',
  pencil: 'Pencil',
  enquiry: 'Enquiry',
};

export function statusToken(status: string | null | undefined): StatusToken {
  const norm = (status ?? '').trim().toLowerCase();
  const key: StatusKey = (norm in LABELS ? norm : 'pending') as StatusKey;
  return { key, label: LABELS[key], className: `status-${key}` };
}
