import axiosInstance from './axiosInstance';

interface GradoResponse {
    id: number;
    nombre_grado: string;
    orden: number;
    created_at: string;
    updated_at: string;
}
  
interface ApiResponse {
    success: boolean;
    message: string;
    data: GradoResponse | GradoResponse[];
}

interface ConvocatoriaNivelConfig {
  id_convocatoria_nivel: number;
  nombre_area: string;
  nombre_nivel: string;
  nombre_grado_min: string;
  nombre_grado_max: string;
  id_area: number; // Puedes mantener estos IDs si los necesitas
  id_nivel: number;
  id_grado_min: number;
  id_grado_max: number;
}

// Variable para almacenar todas las configuraciones cargadas
let allConvocatoriaNivelConfigs: ConvocatoriaNivelConfig[] = [];
let gradeNameToIdMap = new Map<string, number>();

/**
 * Busca el ID de convocatoria nivel basado en los nombres proporcionados.
 * @param idConvocatoria ID de la convocatoria activa
 * @param nombreArea Nombre del área
 * @param nombreNivel Nombre del nivel
 * @param nombreGrado Nombre del grado
 */
export const loadAllConvocatoriaNivelConfigs = async (selectedConvocatoriaId: number): Promise<void> => {
  try {
    const response = await axiosInstance.get(`/v1/convocatorianiveles/${selectedConvocatoriaId}`);
    allConvocatoriaNivelConfigs = response.data?.data || [];
    console.log('Todas las configuraciones cargadas:', allConvocatoriaNivelConfigs);

    // *** NUEVO: Llenar el mapa de nombres de grado a IDs ***
    gradeNameToIdMap.clear(); // Limpiar por si se llama varias veces
    allConvocatoriaNivelConfigs.forEach(config => {
      // Solo necesitamos añadir los nombres de grados únicos a nuestro mapa
      // Asegúrate de que las claves del mapa estén en minúsculas y sin espacios extra
      if (config.nombre_grado_min && config.id_grado_min) {
        gradeNameToIdMap.set(config.nombre_grado_min.toLowerCase().trim(), config.id_grado_min);
      }
      if (config.nombre_grado_max && config.id_grado_max) {
        gradeNameToIdMap.set(config.nombre_grado_max.toLowerCase().trim(), config.id_grado_max);
      }
    });
    console.log('Mapa de nombres de grado a IDs cargado:', gradeNameToIdMap);

  } catch (error) {
    console.error('Error al cargar todas las configuraciones de convocatoria nivel:', error);
    alert("Opsie! No se pudieron cargar las configuraciones de la convocatoria. Inténtalo de nuevo.");
    throw error;
  }
};

export const buscarIdConvocatoriaNivelEnMemoria = (
  nombreArea: string,
  nombreNivel: string,
  nombreGradoEntrada: string // Renombrado: Este es el nombre del grado que viene del Excel
): number | null => {
  const formattedNombreArea = nombreArea.toLowerCase().trim();
  const formattedNombreNivel = nombreNivel.toLowerCase().trim();
  const formattedNombreGradoEntrada = nombreGradoEntrada.toLowerCase().trim();

  // 1. Obtener el ID numérico del grado a partir de su nombre usando nuestro nuevo mapa
  const idGradoBuscado = gradeNameToIdMap.get(formattedNombreGradoEntrada);

  if (idGradoBuscado === undefined) {
    // Si el nombre del grado del Excel no se encuentra en nuestro mapa,
    // significa que no hay un ID correspondiente o el nombre no coincide.
    console.warn(`[buscarIdConvocatoriaNivelEnMemoria] Grado '${nombreGradoEntrada}' (formateado: '${formattedNombreGradoEntrada}') no encontrado en el mapa de grados cargados. La búsqueda fallará.`);
    return null;
  }

  // 2. Realizar la búsqueda usando el ID numérico
  const foundConfig = allConvocatoriaNivelConfigs.find(config => {
    // Asegurarse de que los nombres de área y nivel también se procesen en minúsculas y sin espacios en las configuraciones cargadas
    const configArea = config.nombre_area.toLowerCase().trim();
    const configNivel = config.nombre_nivel.toLowerCase().trim();

    // La comparación de rangos ahora usa el ID numérico obtenido
    const isGradeInRange = (idGradoBuscado >= config.id_grado_min && idGradoBuscado <= config.id_grado_max);

    return configArea === formattedNombreArea &&
           configNivel === formattedNombreNivel &&
           isGradeInRange;
  });

  if (!foundConfig) {
    console.warn(`[buscarIdConvocatoriaNivelEnMemoria] No se encontró una configuración coincidente para:
      Area: '${nombreArea}' (formateada: '${formattedNombreArea}')
      Nivel: '${nombreNivel}' (formateada: '${formattedNombreNivel}')
      Grado: '${nombreGradoEntrada}' (ID numérico: '${idGradoBuscado}')`);
  }

  return foundConfig?.id_convocatoria_nivel || null;
};


export const descargarPlantilla = async (idConvocatoria: number) => {
  try {
    const response = await axiosInstance.get(`/v1/excel/plantilla/${idConvocatoria}`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `plantilla_inscripcion_${idConvocatoria}.xlsx`);
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error al descargar plantilla:', error);
    alert('Error al descargar la plantilla.');
    throw error;
  }
};

let allGradesMap: Map<string, GradoResponse> = new Map();

export const loadAllGrades = async (): Promise<void> => {
  try {
      // Asume una ruta para obtener todos los grados, por ejemplo: /v1/grados
      const response = await axiosInstance.get<ApiResponse>('/v1/grados');
      if (response.data.success && Array.isArray(response.data.data)) {
          response.data.data.forEach((grado: GradoResponse) => {
              allGradesMap.set(grado.nombre_grado.toLowerCase().trim(), grado);
          });
          console.log('Todos los grados cargados y mapeados:', allGradesMap);
      } else {
          console.warn('No se pudieron cargar todos los grados o el formato de respuesta no es el esperado.');
      }
  } catch (error) {
      console.error('Error al cargar todos los grados:', error);
      alert("Opsie! No se pudieron cargar los grados disponibles. Inténtalo de nuevo.");
      throw error;
  }
};

export const getGradoIdByName = (nombreGrado: string): number | null => {
  const formattedNombreGrado = nombreGrado.toLowerCase().trim();
  const grado = allGradesMap.get(formattedNombreGrado);
  // You can choose to return 'id' or 'orden' here based on which one defines your grade hierarchy.
  // 'id' is generally safer as it's the primary key.
  return grado?.id || null;
};

export const obtenerIdGradoPorNombre = async (nombreGrado: string): Promise<GradoResponse | null> => {
    try {
      const response = await axiosInstance.get<ApiResponse>(`/v1/grados/por-nombre/${encodeURIComponent(nombreGrado)}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return null;
    } catch (error: any) {
      console.error('Error al obtener ID del grado por nombre:', error);
      throw error;
    }
  };