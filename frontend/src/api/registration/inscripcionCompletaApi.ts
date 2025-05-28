import axiosInstance from '../axiosInstance';

/**
 * Obtiene los datos iniciales para el formulario de inscripción
 */
export const getDatosInscripcion = async () => {
  try {
    const response = await axiosInstance.get('/v1/public/datos-inscripcion');
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error al obtener datos para inscripción:', error);
    throw error;
  }
};

/**
 * Obtiene las áreas y niveles disponibles según el grado seleccionado
 * @param idGrado ID del grado seleccionado
 * @param idConvocatoria ID de la convocatoria activa
 */
export const getAreasPorGrado = async (idGrado: number, idConvocatoria: number) => {
  try {
    const response = await axiosInstance.post('/v1/public/areas-por-grado', {
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
 * @param query Texto para buscar unidades educativas
 */
export const buscarUnidadesEducativas = async (query: string) => {
  try {
    const response = await axiosInstance.get('/v1/public/unidades-educativas/buscar', {
      params: { query }
    });
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error al buscar unidades educativas:', error);
    throw error;
  }
};

/**
 * Procesa la inscripción completa de un estudiante
 * @param data Datos completos del formulario de inscripción
 */
export const inscribirEstudiante = async (data: any ) => {
  try {
    const response = await axiosInstance.post('/v1/public/inscripcion-completa', data);
    //openModal();
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error al inscribir estudiante:', error);
    console.error('Detalles del error de validación:', error.response?.data); // Loguea los detalles del error
    if(error.status == 409){
      alert("Opsie! , Estudiante ya inscrito en materia - nivel" );
    }else {
      alert("Opsie! , algo salio mal! " + error.response?.data?.message);
    }
    throw error;
  }
};

/**
 * Procesa la inscripción completa de un estudiante
 * @param data Datos completos del formulario de inscripción
 */
export const getUser = async (data: any, ) => {
  try {
    console.log("data " + data);
    const response = await axiosInstance.get('/v1/search-by-ci', {params: data});
    return response.data?.data.usuario || response.data.usuario;
  } catch (error) {
    console.error('Error al obtener informacion:', error);
    console.error('Detalles del error de validación:', error.response?.data); // Loguea los detalles del error
    throw error;
  }};