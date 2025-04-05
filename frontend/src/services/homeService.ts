import { apiService } from './api';
import { API_ROUTES } from '../config';
import { ApiResponse, Announcement, Area } from '../types';

/**
 * Tipo para la respuesta del endpoint de convocatoria actual
 */
export interface ConvocatoriaActualResponse {
  convocatoria: any; // La convocatoria con sus áreas y niveles
  estadisticas: {
    total_inscritos: number;
    areas_participantes: number;
    dias_restantes: number;
  };
}

/**
 * Servicio para la página home
 */
export const homeService = {
  /**
   * Obtiene la convocatoria actual con todas sus áreas y estadísticas
   */
  async getConvocatoriaActual(): Promise<ApiResponse<ConvocatoriaActualResponse>> {
    try {
      return await apiService.get<ConvocatoriaActualResponse>(API_ROUTES.HOME.CONVOCATORIA_ACTUAL);
    } catch (error) {
      console.error('Error obteniendo convocatoria actual:', error);
      throw error;
    }
  },

  /**
   * Mapea la convocatoria del backend al formato esperado por el frontend
   */
  mapConvocatoriaFromBackend(data: any): {
    convocatoria: Announcement;
    areas: Area[];
    estadisticas: any;
  } {
    // Mapear la convocatoria
    const convocatoria: Announcement = {
      id: data.convocatoria.id_convocatoria.toString(),
      name: data.convocatoria.nombre,
      registrationStartDate: data.convocatoria.fecha_inicio_inscripcion,
      registrationEndDate: data.convocatoria.fecha_fin_inscripcion,
      maxAreasPerStudent: data.convocatoria.max_areas_por_estudiante,
      status: this.mapStatusFromBackend(data.convocatoria.estado),
      createdAt: data.convocatoria.created_at,
      updatedAt: data.convocatoria.updated_at
    };

    // Mapear las áreas
    const areas: Area[] = data.convocatoria.areas.map((area: any) => ({
      id: area.id_area.toString(),
      name: area.area?.nombre_area || '',
      description: '',
      cost: parseFloat(area.costo_inscripcion || '0')
    }));

    return {
      convocatoria,
      areas,
      estadisticas: data.estadisticas
    };
  },

  /**
   * Mapea el estado de convocatoria del backend al formato del frontend
   */
  mapStatusFromBackend(estado?: string): 'planned' | 'open' | 'closed' | 'finished' {
    switch (estado) {
      case 'planificada': return 'planned';
      case 'abierta': return 'open';
      case 'cerrada': return 'closed';
      case 'finalizada': return 'finished';
      default: return 'planned';
    }
  }
};
