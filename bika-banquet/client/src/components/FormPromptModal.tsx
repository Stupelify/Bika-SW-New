'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

interface FormPromptModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  widthClass?: string;
  isDirty?: boolean;
  /** When set, replaces the default title heading (e.g. tab navigation in the header row). */
  headerContent?: ReactNode;
}

/**
 * Shared modal for every form in the app. Ported to Radix Dialog (shadcn's
 * primitive), which provides focus-trap, scroll-lock, Escape handling, portal
 * and nested-dialog coordination natively. Keeps the previous public API plus
 * the bespoke pieces Radix does not cover:
 *   - the unsaved-changes confirm + beforeunload guard (driven by `isDirty`),
 *   - the optional `headerContent` (tab navigation in the header row),
 *   - the mobile bottom-sheet / desktop-centred layout,
 *   - the `capacitor-modal-panel` class and data-attributes that existing CSS
 *     and the native keyboard handling rely on.
 */
export default function FormPromptModal({
  open,
  title,
  onClose,
  children,
  widthClass = 'max-w-4xl',
  isDirty = false,
  headerContent,
}: FormPromptModalProps) {
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) setShowCloseConfirm(false);
  }, [open]);

  // Warn on browser-level exits (refresh / tab close / back) while there are
  // unsaved changes — the in-app close is guarded by the confirm below.
  useEffect(() => {
    if (!open || !isDirty || typeof window === 'undefined') return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [open, isDirty]);

  const handleCloseRequest = () => {
    if (isDirty) setShowCloseConfirm(true);
    else onClose();
  };

  return (
    <Dialog.Root
      open={open}
      // `open` is controlled by the parent, so Radix never self-closes; a close
      // request (Escape / backdrop / X) routes through the dirty guard. While
      // the confirm is up, Escape dismisses the confirm first.
      onOpenChange={(next) => {
        if (next) return;
        if (showCloseConfirm) {
          setShowCloseConfirm(false);
          return;
        }
        handleCloseRequest();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-slate-900/45 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          ref={panelRef}
          aria-describedby={undefined}
          data-capacitor-overlay="open"
          data-ops-form-surface="true"
          // Focus the panel itself (not the first field) on open, matching the
          // previous behaviour so long forms don't jump/scroll on mount.
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            panelRef.current?.focus();
          }}
          style={{ overscrollBehavior: 'contain' }}
          className={`capacitor-modal-panel fixed z-[71] left-1/2 bottom-0 top-auto -translate-x-1/2 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 w-[calc(100%-1.5rem)] ${widthClass} max-h-[calc(100dvh-var(--safe-top)-var(--keyboard-offset,0px))] sm:max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-[var(--border)] bg-surface shadow-xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom-2 data-[state=open]:slide-in-from-bottom-2 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95`}
        >
          <div
            className={`sticky top-0 z-10 bg-surface/95 border-b border-[var(--border)] px-4 sm:px-5 flex justify-between gap-3 ${
              headerContent ? 'items-end pt-2 pb-0' : 'items-center py-3.5 sm:py-4'
            }`}
          >
            {headerContent ? (
              <>
                <Dialog.Title className="sr-only">{title}</Dialog.Title>
                {headerContent}
              </>
            ) : (
              <Dialog.Title className="text-lg font-display font-semibold text-[var(--text-1)]">
                {title}
              </Dialog.Title>
            )}
            <button
              type="button"
              onClick={handleCloseRequest}
              className={`min-h-11 min-w-11 p-2 rounded-lg text-[var(--text-4)] hover:bg-surface-2 hover:text-[var(--text-2)] border border-transparent hover:border-[var(--border)] ${
                headerContent ? 'mb-1.5 shrink-0' : ''
              }`}
              aria-label="Close form prompt"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 sm:p-5 pb-[calc(1rem+var(--safe-bottom)+var(--keyboard-offset,0px))]">
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>

      {showCloseConfirm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/45" />
          <div className="relative bg-surface rounded-2xl border border-[var(--border)] shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
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
                Discard &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Dialog.Root>
  );
}
