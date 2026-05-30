import { describe, expect, it } from 'vitest';
import {
  shouldRedirectToLogin,
  shouldShowSessionVerificationFailure,
} from '@/lib/authRedirect';

describe('auth session hydration redirect guard', () => {
  it('does not redirect before loadUser completes', () => {
    expect(shouldRedirectToLogin(false, false, true)).toBe(false);
  });

  it('does not redirect while token exists but profile is still loading', () => {
    expect(shouldRedirectToLogin(false, true, true)).toBe(false);
  });

  it('redirects when hydration finished and there is no token', () => {
    expect(shouldRedirectToLogin(false, true, false)).toBe(true);
  });

  it('does not redirect authenticated users', () => {
    expect(shouldRedirectToLogin(true, true, true)).toBe(false);
  });
});

describe('auth session verification failure state', () => {
  it('does not show token recovery UI before hydration completes', () => {
    expect(shouldShowSessionVerificationFailure(false, false, true)).toBe(false);
  });

  it('shows token recovery UI after hydration fails with a stored token', () => {
    expect(shouldShowSessionVerificationFailure(false, true, true)).toBe(true);
  });
});
