/**
 * Definiciones de tipos para la aplicación
 */

// Respuesta genérica de la API
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
}

// Estructura para respuestas paginadas
export interface PaginationResponse<T = any> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  links?: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

// Estructuras de Áreas
export interface BackendArea {
  id_area: number;
  nombre_area: string;
  descripcion: string;
  created_at?: string;
  updated_at?: string;
}

export interface Area {
  id: string;
  name: string;
  description: string;
}

// Estructuras de Niveles
export interface BackendNivel {
  id_nivel: number;
  nombre_nivel: string;
  id_area: number;
  id_grado_min: number;
  id_grado_max: number;
  area?: BackendArea;
  grado_min?: BackendGrado;
  grado_max?: BackendGrado;
  created_at?: string;
  updated_at?: string;
}

export interface Level {
  id: string;
  name: string;
  areaId: string;
  minGradeId: string;
  maxGradeId: string;
  area?: Area;
  minGrade?: Grade;
  maxGrade?: Grade;
}

// Estructuras de Grados
export interface BackendGrado {
  id_grado: number;
  nombre_grado: string;
  orden: number;
  created_at?: string;
  updated_at?: string;
}

export interface Grade {
  id: string;
  name: string;
  order: number;
}

// Estructuras de Convocatorias
export interface Announcement {
  id: string;
  name: string;
  registrationStartDate: string;
  registrationEndDate: string;
  maxAreasPerStudent: number;
  status: 'planned' | 'open' | 'closed' | 'finished';
  createdAt?: string;
  updatedAt?: string;
  areas?: AnnouncementArea[];
  levels?: AnnouncementLevel[];
}

export interface AnnouncementArea {
  id: string;
  announcementId: string;
  areaId: string;
  registrationCost: number;
  area?: Area;
}

export interface AnnouncementLevel {
  id: string;
  announcementId: string;
  levelId: string;
  level?: Level;
}

// Estructuras de Unidades Educativas
export interface EducationalUnit {
  id: string;
  name: string;
  department: string;
  province: string;
}

// Estructuras de Estudiantes
export interface Student {
  id: string;
  name: string;
  surname: string;
  ci: string;
  birthDate: string;
  email: string;
  school: string;
  gradeId: string;
  department: string;
  province: string;
  grade?: Grade;
}

// Estructuras de Tutores
export interface Guardian {
  id: string;
  name: string;
  surname: string;
  ci: string;
  phone: string;
  email: string;
  relationship: string;
  isSameAsStudent: boolean;
}

export interface AcademicTutor {
  id: string;
  name: string;
  surname: string;
  ci: string;
  phone: string;
  email: string;
}

// Estructuras de Inscripciones
export interface BackendInscripcion {
  id_inscripcion: number;
  id_estudiante: number;
  id_convocatoria_area: number;
  id_convocatoria_nivel: number;
  id_tutor_academico?: number;
  estado: string;
  fecha_inscripcion: string;
  estudiante?: any;
  convocatoria_area?: any;
  convocatoria_nivel?: any;
  tutor_academico?: any;
}

export interface Registration {
  id: string;
  studentId: string;
  announcementAreaId: string;
  announcementLevelId: string;
  academicTutorId?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  registrationDate: string;
  student?: Student;
  announcementArea?: AnnouncementArea;
  announcementLevel?: AnnouncementLevel;
  academicTutor?: AcademicTutor;
}

// Estructuras de Listas de Inscripción
export interface RegistrationList {
  id: string;
  code: string;
  educationalUnitId: string;
  creationDate: string;
  educationalUnit?: EducationalUnit;
  details: RegistrationListDetail[];
}

export interface RegistrationListDetail {
  id: string;
  listId: string;
  studentId: string;
  announcementAreaId: string;
  announcementLevelId: string;
  academicTutorId?: string;
  registrationDate: string;
  student?: any;
  announcementArea?: any;
  announcementLevel?: any;
  academicTutor?: any;
}

// Estructuras de Pagos
export interface PaymentOrder {
  id: string;
  code: string;
  sourceType: 'individual' | 'lista';
  registrationId?: string;
  listId?: string;
  amount: number;
  status: 'pending' | 'paid' | 'expired';
  creationDate: string;
  dueDate: string;
  registration?: Registration;
  registrationList?: RegistrationList;
}

export interface PaymentReceipt {
  id: string;
  orderId: string;
  receiptNumber: string;
  payerName: string;
  paymentDate: string;
  amountPaid: number;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  pdfPath: string;
  uploadDate: string;
  paymentOrder?: PaymentOrder;
}

// Estructuras de Usuarios
export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
}

// Exportar todas las interfaces
export type {
  // Ya están exportadas arriba
};