import axios from 'axios';
import config from '../config';

// Crear y exportar la instancia base de axios
const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Interceptor para añadir token de autenticación cuando esté disponible
api.interceptors.request.use(config => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
