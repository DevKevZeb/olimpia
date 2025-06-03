// filepath: c:\xampp\htdocs\oh-sansi\frontend\src\hooks\useMultipleStudents.ts
import { useState, useEffect, useCallback } from 'react';
import { EstudianteFormData, AreaSeleccionada } from '../types/index';
import { 
  createNewEstudiante,
  updateActiveStudent as updateActiveStudentUtil,
  removeStudent as removeStudentUtil,
  isCurrentStudentValid as isCurrentStudentValidUtil,
  calculateTotalCost
} from '../../utils/registration/formUtils';

interface UseMultipleStudentsProps {
  convocatoria: any;
}

interface UseMultipleStudentsReturn {
  estudiantes: EstudianteFormData[];
  activeStudentIndex: number;
  costoTotalGeneral: number;
  setEstudiantes: React.Dispatch<React.SetStateAction<EstudianteFormData[]>>;
  setActiveStudentIndex: React.Dispatch<React.SetStateAction<number>>;
  setCostoTotalGeneral: React.Dispatch<React.SetStateAction<number>>;
  updateActiveStudent: (newFormData: EstudianteFormData, newSelectedAreas: AreaSeleccionada[]) => void;
  removeStudent: (index: number) => void;
  isCurrentStudentValid: () => boolean;
  initializeFirstStudent: () => void;
  handleAddNewStudent: (
    setStep: React.Dispatch<React.SetStateAction<number>>,
    setFormErrorMessage: React.Dispatch<React.SetStateAction<string>>
  ) => void;
}

export const useMultipleStudents = ({ 
  convocatoria 
}: UseMultipleStudentsProps): UseMultipleStudentsReturn => {
  const [estudiantes, setEstudiantes] = useState<EstudianteFormData[]>([]);
  const [activeStudentIndex, setActiveStudentIndex] = useState(0);
  const [costoTotalGeneral, setCostoTotalGeneral] = useState(0);

  // Recalcular costo total general cuando cambian las áreas seleccionadas de cualquier estudiante
  useEffect(() => {
    const costoGeneral = calculateTotalCost(estudiantes);
    setCostoTotalGeneral(costoGeneral);
  }, [estudiantes]);
  const updateActiveStudent = useCallback((newFormData: EstudianteFormData, newSelectedAreas: AreaSeleccionada[]) => {
    updateActiveStudentUtil(
      estudiantes,
      activeStudentIndex,
      setEstudiantes,
      newFormData,
      newSelectedAreas
    );
  }, [estudiantes, activeStudentIndex]);
  const removeStudent = useCallback((index: number) => {
    removeStudentUtil(index, estudiantes, setEstudiantes, activeStudentIndex, setActiveStudentIndex);
  }, [estudiantes, activeStudentIndex]);

  const isCurrentStudentValid = useCallback(() => {
    return isCurrentStudentValidUtil(estudiantes, activeStudentIndex);
  }, [estudiantes, activeStudentIndex]);

  const initializeFirstStudent = useCallback(() => {
    const newEstudiante = createNewEstudiante(convocatoria);
    setEstudiantes([newEstudiante]);
    setActiveStudentIndex(0);
  }, [convocatoria]);

  const handleAddNewStudent = (
    setStep: React.Dispatch<React.SetStateAction<number>>,
    setFormErrorMessage: React.Dispatch<React.SetStateAction<string>>
  ) => {
    // Verificar si el estudiante actual tiene datos completos antes de permitir añadir uno nuevo
    if (!isCurrentStudentValid()) {
      setFormErrorMessage('Debe completar los datos del estudiante actual antes de agregar uno nuevo.');
      return;
    }
    
    const newStudent = createNewEstudiante(convocatoria);
    setEstudiantes([...estudiantes, newStudent]);
    setActiveStudentIndex(estudiantes.length);
    
    // Redirigir al paso 1 para completar los datos del nuevo estudiante
    setStep(1);
    setFormErrorMessage('');
  };

  return {
    estudiantes,
    activeStudentIndex,
    costoTotalGeneral,
    setEstudiantes,
    setActiveStudentIndex,
    setCostoTotalGeneral,
    updateActiveStudent,
    removeStudent,
    isCurrentStudentValid,
    initializeFirstStudent,
    handleAddNewStudent
  };
};
