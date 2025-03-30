import api from './api';

// NIVELES
export const getNiveles = async () => {
  try {
    const response = await api.get('/niveles');
    return response.data;
  } catch (error) {
    console.error('Error fetching niveles:', error);
    throw error;
  }
};

export const createNivel = async (nombre: string) => {
  try {
    const response = await api.post('/niveles', { nombre });
    return response.data;
  } catch (error) {
    console.error('Error creating nivel:', error);
    throw error;
  }
};

export const deleteNivel = async (id: string) => {
  try {
    const response = await api.delete(`/niveles/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting nivel:', error);
    throw error;
  }
};

// GRADOS
export const getGrados = async () => {
  try {
    const response = await api.get('/grados');
    return response.data;
  } catch (error) {
    console.error('Error fetching grados:', error);
    throw error;
  }
};

export const createGrado = async (nombre: string) => {
  try {
    const response = await api.post('/grados', { nombre });
    return response.data;
  } catch (error) {
    console.error('Error creating grado:', error);
    throw error;
  }
};

export const deleteGrado = async (id: string) => {
  try {
    const response = await api.delete(`/grados/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting grado:', error);
    throw error;
  }
};

// AREAS
export const getAreas = async () => {
  try {
    const response = await api.get('/areas');
    return response.data;
  } catch (error) {
    console.error('Error fetching areas:', error);
    throw error;
  }
};

export const createArea = async (nombre: string, descripcion: string) => {
  try {
    const response = await api.post('/areas', { nombre, descripcion });
    return response.data;
  } catch (error) {
    console.error('Error creating area:', error);
    throw error;
  }
};

export const deleteArea = async (id: string) => {
  try {
    const response = await api.delete(`/areas/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting area:', error);
    throw error;
  }
};

// COSTOS
export const getCostos = async () => {
  try {
    const response = await api.get('/costos');
    return response.data;
  } catch (error) {
    console.error('Error fetching costos:', error);
    throw error;
  }
};

export const createCosto = async (Id_area: string, Id_nivel: string, monto: number) => {
  try {
    const response = await api.post('/costos', { Id_area, Id_nivel, monto });
    return response.data;
  } catch (error) {
    console.error('Error creating costo:', error);
    throw error;
  }
};

export const deleteCosto = async (id: string) => {
  try {
    const response = await api.delete(`/costos/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting costo:', error);
    throw error;
  }
};

// INSCRIPCIONES
export const getInscripciones = async () => {
  try {
    const response = await api.get('/inscripciones');
    return response.data;
  } catch (error) {
    console.error('Error fetching inscripciones:', error);
    throw error;
  }
};

// ESTADÍSTICAS
export const getDashboardStats = async () => {
  try {
    const response = await api.get('/dashboard/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};