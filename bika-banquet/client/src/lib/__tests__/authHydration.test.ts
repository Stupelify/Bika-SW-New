import { describe, expect, it } from 'vitest';

/** Mirrors dashboard layout redirect guard */
export function shouldRedirectToLogin(
  isAuthenticated: boolean,
  isAuthReady: boolean
): boolean {
  return isAuthReady && !isAuthenticated;
}

describe('auth session hydration redirect guard', () => {
  it('does not redirect before loadUser completes', () => {
    expect(shouldRedirectToLogin(false, false)).toBe(false);
  });

  it('redirects when hydration finished and user is not authenticated', () => {
    expect(shouldRedirectToLogin(false, true)).toBe(true);
  });

  it('does not redirect authenticated users', () => {
    expect(shouldRedirectToLogin(true, true)).toBe(false);
  });
});
