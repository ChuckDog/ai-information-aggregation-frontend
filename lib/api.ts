import axios from 'axios';
import { getCookie } from 'cookies-next';

const api = axios.create({
  baseURL: 'http://localhost:3000', // Direct to backend
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
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login if unauthorized
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        // window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
