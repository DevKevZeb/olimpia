import axios, { AxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../config';
import { ApiResponse } from '../types';

// Crear instancia de axios con la URL base
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Habilitar el envío de cookies en solicitudes de origen cruzado
  withCredentials: true, 
});

// Interceptor para solicitudes
apiClient.interceptors.request.use(
  config => {
    // Si estás usando tokens de autenticación
    // const token = localStorage.getItem('authToken');
    // if (token) {
    //   config.headers['Authorization'] = `Bearer ${token}`;
    // }
    return config;
  },
  error => {
    console.error('Error en solicitud API:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Mensajes de error más específicos
    let message = 'Error desconocido';
    
    if (error.response) {
      // El servidor respondió con un código de error
      message = error.response.data?.message || 
               (error.response.status === 404 ? 'Recurso no encontrado' : 
               (error.response.status === 500 ? 'Error interno del servidor' : 
               (error.response.status === 401 ? 'No autorizado' :
               (error.response.status === 403 ? 'Acceso prohibido' :
               `Error del servidor (${error.response.status})`))));
               
      console.error('Error de respuesta del servidor:', {
        status: error.response.status,
        url: error.config.url,
        method: error.config.method,
        data: error.response.data
      });
    } else if (error.request) {
      // La solicitud se hizo pero no se recibió respuesta
      message = 'No se pudo conectar con el servidor. Verifica tu conexión a internet o la URL del backend.';
      console.error('Error de conexión:', {
        url: error.config.url,
        method: error.config.method
      });
    } else {
      // Algo ocurrió al preparar la solicitud
      message = error.message || 'Error al procesar la solicitud';
      console.error('Error al preparar solicitud:', error.message);
    }
    
    return Promise.reject({
      ...error,
      friendlyMessage: message
    });
  }
);

// Funciones genéricas para peticiones HTTP
export const apiService = {
  // GET request
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.get<ApiResponse<T>>(url, config);
      return response.data;
    } catch (error) {
      console.error(`Error en GET ${url}:`, error);
      throw error;
    }
  },

  // POST request
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.post<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      console.error(`Error en POST ${url}:`, error);
      throw error;
    }
  },

  // PUT request
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.put<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      console.error(`Error en PUT ${url}:`, error);
      throw error;
    }
  },

  // DELETE request
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.delete<ApiResponse<T>>(url, config);
      return response.data;
    } catch (error) {
      console.error(`Error en DELETE ${url}:`, error);
      throw error;
    }
  },
};

export default apiClient;
