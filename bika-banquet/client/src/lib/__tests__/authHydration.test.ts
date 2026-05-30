import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const apiMocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  api: {
    getCurrentUser: apiMocks.getCurrentUser,
  },
}));

/** Mirrors dashboard layout redirect guard */
export function shouldRedirectToLogin(
  isAuthenticated: boolean,
  isAuthReady: boolean,
  hasStoredToken: boolean
): boolean {
  return isAuthReady && !isAuthenticated && !hasStoredToken;
}

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

function createLocalStorage(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear: vi.fn(() => values.clear()),
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    key: vi.fn((index: number) => Array.from(values.keys())[index] ?? null),
    removeItem: vi.fn((key: string) => {
      values.delete(key);
    }),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value);
    }),
  };
}

const restoredUser = {
  id: 'user-1',
  email: 'manager@example.com',
  name: 'Banquet Manager',
  roles: ['manager'],
  permissions: ['view_dashboard'],
};

describe('auth store session hydration', () => {
  beforeEach(() => {
    vi.resetModules();
    apiMocks.getCurrentUser.mockReset();

    const storage = createLocalStorage();
    vi.stubGlobal('localStorage', storage);
    vi.stubGlobal('window', { localStorage: storage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('deduplicates concurrent profile loads while keeping hydration pending', async () => {
    const { useAuthStore } = await import('@/store/authStore');
    const { isAuthHydrationComplete } = await import('@/lib/authSession');

    localStorage.setItem('auth_token', 'token-1');
    let resolveProfile!: (value: unknown) => void;
    apiMocks.getCurrentUser.mockReturnValue(
      new Promise((resolve) => {
        resolveProfile = resolve;
      })
    );

    const firstLoad = useAuthStore.getState().loadUser();
    const secondLoad = useAuthStore.getState().loadUser();

    expect(apiMocks.getCurrentUser).toHaveBeenCalledTimes(1);
    expect(isAuthHydrationComplete()).toBe(false);
    expect(useAuthStore.getState()).toMatchObject({
      token: 'token-1',
      isAuthReady: false,
      isLoading: true,
    });

    resolveProfile({ data: { data: { user: restoredUser } } });
    await Promise.all([firstLoad, secondLoad]);

    expect(apiMocks.getCurrentUser).toHaveBeenCalledTimes(1);
    expect(isAuthHydrationComplete()).toBe(true);
    expect(useAuthStore.getState()).toMatchObject({
      user: restoredUser,
      token: 'token-1',
      isAuthenticated: true,
      isAuthReady: true,
      isLoading: false,
    });
  });

  it('keeps the stored token when a transient profile load fails', async () => {
    const { useAuthStore } = await import('@/store/authStore');
    const { isAuthHydrationComplete } = await import('@/lib/authSession');

    localStorage.setItem('auth_token', 'token-1');
    apiMocks.getCurrentUser.mockRejectedValue(new Error('network unavailable'));

    await useAuthStore.getState().loadUser({ silent: true });

    expect(localStorage.getItem('auth_token')).toBe('token-1');
    expect(isAuthHydrationComplete()).toBe(true);
    expect(useAuthStore.getState()).toMatchObject({
      token: 'token-1',
      isAuthenticated: false,
      isAuthReady: true,
      isLoading: false,
    });
  });

  it('clears the stored token when the restored session is unauthorized', async () => {
    const { useAuthStore } = await import('@/store/authStore');

    localStorage.setItem('auth_token', 'expired-token');
    apiMocks.getCurrentUser.mockRejectedValue({
      isAxiosError: true,
      response: { status: 401 },
    });

    await useAuthStore.getState().loadUser();

    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(useAuthStore.getState()).toMatchObject({
      user: null,
      token: null,
      isAuthenticated: false,
      isAuthReady: true,
      isLoading: false,
    });
  });
});
