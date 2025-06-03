import axiosInstance from './axiosInstance';

/**
 * Obtiene todas las convocatorias activas
 */
export const getConvocatoriasActivas = async () => {
  try {
    const response = await axiosInstance.get('/v1/admin/convocatorias-activas');
    // Asegurar que se retorna la data independientemente de la estructura
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error al obtener convocatorias activas:', error);
    throw error;
  }
};

/**
 * Obtiene todas las convocatorias activas
 */
export const getConvocatoriasPlanificadas = async () => {
  try {
    const response = await axiosInstance.get('/v1/admin/convocatorias-planificadas');
    // Asegurar que se retorna la data independientemente de la estructura
    return response.data?.data || response.data;
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
    // Asegurar que se retorna la data independientemente de la estructura
    return response.data?.data || response.data;
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
    // Asegurar que se retorna la data independientemente de la estructura
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error al obtener niveles de categoría:', error);
    throw error;
  }
};

/**
 * Crea un nuevo nivel de categoría
 * @param nombre_nivel Nombre del nivel a crear
 */
export const createNivelCategoria = async (nombre_nivel) => {
  try {
    const response = await axiosInstance.post('/v1/niveles', { nombre_nivel });
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error al crear nivel de categoría:', error);
    throw error;
  }
};

/**
 * Obtiene todos los grados
 */
export const getGrados = async () => {
  try {
    const response = await axiosInstance.get('/v1/admin/grados');
    // Asegurar que se retorna la data independientemente de la estructura
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error al obtener grados:', error);
    throw error;
  }
};

/**
 * Crea una nueva convocatoria (solo datos básicos)
 * @param data Datos básicos de la convocatoria
 */
export const crearConvocatoria = async (data) => {
  try {
    console.log('Enviando datos de convocatoria:', data);
    const response = await axiosInstance.post('/v1/admin/convocatorias', data);
    console.log('Respuesta al crear convocatoria:', response.data);
    
    // Verificar si la respuesta contiene la estructura esperada
    if (response.data && response.data.data) {
      return response.data.data; // Para el caso de que la API devuelva {data: {...}}
    } else if (response.data && response.data.id_convocatoria) {
      return response.data; // Para el caso de que la API devuelva directamente el objeto
    } else {
      console.error('Respuesta inesperada al crear convocatoria:', response.data);
      throw new Error('La respuesta no contiene el ID de la convocatoria');
    }
  } catch (error) {
    console.error('Error al crear convocatoria:', error);
    throw error;
  }
};

/**
 * Asocia áreas a una convocatoria existente
 * @param data Datos de asociación de áreas
 */
export const asociarAreas = async (data) => {
  try {
    console.log('Enviando datos de áreas al servidor:', data);
    const response = await axiosInstance.post('/v1/admin/convocatorias/asociar-areas', data);
    return response.data;
  } catch (error) {
    console.error('Error al asociar áreas:', error);
    if (error.response) {
      console.error('Respuesta del servidor:', error.response.data);
    }
    throw error;
  }
};

/**
 * Asocia niveles y grados a las áreas de una convocatoria
 * @param data Datos de asociación de niveles y grados
 */
export const asociarNivelesGrados = async (data) => {
  try {
    console.log('Enviando datos de niveles y grados al servidor:', data);
    const response = await axiosInstance.post('/v1/admin/convocatorias/asociar-niveles-grados', data);
    return response.data;
  } catch (error) {
    console.error('Error al asociar niveles y grados:', error);
    if (error.response) {
      console.error('Respuesta del servidor:', error.response.data);
    }
    throw error;
  }
};

/**
 * Obtiene las áreas asociadas a una convocatoria específica
 * @param idConvocatoria ID de la convocatoria
 */
export const getAreasPorConvocatoria = async (idConvocatoria) => {
  try {
    const response = await axiosInstance.get(`/v1/admin/convocatorias/${idConvocatoria}/areas`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error(`Error al obtener áreas para la convocatoria ${idConvocatoria}:`, error);
    throw error;
  }
};

/**
 * Obtiene los niveles asociados a las áreas de una convocatoria específica
 * @param idConvocatoria ID de la convocatoria
 */
export const getNivelesPorConvocatoria = async (idConvocatoria) => {
  try {
    const response = await axiosInstance.get(`/v1/admin/convocatorias/${idConvocatoria}/niveles`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error(`Error al obtener niveles para la convocatoria ${idConvocatoria}:`, error);
    throw error;
  }
};

/**
 * Asigna un costo general a todas las áreas de una convocatoria
 * @param idConvocatoria ID de la convocatoria
 * @param costo_inscripcion Costo general a asignar
 */
export const setCostoGeneralConvocatoria = async (idConvocatoria: string, costo_inscripcion: number) => {
  try {
    const response = await axiosInstance.post(`/v1/admin/convocatorias/${idConvocatoria}/set-costo-general`, { costo_inscripcion });
    return response.data;
  } catch (error) {
    console.error('Error al asignar costo general:', error);
    throw error;
  }
};

/**
 * Obtiene el estado y requisitos de una convocatoria
 * @param idConvocatoria ID de la convocatoria
 */
export const getEstadoConvocatoria = async (idConvocatoria: number) => {
  try {
    const response = await axiosInstance.get(`/v1/admin/convocatorias/${idConvocatoria}/estado`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error al obtener estado de convocatoria:', error);
    throw error;
  }
};

/**
 * Transiciona el estado de una convocatoria
 * @param idConvocatoria ID de la convocatoria
 * @param nuevoEstado Nuevo estado a aplicar
 */
export const transicionarEstadoConvocatoria = async (idConvocatoria: number, nuevoEstado: string) => {
  try {
    const response = await axiosInstance.put(`/v1/admin/convocatorias/${idConvocatoria}/estado`, {
      nuevo_estado: nuevoEstado
    });
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error al transicionar estado:', error);
    throw error;
  }
};

/**
 * Cierra automáticamente convocatorias expiradas
 */
export const cerrarConvocatoriasExpiradas = async () => {
  try {
    const response = await axiosInstance.post('/v1/admin/convocatorias/cerrar-expiradas');
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error al cerrar convocatorias expiradas:', error);
    throw error;
  }
};
