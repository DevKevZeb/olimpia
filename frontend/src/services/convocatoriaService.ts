import { apiService } from './api';
import { API_ROUTES } from '../config';
import { 
  Announcement, 
  AnnouncementArea, 
  AnnouncementLevel, 
  ApiResponse 
} from '../types';

// Convocatorias
export const convocatoriaService = {
  // Obtener todas las convocatorias
  async getConvocatorias(): Promise<ApiResponse<Announcement[]>> {
    try {
      return await apiService.get<Announcement[]>(API_ROUTES.CONVOCATORIAS);
    } catch (error) {
      console.error("Error fetching convocatorias:", error);
      throw error;
    }
  },

  // Obtener una convocatoria específica
  async getConvocatoria(id: string): Promise<ApiResponse<Announcement>> {
    try {
      return await apiService.get<Announcement>(`${API_ROUTES.CONVOCATORIAS}/${id}`);
    } catch (error) {
      console.error(`Error fetching convocatoria ${id}:`, error);
      throw error;
    }
  },

  // Obtener la convocatoria vigente/actual
  async getConvocatoriaActual(): Promise<ApiResponse<Announcement>> {
    try {
      const convocatorias = await this.getConvocatorias();
      const convocatoriaActual = convocatorias.data.find(c => c.status === 'open');
      
      if (!convocatoriaActual) {
        throw new Error("No hay convocatorias abiertas actualmente");
      }
      
      return { 
        status: 'success', 
        data: convocatoriaActual, 
        message: "Convocatoria actual obtenida correctamente" 
      };
    } catch (error) {
      console.error("Error fetching convocatoria actual:", error);
      throw error;
    }
  },

  // Crear una convocatoria
  async createConvocatoria(convocatoria: Partial<Announcement>): Promise<ApiResponse<Announcement>> {
    try {
      return await apiService.post<Announcement>(API_ROUTES.CONVOCATORIAS, {
        nombre: convocatoria.name,
        fecha_inicio_inscripcion: convocatoria.registrationStartDate,
        fecha_fin_inscripcion: convocatoria.registrationEndDate,
        max_areas_por_estudiante: convocatoria.maxAreasPerStudent,
        estado: this.mapStatusToBackend(convocatoria.status)
      });
    } catch (error) {
      console.error("Error creating convocatoria:", error);
      throw error;
    }
  },

  // Actualizar una convocatoria
  async updateConvocatoria(id: string, convocatoria: Partial<Announcement>): Promise<ApiResponse<Announcement>> {
    try {
      const updateData: any = {};
      
      if (convocatoria.name) updateData.nombre = convocatoria.name;
      if (convocatoria.registrationStartDate) updateData.fecha_inicio_inscripcion = convocatoria.registrationStartDate;
      if (convocatoria.registrationEndDate) updateData.fecha_fin_inscripcion = convocatoria.registrationEndDate;
      if (convocatoria.maxAreasPerStudent) updateData.max_areas_por_estudiante = convocatoria.maxAreasPerStudent;
      if (convocatoria.status) updateData.estado = this.mapStatusToBackend(convocatoria.status);
      
      return await apiService.put<Announcement>(`${API_ROUTES.CONVOCATORIAS}/${id}`, updateData);
    } catch (error) {
      console.error(`Error updating convocatoria ${id}:`, error);
      throw error;
    }
  },

  // Eliminar una convocatoria
  async deleteConvocatoria(id: string): Promise<ApiResponse<null>> {
    try {
      return await apiService.delete<null>(`${API_ROUTES.CONVOCATORIAS}/${id}`);
    } catch (error) {
      console.error(`Error deleting convocatoria ${id}:`, error);
      throw error;
    }
  },

  // Obtener áreas de una convocatoria
  async getConvocatoriaAreas(convocatoriaId: string): Promise<ApiResponse<AnnouncementArea[]>> {
    try {
      return await apiService.get<AnnouncementArea[]>(
        `${API_ROUTES.CONVOCATORIA_AREAS}?convocatoria_id=${convocatoriaId}`
      );
    } catch (error) {
      console.error(`Error fetching areas for convocatoria ${convocatoriaId}:`, error);
      throw error;
    }
  },

  // Agregar un área a una convocatoria
  async addAreaToConvocatoria(area: Partial<AnnouncementArea>): Promise<ApiResponse<AnnouncementArea>> {
    try {
      return await apiService.post<AnnouncementArea>(API_ROUTES.CONVOCATORIA_AREAS, {
        id_convocatoria: area.announcementId,
        id_area: area.areaId,
        costo_inscripcion: area.registrationCost
      });
    } catch (error) {
      console.error("Error adding area to convocatoria:", error);
      throw error;
    }
  },

  // Actualizar un área de convocatoria
  async updateConvocatoriaArea(id: string, area: Partial<AnnouncementArea>): Promise<ApiResponse<AnnouncementArea>> {
    try {
      return await apiService.put<AnnouncementArea>(`${API_ROUTES.CONVOCATORIA_AREAS}/${id}`, {
        costo_inscripcion: area.registrationCost
      });
    } catch (error) {
      console.error(`Error updating convocatoria area ${id}:`, error);
      throw error;
    }
  },

  // Eliminar un área de convocatoria
  async deleteConvocatoriaArea(id: string): Promise<ApiResponse<null>> {
    try {
      return await apiService.delete<null>(`${API_ROUTES.CONVOCATORIA_AREAS}/${id}`);
    } catch (error) {
      console.error(`Error deleting convocatoria area ${id}:`, error);
      throw error;
    }
  },

  // Obtener niveles de una convocatoria
  async getConvocatoriaNiveles(convocatoriaId: string): Promise<ApiResponse<AnnouncementLevel[]>> {
    try {
      return await apiService.get<AnnouncementLevel[]>(
        `${API_ROUTES.CONVOCATORIA_NIVELES}?convocatoria_id=${convocatoriaId}`
      );
    } catch (error) {
      console.error(`Error fetching niveles for convocatoria ${convocatoriaId}:`, error);
      throw error;
    }
  },

  // Agregar un nivel a una convocatoria
  async addNivelToConvocatoria(nivel: Partial<AnnouncementLevel>): Promise<ApiResponse<AnnouncementLevel>> {
    try {
      return await apiService.post<AnnouncementLevel>(API_ROUTES.CONVOCATORIA_NIVELES, {
        id_convocatoria: nivel.announcementId,
        id_nivel: nivel.levelId
      });
    } catch (error) {
      console.error("Error adding nivel to convocatoria:", error);
      throw error;
    }
  },

  // Eliminar un nivel de convocatoria
  async deleteConvocatoriaNivel(id: string): Promise<ApiResponse<null>> {
    try {
      return await apiService.delete<null>(`${API_ROUTES.CONVOCATORIA_NIVELES}/${id}`);
    } catch (error) {
      console.error(`Error deleting convocatoria nivel ${id}:`, error);
      throw error;
    }
  },

  // Mapear estado a formato del backend
  mapStatusToBackend(status?: 'planned' | 'open' | 'closed' | 'finished'): string {
    switch (status) {
      case 'planned': return 'planificada';
      case 'open': return 'abierta';
      case 'closed': return 'cerrada';
      case 'finished': return 'finalizada';
      default: return 'planificada';
    }
  },

  // Mapear estado del backend al frontend
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
