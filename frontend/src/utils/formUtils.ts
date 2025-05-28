/**
 * Utilidades para manejo de formularios
 * Funciones extraídas de Registration.tsx para manejo de datos de formularios
 */

import { EstudianteFormData, FormErrors, AreaSeleccionada } from '../types/registration';
import { getUser } from '../api/inscripcionCompletaApi';

/**
 * Crear un nuevo estudiante con valores iniciales
 */
export const createNewEstudiante = (): EstudianteFormData => {
  return {
    id: `estudiante-${Date.now()}`,
    nombres: '',
    apellidos: '',
    ci: '',
    fecha_nacimiento: '',
    email: '',
    id_grado: '',
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
 * Manejar cambios en los inputs del formulario
 */
export const handleFormChange = (
  formData: EstudianteFormData,
  field: string,
  value: string,
  setFormData: (data: EstudianteFormData) => void,
  setFormErrors: (errors: FormErrors) => void,
  formErrors: FormErrors,
  updateActiveStudent: (formData: EstudianteFormData, areas: AreaSeleccionada[]) => void,
  areas_seleccionadas: AreaSeleccionada[]
) => {
  const newFormData = { ...formData, [field]: value };
  setFormData(newFormData);
  setFormErrors({ ...formErrors, [field]: '' });
  updateActiveStudent(newFormData, areas_seleccionadas);
};

/**
 * Manejar cambios en los campos anidados
 */
export const handleNestedChange = (
  formData: EstudianteFormData,
  parentField: string,
  field: string,
  value: string | number | boolean,
  setFormData: (data: EstudianteFormData) => void,
  updateActiveStudent: (formData: EstudianteFormData, areas: AreaSeleccionada[]) => void,
  areas_seleccionadas: AreaSeleccionada[]
) => {
  const newFormData = { 
    ...formData, 
    [parentField]: { 
      ...formData[parentField as keyof EstudianteFormData], 
      [field]: value 
    } 
  };
  setFormData(newFormData);
  updateActiveStudent(newFormData, areas_seleccionadas);
};

/**
 * Manejar búsqueda de usuario por CI
 */
export const handleCIChange = async (ci: string, type: string) => {
  const data = {
    'ci': ci,
    'type': type
  };

  const user = await getUser(data);
  return user;
};

/**
 * Manejar carga de información de estudiante
 */
export const handleStudentInfoLoaded = async (
  ci: string,
  formData: EstudianteFormData,
  setFormData: (data: EstudianteFormData) => void,
  setFormErrors: (errors: FormErrors) => void,
  formErrors: FormErrors,
  updateActiveStudent: (formData: EstudianteFormData, areas: AreaSeleccionada[]) => void,
  areas_seleccionadas: AreaSeleccionada[]
) => {
  if (ci.length < 8) {
    return;
  }
  
  const user = await handleCIChange(ci, 'estudiantes');

  const newFormData = { 
    ...formData, 
    ci: user.ci,
    nombres: user.nombres,
    apellidos: user.apellidos,
    email: user.email,
  };
   
  setFormData(newFormData);
  setFormErrors({ ...formErrors, ci: '', nombres: '', apellidos: '', email: '' });
  updateActiveStudent(newFormData, areas_seleccionadas);
};

/**
 * Manejar carga de información de tutor
 */
export const handleTutorLoaded = async (
  ci: string,
  formData: EstudianteFormData,
  setFormData: (data: EstudianteFormData) => void,
  setFormErrors: (errors: FormErrors) => void,
  formErrors: FormErrors,
  updateActiveStudent: (formData: EstudianteFormData, areas: AreaSeleccionada[]) => void,
  areas_seleccionadas: AreaSeleccionada[]
) => {
  if (ci.length < 8) {
    return;
  }
  
  const user = await handleCIChange(ci, 'tutores_legales');
  
  const newFormData = { 
    ...formData, 
    tutor_legal: { 
      ...formData.tutor_legal, 
      ci: user.ci,
      nombres: user.nombres,
      apellidos: user.apellidos,
      email: user.email,
      telefono: user.telefono,
    } 
  };
  
  setFormData(newFormData);
  setFormErrors({ 
    ...formErrors, 
    tutor_legal: { 
      ...formErrors.tutor_legal, 
      ci: '', 
      nombres: '', 
      apellidos: '', 
      email: '', 
      telefono: '' 
    } 
  });
  updateActiveStudent(newFormData, areas_seleccionadas);
};

/**
 * Actualizar los datos del estudiante activo
 */
export const updateActiveStudent = (
  estudiantes: EstudianteFormData[],
  activeStudentIndex: number,
  setEstudiantes: (estudiantes: EstudianteFormData[]) => void,
  newFormData: EstudianteFormData,
  newSelectedAreas: AreaSeleccionada[]
) => {
  if (estudiantes.length > 0 && activeStudentIndex < estudiantes.length) {
    const updatedEstudiantes = [...estudiantes];
    updatedEstudiantes[activeStudentIndex] = {
      ...updatedEstudiantes[activeStudentIndex],
      nombres: newFormData.nombres,
      apellidos: newFormData.apellidos,
      ci: newFormData.ci,
      fecha_nacimiento: newFormData.fecha_nacimiento,
      email: newFormData.email,
      id_grado: newFormData.id_grado,
      unidad_educativa: newFormData.unidad_educativa,
      tutor_legal: newFormData.tutor_legal,
      tutores_academicos: newFormData.tutores_academicos,
      areas_seleccionadas: newSelectedAreas
    };
    setEstudiantes(updatedEstudiantes);
  }
};

/**
 * Añadir un nuevo estudiante
 */
export const addNewStudent = (
  estudiantes: EstudianteFormData[],
  setEstudiantes: (estudiantes: EstudianteFormData[]) => void,
  setActiveStudentIndex: (index: number) => void,
  setStep: (step: number) => void
) => {
  const newEstudiante = createNewEstudiante();
  setEstudiantes([...estudiantes, newEstudiante]);
  setActiveStudentIndex(estudiantes.length);
  // Redirigir al paso 1 para completar los datos del nuevo estudiante
  setStep(1);
};

/**
 * Eliminar un estudiante
 */
export const removeStudent = (
  index: number,
  estudiantes: EstudianteFormData[],
  setEstudiantes: (estudiantes: EstudianteFormData[]) => void,
  activeStudentIndex: number,
  setActiveStudentIndex: (index: number) => void
) => {
  // No permitir eliminar si solo hay un estudiante
  if (estudiantes.length <= 1) return;
  
  const updatedEstudiantes = estudiantes.filter((_, i) => i !== index);
  setEstudiantes(updatedEstudiantes);
  
  // Actualizar el índice activo si es necesario
  if (activeStudentIndex >= updatedEstudiantes.length) {
    setActiveStudentIndex(updatedEstudiantes.length - 1);
  } else if (activeStudentIndex === index && index > 0) {
    setActiveStudentIndex(index - 1);
  }
};

/**
 * Verificar si el estudiante actual tiene los datos requeridos
 */
export const isCurrentStudentValid = (estudiantes: EstudianteFormData[], activeStudentIndex: number) => {
  const currentStudent = estudiantes[activeStudentIndex];
  if (!currentStudent) return false;
  
  return !!(
    currentStudent.nombres &&
    currentStudent.apellidos &&
    currentStudent.ci &&
    currentStudent.fecha_nacimiento &&
    currentStudent.email &&
    currentStudent.id_grado &&
    currentStudent.unidad_educativa?.nombre
  );
};

/**
 * Calcular el costo total de un estudiante
 */
export const calculateStudentCost = (areas_seleccionadas: AreaSeleccionada[]) => {
  if (!areas_seleccionadas || areas_seleccionadas.length === 0) return 0;
  
  return areas_seleccionadas.reduce((total, area) => 
    total + (parseFloat(area.costo) || 0), 0);
};

/**
 * Calcular el costo total general de todos los estudiantes
 */
export const calculateTotalCost = (estudiantes: EstudianteFormData[]) => {
  return estudiantes.reduce((total, estudiante) => {
    if (estudiante.areas_seleccionadas && estudiante.areas_seleccionadas.length > 0) {
      return total + estudiante.areas_seleccionadas.reduce((subtotal, area) => 
        subtotal + (parseFloat(area.costo) || 0), 0);
    }
    return total;
  }, 0);
};
