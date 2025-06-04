// filepath: c:\xampp\htdocs\oh-sansi\frontend\src\hooks\useAreasSelection.ts
import { useState, useEffect, useCallback } from 'react';
import { getAreasPorGrado } from '../../api/registration/inscripcionCompletaApi';
import { 
  EstudianteFormData, 
  Convocatoria,
  AreaNivel, 
  AreaSeleccionada
} from '../../types/registration';

interface UseAreasSelectionProps {
  formData: EstudianteFormData;
  id_grado: string;
  id_convocatoria: string;
  setFormData: React.Dispatch<React.SetStateAction<EstudianteFormData>>;
  convocatoria: Convocatoria | null;
  setFormErrorMessage: React.Dispatch<React.SetStateAction<string>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  updateActiveStudent: (newFormData: EstudianteFormData, newSelectedAreas: AreaSeleccionada[]) => void;
  isStep2?: boolean; // Prop opcional para controlar si estamos en el paso 2
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
  id_grado,
  id_convocatoria,
  setFormData,
  convocatoria,
  setFormErrorMessage,
  setIsLoading,
  updateActiveStudent,
  isStep2 = false
}: UseAreasSelectionProps): UseAreasSelectionReturn => {
  // Debug: Log when hook is initialized
  console.log('🚀 useAreasSelection: Hook inicializado con valores:', {
    id_grado,
    id_convocatoria,
    isStep2: isStep2,
    timestamp: new Date().toISOString()
  });
  // Estados para áreas
  const [areasNiveles, setAreasNiveles] = useState<AreaNivel[]>([]);
  const [areas_seleccionadas, setSelectedAreas] = useState<AreaSeleccionada[]>([]);
  const [costoTotal, setCostoTotal] = useState(0);
  // Sincronizar el estado local con las áreas del estudiante activo
  useEffect(() => {
    console.log('🔄 Sincronizando áreas con el estudiante activo:', {
      formDataAreas: formData.areas_seleccionadas?.length || 0,
      timestamp: new Date().toISOString()
    });

    // Inicializar o actualizar las áreas seleccionadas del estudiante activo
    if (formData.areas_seleccionadas) {
      setSelectedAreas(formData.areas_seleccionadas);
      
      // Calcular el costo total
      const total = formData.areas_seleccionadas.reduce((sum, area) => {
        return sum + (parseFloat(area.costo) || 0);
      }, 0);
      setCostoTotal(total);
      
      console.log('✅ Áreas sincronizadas:', {
        areas: formData.areas_seleccionadas.length,
        costoTotal: total
      });
    } else {
      // Si no hay áreas en formData, resetear el estado local
      setSelectedAreas([]);
      setCostoTotal(0);
      console.log('🔄 Áreas reseteadas - nuevo estudiante sin áreas seleccionadas');
    }
  }, [formData.areas_seleccionadas]); // Solo depende de las áreas del formData  // Cargar áreas disponibles cuando se selecciona un grado
  const fetchAreasPorGrado = useCallback(async () => {
    console.log('🔍 fetchAreasPorGrado ejecutado - valores:');
    console.log('  - id_grado:', id_grado, '(tipo:', typeof id_grado, ')');
    console.log('  - id_convocatoria:', id_convocatoria, '(tipo:', typeof id_convocatoria, ')');
    console.log('  - id_grado es truthy:', !!id_grado);
    console.log('  - id_convocatoria es truthy:', !!id_convocatoria);
    
    // Verificar que tenemos los datos necesarios para cargar áreas
    if (!id_grado || !id_convocatoria) {
      console.log('❌ Faltan datos requeridos para cargar áreas:');
      console.log('  - id_grado:', id_grado);
      console.log('  - id_convocatoria:', id_convocatoria);
      console.log('  - 📋 IMPORTANTE: Las áreas se cargan tan pronto como se selecciona un grado, no solo en Step 2');
      return;
    }
    
    console.log('✅ Todas las condiciones cumplidas, haciendo llamada API...');
    setIsLoading(true);
    try {
      const gradoId = parseInt(id_grado);
      const convocatoriaId = parseInt(id_convocatoria);
      
      console.log('📞 Llamando getAreasPorGrado con:', { gradoId, convocatoriaId });
      const data = await getAreasPorGrado(gradoId, convocatoriaId);
      
      console.log('📊 Datos recibidos de la API:', data);
        if (data && data.areas_niveles) {
        setAreasNiveles(data.areas_niveles);
        console.log('✅ Áreas cargadas exitosamente:', data.areas_niveles.length, 'áreas disponibles');
      } else {
        console.log('⚠️ No se encontraron áreas para este grado');
        setAreasNiveles([]);
      }
    } catch (error) {
      console.error('❌ Error al obtener áreas por grado:', error);
      setFormErrorMessage('Hubo un problema al cargar las áreas disponibles. Por favor, intenta nuevamente.');
      setAreasNiveles([]);
    } finally {
      setIsLoading(false);
    }
  }, [id_grado, id_convocatoria, setIsLoading, setFormErrorMessage]);  // Efecto principal: Cargar áreas tan pronto como se selecciona un grado
  useEffect(() => {
    console.log('🔄 useAreasSelection: useEffect disparado - valores:', {
      id_grado,
      id_convocatoria,
      timestamp: new Date().toISOString()
    });
    
    // Las áreas se cargan cuando se selecciona un grado, NO solo en step 2
    fetchAreasPorGrado();
  }, [id_grado, id_convocatoria, fetchAreasPorGrado]);

  // Efecto adicional para asegurar que las áreas se muestran cuando llegamos al step 2
  useEffect(() => {
    if (isStep2 && formData.id_grado && formData.id_convocatoria) {
      console.log('🎯 Step 2 detectado - verificando si las áreas ya están cargadas...');
      console.log('  - Áreas disponibles:', areasNiveles.length);
      
      if (areasNiveles.length === 0) {
        console.log('🔄 Forzando recarga de áreas en Step 2...');
        setTimeout(() => {
          fetchAreasPorGrado();
        }, 100);
      } else {
        console.log('✅ Las áreas ya están cargadas para mostrar en Step 2');
      }
    }
  }, [isStep2, formData.id_grado, formData.id_convocatoria, areasNiveles.length, fetchAreasPorGrado]);
  // Función para manejar la selección de áreas
  const handleAreaSelect = useCallback((areaNivel: AreaNivel) => {
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
      areas_seleccionadas: updatedSelectedAreas,
      tutores_academicos: updatedTutores
    };
    
    setFormData(newFormData);
    updateActiveStudent(newFormData, updatedSelectedAreas);
  }, [
    areas_seleccionadas, 
    convocatoria, 
    costoTotal, 
    formData, 
    setFormData, 
    setFormErrorMessage, 
    updateActiveStudent
  ]);

  return {
    areasNiveles,
    areas_seleccionadas,
    costoTotal,
    handleAreaSelect,
    setSelectedAreas,
    setCostoTotal
  };
};
