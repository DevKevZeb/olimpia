/**
 * Punto central de exportación para todos los servicios API
 */

// Exportaciones del servicio de áreas
export {
  getAreas,
  getAreaById,
  createArea,
  updateArea,
  deleteArea,
  getAreaCosts,
} from './areasService';

// Exportaciones del servicio de niveles
export {
  getNiveles,
  getNivelById,
  createNivel,
  updateNivel,
  deleteNivel,
  getNivelesByArea,
} from './nivelService';

// Exportaciones del servicio de grados
export {
  getGrados,
  getGradoById,
  createGrado,
  updateGrado,
  deleteGrado,
} from './gradoService';

// Exportaciones del servicio de inscripciones
export {
  getInscripciones,
  getInscripcionById,
  createInscripcion,
  updateInscripcion,
  deleteInscripcion,
  getInscripcionesByEstudiante,
} from './inscripcionesService';

// Exportaciones del servicio de convocatorias
export { convocatoriaService } from './convocatoriaService';

// Exportaciones del servicio de dashboard
export {
  dashboardService as dashboardService,
  type DashboardStats,
  type AreaStats,
  type LevelStats,
  type DepartmentStats,
  type MonthlyPaymentStats,
} from './dashboardService';

// Función para obtener estadísticas del dashboard
export const getDashboardStats = async () => {
  return await dashboardService.getStats();
};

// Exportaciones del servicio de pagos
export { pagoService } from './pagoService';

// Exportaciones del servicio de estudiantes
export { estudianteService } from './estudianteService';

// Exportaciones del servicio de tutores
export { tutorService } from './tutorService';

// Exportaciones del servicio de listas de inscripción
export { listaInscripcionService } from './listaInscripcionService';

// Función auxiliar para obtener costos (implementación temporal)
export const getCostos = async () => {
  try {
    // Implementación temporal - en una aplicación real, esto vendría de un servicio real
    return {
      status: 'success',
      data: [
        {
          Id_costo: 1,
          Id_area: 1,
          Id_nivel: 1,
          monto: 150,
        },
        {
          Id_costo: 2,
          Id_area: 2,
          Id_nivel: 2,
          monto: 200,
        },
      ],
    };
  } catch (error) {
    console.error('Error fetching costos:', error);
    throw error;
  }
};

// Función auxiliar para crear costo (implementación temporal)
export const createCosto = async (data: any) => {
  try {
    console.log('Creando costo con datos:', data);
    return {
      status: 'success',
      data: {
        Id_costo: Math.floor(Math.random() * 1000),
        ...data,
      },
    };
  } catch (error) {
    console.error('Error creating costo:', error);
    throw error;
  }
};
