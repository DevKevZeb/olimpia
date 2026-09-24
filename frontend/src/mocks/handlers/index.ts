import { adminHandlers } from './admin';
import { authHandlers } from './auth';
import { catalogosHandlers } from './catalogos';
import { documentosHandlers } from './documentos';
import { inscripcionHandlers } from './inscripcion';
import { pagosHandlers } from './pagos';
import { reportesHandlers } from './reportes';

/** Todos los endpoints que consume el frontend, agrupados por dominio. */
export const handlers = [
  ...authHandlers,
  ...adminHandlers,
  ...catalogosHandlers,
  ...inscripcionHandlers,
  ...pagosHandlers,
  ...reportesHandlers,
  ...documentosHandlers,
];
