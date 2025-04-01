import { apiService } from './api';
import { API_ROUTES } from '../config';
import { BackendDashboardStats } from '../types';

// NIVELES
export const getNiveles = async () => {
  try {
    return await apiService.get(API_ROUTES.NIVELES);
  } catch (error) {
    console.error('Error fetching niveles:', error);
    throw error;
  }
};

export const createNivel = async (nombre: string) => {
  try {
    return await apiService.post(API_ROUTES.NIVELES, { nombre });
  } catch (error) {
    console.error('Error creating nivel:', error);
    throw error;
  }
};

export const deleteNivel = async (id: string) => {
  try {
    return await apiService.delete(`${API_ROUTES.NIVELES}/${id}`);
  } catch (error) {
    console.error('Error deleting nivel:', error);
    throw error;
  }
};

// GRADOS
export const getGrados = async () => {
  try {
    return await apiService.get(API_ROUTES.GRADOS);
  } catch (error) {
    console.error('Error fetching grados:', error);
    throw error;
  }
};

export const createGrado = async (nombre: string) => {
  try {
    return await apiService.post(API_ROUTES.GRADOS, { nombre });
  } catch (error) {
    console.error('Error creating grado:', error);
    throw error;
  }
};

export const deleteGrado = async (id: string) => {
  try {
    return await apiService.delete(`${API_ROUTES.GRADOS}/${id}`);
  } catch (error) {
    console.error('Error deleting grado:', error);
    throw error;
  }
};

// AREAS
export const getAreas = async () => {
  try {
    return await apiService.get(API_ROUTES.AREAS);
  } catch (error) {
    console.error('Error fetching areas:', error);
    throw error;
  }
};

export const createArea = async (nombre: string, descripcion: string) => {
  try {
    return await apiService.post(API_ROUTES.AREAS, { nombre, descripcion });
  } catch (error) {
    console.error('Error creating area:', error);
    throw error;
  }
};

export const deleteArea = async (id: string) => {
  try {
    return await apiService.delete(`${API_ROUTES.AREAS}/${id}`);
  } catch (error) {
    console.error('Error deleting area:', error);
    throw error;
  }
};

// COSTOS
export const getCostos = async () => {
  try {
    return await apiService.get(API_ROUTES.COSTOS);
  } catch (error) {
    console.error('Error fetching costos:', error);
    throw error;
  }
};

export const createCosto = async (Id_area: string, Id_nivel: string, monto: number) => {
  try {
    return await apiService.post(API_ROUTES.COSTOS, { Id_area, Id_nivel, monto });
  } catch (error) {
    console.error('Error creating costo:', error);
    throw error;
  }
};

export const deleteCosto = async (id: string) => {
  try {
    return await apiService.delete(`${API_ROUTES.COSTOS}/${id}`);
  } catch (error) {
    console.error('Error deleting costo:', error);
    throw error;
  }
};

// INSCRIPCIONES
export const getInscripciones = async () => {
  try {
    return await apiService.get(API_ROUTES.INSCRIPCIONES);
  } catch (error) {
    console.error('Error fetching inscripciones:', error);
    throw error;
  }
};

export const createInscripcion = async (data: {
  Id_competidor: string | number;
  Id_tutor: string | number;
  Id_area: string | number;
  Id_nivel: string | number;
  estado: string;
}) => {
  try {
    return await apiService.post(API_ROUTES.INSCRIPCIONES, data);
  } catch (error) {
    console.error('Error creating inscripcion:', error);
    throw error;
  }
};

// ESTUDIANTES (COMPETIDORES)
export const createEstudiante = async (data: {
  nombre: string;
  apellido: string;
  email: string;
  ci: string;
  fecha_nacimiento: string;
  colegio: string;
  Id_grado: number | string;
  departamento: string;
  provincia: string;
}) => {
  try {
    return await apiService.post(API_ROUTES.ESTUDIANTES, data);
  } catch (error) {
    console.error('Error creating estudiante:', error);
    throw error;
  }
};

// TUTORES LEGALES
export const createTutorLegal = async (data: {
  nombre: string;
  apellido: string;
  tipo_tutor: string;
  telefono: string;
  email: string;
}) => {
  try {
    return await apiService.post(API_ROUTES.TUTORES_LEGALES, data);
  } catch (error) {
    console.error('Error creating tutor legal:', error);
    throw error;
  }
};

// ESTADÍSTICAS
export const getDashboardStats = async () => {
  try {
    return await apiService.get<BackendDashboardStats>(API_ROUTES.DASHBOARD_STATS);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};