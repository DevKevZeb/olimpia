import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api', // Asegúrate de que esta URL sea correcta
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor para depuración
axiosInstance.interceptors.request.use(
  (config) => {
    console.log('Request:', config.method, config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    console.log('Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('Response error:', error.response || error);
    return Promise.reject(error);
  }
);

export default axiosInstance;
