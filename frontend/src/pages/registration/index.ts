/**
 * Páginas relacionadas con el proceso de registration/inscripción
 * Exportaciones centralizadas para facilitar las importaciones
 */

// Páginas principales
export { default as RegistrationPage } from './RegistrationPage';
export { default as CompletarInscripcionPage } from './CompletarInscripcionPage';
export { default as DescargarBoletaPage } from './DescargarBoletaPage';
export { default as EstadoInscripcionPage } from './EstadoInscripcionPage';

// Tipos relacionados
export type { 
  EstudianteFormData, 
  AreaSeleccionada, 
  TutorAcademico,
  Convocatoria,
  FormErrors
} from '../../types/registration';
