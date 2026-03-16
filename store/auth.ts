import { create } from "zustand";
import { setCookie, deleteCookie, getCookie } from "cookies-next";
import api from "../lib/api";

interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  isActive: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshTimer: NodeJS.Timeout | null;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  setUser: (user: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
  refreshToken: () => Promise<void>;
  scheduleRefresh: (token: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  refreshTimer: null,
  scheduleRefresh: (token: string) => {
    const existingTimer = get().refreshTimer;
    if (existingTimer) clearTimeout(existingTimer);

    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join(""),
      );
      const payload = JSON.parse(jsonPayload);

      if (!payload.exp) return;

      const expiresAt = payload.exp * 1000;
      // Refresh 1 minute before expiry
      const timeout = expiresAt - Date.now() - 60 * 1000;

      if (timeout > 0) {
        const timer = setTimeout(() => {
          get().refreshToken();
        }, timeout);
        set({ refreshTimer: timer });
      } else {
        // If already expired or close to expiring, refresh immediately
        // But add a small delay to avoid race conditions on immediate load
        setTimeout(() => get().refreshToken(), 1000);
      }
    } catch (e) {
      console.error("Failed to schedule refresh", e);
    }
  },
  login: (accessToken: string, refreshToken: string, user: User) => {
    setCookie("token", accessToken, { maxAge: 60 * 15 }); // 15 minutes for access token
    setCookie("refresh_token", refreshToken, { maxAge: 60 * 60 * 24 * 7 }); // 7 days for refresh token
    localStorage.setItem("user", JSON.stringify(user));
    set({ user, isAuthenticated: true });
    get().scheduleRefresh(accessToken);
  },
  setUser: (user: User) => {
    localStorage.setItem("user", JSON.stringify(user));
    set({ user });
  },
  logout: () => {
    const timer = get().refreshTimer;
    if (timer) clearTimeout(timer);
    deleteCookie("token");
    deleteCookie("refresh_token");
    localStorage.removeItem("user");
    set({ user: null, isAuthenticated: false, refreshTimer: null });
    window.location.href = "/login";
  },
  checkAuth: async () => {
    const token = getCookie("token");
    const refreshToken = getCookie("refresh_token");
    const savedUser = localStorage.getItem("user");

    if (token) {
      try {
        if (savedUser) {
          set({
            user: JSON.parse(savedUser),
            isAuthenticated: true,
            isLoading: false,
          });
        }
        const response = await api.get("/auth/profile");
        get().setUser(response.data);
        set({ isAuthenticated: true, isLoading: false });
        // Schedule next refresh
        get().scheduleRefresh(token as string);
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
    const refreshToken = getCookie("refresh_token");
    if (!refreshToken) {
      get().logout();
      return;
    }

    try {
      const response = await api.post("/auth/refresh", {
        refresh_token: refreshToken,
      });
      const { access_token, refresh_token: newRefreshToken } = response.data;

      setCookie("token", access_token, { maxAge: 60 * 15 });
      setCookie("refresh_token", newRefreshToken, {
        maxAge: 60 * 60 * 24 * 7,
      });

      // Retry profile fetch
      const profileResponse = await api.get("/auth/profile");
      get().setUser(profileResponse.data);
      set({
        isAuthenticated: true,
        isLoading: false,
      });
      // Schedule next refresh
      get().scheduleRefresh(access_token);
    } catch (error) {
      get().logout();
    }
  },
}));
