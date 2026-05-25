import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';
export const TOKEN_KEY = 'lacebo_token';
export const USER_KEY = 'lacebo_user';
const REQUEST_TIMEOUT_MS = 10000;

const clearStoredSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getApiErrorMessage = (
  error,
  fallback = 'Something went wrong',
) => {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
};

const api = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT_MS,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      clearStoredSession();
    }
    return Promise.reject(err);
  },
);

export default api;
