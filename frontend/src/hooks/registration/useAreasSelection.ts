// filepath: c:\xampp\htdocs\oh-sansi\frontend\src\hooks\useAreasSelection.ts
import { useState, useEffect } from 'react';
import { getAreasPorGrado } from '../../api/registration/inscripcionCompletaApi';
import { 
  EstudianteFormData, 
  Convocatoria,
  AreaNivel, 
  AreaSeleccionada
} from '../../types/registration';

interface UseAreasSelectionProps {
  formData: EstudianteFormData;
  setFormData: React.Dispatch<React.SetStateAction<EstudianteFormData>>;
  convocatoria: Convocatoria | null;
  setFormErrorMessage: React.Dispatch<React.SetStateAction<string>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  updateActiveStudent: (newFormData: EstudianteFormData, newSelectedAreas: AreaSeleccionada[]) => void;
}

interface UseAreasSelectionReturn {
  areasNiveles: AreaNivel[];
  areas_seleccionadas: AreaSeleccionada[];
  costoTotal: number;
  handleAreaSelect: (areaNivel: AreaNivel) => void;
  setSelectedAreas: React.Dispatch<React.SetStateAction<AreaSeleccionada[]>>;
  setCostoTotal: React.Dispatch<React.SetStateAction<number>>;
}

export const useAreasSelection = ({
  formData,
  setFormData,
  convocatoria,
  setFormErrorMessage,
  setIsLoading,
  updateActiveStudent
}: UseAreasSelectionProps): UseAreasSelectionReturn => {
  // Estados para áreas
  const [areasNiveles, setAreasNiveles] = useState<AreaNivel[]>([]);
  const [areas_seleccionadas, setSelectedAreas] = useState<AreaSeleccionada[]>([]);
  const [costoTotal, setCostoTotal] = useState(0);

  // Cargar áreas disponibles cuando se selecciona un grado
  useEffect(() => {
    if (formData.id_grado && formData.id_convocatoria) {
      const fetchAreasPorGrado = async () => {
        setIsLoading(true);
        try {
          const data = await getAreasPorGrado(parseInt(formData.id_grado), parseInt(formData.id_convocatoria));
          setAreasNiveles(data.areas_niveles);
          // Resetear áreas seleccionadas cuando cambia el grado
          setSelectedAreas([]);
          setCostoTotal(0);
        } catch (error) {
          console.error('Error al obtener áreas por grado:', error);
          setFormErrorMessage('Hubo un problema al cargar las áreas disponibles.');
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchAreasPorGrado();
    }
  }, [formData.id_grado, formData.id_convocatoria, setIsLoading, setFormErrorMessage]);

  // Función para manejar la selección de áreas
  const handleAreaSelect = (areaNivel: AreaNivel) => {
    // Verificar si ya está seleccionada
    const isSelected = areas_seleccionadas.some(item => item.id_convocatoria_nivel === areaNivel.id_convocatoria_nivel);
    
    // Verificar límite de áreas si estamos añadiendo una nueva
    if (!isSelected && convocatoria && areas_seleccionadas.length >= convocatoria.max_areas) {
      setFormErrorMessage(`Solo puede seleccionar hasta ${convocatoria.max_areas} áreas por estudiante`);
      return;
    }
    
    // Asegurar que el costo sea un número
    const costo = parseFloat(areaNivel.costo) || 0;
    
    // Actualizar las áreas seleccionadas
    let updatedSelectedAreas;
    let newCostoTotal = costoTotal;
    
    if (isSelected) {
      updatedSelectedAreas = areas_seleccionadas.filter(item => item.id_convocatoria_nivel !== areaNivel.id_convocatoria_nivel);
      newCostoTotal -= costo;
    } else {
      updatedSelectedAreas = [...areas_seleccionadas, {
        id_convocatoria_nivel: areaNivel.id_convocatoria_nivel,
        area_nombre: areaNivel.area.nombre,
        nivel_nombre: areaNivel.nivel.nombre,
        costo: areaNivel.costo
      }];
      newCostoTotal += costo;
    }
    
    setSelectedAreas(updatedSelectedAreas);
    setCostoTotal(newCostoTotal);
    
    // Actualizar los tutores académicos
    const updatedTutores = [...formData.tutores_academicos];
    if (!isSelected) {
      // Añadir un tutor nuevo para el área seleccionada
      updatedTutores.push({
        id_convocatoria_nivel: areaNivel.id_convocatoria_nivel,
        nombres: '',
        apellidos: '',
        ci: '',
        telefono: '',
        email: '',
      });
    } else {
      // Eliminar el tutor del área deseleccionada
      const tutorIndex = updatedTutores.findIndex(
        tutor => tutor.id_convocatoria_nivel === areaNivel.id_convocatoria_nivel
      );
      if (tutorIndex !== -1) {
        updatedTutores.splice(tutorIndex, 1);
      }
    }
    
    const newFormData = {
      ...formData,
      tutores_academicos: updatedTutores
    };
    
    setFormData(newFormData);
    updateActiveStudent(newFormData, updatedSelectedAreas);
  };

  return {
    areasNiveles,
    areas_seleccionadas,
    costoTotal,
    handleAreaSelect,
    setSelectedAreas,
    setCostoTotal
  };
};
