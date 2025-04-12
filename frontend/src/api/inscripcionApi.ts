import axiosInstance from './axiosInstance';

/**
 * Obtiene los datos necesarios para el formulario de inscripción
 * (convocatoria activa, grados disponibles)
 */
export const getDatosInscripcion = async () => {
  try {
    const response = await axiosInstance.get('/public/datos-inscripcion');
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error al obtener datos de inscripción:', error);
    throw error;
  }
};

/**
 * Obtiene las áreas y niveles disponibles según el grado seleccionado
 * @param idGrado ID del grado seleccionado
 * @param idConvocatoria ID de la convocatoria
 */
export const getAreasPorGrado = async (idGrado: number, idConvocatoria: number) => {
  try {
    const response = await axiosInstance.post('/public/areas-por-grado', {
      id_grado: idGrado,
      id_convocatoria: idConvocatoria
    });
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error al obtener áreas por grado:', error);
    throw error;
  }
};

/**
 * Busca unidades educativas por nombre
 * @param query Texto de búsqueda
 */
export const buscarUnidadesEducativas = async (query: string) => {
  try {
    const response = await axiosInstance.get('/public/unidades-educativas/buscar', {
      params: { query }
    });
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error al buscar unidades educativas:', error);
    throw error;
  }
};

/**
 * Realiza la inscripción completa de un estudiante
 * @param formData Datos completos del formulario de inscripción
 */
export const inscribirEstudiante = async (formData: any) => {
  try {
    const response = await axiosInstance.post('/public/inscripcion-completa', formData);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error al inscribir estudiante:', error);
    throw error;
  }
};