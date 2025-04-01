import { apiService } from './api';
import { API_ROUTES } from '../config';
import { BackendArea, ApiResponse } from '../types';

/**
 * Obtiene todas las áreas de competencia
 */
export const getAreas = async (): Promise<ApiResponse<BackendArea[]>> => {
  try {
    return await apiService.get(API_ROUTES.AREAS);
  } catch (error) {
    console.error('Error fetching areas:', error);
    throw error;
  }
};

/**
 * Crea una nueva área de competencia
 */
export const createArea = async (nombre: string, descripcion: string): Promise<ApiResponse<BackendArea>> => {
  try {
    return await apiService.post(API_ROUTES.AREAS, { nombre_area: nombre, descripcion });
  } catch (error) {
    console.error('Error creating area:', error);
    throw error;
  }
};

/**
 * Actualiza un área de competencia existente
 */
export const updateArea = async (id: string, nombre: string, descripcion: string): Promise<ApiResponse<BackendArea>> => {
  try {
    return await apiService.put(`${API_ROUTES.AREAS}/${id}`, { nombre_area: nombre, descripcion });
  } catch (error) {
    console.error('Error updating area:', error);
    throw error;
  }
};

/**
 * Elimina un área de competencia
 */
export const deleteArea = async (id: string): Promise<ApiResponse<null>> => {
  try {
    return await apiService.delete(`${API_ROUTES.AREAS}/${id}`);
  } catch (error) {
    console.error('Error deleting area:', error);
    throw error;
  }
};

/**
 * Obtiene los costos asociados a un área por nivel
 */
export const getAreaCosts = async (areaId: string): Promise<ApiResponse<any>> => {
  try {
    return await apiService.get(`${API_ROUTES.COSTOS}?area_id=${areaId}`);
  } catch (error) {
    console.error('Error fetching area costs:', error);
    throw error;
  }
};

/**
 * Obtiene un área por su ID
 */
export const getAreaById = async (id: string): Promise<ApiResponse<BackendArea>> => {
  try {
    return await apiService.get(`${API_ROUTES.AREAS}/${id}`);
  } catch (error) {
    console.error('Error fetching area by id:', error);
    throw error;
  }
};
