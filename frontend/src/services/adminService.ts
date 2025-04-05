import { apiService } from './api';
import { API_ROUTES } from '../config';
import { ApiResponse } from '../types';

/**
 * Interfaces para las respuestas del dashboard administrativo
 */
export interface DashboardDataResponse {
  estadisticas: {
    total_estudiantes: number;
    total_inscripciones: number;
    ingresos_pendientes: number;
    ingresos_pagados: number;
  };
  convocatorias_activas: any[];
  inscripciones_por_area: any[];
  inscripciones_por_mes: any[];
  catalogos: {
    areas: any[];
    grados: any[];
    niveles: any[];
  };
}

/**
 * Interfaz para los datos de creación de convocatoria completa
 */
export interface ConvocatoriaCompletaForm {
  nombre: string;
  fecha_inicio_inscripcion: string;
  fecha_fin_inscripcion: string;
  max_areas_por_estudiante: number;
  estado: string;
  areas: Array<{
    id_area: number;
    costo_inscripcion: number;
  }>;
  niveles: Array<{
    id_nivel: number;
  }>;
}

/**
 * Servicio para la página de administración
 */
export const adminService = {
  /**
   * Obtiene todos los datos para el dashboard administrativo
   */
  async getDashboardData(): Promise<ApiResponse<DashboardDataResponse>> {
    try {
      console.log("Calling dashboard data endpoint...");
      const response = await apiService.get<DashboardDataResponse>(API_ROUTES.ADMIN.DASHBOARD_DATA);
      console.log("Dashboard data response received:", response);
      return response;
    } catch (error) {
      console.error('Error obteniendo datos del dashboard:', error);
      
      // Intentar obtener los catálogos directamente desde los endpoints CRUD
      try {
        console.log("Attempting to fetch data from CRUD endpoints...");
        
        const areasPromise = apiService.get(API_ROUTES.AREAS);
        const gradosPromise = apiService.get(API_ROUTES.GRADOS);
        const nivelesPromise = apiService.get(API_ROUTES.NIVELES);
        
        const [areasResponse, gradosResponse, nivelesResponse] = await Promise.all([
          areasPromise,
          gradosPromise,
          nivelesPromise
        ]);
        
        const mockResponse: ApiResponse<DashboardDataResponse> = {
          status: 'success',
          data: {
            estadisticas: {
              total_estudiantes: 0,
              total_inscripciones: 0,
              ingresos_pendientes: 0,
              ingresos_pagados: 0
            },
            convocatorias_activas: [],
            inscripciones_por_area: [],
            inscripciones_por_mes: [],
            catalogos: {
              areas: areasResponse.data || [],
              grados: gradosResponse.data || [],
              niveles: nivelesResponse.data || []
            }
          },
          message: "Datos obtenidos de endpoints CRUD"
        };
        
        console.log("Mock response from CRUD endpoints:", mockResponse);
        return mockResponse;
      } catch (crudError) {
        console.error('Error obteniendo datos de endpoints CRUD:', crudError);
        throw error; // Lanzar el error original
      }
    }
  },

  /**
   * Crea una convocatoria completa con sus áreas y niveles
   */
  async crearConvocatoriaCompleta(formData: ConvocatoriaCompletaForm): Promise<ApiResponse<any>> {
    try {
      console.log("Sending data to create convocatoria:", formData);
      const response = await apiService.post(API_ROUTES.ADMIN.CONVOCATORIA_COMPLETA, formData);
      console.log("Create convocatoria response:", response);
      return response;
    } catch (error) {
      console.error('Error creando convocatoria completa:', error);
      throw error;
    }
  },

  /**
   * Obtiene una convocatoria específica con todos sus datos relacionados
   */
  async getConvocatoriaCompleta(id: string): Promise<ApiResponse<any>> {
    try {
      return await apiService.get(`${API_ROUTES.ADMIN.CONVOCATORIA_DETALLE}/${id}/completa`);
    } catch (error) {
      console.error(`Error obteniendo convocatoria completa ${id}:`, error);
      throw error;
    }
  }
};
