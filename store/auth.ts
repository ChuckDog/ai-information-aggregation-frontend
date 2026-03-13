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
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: (accessToken: string, refreshToken: string, user: User) => {
    setCookie('token', accessToken, { maxAge: 60 * 15 }); // 15 minutes for access token
    setCookie('refresh_token', refreshToken, { maxAge: 60 * 60 * 24 * 7 }); // 7 days for refresh token
    set({ user, isAuthenticated: true });
  },
  logout: () => {
    deleteCookie('token');
    deleteCookie('refresh_token');
    set({ user: null, isAuthenticated: false });
    window.location.href = '/login';
  },
  checkAuth: async () => {
    const token = getCookie('token');
    const refreshToken = getCookie('refresh_token');

    if (token) {
      try {
        const response = await api.get('/auth/profile');
        set({ user: response.data, isAuthenticated: true, isLoading: false });
      } catch (error) {
        // If profile fetch fails (e.g., token expired), try refresh
        if (refreshToken) {
          await get().refreshToken();
        } else {
          get().logout();
        }
      }
    } else if (refreshToken) {
      // No access token but has refresh token, try refresh
      await get().refreshToken();
    } else {
      set({ isLoading: false });
    }
  },
  refreshToken: async () => {
    const refreshToken = getCookie('refresh_token');
    if (!refreshToken) {
      get().logout();
      return;
    }

    try {
      const response = await api.post('/auth/refresh', {
        refresh_token: refreshToken,
      });
      const { access_token, refresh_token: newRefreshToken } = response.data;
      
      setCookie('token', access_token, { maxAge: 60 * 15 });
      setCookie('refresh_token', newRefreshToken, { maxAge: 60 * 60 * 24 * 7 });
      
      // Retry profile fetch
      const profileResponse = await api.get('/auth/profile');
      set({ user: profileResponse.data, isAuthenticated: true, isLoading: false });
    } catch (error) {
      get().logout();
    }
  },
}));
