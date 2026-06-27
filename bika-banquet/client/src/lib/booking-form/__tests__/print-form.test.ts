import { describe, expect, it, vi } from 'vitest';
import { prepareBookingFormPrint } from '../print-form';

describe('prepareBookingFormPrint', () => {
  it('switches to the booking form tab before printing from payments', () => {
    const setActiveTab = vi.fn();
    const print = vi.fn();
    const defer = vi.fn((callback: () => void) => callback());

    prepareBookingFormPrint('payments', setActiveTab, print, defer);

    expect(setActiveTab).toHaveBeenCalledWith('details');
    expect(defer).toHaveBeenCalledOnce();
    expect(print).toHaveBeenCalledOnce();
  });

  it('prints immediately when the booking form tab is already active', () => {
    const setActiveTab = vi.fn();
    const print = vi.fn();
    const defer = vi.fn((callback: () => void) => callback());

    prepareBookingFormPrint('details', setActiveTab, print, defer);

    expect(setActiveTab).not.toHaveBeenCalled();
    expect(defer).not.toHaveBeenCalled();
    expect(print).toHaveBeenCalledOnce();
  });
});
