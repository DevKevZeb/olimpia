import { apiService } from './api';
import { API_ROUTES } from '../config';
import { Student, PaginationResponse } from '../types';

export const studentsService = {
  // Obtener todos los estudiantes con paginación
  async getStudents(page = 1) {
    return apiService.get<PaginationResponse<Student>>(
      `${API_ROUTES.ESTUDIANTES}?page=${page}`
    );
  },

  // Buscar estudiantes
  async searchStudents(query: string) {
    return apiService.get<PaginationResponse<Student>>(
      `${API_ROUTES.ESTUDIANTES_SEARCH}?query=${encodeURIComponent(query)}`
    );
  },

  // Obtener un estudiante específico
  async getStudent(id: string) {
    return apiService.get<Student>(`${API_ROUTES.ESTUDIANTES}/${id}`);
  },

  // Crear un estudiante nuevo
  async createStudent(student: Partial<Student>) {
    // Separa el nombre completo en nombre y apellidos si es necesario
    let nombres = student.name || '';
    let apellidos = '';
    
    if (nombres.includes(' ')) {
      const parts = nombres.split(' ');
      nombres = parts[0];
      apellidos = parts.slice(1).join(' ');
    }
    
    return apiService.post<Student>(API_ROUTES.ESTUDIANTES, {
      nombres: nombres,
      apellidos: apellidos,
      ci: student.ci,
      fecha_nacimiento: student.birthDate,
      email: student.email,
      id_unidad_educativa: student.educationalUnitId,
      id_grado: student.gradeId,
      id_tutor_legal: student.guardianId
    });
  },

  // Actualizar un estudiante
  async updateStudent(id: string, student: Partial<Student>) {
    // Separa el nombre completo en nombre y apellidos si es necesario
    let nombres = student.name || '';
    let apellidos = '';
    
    if (nombres.includes(' ')) {
      const parts = nombres.split(' ');
      nombres = parts[0];
      apellidos = parts.slice(1).join(' ');
    }
    
    return apiService.put<Student>(`${API_ROUTES.ESTUDIANTES}/${id}`, {
      nombres: nombres,
      apellidos: apellidos,
      ci: student.ci,
      fecha_nacimiento: student.birthDate,
      email: student.email,
      id_unidad_educativa: student.educationalUnitId,
      id_grado: student.gradeId,
      id_tutor_legal: student.guardianId
    });
  },

  // Eliminar un estudiante
  async deleteStudent(id: string) {
    return apiService.delete<null>(`${API_ROUTES.ESTUDIANTES}/${id}`);
  }
};
