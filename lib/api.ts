import axios from 'axios';
import { getCookie, deleteCookie } from 'cookies-next';

const baseURL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL, // Direct to backend
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getCookie('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Try to refresh token here if possible, but for now we focus on logout
      // The auth store handles complex refresh logic, but axios interceptor
      // needs a way to trigger it or just logout.
      
      // If we are already on login page, don't redirect loop
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          // Clear cookies to ensure clean state
          deleteCookie('token');
          deleteCookie('refresh_token');
          
          // Force redirect to login
          window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
