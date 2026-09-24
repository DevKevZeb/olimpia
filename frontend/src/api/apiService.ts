import axios, { AxiosInstance } from 'axios';
import sharedAxios from './axiosInstance';

interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  errors?: unknown;
}

interface ApiError {
  success: false;
  message: string;
  errors?: unknown;
  status: number;
}

class ApiService {
  // Usa el cliente compartido: token y manejo de sesión viven en axiosInstance
  private axiosInstance: AxiosInstance = sharedAxios;

  // Métodos HTTP genéricos
  async get<T = unknown>(url: string, params?: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.get<ApiResponse<T>>(url, { params });
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }
  async post<T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    // Sin try/catch: se propaga el error original, no el transformado
    const response = await this.axiosInstance.post<ApiResponse<T>>(url, data);
    return response.data;
  }

  async put<T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.put<ApiResponse<T>>(url, data);
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  async delete<T = unknown>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.delete<ApiResponse<T>>(url);
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  // Método para manejar errores
  private handleError(error: unknown): ApiError {
    const axiosError = axios.isAxiosError<{ message?: string; errors?: unknown }>(error) ? error : undefined;
    if (axiosError?.response) {
      // Error de respuesta del servidor
      return {
        success: false,
        message: axiosError.response.data?.message || 'Error del servidor',
        errors: axiosError.response.data?.errors,
        status: axiosError.response.status,
      };
    } else if (axiosError?.request) {
      // Error de red
      return {
        success: false,
        message: 'Error de conexión con el servidor',
        status: 0,
      };
    } else {
      // Error de configuración
      return {
        success: false,
        message: 'Error interno de la aplicación',
        status: -1,
      };
    }
  }

  // Acceso directo a la instancia de axios para casos especiales
  get axios(): AxiosInstance {
    return this.axiosInstance;
  }
}

// Exportar instancia singleton
export const apiService = new ApiService();
export default apiService;
