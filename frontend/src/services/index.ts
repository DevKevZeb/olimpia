/**
 * Punto central de exportación para todos los servicios API
 */

// Exportar los nuevos servicios orientados a casos de uso
export { homeService } from './homeService';
export { inscripcionService, type DatosInscripcionResponse, type InscripcionCompletaForm, type InscripcionCompletaResponse } from './inscripcionService';
export { adminService, type DashboardDataResponse, type ConvocatoriaCompletaForm } from './adminService';

// Mantener exportaciones de servicios CRUD si son necesarias como respaldo
export {
  getAreas,
  getAreaById,
  createArea,
  updateArea,
  deleteArea,
  getAreaCosts,
} from './areasService';

export {
  getNiveles,
  getNivelById,
  createNivel,
  updateNivel,
  deleteNivel,
  getNivelesByArea,
} from './nivelService';

export {
  getGrados,
  getGradoById,
  createGrado,
  updateGrado,
  deleteGrado,
} from './gradoService';

export {
  getInscripciones,
  getInscripcionById,
  createInscripcion,
  updateInscripcion,
  deleteInscripcion,
  getInscripcionesByEstudiante,
} from './inscripcionesService';

export { convocatoriaService } from './convocatoriaService';

export { dashboardService, type DashboardStats, type AreaStats, type LevelStats, type DepartmentStats, type MonthlyPaymentStats } from './dashboardService';

export { pagoService } from './pagoService';

export { estudianteService } from './estudianteService';

export { tutorService } from './tutorService';

export { listaInscripcionService } from './listaInscripcionService';
