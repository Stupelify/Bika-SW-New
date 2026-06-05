import { describe, expect, it } from 'vitest';
import { statusToken } from '../statusToken';

describe('statusToken', () => {
  it('maps a known status to label + className', () => {
    expect(statusToken('confirmed')).toEqual({
      key: 'confirmed',
      label: 'Confirmed',
      className: 'status-confirmed',
    });
  });

  it('is case-insensitive and trims whitespace', () => {
    expect(statusToken('  PENCIL ').key).toBe('pencil');
    expect(statusToken('Quotation').label).toBe('Quotation');
  });

  it('falls back to pending for unknown or empty input', () => {
    expect(statusToken('').key).toBe('pending');
    expect(statusToken('banana').key).toBe('pending');
    // @ts-expect-error runtime guard for null
    expect(statusToken(null).key).toBe('pending');
  });
});
