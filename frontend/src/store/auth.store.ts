import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  token: string | null;
  user: User | null;
  isRefreshing: boolean;
  setAuth: (token: string, user: User) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  setRefreshing: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isRefreshing: false,

      setAuth: (token, user) => set({ token, user }),

      setToken: (token) => set({ token }),

      logout: () => set({ token: null, user: null }),

      isAuthenticated: () => !!get().token && !!get().user,

      setRefreshing: (v) => set({ isRefreshing: v }),
    }),
    {
      name: 'clinic-auth',
      // Only persist user (not token — lives in memory only for XSS protection)
      partialize: (state) => ({ user: state.user }),
    }
  )
);
