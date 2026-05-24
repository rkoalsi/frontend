// axiosInstance.ts
import axios from 'axios';
import { toast } from 'react-toastify';

const axiosInstance = axios.create({
  baseURL: process.env.api_url,
  headers: { 'Content-Type': 'application/json' },
  // Issue 8: send the HttpOnly auth cookie on every request
  withCredentials: true,
});

// Request interceptor — keep Authorization header attachment as a fallback
// for environments where cookies are not set (e.g. mobile apps, Postman tests).
// In the browser the HttpOnly cookie takes precedence (see config/auth.py).
axiosInstance.interceptors.request.use(
  (config) => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle expired / invalid sessions
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const PUBLIC_PATHS = [
      '/login',
      '/forgot_password',
      '/reset_password',
      '/catalogues/all_products',
      '/orders/new/',   // prefix-match covers all /orders/new/[id] variants
    ];
    const currentPath =
      typeof window !== 'undefined' ? window.location.pathname : '';
    const alreadyOnLogin = PUBLIC_PATHS.some((p) => currentPath.startsWith(p));

    if ((status === 403 || status === 401) && !alreadyOnLogin) {
      toast.error('Your session has expired. Please log in again.');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
      // Ask the backend to clear the HttpOnly cookie too
      axios
        .post(
          `${process.env.api_url}/users/logout`,
          {},
          { withCredentials: true }
        )
        .catch(() => {/* best-effort */});
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
