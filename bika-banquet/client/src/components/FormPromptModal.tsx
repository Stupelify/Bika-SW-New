'use client';

import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface FormPromptModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  widthClass?: string;
}

export default function FormPromptModal({
  open,
  title,
  onClose,
  children,
  widthClass = 'max-w-4xl',
}: FormPromptModalProps) {
  useEffect(() => {
    if (!open || typeof document === 'undefined') return;

    const bodyStyle = document.body.style;
    const prevOverflow = bodyStyle.overflow;
    const prevOverscroll = bodyStyle.overscrollBehavior;

    // Keep scrolling isolated to the modal content while it is open.
    bodyStyle.overflow = 'hidden';
    bodyStyle.overscrollBehavior = 'none';

    return () => {
      bodyStyle.overflow = prevOverflow;
      bodyStyle.overscrollBehavior = prevOverscroll;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-2 sm:p-4"
      style={{ overscrollBehavior: 'contain' }}
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/45"
        onClick={onClose}
        aria-label="Close form prompt backdrop"
      />
      <div
        className={`relative w-full ${widthClass} max-h-[94vh] sm:max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-gray-200 bg-white shadow-xl transform-gpu will-change-transform`}
      >
        <div className="sticky top-0 z-10 bg-white/95 border-b border-gray-200 px-4 sm:px-5 py-3.5 sm:py-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-display font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:bg-white hover:text-gray-700 border border-transparent hover:border-gray-200"
            aria-label="Close form prompt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
}
