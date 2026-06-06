import { create } from 'zustand';
import axios from 'axios';
import { api } from '@/lib/api';
import { setAuthHydrationComplete } from '@/lib/authSession';

interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
  deniedPermissions?: string[];
  banquetIds?: string[];
  hasAllVenueAccess?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  /** True while login() is in flight — drives the Sign In button only */
  isLoading: boolean;
  /** False until the first loadUser() finishes (token restore on refresh) */
  isAuthReady: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  setToken: (token: string) => void;
}

export function getStoredAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

let loadUserInFlight: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthReady: false,
  isAuthenticated: false,

  setToken: (token: string) => {
    localStorage.setItem('auth_token', token);
    setAuthHydrationComplete(true);
    set({ token, isAuthenticated: true, isAuthReady: true });
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await api.login(email, password);
      const { token, user } = response.data.data;

      localStorage.setItem('auth_token', token);
      setAuthHydrationComplete(true);
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        isAuthReady: true,
      });
    } catch (error: unknown) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      setAuthHydrationComplete(true);
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isAuthReady: true,
      });
    }
  },

  loadUser: async () => {
    if (loadUserInFlight) {
      await loadUserInFlight;
      return;
    }

    loadUserInFlight = (async () => {
      const token = getStoredAuthToken();
      if (!token) {
        setAuthHydrationComplete(true);
        set({ isAuthenticated: false, isLoading: false, isAuthReady: true, token: null });
        return;
      }

      setAuthHydrationComplete(false);
      // Never set isLoading here — that flag is only for login() (Sign In button).
      set({
        isAuthReady: false,
        token,
      });

      try {
        const response = await api.getCurrentUser();
        setAuthHydrationComplete(true);
        set({
          user: response.data.data.user,
          isAuthenticated: true,
          isLoading: false,
          isAuthReady: true,
        });
      } catch (error: unknown) {
        const isUnauthorized =
          axios.isAxiosError(error) && error.response?.status === 401;

        setAuthHydrationComplete(true);
        if (isUnauthorized) {
          localStorage.removeItem('auth_token');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            isAuthReady: true,
          });
        } else {
          set({
            isAuthenticated: false,
            isLoading: false,
            isAuthReady: true,
          });
        }
      }
    })();

    try {
      await loadUserInFlight;
    } finally {
      loadUserInFlight = null;
    }
  },
}));
