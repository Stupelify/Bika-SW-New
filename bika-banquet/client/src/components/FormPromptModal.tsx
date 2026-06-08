'use client';

import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface FormPromptModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  widthClass?: string;
  isDirty?: boolean;
}

export default function FormPromptModal({
  open,
  title,
  onClose,
  children,
  widthClass = 'max-w-4xl',
  isDirty = false,
}: FormPromptModalProps) {
  const [mounted, setMounted] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) setShowCloseConfirm(false);
  }, [open]);

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

  const handleCloseRequest = () => {
    if (isDirty) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  if (!open || !mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-3 sm:p-4"
      data-capacitor-overlay="open"
      data-ops-form-surface="true"
      style={{ overscrollBehavior: 'contain' }}
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/45 z-0"
        onClick={handleCloseRequest}
        aria-label="Close form prompt backdrop"
      />
      <div
        className={`capacitor-modal-panel relative z-10 w-full ${widthClass} max-h-[calc(100dvh-var(--safe-top)-var(--keyboard-offset,0px))] sm:max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-[var(--border)] bg-surface shadow-xl`}
      >
        <div className="sticky top-0 z-10 bg-surface/95 border-b border-[var(--border)] px-4 sm:px-5 py-3.5 sm:py-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-display font-semibold text-[var(--text-1)]">{title}</h2>
          <button
            type="button"
            onClick={handleCloseRequest}
            className="min-h-11 min-w-11 p-2 rounded-lg text-[var(--text-4)] hover:bg-surface-2 hover:text-[var(--text-2)] border border-transparent hover:border-[var(--border)]"
            aria-label="Close form prompt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 sm:p-5 pb-[calc(1rem+var(--safe-bottom)+var(--keyboard-offset,0px))]">{children}</div>
      </div>

      {showCloseConfirm && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
            <div>
              <h3 className="text-base font-semibold text-[var(--text-1)] mb-1">Unsaved Changes</h3>
              <p className="text-sm text-[var(--text-3)]">
                You have unsaved changes. Are you sure you want to close without saving?
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowCloseConfirm(false)}
                className="btn btn-secondary"
              >
                Stay on Page
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCloseConfirm(false);
                  onClose();
                }}
                className="btn btn-danger"
              >
                Discard & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
