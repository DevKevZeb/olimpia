import axiosInstance from '../axiosInstance';
import { EstudianteFormData, AreaSeleccionada } from '../../types/index';

// ====== TIPOS ESPECÍFICOS PARA BOLETAS ======

interface BoletaOrdenItem {
  ci: string;
  nombres: string;
  apellidos: string;
  nombre_area: string;
  nombre_nivel: string;
  costo_inscripcion: number;
  id_convocatoria_nivel: number;
}

interface BoletaResponse {
  orden: BoletaOrdenItem[];
  monto_total: number;
  encargado: {
    nombre: string;
    ci: string;
  };
}

// ====== FUNCIONES DE VERIFICACIÓN ======

/**
 * Verifica si existe una orden de pago con el código especificado
 * @param codigo Código único de la orden
 */
export const verificarCodigoOrden = async (codigo: string) => {
  try {
    const response = await axiosInstance.post('/v1/comprobantes-pago/verificar-codigo', {
      codigo_orden: codigo
    });
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error al verificar el código:', error);
    throw error;
  }
};

// ====== FUNCIONES DE COMPROBANTES ======

/**
 * Sube un comprobante de pago para una orden de pago
 * @param formData FormData con los datos del comprobante y el archivo
 */
export const subirComprobantePago = async (formData: FormData) => {
  try {
    const response = await axiosInstance.post('/v1/comprobantes-pago/por-codigo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        // Esta función se puede usar para reportar el progreso
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Progreso de carga: ${percentCompleted}%`);
        }
        // Aquí podrías actualizar el estado en el componente
      }
    });
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error al subir el comprobante:', error);
    throw error;
  }
};

// ====== FUNCIONES DE BOLETAS ======

/**
 * Descarga la información de una boleta de pago
 * @param codigo Código de boleta de pago 
 */
export const descargarBoleta = async (codigo: string) => {
  try {
    const response = await axiosInstance.get(`/v1/ordenes-pago/descargar/${codigo}`, {
    });

    const data = response.data?.data || response.data;
    return transformBoletaData(data);
  } catch (error) {
    console.error('Error al descargar boleta:', error);
    throw error;
  }
};

// ====== FUNCIONES AUXILIARES ======

/**
 * Busca el índice de un estudiante por CI en el array
 */
function getStudentIndexByCI(data: EstudianteFormData[], ci: string): number {
  for (let indx = 0; indx < data.length; indx++) {
    if (data[indx].ci === ci) {
      return indx;
    }
  }
  return -1;
}

/**
 * Crea un nuevo objeto estudiante con valores por defecto
 */
const createNewEstudiante = (): EstudianteFormData => {
  return {
    id: `estudiante-${Date.now()}`,
    nombres: '',
    apellidos: '',
    ci: '',
    fecha_nacimiento: '',
    email: '',
    id_grado: '',
    id_convocatoria: '', // Agregamos este campo requerido
    unidad_educativa: {
      id_unidad_educativa: null,
      nombre: '',
      departamento: '',
      provincia: '',
    },
    tutor_legal: {
      nombres: '',
      apellidos: '',
      ci: '',
      telefono: '',
      email: '',
      parentesco: '',
      es_el_mismo_estudiante: false,
    },
    tutores_academicos: [],
    areas_seleccionadas: []
  };
};

/**
 * Transforma los datos de la boleta del backend al formato del frontend
 */
function transformBoletaData(data: BoletaResponse) {
  const form: EstudianteFormData[] = [];

  data.orden.forEach((row: BoletaOrdenItem) => {
    let indx = getStudentIndexByCI(form, row.ci);

    if (indx === -1) {
      form.push(createNewEstudiante());
      indx = form.length - 1;
    }

    const area: AreaSeleccionada = {
      id_convocatoria_nivel: row.id_convocatoria_nivel,
      area_nombre: row.nombre_area,
      nivel_nombre: row.nombre_nivel,
      costo: row.costo_inscripcion.toString()
    };

    form[indx].ci = row.ci;
    form[indx].nombres = row.nombres;
    form[indx].apellidos = row.apellidos;
    form[indx].areas_seleccionadas.push(area);
  });

  return {
    estudiantes: form,
    costoTotalGeneral: data.monto_total,
    encargado: {
      nombre: data.encargado.nombre,
      ci: data.encargado.ci,
    }
  };
}