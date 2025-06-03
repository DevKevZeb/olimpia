// filepath: c:\xampp\htdocs\oh-sansi\frontend\src\hooks\useStudentForm.ts
import { useState, useEffect, useRef } from 'react';
import { 
  EstudianteFormData, 
  FormErrors, 
  AreaSeleccionada,
  RequisitoGuardado
} from '../../types/registration';
import { validateStep1 } from '../../utils/registration/validationUtils';
import { 
  handleFormChange as handleFormChangeUtil,
  handleNestedChange as handleNestedChangeUtil,
  handleStudentInfoLoaded as handleStudentInfoLoadedUtil,
  handleTutorLoaded as handleTutorLoadedUtil
} from '../../utils/registration/formUtils';

interface UseStudentFormProps {
  initialFormData: EstudianteFormData;
  areas_seleccionadas: AreaSeleccionada[];
  requisitosGuardados: Record<string, RequisitoGuardado>;
  updateActiveStudent: (newFormData: EstudianteFormData, newSelectedAreas: AreaSeleccionada[]) => void;
  updateRequisitos?: (formData: EstudianteFormData) => void;
}

interface UseStudentFormReturn {
  formData: EstudianteFormData;
  formErrors: FormErrors;
  formErrorMessage: string;
  setFormData: React.Dispatch<React.SetStateAction<EstudianteFormData>>;
  setFormErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
  setFormErrorMessage: React.Dispatch<React.SetStateAction<string>>;
  handleFormChange: (field: string, value: string) => void;
  handleNestedChange: (parentField: string, field: string, value: string) => void;
  handleStudentInfoLoaded: (ci: string) => Promise<void>;
  handleTutorLoaded: (ci: string) => Promise<void>;
  validateStep1: () => boolean;
}

export const useStudentForm = ({
  initialFormData,
  areas_seleccionadas,
  requisitosGuardados,
  updateActiveStudent,
  updateRequisitos
}: UseStudentFormProps): UseStudentFormReturn => {  const [formData, setFormData] = useState<EstudianteFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [formErrorMessage, setFormErrorMessage] = useState('');

  // Debug: Track formData changes
  useEffect(() => {
    console.log('📊 useStudentForm: formData cambió:');
    console.log('  - id_grado:', formData.id_grado, '(tipo:', typeof formData.id_grado, ')');
    console.log('  - id_convocatoria:', formData.id_convocatoria, '(tipo:', typeof formData.id_convocatoria, ')');
  }, [formData.id_grado, formData.id_convocatoria]);  // Sync formData when initialFormData changes (but avoid unnecessary re-syncs)
  const prevInitialFormDataRef = useRef(initialFormData);
  useEffect(() => {
    // Only sync if the initialFormData actually changed (not just reference)
    if (JSON.stringify(prevInitialFormDataRef.current) !== JSON.stringify(initialFormData)) {
      console.log('🔧 useStudentForm: Sincronizando formData con initialFormData:');
      console.log('  - initialFormData.id_grado:', initialFormData.id_grado);
      console.log('  - initialFormData.id_convocatoria:', initialFormData.id_convocatoria);
      setFormData(initialFormData);
      
      // Update requirements when form data is initialized
      if (updateRequisitos && Object.keys(initialFormData).length > 0) {
        updateRequisitos(initialFormData);
      }
      
      prevInitialFormDataRef.current = initialFormData;
    }
  }, [initialFormData, updateRequisitos]);const handleFormChange = (field: string, value: string) => {
    // Debug: Log field changes, especially for id_grado
    if (field === 'id_grado') {
      console.log('🎯 useStudentForm: handleFormChange para id_grado:');
      console.log('  - Valor anterior:', formData.id_grado);
      console.log('  - Nuevo valor:', value);
      console.log('  - Tipo del nuevo valor:', typeof value);
    }
    
    handleFormChangeUtil(
      formData,
      field,
      value,
      setFormData,
      setFormErrors,
      formErrors,
      updateActiveStudent,
      areas_seleccionadas
    );
    
    // Update requirements when form data changes
    if (updateRequisitos) {
      // Create updated form data to pass to updateRequisitos
      const updatedFormData = { ...formData, [field]: value };
      if (field === 'id_grado') {
        console.log('🎯 useStudentForm: formData actualizado enviado a updateRequisitos:', {
          id_grado: updatedFormData.id_grado,
          id_convocatoria: updatedFormData.id_convocatoria
        });
      }
      updateRequisitos(updatedFormData);
    }
  };
  const handleNestedChange = (parentField: string, field: string, value: string) => {
    handleNestedChangeUtil(
      formData,
      parentField,
      field,
      value,
      setFormData,
      updateActiveStudent,
      areas_seleccionadas
    );
    
    // Update requirements when form data changes
    if (updateRequisitos) {
      // Create updated form data to pass to updateRequisitos
      let updatedFormData: EstudianteFormData;
      
      if (parentField === 'unidad_educativa') {
        updatedFormData = {
          ...formData,
          unidad_educativa: {
            ...formData.unidad_educativa,
            [field]: value
          }
        };
      } else if (parentField === 'tutor_legal') {
        updatedFormData = {
          ...formData,
          tutor_legal: {
            ...formData.tutor_legal,
            [field]: value
          }
        };
      } else {
        // Fallback
        const parentData = formData[parentField as keyof EstudianteFormData];
        updatedFormData = { 
          ...formData, 
          [parentField]: typeof parentData === 'object' && parentData !== null 
            ? { ...parentData, [field]: value }
            : { [field]: value }
        };
      }
      
      updateRequisitos(updatedFormData);
    }
  };  const handleStudentInfoLoaded = async (ci: string) => {
    await handleStudentInfoLoadedUtil(
      ci,
      formData,
      setFormData,
      setFormErrors,
      formErrors,
      updateActiveStudent,
      areas_seleccionadas,
      updateRequisitos
    );
  };  const handleTutorLoaded = async (ci: string) => {
    await handleTutorLoadedUtil(
      ci,
      formData,
      setFormData,
      setFormErrors,
      formErrors,
      updateActiveStudent,
      areas_seleccionadas,
      updateRequisitos
    );
  };

  const validateStep1Func = () => {
    const validation = validateStep1(formData, requisitosGuardados);
    
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      setFormErrorMessage(validation.errorMessage);
    } else {
      setFormErrors({});
      setFormErrorMessage('');
    }
    
    return validation.isValid;
  };

  return {
    formData,
    formErrors,
    formErrorMessage,
    setFormData,
    setFormErrors,
    setFormErrorMessage,
    handleFormChange,
    handleNestedChange,
    handleStudentInfoLoaded,
    handleTutorLoaded,
    validateStep1: validateStep1Func
  };
};
