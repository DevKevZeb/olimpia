import axios from 'axios';
import axiosInstance from './axiosInstance';

type IdConvocatoria = number | string;

/** Área asociada a una convocatoria (GET /v1/admin/convocatorias/{id}/areas) */
export interface AreaConvocatoriaAsignada {
  id_convocatoria_area: number;
  id_area: number;
  nombre_area: string;
  costo_inscripcion: number | string | null;
}

/** Nivel asociado a un área de una convocatoria (GET /v1/admin/convocatorias/{id}/niveles[/{area}]) */
export interface NivelConvocatoriaAsignado {
  id_convocatoria_nivel: number;
  id_convocatoria_area: number;
  id_area: number;
  nombre_area: string;
  id_nivel: number;
  nombre_nivel: string;
  id_grado_min: number;
  nombre_grado_min: string;
  id_grado_max: number;
  nombre_grado_max: string;
}

export interface CrearConvocatoriaData {
  nombre: string;
  fecha_inicio_inscripcion: string;
  fecha_fin_inscripcion: string;
  max_areas_por_estudiante: number;
}

export interface AsociarAreasData {
  id_convocatoria: IdConvocatoria;
  areas: { id_area: number; costo_inscripcion: number }[];
}

export interface AsociarNivelesGradosData {
  id_convocatoria: IdConvocatoria;
  niveles: { id_nivel: number; id_area: number; id_grado_min: number; id_grado_max: number }[];
}

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
export const createNivelCategoria = async (nombre_nivel: string) => {
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
export const crearConvocatoria = async (data: CrearConvocatoriaData) => {
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
export const asociarAreas = async (data: AsociarAreasData) => {
  try {
    console.log('Enviando datos de áreas al servidor:', data);
    const response = await axiosInstance.post('/v1/admin/convocatorias/asociar-areas', data);
    return response.data;
  } catch (error) {
    console.error('Error al asociar áreas:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('Respuesta del servidor:', error.response.data);
    }
    throw error;
  }
};

/**
 * Asocia niveles y grados a las áreas de una convocatoria
 * @param data Datos de asociación de niveles y grados
 */
export const asociarNivelesGrados = async (data: AsociarNivelesGradosData) => {
  try {
    console.log('Enviando datos de niveles y grados al servidor:', data);
    const response = await axiosInstance.post('/v1/admin/convocatorias/asociar-niveles-grados', data);
    return response.data;
  } catch (error) {
    console.error('Error al asociar niveles y grados:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('Respuesta del servidor:', error.response.data);
    }
    throw error;
  }
};

/**
 * Obtiene las áreas asociadas a una convocatoria específica
 * @param idConvocatoria ID de la convocatoria
 */
export const getAreasPorConvocatoria = async (idConvocatoria: IdConvocatoria) => {
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
export const getNivelesPorConvocatoria = async (idConvocatoria: IdConvocatoria, idAreaConvocatoria: IdConvocatoria | null = null) => {
  try {
    const areas = idAreaConvocatoria ? `/${idAreaConvocatoria}` : '' ;   

    console.log("entonces ", `/v1/admin/convocatorias/${idConvocatoria}/niveles${areas}`); 
    const response = await axiosInstance.get(`/v1/admin/convocatorias/${idConvocatoria}/niveles${areas}`);
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

/**
 * Obtiene todas las convocatorias (todos los estados)
 */
export const getAllConvocatorias = async () => {
  try {
    const response = await axiosInstance.get('/v1/admin/convocatorias');
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error al obtener todas las convocatorias:', error);
    throw error;
  }
};

export interface DashboardEstadisticas {
  total_convocatorias: number;
  total_areas: number;
  total_niveles: number;
  total_estudiantes: number;
  total_inscripciones: number;
}

/**
 * Obtiene los totales para el inicio del panel de administración
 */
export const getDashboardEstadisticas = async (): Promise<DashboardEstadisticas> => {
  const response = await axiosInstance.get('/v1/admin/dashboard-data');
  return response.data.data.estadisticas;
};
