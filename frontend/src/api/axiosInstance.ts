import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://corvus.tis.cs.umss.edu.bo/api', // Asegúrate de que esta URL sea correcta
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
    if (error.response) {
      // La solicitud se hizo y el servidor respondió con un código de estado
      // que cae fuera del rango 2xx
      console.error('Response error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers,
        url: error.config?.url
      });
    } else if (error.request) {
      // La solicitud se hizo pero no se recibió respuesta
      console.error('Request error (no response):', {
        request: error.request,
        url: error.config?.url,
        method: error.config?.method
      });
    } else {
      // Ocurrió un error al configurar la solicitud
      console.error('Error setting up request:', error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
