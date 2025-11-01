import { create } from 'zustand';
import { authApi } from './api';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    const token = res.data.access_token as string;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
    set({ token, isAuthenticated: true });
    // Fetch user profile
    const me = await authApi.me();
    set({ user: me.data });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      let token: string | null = null;
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('token');
      }
      if (!token) {
        set({ isAuthenticated: false, isLoading: false });
        return;
      }
      const me = await authApi.me();
      set({ user: me.data, token, isAuthenticated: true, isLoading: false });
    } catch {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

export {};
// placeholder
