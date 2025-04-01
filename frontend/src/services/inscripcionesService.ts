import { apiService } from './api';
import { API_ROUTES } from '../config';
import { 
  BackendInscripcion, 
  ApiResponse, 
  PaginationResponse 
} from '../types';

/**
 * Obtiene todas las inscripciones con paginación opcional
 */
export const getInscripciones = async (page = 1, estado?: string, convocatoriaId?: string): Promise<ApiResponse<PaginationResponse<BackendInscripcion>>> => {
  try {
    let url = `${API_ROUTES.INSCRIPCIONES}?page=${page}`;
    
    if (estado) {
      url += `&estado=${estado}`;
    }
    
    if (convocatoriaId) {
      url += `&convocatoria_id=${convocatoriaId}`;
    }
    
    return await apiService.get(url);
  } catch (error) {
    console.error('Error fetching inscripciones:', error);
    throw error;
  }
};

/**
 * Obtiene una inscripción específica por su ID
 */
export const getInscripcionById = async (id: string): Promise<ApiResponse<BackendInscripcion>> => {
  try {
    return await apiService.get(`${API_ROUTES.INSCRIPCIONES}/${id}`);
  } catch (error) {
    console.error('Error fetching inscripcion:', error);
    throw error;
  }
};

/**
 * Crea una nueva inscripción
 */
export const createInscripcion = async (data: {
  id_estudiante: string | number;
  id_convocatoria_area: string | number;
  id_convocatoria_nivel: string | number;
  id_tutor_academico?: string | number;
}): Promise<ApiResponse<BackendInscripcion>> => {
  try {
    return await apiService.post(API_ROUTES.INSCRIPCIONES, data);
  } catch (error) {
    console.error('Error creating inscripcion:', error);
    throw error;
  }
};

/**
 * Actualiza el estado o tutor académico de una inscripción
 */
export const updateInscripcion = async (id: string, data: {
  estado?: string;
  id_tutor_academico?: string | number;
}): Promise<ApiResponse<BackendInscripcion>> => {
  try {
    return await apiService.put(`${API_ROUTES.INSCRIPCIONES}/${id}`, data);
  } catch (error) {
    console.error('Error updating inscripcion:', error);
    throw error;
  }
};

/**
 * Elimina una inscripción
 */
export const deleteInscripcion = async (id: string): Promise<ApiResponse<null>> => {
  try {
    return await apiService.delete(`${API_ROUTES.INSCRIPCIONES}/${id}`);
  } catch (error) {
    console.error('Error deleting inscripcion:', error);
    throw error;
  }
};

/**
 * Obtiene las inscripciones de un estudiante específico
 */
export const getInscripcionesByEstudiante = async (estudianteId: string): Promise<ApiResponse<BackendInscripcion[]>> => {
  try {
    return await apiService.get(`${API_ROUTES.INSCRIPCIONES}?estudiante_id=${estudianteId}`);
  } catch (error) {
    console.error('Error fetching inscripciones by estudiante:', error);
    throw error;
  }
};
