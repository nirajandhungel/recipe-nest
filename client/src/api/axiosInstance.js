import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../constants/apiEndpoints';
import { tokenStorage, refreshTokenStorage, clearAuth } from '../utils/tokenStorage';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach access token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = tokenStorage.get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Token refresh state ──────────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor — refresh on 401 before giving up
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error?.response?.status;

    // Only try refresh on 401, and only once per request
    if (status === 401 && !original._retry) {
      const refreshToken = refreshTokenStorage.get();

      // No refresh token stored — log out immediately
      if (!refreshToken) {
        clearAuth();
        if (!window.location.pathname.startsWith('/auth')) {
          toast.error('Session expired. Please log in again.');
          window.location.href = '/auth/login';
        }
        return Promise.reject(error);
      }

      // If a refresh is already in flight, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            original.headers.Authorization = `Bearer ${newToken}`;
            return axiosInstance(original);
          })
          .catch((err) => Promise.reject(err));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        // Use plain axios to avoid interceptor loop
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        const newAccessToken = data.data?.tokens?.accessToken;
        const newRefreshToken = data.data?.tokens?.refreshToken;

        tokenStorage.set(newAccessToken);
        if (newRefreshToken) refreshTokenStorage.set(newRefreshToken);

        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);

        original.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuth();
        if (!window.location.pathname.startsWith('/auth')) {
          toast.error('Session expired. Please log in again.');
          window.location.href = '/auth/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Other error handling
    const message = error?.response?.data?.message || 'Something went wrong';
    if (status === 403) {
      toast.error('Access denied.');
    } else if (status >= 500) {
      toast.error('Server error. Please try again later.');
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;