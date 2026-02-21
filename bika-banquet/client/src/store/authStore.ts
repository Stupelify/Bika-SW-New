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
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,

  setToken: (token: string) => {
    localStorage.setItem('auth_token', token);
    set({ token, isAuthenticated: true });
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
        isLoading: false 
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
        isAuthenticated: false 
      });
    }
  },

  loadUser: async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      set({ isAuthenticated: false, isLoading: false });
      return;
    }

    set({ isLoading: true, token });
    try {
      const response = await api.getCurrentUser();
      set({ 
        user: response.data.data.user, 
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (error) {
      localStorage.removeItem('auth_token');
      set({ 
        user: null, 
        token: null, 
        isAuthenticated: false, 
        isLoading: false 
      });
    }
  },
}));
