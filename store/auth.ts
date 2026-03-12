import { create } from 'zustand';
import { setCookie, deleteCookie, getCookie } from 'cookies-next';
import api from '../lib/api';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: (token: string, user: User) => {
    setCookie('token', token, { maxAge: 60 * 60 * 24 * 30 }); // 30 days
    set({ user, isAuthenticated: true });
  },
  logout: () => {
    deleteCookie('token');
    set({ user: null, isAuthenticated: false });
    window.location.href = '/login';
  },
  checkAuth: async () => {
    const token = getCookie('token');
    if (token) {
      try {
        const response = await api.get('/auth/profile');
        set({ user: response.data, isAuthenticated: true, isLoading: false });
      } catch (error) {
        deleteCookie('token');
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },
}));
