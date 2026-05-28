import { create } from 'zustand';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
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
  loadUser: (options?: { silent?: boolean }) => Promise<void>;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthReady: false,
  isAuthenticated: false,

  setToken: (token: string) => {
    localStorage.setItem('auth_token', token);
    set({ token, isAuthenticated: true, isAuthReady: true });
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await api.login(email, password);
      const { token, user } = response.data.data;

      localStorage.setItem('auth_token', token);
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        isAuthReady: true,
      });
    } catch (error: any) {
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
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isAuthReady: true,
      });
    }
  },

  loadUser: async (options?: { silent?: boolean }) => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      set({ isAuthenticated: false, isLoading: false, isAuthReady: true });
      return;
    }

    if (!options?.silent) {
      set({ isLoading: true, token });
    } else {
      set({ token });
    }
    try {
      const response = await api.getCurrentUser();
      set({
        user: response.data.data.user,
        isAuthenticated: true,
        isLoading: false,
        isAuthReady: true,
      });
    } catch (error) {
      localStorage.removeItem('auth_token');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        isAuthReady: true,
      });
    }
  },
}));
