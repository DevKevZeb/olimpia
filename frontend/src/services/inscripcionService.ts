import { apiService } from './api';
import { API_ROUTES } from '../config';
import { ApiResponse } from '../types';

/**
 * Interfaces para la respuesta de datos de inscripción
 */
export interface DatosInscripcionResponse {
  convocatoria: {
    id: number;
    nombre: string;
    fecha_inicio: string;
    fecha_fin: string;
    max_areas: number;
    estado: string;
  };
  areas: Array<{
    id: number;
    id_area: number;
    nombre: string;
    costo: number;
  }>;
  niveles_por_area: Record<string, Array<{
    id: number;
    nombre: string;
    grado_min: number;
    grado_max: number;
  }>>;
  grados: Array<{
    id_grado: number;
    nombre_grado: string;
    orden: number;
  }>;
  unidades_educativas: Array<{
    id_unidad_educativa: number;
    nombre: string;
    departamento: string;
    provincia: string;
  }>;
}

/**
 * Interfaz para el formulario de inscripción completa
 */
export interface InscripcionCompletaForm {
  estudiante: {
    nombres: string;
    apellidos: string;
    ci: string;
    fecha_nacimiento: string;
    email: string;
    id_unidad_educativa: number;
    id_grado: number;
  };
  tutor_legal: {
    nombres: string;
    apellidos: string;
    ci: string;
    telefono: string;
    email: string;
    parentesco: string;
    es_el_mismo_estudiante: boolean;
  };
  tutor_academico?: {
    nombres?: string;
    apellidos?: string;
    ci?: string;
    telefono?: string;
    email?: string;
  };
  areas_seleccionadas: Array<{
    id_convocatoria_area: number;
    id_convocatoria_nivel: number;
  }>;
}

/**
 * Interfaz para la respuesta de inscripción completa
 */
export interface InscripcionCompletaResponse {
  estudiante: any;
  inscripciones: Array<any>;
  orden_pago: {
    id_orden: number;
    codigo_unico: string;
    monto_total: number;
    fecha_emision: string;
    fecha_vencimiento: string;
    estado: string;
  };
  costo_total: number;
}

/**
 * Servicio para la página de inscripción
 */
export const inscripcionService = {
  /**
   * Obtiene todos los datos necesarios para el formulario de inscripción
   */
  async getDatosInscripcion(): Promise<ApiResponse<DatosInscripcionResponse>> {
    try {
      return await apiService.get<DatosInscripcionResponse>(API_ROUTES.INSCRIPCION.DATOS);
    } catch (error) {
      console.error('Error obteniendo datos de inscripción:', error);
      throw error;
    }
  },

  /**
   * Busca unidades educativas según un término de búsqueda
   */
  async buscarUnidadesEducativas(query: string): Promise<ApiResponse<any>> {
    try {
      return await apiService.get(`${API_ROUTES.INSCRIPCION.BUSCAR_UNIDADES}?q=${encodeURIComponent(query)}`);
    } catch (error) {
      console.error('Error buscando unidades educativas:', error);
      throw error;
    }
  },

  /**
   * Registra un estudiante completo con todas sus inscripciones
   */
  async inscribirEstudiante(formData: InscripcionCompletaForm): Promise<ApiResponse<InscripcionCompletaResponse>> {
    try {
      return await apiService.post<InscripcionCompletaResponse>(
        API_ROUTES.INSCRIPCION.INSCRIPCION_COMPLETA,
        formData
      );
    } catch (error) {
      console.error('Error al realizar inscripción completa:', error);
      throw error;
    }
  }
};
