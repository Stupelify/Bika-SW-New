'use client';

import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  width?: number | string;
  children: ReactNode;
}

export default function Sheet({ open, onClose, title, width = 480, children }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    if (open) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div className="scrim" onClick={onClose} aria-hidden="true" />
      <div
        className="sheet"
        data-open="true"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ width }}
      >
        {title && (
          <div className="sheet-header">
            <span className="sheet-title">{title}</span>
            <button
              type="button"
              className="header-icon-btn header-icon-hover"
              onClick={onClose}
              aria-label="Close panel"
            >
              <X width={16} height={16} aria-hidden="true" />
            </button>
          </div>
        )}
        <div className="sheet-body">{children}</div>
      </div>
    </>
  );
}
