import { apiService } from './api';
import { API_ROUTES } from '../config';
import { BackendGrado, ApiResponse } from '../types';

/**
 * Obtiene todos los grados académicos
 */
export const getGrados = async (): Promise<ApiResponse<BackendGrado[]>> => {
  try {
    return await apiService.get(API_ROUTES.GRADOS);
  } catch (error) {
    console.error('Error fetching grados:', error);
    throw error;
  }
};

/**
 * Obtiene un grado específico por su ID
 */
export const getGradoById = async (id: string): Promise<ApiResponse<BackendGrado>> => {
  try {
    return await apiService.get(`${API_ROUTES.GRADOS}/${id}`);
  } catch (error) {
    console.error('Error fetching grado by id:', error);
    throw error;
  }
};

/**
 * Crea un nuevo grado académico
 */
export const createGrado = async (data: {
  nombre_grado: string;
  orden: number;
}): Promise<ApiResponse<BackendGrado>> => {
  try {
    return await apiService.post(API_ROUTES.GRADOS, data);
  } catch (error) {
    console.error('Error creating grado:', error);
    throw error;
  }
};

/**
 * Actualiza un grado académico existente
 */
export const updateGrado = async (id: string, data: {
  nombre_grado?: string;
  orden?: number;
}): Promise<ApiResponse<BackendGrado>> => {
  try {
    return await apiService.put(`${API_ROUTES.GRADOS}/${id}`, data);
  } catch (error) {
    console.error('Error updating grado:', error);
    throw error;
  }
};

/**
 * Elimina un grado académico
 */
export const deleteGrado = async (id: string): Promise<ApiResponse<null>> => {
  try {
    return await apiService.delete(`${API_ROUTES.GRADOS}/${id}`);
  } catch (error) {
    console.error('Error deleting grado:', error);
    throw error;
  }
};
