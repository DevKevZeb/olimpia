import { apiService } from './api';
import { API_ROUTES } from '../config';
import { EducationalUnit, ApiResponse } from '../types';

/**
 * Servicio para gestionar unidades educativas
 */
export const unidadEducativaService = {
  /**
   * Obtener todas las unidades educativas
   */
  async getUnidadesEducativas(): Promise<ApiResponse<EducationalUnit[]>> {
    try {
      return await apiService.get<EducationalUnit[]>(API_ROUTES.UNIDADES_EDUCATIVAS);
    } catch (error) {
      console.error("Error fetching unidades educativas:", error);
      throw error;
    }
  },

  /**
   * Obtener una unidad educativa por su ID
   */
  async getUnidadEducativa(id: string): Promise<ApiResponse<EducationalUnit>> {
    try {
      return await apiService.get<EducationalUnit>(`${API_ROUTES.UNIDADES_EDUCATIVAS}/${id}`);
    } catch (error) {
      console.error(`Error fetching unidad educativa ${id}:`, error);
      throw error;
    }
  },

  /**
   * Buscar unidades educativas por nombre (parcial)
   */
  async searchUnidadesEducativas(query: string): Promise<ApiResponse<EducationalUnit[]>> {
    try {
      return await apiService.get<EducationalUnit[]>(`${API_ROUTES.UNIDADES_EDUCATIVAS}?search=${encodeURIComponent(query)}`);
    } catch (error) {
      console.error(`Error searching unidades educativas with query '${query}':`, error);
      throw error;
    }
  },

  /**
   * Crear una nueva unidad educativa
   */
  async createUnidadEducativa(unidad: Partial<EducationalUnit>): Promise<ApiResponse<EducationalUnit>> {
    try {
      return await apiService.post<EducationalUnit>(API_ROUTES.UNIDADES_EDUCATIVAS, {
        nombre: unidad.name,
        departamento: unidad.department,
        provincia: unidad.province
      });
    } catch (error) {
      console.error("Error creating unidad educativa:", error);
      throw error;
    }
  },

  /**
   * Actualizar una unidad educativa
   */
  async updateUnidadEducativa(id: string, unidad: Partial<EducationalUnit>): Promise<ApiResponse<EducationalUnit>> {
    try {
      const updateData: any = {};
      
      if (unidad.name) updateData.nombre = unidad.name;
      if (unidad.department) updateData.departamento = unidad.department;
      if (unidad.province) updateData.provincia = unidad.province;
      
      return await apiService.put<EducationalUnit>(`${API_ROUTES.UNIDADES_EDUCATIVAS}/${id}`, updateData);
    } catch (error) {
      console.error(`Error updating unidad educativa ${id}:`, error);
      throw error;
    }
  },

  /**
   * Eliminar una unidad educativa
   */
  async deleteUnidadEducativa(id: string): Promise<ApiResponse<null>> {
    try {
      return await apiService.delete<null>(`${API_ROUTES.UNIDADES_EDUCATIVAS}/${id}`);
    } catch (error) {
      console.error(`Error deleting unidad educativa ${id}:`, error);
      throw error;
    }
  },

  /**
   * Mapear datos del backend al formato del frontend
   */
  mapFromBackend(backendUnidad: any): EducationalUnit {
    return {
      id: backendUnidad.id_unidad_educativa.toString(),
      name: backendUnidad.nombre,
      department: backendUnidad.departamento,
      province: backendUnidad.provincia
    };
  },

  /**
   * Mapear datos del frontend al formato del backend
   */
  mapToBackend(unidad: Partial<EducationalUnit>): any {
    return {
      nombre: unidad.name,
      departamento: unidad.department,
      provincia: unidad.province
    };
  }
};
