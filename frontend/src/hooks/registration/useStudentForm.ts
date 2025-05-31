// filepath: c:\xampp\htdocs\oh-sansi\frontend\src\hooks\useStudentForm.ts
import { useState, useEffect } from 'react';
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
  updateActiveStudent
}: UseStudentFormProps): UseStudentFormReturn => {
  const [formData, setFormData] = useState<EstudianteFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [formErrorMessage, setFormErrorMessage] = useState('');

  // Sync formData when initialFormData changes
  useEffect(() => {
    setFormData(initialFormData);
  }, [initialFormData]);

  const handleFormChange = (field: string, value: string) => {
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
  };

  const handleStudentInfoLoaded = async (ci: string) => {
    await handleStudentInfoLoadedUtil(
      ci,
      formData,
      setFormData,
      setFormErrors,
      formErrors,
      updateActiveStudent,
      areas_seleccionadas
    );
  };

  const handleTutorLoaded = async (ci: string) => {
    await handleTutorLoadedUtil(
      ci,
      formData,
      setFormData,
      setFormErrors,
      formErrors,
      updateActiveStudent,
      areas_seleccionadas
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
