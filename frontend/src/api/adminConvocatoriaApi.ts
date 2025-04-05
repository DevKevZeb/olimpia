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
 * Crea una nueva convocatoria
 * @param data Datos de la convocatoria
 */
export const crearConvocatoria = async (data) => {
  const response = await axiosInstance.post('/v1/admin/convocatorias', data);
  return response.data;
};

/**
 * Asocia áreas a una convocatoria
 * @param data Datos de asociación
 */
export const asociarAreas = async (data) => {
  const response = await axiosInstance.post('/v1/admin/convocatorias/asociar-areas', data);
  return response.data;
};
