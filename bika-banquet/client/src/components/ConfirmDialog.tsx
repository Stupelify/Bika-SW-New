'use client';

import { Loader2 } from 'lucide-react';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="card w-full max-w-sm">
          <h2 className="page-title">{title}</h2>
          <p className="mt-2 text-sm text-text-3">{description}</p>
          <div className="form-actions mt-6">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button
              type="button"
              className={`btn ${confirmVariant === 'primary' ? 'btn-primary' : 'btn-danger'}`}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
