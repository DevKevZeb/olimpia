import { apiService } from './api';
import { API_ROUTES } from '../config';
import { BackendNivel, ApiResponse } from '../types';

/**
 * Obtiene todos los niveles de categoría
 */
export const getNiveles = async (): Promise<ApiResponse<BackendNivel[]>> => {
  try {
    return await apiService.get(API_ROUTES.NIVELES);
  } catch (error) {
    console.error('Error fetching niveles:', error);
    throw error;
  }
};

/**
 * Obtiene un nivel específico por su ID
 */
export const getNivelById = async (id: string): Promise<ApiResponse<BackendNivel>> => {
  try {
    return await apiService.get(`${API_ROUTES.NIVELES}/${id}`);
  } catch (error) {
    console.error('Error fetching nivel by id:', error);
    throw error;
  }
};

/**
 * Crea un nuevo nivel de categoría
 */
export const createNivel = async (data: {
  nombre_nivel: string;
  id_area: string | number;
  id_grado_min: string | number;
  id_grado_max: string | number;
}): Promise<ApiResponse<BackendNivel>> => {
  try {
    return await apiService.post(API_ROUTES.NIVELES, data);
  } catch (error) {
    console.error('Error creating nivel:', error);
    throw error;
  }
};

/**
 * Actualiza un nivel de categoría existente
 */
export const updateNivel = async (id: string, data: {
  nombre_nivel?: string;
  id_area?: string | number;
  id_grado_min?: string | number;
  id_grado_max?: string | number;
}): Promise<ApiResponse<BackendNivel>> => {
  try {
    return await apiService.put(`${API_ROUTES.NIVELES}/${id}`, data);
  } catch (error) {
    console.error('Error updating nivel:', error);
    throw error;
  }
};

/**
 * Elimina un nivel de categoría
 */
export const deleteNivel = async (id: string): Promise<ApiResponse<null>> => {
  try {
    return await apiService.delete(`${API_ROUTES.NIVELES}/${id}`);
  } catch (error) {
    console.error('Error deleting nivel:', error);
    throw error;
  }
};

/**
 * Obtiene niveles filtrados por área
 */
export const getNivelesByArea = async (areaId: string): Promise<ApiResponse<BackendNivel[]>> => {
  try {
    return await apiService.get(`${API_ROUTES.NIVELES}?area_id=${areaId}`);
  } catch (error) {
    console.error('Error fetching niveles by area:', error);
    throw error;
  }
};
