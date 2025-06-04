/**
 * Tipos e interfaces específicas para el proceso de registro/inscripción
 * Extraídas del componente Registration.tsx para mejor organización
 */

// Interfaces principales del sistema de inscripción
export interface Convocatoria {
  id: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  max_areas: number;
}

export interface Grado {
  id: number;
  nombre: string;
  nombre_grado?: string;
}

export interface Area {
  nombre: string;
}

export interface Nivel {
  nombre: string;
}

export interface AreaNivel {
  id_convocatoria_nivel: number;
  area: Area;
  nivel: Nivel;
  costo: string;
}

export interface AreaSeleccionada {
  id_convocatoria_nivel: number;
  area_nombre: string;
  nivel_nombre: string;
  costo: string;
}

export interface TutorAcademico {
  id_convocatoria_nivel: number;
  nombres: string;
  apellidos: string;
  ci: string;
  telefono: string;
  email: string;
}

export interface EstudianteFormData {
  id: string;
  nombres: string;
  apellidos: string;
  ci: string;
  fecha_nacimiento: string;
  email: string;
  telefono?: string;
  id_grado: string;
  genero: string;
  id_convocatoria: string;
  unidad_educativa: {
    id_unidad_educativa: number | null;
    nombre: string;
    departamento: string;
    provincia: string;
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
  tutores_academicos: TutorAcademico[];
  areas_seleccionadas: AreaSeleccionada[];
}

export interface FormErrors {
  nombres?: string;
  apellidos?: string;
  ci?: string;
  fecha_nacimiento?: string;
  email?: string;
  telefono?: string;
  id_grado?: string;
  genero?: string;
  unidad_educativa?: {
    departamento?: string;
    nombre?: string;
    provincia?: string;
  };
  tutor_legal?: {
    nombres?: string;
    apellidos?: string;
    ci?: string;
    telefono?: string;
    email?: string;
    parentesco?: string;
  };
}

export interface RequisitoGuardado {
  entidad: string;
  campo: string;
  es_obligatorio: boolean;
}

export interface RequisitoConvocatoria {
  entidad: string;
  campo: string;
  es_obligatorio: boolean;
}

export interface ComprobanteDetails {
  nombre?: string;
  numero_comprobante?: string;
  fecha?: string;
  monto?: number;
  ocr_text?: string;
}
