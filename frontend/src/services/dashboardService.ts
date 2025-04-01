import { apiService } from './api';
import { API_ROUTES } from '../config';
import { ApiResponse } from '../types';

/**
 * Tipos para las estadísticas del dashboard
 */
interface DashboardStats {
  totalEstudiantes: number;
  totalInscripciones: number;
  totalPagos: number;
  totalOrdenesPendientes: number;
  inscripcionesPorArea: AreaStats[];
  inscripcionesPorNivel: LevelStats[];
  inscripcionesPorDepartamento: DepartmentStats[];
  pagosPorMes: MonthlyPaymentStats[];
}

interface AreaStats {
  areaId: string;
  nombreArea: string;
  totalInscripciones: number;
  porcentaje: number;
}

interface LevelStats {
  nivelId: string;
  nombreNivel: string;
  totalInscripciones: number;
  porcentaje: number;
}

interface DepartmentStats {
  departamento: string;
  totalInscripciones: number;
  porcentaje: number;
}

interface MonthlyPaymentStats {
  mes: string;
  montoTotal: number;
}

/**
 * Servicio para obtener datos estadísticos para el dashboard
 */
export const dashboardService = {
  /**
   * Obtener estadísticas generales
   */
  async getStats(convocatoriaId?: string): Promise<ApiResponse<DashboardStats>> {
    try {
      let url = API_ROUTES.DASHBOARD_STATS;
      
      if (convocatoriaId) {
        url += `?convocatoria_id=${convocatoriaId}`;
      }
      
      return await apiService.get(url);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  /**
   * Obtener estadísticas de inscripciones por área
   */
  async getAreaStats(convocatoriaId?: string): Promise<ApiResponse<AreaStats[]>> {
    try {
      let url = `${API_ROUTES.DASHBOARD_STATS}/areas`;
      
      if (convocatoriaId) {
        url += `?convocatoria_id=${convocatoriaId}`;
      }
      
      return await apiService.get(url);
    } catch (error) {
      console.error('Error fetching area stats:', error);
      throw error;
    }
  },

  /**
   * Obtener estadísticas de inscripciones por nivel
   */
  async getNivelStats(convocatoriaId?: string): Promise<ApiResponse<LevelStats[]>> {
    try {
      let url = `${API_ROUTES.DASHBOARD_STATS}/niveles`;
      
      if (convocatoriaId) {
        url += `?convocatoria_id=${convocatoriaId}`;
      }
      
      return await apiService.get(url);
    } catch (error) {
      console.error('Error fetching nivel stats:', error);
      throw error;
    }
  },

  /**
   * Obtener estadísticas de inscripciones por departamento
   */
  async getDepartamentoStats(convocatoriaId?: string): Promise<ApiResponse<DepartmentStats[]>> {
    try {
      let url = `${API_ROUTES.DASHBOARD_STATS}/departamentos`;
      
      if (convocatoriaId) {
        url += `?convocatoria_id=${convocatoriaId}`;
      }
      
      return await apiService.get(url);
    } catch (error) {
      console.error('Error fetching departamento stats:', error);
      throw error;
    }
  },

  /**
   * Obtener estadísticas de pagos por mes
   */
  async getPagosPorMes(convocatoriaId?: string, year?: number): Promise<ApiResponse<MonthlyPaymentStats[]>> {
    try {
      let url = `${API_ROUTES.DASHBOARD_STATS}/pagos-mensuales`;
      const params: string[] = [];
      
      if (convocatoriaId) {
        params.push(`convocatoria_id=${convocatoriaId}`);
      }
      
      if (year) {
        params.push(`year=${year}`);
      }
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      
      return await apiService.get(url);
    } catch (error) {
      console.error('Error fetching pagos mensuales stats:', error);
      throw error;
    }
  },

  /**
   * Mapear los datos del backend al formato del frontend
   */
  mapStatsFromBackend(backendStats: any): DashboardStats {
    return {
      totalEstudiantes: backendStats.total_estudiantes || 0,
      totalInscripciones: backendStats.total_inscripciones || 0,
      totalPagos: backendStats.total_pagos || 0,
      totalOrdenesPendientes: backendStats.total_ordenes_pendientes || 0,
      inscripcionesPorArea: (backendStats.inscripciones_por_area || []).map((item: any) => ({
        areaId: item.id_area?.toString(),
        nombreArea: item.nombre_area,
        totalInscripciones: item.total_inscripciones,
        porcentaje: item.porcentaje
      })),
      inscripcionesPorNivel: (backendStats.inscripciones_por_nivel || []).map((item: any) => ({
        nivelId: item.id_nivel?.toString(),
        nombreNivel: item.nombre_nivel,
        totalInscripciones: item.total_inscripciones,
        porcentaje: item.porcentaje
      })),
      inscripcionesPorDepartamento: (backendStats.inscripciones_por_departamento || []).map((item: any) => ({
        departamento: item.departamento,
        totalInscripciones: item.total_inscripciones,
        porcentaje: item.porcentaje
      })),
      pagosPorMes: (backendStats.pagos_por_mes || []).map((item: any) => ({
        mes: item.mes,
        montoTotal: item.monto_total
      }))
    };
  }
};

// Exportar los tipos para que puedan ser utilizados en componentes
export type { 
  DashboardStats, 
  AreaStats, 
  LevelStats, 
  DepartmentStats,
  MonthlyPaymentStats 
};
