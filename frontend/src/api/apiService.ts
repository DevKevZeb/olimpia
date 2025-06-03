import axios, { AxiosInstance, AxiosResponse } from 'axios';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
}

class ApiService {
  private axiosInstance: AxiosInstance;  constructor() {
    this.axiosInstance = axios.create({
      baseURL: 'http://127.0.0.1:8000/api',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Interceptor para agregar token automáticamente
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('admin_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        console.log('API Request:', config.method?.toUpperCase(), config.url);
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );    // Interceptor para manejar respuestas
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log('API Response:', response.status, response.data);
        return response;
      },
      (error) => {
        console.error('API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url
        });

        // Solo redirigir automáticamente si es 401 Y NO es el endpoint de login
        if (error.response?.status === 401 && !error.config?.url?.includes('/admin/login')) {
          localStorage.removeItem('admin_token');
          window.location.href = '/admin/login';
        }

        return Promise.reject(error);
      }
    );
  }

  // Método para configurar el token manualmente
  setAuthToken(token: string | null): void {
    if (token) {
      this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.axiosInstance.defaults.headers.common['Authorization'];
    }
  }

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
      console.error('ApiService POST error:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
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
