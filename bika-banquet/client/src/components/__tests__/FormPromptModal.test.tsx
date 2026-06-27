// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import FormPromptModal from '../FormPromptModal';

describe('FormPromptModal custom header', () => {
  let host: HTMLDivElement;
  let root: Root | null;

  beforeEach(() => {
    vi.useFakeTimers();
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    document.body.innerHTML = '';
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
    }
    root = null;
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  const renderModal = (onClose = vi.fn()) => {
    act(() => {
      root?.render(
        <FormPromptModal
          open
          title="Edit Booking"
          onClose={onClose}
          isDirty
          headerContent={
            <div role="tablist" aria-label="Booking form sections">
              <button type="button" role="tab" aria-selected="true">
                Booking Form
              </button>
            </div>
          }
        >
          <p>Booking modal body</p>
        </FormPromptModal>
      );
    });
    act(() => {
      vi.runOnlyPendingTimers();
    });
    return onClose;
  };

  it('retains an accessible dialog name when replacing the header title', () => {
    renderModal();

    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog?.getAttribute('aria-label')).toBe('Edit Booking');
    expect(document.querySelector('h2')).toBeNull();
    expect(document.querySelector('[role="tablist"]')?.textContent).toContain('Booking Form');
    expect(document.body.textContent).toContain('Booking modal body');
  });

  it('still guards dirty closes when custom header content is rendered', () => {
    const onClose = renderModal();
    const closeButton = document.querySelector(
      'button[aria-label="Close form prompt"]'
    ) as HTMLButtonElement | null;

    act(() => {
      closeButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onClose).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain('Unsaved Changes');

    const discardButton = Array.from(document.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Discard & Close')
    );
    act(() => {
      discardButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
