import { apiService } from './api';
import { API_ROUTES } from '../config';
import { ApiResponse, PaginationResponse } from '../types';

/**
 * Servicio para gestionar estudiantes/competidores
 */
export const estudianteService = {
  /**
   * Obtener todos los estudiantes con paginación opcional
   */
  async getEstudiantes(page = 1): Promise<ApiResponse<PaginationResponse<any>>> {
    try {
      return await apiService.get(`${API_ROUTES.ESTUDIANTES}?page=${page}`);
    } catch (error) {
      console.error("Error fetching estudiantes:", error);
      throw error;
    }
  },

  /**
   * Obtener un estudiante específico por su ID
   */
  async getEstudiante(id: string): Promise<ApiResponse<any>> {
    try {
      return await apiService.get(`${API_ROUTES.ESTUDIANTES}/${id}`);
    } catch (error) {
      console.error(`Error fetching estudiante ${id}:`, error);
      throw error;
    }
  },

  /**
   * Buscar un estudiante por CI
   */
  async searchEstudianteByCi(ci: string): Promise<ApiResponse<any[]>> {
    try {
      return await apiService.get(`${API_ROUTES.ESTUDIANTES_SEARCH}?ci=${encodeURIComponent(ci)}`);
    } catch (error) {
      console.error(`Error searching estudiante with CI ${ci}:`, error);
      throw error;
    }
  },

  /**
   * Buscar estudiantes por nombre o apellido
   */
  async searchEstudiantes(query: string): Promise<ApiResponse<any[]>> {
    try {
      return await apiService.get(`${API_ROUTES.ESTUDIANTES_SEARCH}?q=${encodeURIComponent(query)}`);
    } catch (error) {
      console.error(`Error searching estudiantes with query '${query}':`, error);
      throw error;
    }
  },

  /**
   * Crear un nuevo estudiante
   */
  async createEstudiante(estudiante: {
    nombre: string;
    apellido: string;
    ci: string;
    fecha_nacimiento: string;
    email: string;
    colegio: string;
    id_grado: number | string;
    departamento: string;
    provincia: string;
  }): Promise<ApiResponse<any>> {
    try {
      return await apiService.post(API_ROUTES.ESTUDIANTES, estudiante);
    } catch (error) {
      console.error("Error creating estudiante:", error);
      throw error;
    }
  },

  /**
   * Actualizar un estudiante existente
   */
  async updateEstudiante(id: string, estudiante: Partial<{
    nombre: string;
    apellido: string;
    email: string;
    fecha_nacimiento: string;
    colegio: string;
    id_grado: number | string;
    departamento: string;
    provincia: string;
  }>): Promise<ApiResponse<any>> {
    try {
      return await apiService.put(`${API_ROUTES.ESTUDIANTES}/${id}`, estudiante);
    } catch (error) {
      console.error(`Error updating estudiante ${id}:`, error);
      throw error;
    }
  },

  /**
   * Eliminar un estudiante
   */
  async deleteEstudiante(id: string): Promise<ApiResponse<null>> {
    try {
      return await apiService.delete(`${API_ROUTES.ESTUDIANTES}/${id}`);
    } catch (error) {
      console.error(`Error deleting estudiante ${id}:`, error);
      throw error;
    }
  },

  /**
   * Mapear datos del backend al formato del frontend
   */
  mapFromBackend(backendEstudiante: any): any {
    return {
      id: backendEstudiante.id_estudiante.toString(),
      name: backendEstudiante.nombre,
      surname: backendEstudiante.apellido,
      ci: backendEstudiante.ci,
      birthDate: backendEstudiante.fecha_nacimiento,
      email: backendEstudiante.email,
      school: backendEstudiante.colegio,
      gradeId: backendEstudiante.id_grado.toString(),
      department: backendEstudiante.departamento,
      province: backendEstudiante.provincia,
      grade: backendEstudiante.grado ? {
        id: backendEstudiante.grado.id_grado.toString(),
        name: backendEstudiante.grado.nombre_grado
      } : undefined
    };
  },

  /**
   * Mapear varios estudiantes del backend al formato del frontend
   */
  mapManyFromBackend(estudiantes: any[]): any[] {
    return estudiantes.map(estudiante => this.mapFromBackend(estudiante));
  },

  /**
   * Mapear datos del frontend al formato del backend
   */
  mapToBackend(estudiante: any): any {
    return {
      nombre: estudiante.name,
      apellido: estudiante.surname,
      ci: estudiante.ci,
      fecha_nacimiento: estudiante.birthDate,
      email: estudiante.email,
      colegio: estudiante.school,
      id_grado: estudiante.gradeId,
      departamento: estudiante.department,
      provincia: estudiante.province
    };
  }
};
