// axiosInstance.js
import axios from 'axios';
import { toast } from 'react-toastify';

// Create the axios instance with the base URL from your environment variables
const axiosInstance = axios.create({
  baseURL: process.env.api_url, // ensure you have this variable set correctly in your environment
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach the token from localStorage on every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to check for 403 and redirect to login if needed
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 403) {
      toast.error('Your token has expired. Please login to continue');
      // Clear the token
      localStorage.removeItem('token');
      // Redirect to login (adjust the URL if needed)
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
