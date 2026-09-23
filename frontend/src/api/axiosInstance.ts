import axios from 'axios';

export const TOKEN_KEY = 'admin_token';

const axiosInstance = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  // Sin Content-Type fijo: axios usa JSON para objetos y multipart para FormData
  headers: {
    'Accept': 'application/json',
  },
});

// Adjunta el token del administrador, si existe, a todas las peticiones
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si la sesión del administrador expira, se limpia el token y se vuelve al login
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const sentToken = Boolean(error.config?.headers?.Authorization);
    const isLogin = error.config?.url?.includes('/admin/login');

    if (error.response?.status === 401 && sentToken && !isLogin) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = '/admin/login';
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
