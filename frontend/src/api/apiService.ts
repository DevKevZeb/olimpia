import { AxiosInstance } from 'axios';
import sharedAxios from './axiosInstance';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
}

class ApiService {
  // Usa el cliente compartido: token y manejo de sesión viven en axiosInstance
  private axiosInstance: AxiosInstance = sharedAxios;

  // Métodos HTTP genéricos
  async get<T = any>(url: string, params?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.get(url, { params });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }
  async post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.post(url, data);
      return response.data;
    } catch (error: any) {
      throw error; // Lanzar el error original, no el transformado
    }
  }

  async put<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.put(url, data);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.delete(url);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Método para manejar errores
  private handleError(error: any): any {
    if (error.response) {
      // Error de respuesta del servidor
      return {
        success: false,
        message: error.response.data?.message || 'Error del servidor',
        errors: error.response.data?.errors,
        status: error.response.status,
      };
    } else if (error.request) {
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
