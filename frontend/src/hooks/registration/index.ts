/**
 * Hooks específicos para el proceso de registration/inscripción
 * Exportaciones centralizadas para facilitar las importaciones
 */

// Hooks de verificación y carga de archivos
export { useCodeVerification } from './useCodeVerification';
export { useFileUpload } from './useFileUpload';

// Hooks de formularios y manejo de datos
export { useStudentForm } from './useStudentForm';
export { useMultipleStudents } from './useMultipleStudents';
export { useAreasSelection } from './useAreasSelection';

// Tipos de retorno de los hooks
export type { UseCodeVerificationReturn } from './useCodeVerification';
export type { UseFileUploadReturn } from './useFileUpload';
