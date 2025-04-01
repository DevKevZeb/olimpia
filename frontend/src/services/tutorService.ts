import { apiService } from './api';
import { API_ROUTES } from '../config';
import { ApiResponse, Guardian, AcademicTutor } from '../types';

/**
 * Servicio para gestionar tutores
 */
export const tutorService = {
  // =================== TUTORES LEGALES ===================
  /**
   * Obtener todos los tutores legales
   */
  async getTutoresLegales(): Promise<ApiResponse<Guardian[]>> {
    try {
      return await apiService.get(API_ROUTES.TUTORES_LEGALES);
    } catch (error) {
      console.error("Error fetching tutores legales:", error);
      throw error;
    }
  },

  /**
   * Obtener un tutor legal específico por su ID
   */
  async getTutorLegal(id: string): Promise<ApiResponse<Guardian>> {
    try {
      return await apiService.get(`${API_ROUTES.TUTORES_LEGALES}/${id}`);
    } catch (error) {
      console.error(`Error fetching tutor legal ${id}:`, error);
      throw error;
    }
  },

  /**
   * Crear un nuevo tutor legal
   */
  async createTutorLegal(tutor: Partial<Guardian>): Promise<ApiResponse<Guardian>> {
    try {
      // Separar nombre completo en nombre y apellidos si es necesario
      let nombres = tutor.name || '';
      let apellidos = tutor.surname || '';
      
      if (!apellidos && nombres.includes(' ')) {
        const parts = nombres.split(' ');
        nombres = parts[0];
        apellidos = parts.slice(1).join(' ');
      }
      
      return await apiService.post(API_ROUTES.TUTORES_LEGALES, {
        nombres: nombres,
        apellidos: apellidos,
        ci: tutor.ci || '',
        telefono: tutor.phone,
        email: tutor.email,
        parentesco: tutor.relationship || 'Familiar',
        es_el_mismo_estudiante: tutor.isSameAsStudent || false
      });
    } catch (error) {
      console.error("Error creating tutor legal:", error);
      throw error;
    }
  },

  /**
   * Actualizar un tutor legal existente
   */
  async updateTutorLegal(id: string, tutor: Partial<Guardian>): Promise<ApiResponse<Guardian>> {
    try {
      const updateData: any = {};
      
      if (tutor.name) updateData.nombres = tutor.name;
      if (tutor.surname) updateData.apellidos = tutor.surname;
      if (tutor.ci) updateData.ci = tutor.ci;
      if (tutor.phone) updateData.telefono = tutor.phone;
      if (tutor.email) updateData.email = tutor.email;
      if (tutor.relationship) updateData.parentesco = tutor.relationship;
      if (tutor.isSameAsStudent !== undefined) updateData.es_el_mismo_estudiante = tutor.isSameAsStudent;
      
      return await apiService.put(`${API_ROUTES.TUTORES_LEGALES}/${id}`, updateData);
    } catch (error) {
      console.error(`Error updating tutor legal ${id}:`, error);
      throw error;
    }
  },

  /**
   * Eliminar un tutor legal
   */
  async deleteTutorLegal(id: string): Promise<ApiResponse<null>> {
    try {
      return await apiService.delete(`${API_ROUTES.TUTORES_LEGALES}/${id}`);
    } catch (error) {
      console.error(`Error deleting tutor legal ${id}:`, error);
      throw error;
    }
  },

  // =================== TUTORES ACADÉMICOS ===================
  /**
   * Obtener todos los tutores académicos
   */
  async getTutoresAcademicos(): Promise<ApiResponse<AcademicTutor[]>> {
    try {
      return await apiService.get(API_ROUTES.TUTORES_ACADEMICOS);
    } catch (error) {
      console.error("Error fetching tutores académicos:", error);
      throw error;
    }
  },

  /**
   * Obtener un tutor académico específico por su ID
   */
  async getTutorAcademico(id: string): Promise<ApiResponse<AcademicTutor>> {
    try {
      return await apiService.get(`${API_ROUTES.TUTORES_ACADEMICOS}/${id}`);
    } catch (error) {
      console.error(`Error fetching tutor académico ${id}:`, error);
      throw error;
    }
  },

  /**
   * Crear un nuevo tutor académico
   */
  async createTutorAcademico(tutor: Partial<AcademicTutor>): Promise<ApiResponse<AcademicTutor>> {
    try {
      // Separar nombre completo en nombre y apellidos si es necesario
      let nombres = tutor.name || '';
      let apellidos = tutor.surname || '';
      
      if (!apellidos && nombres.includes(' ')) {
        const parts = nombres.split(' ');
        nombres = parts[0];
        apellidos = parts.slice(1).join(' ');
      }
      
      return await apiService.post(API_ROUTES.TUTORES_ACADEMICOS, {
        nombres: nombres,
        apellidos: apellidos,
        ci: tutor.ci || '',
        telefono: tutor.phone || '',
        email: tutor.email || ''
      });
    } catch (error) {
      console.error("Error creating tutor académico:", error);
      throw error;
    }
  },

  /**
   * Actualizar un tutor académico existente
   */
  async updateTutorAcademico(id: string, tutor: Partial<AcademicTutor>): Promise<ApiResponse<AcademicTutor>> {
    try {
      const updateData: any = {};
      
      if (tutor.name) updateData.nombres = tutor.name;
      if (tutor.surname) updateData.apellidos = tutor.surname;
      if (tutor.ci) updateData.ci = tutor.ci;
      if (tutor.phone) updateData.telefono = tutor.phone;
      if (tutor.email) updateData.email = tutor.email;
      
      return await apiService.put(`${API_ROUTES.TUTORES_ACADEMICOS}/${id}`, updateData);
    } catch (error) {
      console.error(`Error updating tutor académico ${id}:`, error);
      throw error;
    }
  },

  /**
   * Eliminar un tutor académico
   */
  async deleteTutorAcademico(id: string): Promise<ApiResponse<null>> {
    try {
      return await apiService.delete(`${API_ROUTES.TUTORES_ACADEMICOS}/${id}`);
    } catch (error) {
      console.error(`Error deleting tutor académico ${id}:`, error);
      throw error;
    }
  },

  // =================== MAPPINGS ===================
  /**
   * Mapear tutor legal del backend al formato del frontend
   */
  mapTutorLegalFromBackend(backendTutor: any): Guardian {
    return {
      id: backendTutor.id_tutor_legal.toString(),
      name: backendTutor.nombres,
      surname: backendTutor.apellidos,
      ci: backendTutor.ci,
      phone: backendTutor.telefono,
      email: backendTutor.email,
      relationship: backendTutor.parentesco,
      isSameAsStudent: backendTutor.es_el_mismo_estudiante
    };
  },

  /**
   * Mapear tutor académico del backend al formato del frontend
   */
  mapTutorAcademicoFromBackend(backendTutor: any): AcademicTutor {
    return {
      id: backendTutor.id_tutor_academico.toString(),
      name: backendTutor.nombres,
      surname: backendTutor.apellidos,
      ci: backendTutor.ci,
      phone: backendTutor.telefono,
      email: backendTutor.email
    };
  }
};
