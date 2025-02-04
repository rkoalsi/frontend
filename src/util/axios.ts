// axiosInstance.js
import axios from 'axios';

// Create the axios instance with the base URL from your environment variables
const axiosInstance = axios.create({
  baseURL: process.env.api_url, // ensure you have this variable set correctly in your environment
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the token from localStorage on every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
