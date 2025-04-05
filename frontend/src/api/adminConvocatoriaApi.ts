import axiosInstance from './axiosInstance';

/**
 * Obtiene todas las convocatorias activas
 */
export const getConvocatoriasActivas = async () => {
  try {
    const response = await axiosInstance.get('/v1/admin/convocatorias-activas');
    return response.data;
  } catch (error) {
    console.error('Error al obtener convocatorias activas:', error);
    throw error;
  }
};

/**
 * Obtiene todas las áreas de competencia
 */
export const getAreasCompetencia = async () => {
  try {
    const response = await axiosInstance.get('/v1/admin/areas-competencia');
    return response.data;
  } catch (error) {
    console.error('Error al obtener áreas de competencia:', error);
    throw error;
  }
};

/**
 * Obtiene todos los niveles de categoría
 */
export const getNivelesCategoria = async () => {
  try {
    const response = await axiosInstance.get('/v1/admin/niveles-categoria');
    return response.data;
  } catch (error) {
    console.error('Error al obtener niveles de categoría:', error);
    throw error;
  }
};

/**
 * Obtiene todos los grados
 */
export const getGrados = async () => {
  try {
    const response = await axiosInstance.get('/v1/admin/grados');
    return response.data;
  } catch (error) {
    console.error('Error al obtener grados:', error);
    throw error;
  }
};

/**
 * Crea una nueva convocatoria
 * @param data Datos de la convocatoria
 */
export const crearConvocatoria = async (data) => {
  const response = await axiosInstance.post('/v1/admin/convocatorias', data);
  return response.data;
};

/**
 * Asocia áreas y niveles a una convocatoria
 * @param data Datos de asociación
 */
export const asociarAreas = async (data) => {
  try {
    const response = await axiosInstance.post('/v1/admin/convocatorias/asociar-areas', data);
    return response.data;
  } catch (error) {
    console.error('Error al asociar áreas y niveles:', error);
    throw error;
  }
};
