import { apiService } from './api';
import { API_ROUTES } from '../config';
import { 
  RegistrationList, 
  RegistrationListDetail, 
  ApiResponse, 
  PaginationResponse 
} from '../types';

/**
 * Servicio para gestionar listas de inscripción
 */
export const listaInscripcionService = {
  /**
   * Obtener todas las listas de inscripción con paginación
   */
  async getListas(page = 1, unidadEducativaId?: string): Promise<ApiResponse<PaginationResponse<RegistrationList>>> {
    try {
      let url = `${API_ROUTES.LISTAS_INSCRIPCION}?page=${page}`;
      
      if (unidadEducativaId) {
        url += `&unidad_educativa_id=${unidadEducativaId}`;
      }
      
      return await apiService.get(url);
    } catch (error) {
      console.error("Error fetching listas de inscripción:", error);
      throw error;
    }
  },

  /**
   * Obtener una lista de inscripción específica por su ID
   */
  async getLista(id: string): Promise<ApiResponse<RegistrationList>> {
    try {
      return await apiService.get(`${API_ROUTES.LISTAS_INSCRIPCION}/${id}`);
    } catch (error) {
      console.error(`Error fetching lista de inscripción ${id}:`, error);
      throw error;
    }
  },

  /**
   * Crear una nueva lista de inscripción
   */
  async createLista(unidadEducativaId: string, detalles: Partial<RegistrationListDetail>[]): Promise<ApiResponse<RegistrationList>> {
    try {
      const formattedDetalles = detalles.map(detalle => ({
        id_estudiante: detalle.studentId,
        id_convocatoria_area: detalle.announcementAreaId,
        id_convocatoria_nivel: detalle.announcementLevelId,
        id_tutor_academico: detalle.academicTutorId || null
      }));

      return await apiService.post(API_ROUTES.LISTAS_INSCRIPCION, {
        id_unidad_educativa: unidadEducativaId,
        detalles: formattedDetalles
      });
    } catch (error) {
      console.error("Error creating lista de inscripción:", error);
      throw error;
    }
  },

  /**
   * Actualizar una lista de inscripción existente (solo unidad educativa)
   */
  async updateLista(id: string, unidadEducativaId: string): Promise<ApiResponse<RegistrationList>> {
    try {
      return await apiService.put(`${API_ROUTES.LISTAS_INSCRIPCION}/${id}`, {
        id_unidad_educativa: unidadEducativaId
      });
    } catch (error) {
      console.error(`Error updating lista de inscripción ${id}:`, error);
      throw error;
    }
  },

  /**
   * Eliminar una lista de inscripción
   */
  async deleteLista(id: string): Promise<ApiResponse<null>> {
    try {
      return await apiService.delete(`${API_ROUTES.LISTAS_INSCRIPCION}/${id}`);
    } catch (error) {
      console.error(`Error deleting lista de inscripción ${id}:`, error);
      throw error;
    }
  },

  /**
   * Agregar un detalle a una lista de inscripción
   */
  async addDetalle(listaId: string, detalle: Partial<RegistrationListDetail>): Promise<ApiResponse<RegistrationListDetail>> {
    try {
      return await apiService.post(`${API_ROUTES.LISTAS_INSCRIPCION}/${listaId}/detalles`, {
        id_estudiante: detalle.studentId,
        id_convocatoria_area: detalle.announcementAreaId,
        id_convocatoria_nivel: detalle.announcementLevelId,
        id_tutor_academico: detalle.academicTutorId || null
      });
    } catch (error) {
      console.error(`Error adding detalle to lista ${listaId}:`, error);
      throw error;
    }
  },

  /**
   * Eliminar un detalle de una lista de inscripción
   */
  async removeDetalle(listaId: string, detalleId: string): Promise<ApiResponse<null>> {
    try {
      return await apiService.delete(`${API_ROUTES.LISTAS_INSCRIPCION}/${listaId}/detalles/${detalleId}`);
    } catch (error) {
      console.error(`Error removing detalle ${detalleId} from lista ${listaId}:`, error);
      throw error;
    }
  },

  /**
   * Mapear lista de inscripción del backend al formato del frontend
   */
  mapListaFromBackend(backendLista: any): RegistrationList {
    return {
      id: backendLista.id_lista.toString(),
      code: backendLista.codigo_lista,
      educationalUnitId: backendLista.id_unidad_educativa.toString(),
      creationDate: backendLista.fecha_creacion,
      educationalUnit: backendLista.unidad_educativa ? {
        id: backendLista.unidad_educativa.id_unidad_educativa.toString(),
        name: backendLista.unidad_educativa.nombre,
        department: backendLista.unidad_educativa.departamento,
        province: backendLista.unidad_educativa.provincia
      } : undefined,
      details: backendLista.detalles ? backendLista.detalles.map(this.mapDetalleFromBackend) : []
    };
  },

  /**
   * Mapear detalle de lista del backend al formato del frontend
   */
  mapDetalleFromBackend(backendDetalle: any): RegistrationListDetail {
    return {
      id: backendDetalle.id_detalle.toString(),
      listId: backendDetalle.id_lista.toString(),
      studentId: backendDetalle.id_estudiante.toString(),
      announcementAreaId: backendDetalle.id_convocatoria_area.toString(),
      announcementLevelId: backendDetalle.id_convocatoria_nivel.toString(),
      academicTutorId: backendDetalle.id_tutor_academico ? backendDetalle.id_tutor_academico.toString() : undefined,
      registrationDate: backendDetalle.fecha_registro,
      // Mapeo de relaciones si están disponibles
      student: backendDetalle.estudiante ? {
        name: `${backendDetalle.estudiante.nombre} ${backendDetalle.estudiante.apellido}`,
        ci: backendDetalle.estudiante.ci,
        email: backendDetalle.estudiante.email,
        // Otros campos del estudiante según sea necesario
      } : undefined,
      // Otros mapeos de relaciones según sea necesario
    };
  }
};
