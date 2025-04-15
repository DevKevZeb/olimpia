import React, { useState, useEffect } from 'react';
import { Calendar, Check, ChevronRight, Upload, X, AlertCircle, Plus, Trash2, Copy, Users } from 'lucide-react';
import { verificarCodigoOrden, subirComprobantePago } from '../api/comprobantePagoApi';
import { getDatosInscripcion, getAreasPorGrado, inscribirEstudiante, buscarUnidadesEducativas } from '../api/inscripcionCompletaApi';

// Definir una interfaz para la estructura de datos de un estudiante
interface EstudianteFormData {
  id: string;
  nombres: string;
  apellidos: string;
  ci: string;
  fecha_nacimiento: string;
  email: string;
  id_grado: string;
  unidad_educativa: {
    id_unidad_educativa: null | number;
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
  tutores_academicos: Array<any>;
  areas_seleccionadas: Array<any>;
}

export default function Registration() {
  // Estados originales para verificación de código
  const [step, setStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [ordenInfo, setOrdenInfo] = useState(null); 
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState(''); // Error para sección "Completar Inscripción"
  const [formErrorMessage, setFormErrorMessage] = useState(''); // Error para sección "Proceso de Inscripción"
  const codigo_unico = `OCEP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
  // Estados para la inscripción
  const [isLoading, setIsLoading] = useState(false);
  const [convocatoria, setConvocatoria] = useState(null);
  const [grados, setGrados] = useState([]);
  const [areasNiveles, setAreasNiveles] = useState([]);
  const [unidadesEducativas, setUnidadesEducativas] = useState([]);
  const [buscandoUnidades, setBuscandoUnidades] = useState(false);
  
  // Estados para inscripción múltiple
  const [activeStudentIndex, setActiveStudentIndex] = useState(0);
  const [estudiantes, setEstudiantes] = useState<EstudianteFormData[]>([]);
  const [costoTotalGeneral, setCostoTotalGeneral] = useState(0);

  // Estado para almacenar los datos del formulario (para compatibilidad con código existente)
  const [formData, setFormData] = useState({
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
    id_convocatoria: '',
    areas_seleccionadas: [],
    tutores_academicos: [],
  });
  
  const fetchCodigoUnico = async () => {
    try {
      const  datos = {
        lista_inscripcion:estudiantes,
          id_convocatoria:"1",
          codigo_unico: codigo_unico

      };


      console.log(datos);
      const data = await inscribirEstudiante( JSON.stringify(datos));
      console.log(data);
      // setCodigoUnico(data['orden_pago']['codigo_unico']);
      // setCodigo(data['orden_pago']['codigo_unico']);
      // setIsLoading(false);
      // setTimeout(() => {
        // generatePDF();
      // }, 500);

    } catch (error) {
      console.error("Error al obtener el código:", error);
      setIsLoading(false);
    }
};
  // Estado para rastrear las áreas seleccionadas con sus niveles y costos
  const [areas_seleccionadas, setSelectedAreas] = useState([]);
  
  // Estado para almacenar el costo total
  const [costoTotal, setCostoTotal] = useState(0);

  // Estados para el modal de detalles de estudiante
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState<EstudianteFormData | null>(null);

  // Estado para el modal de la boleta de pago
  const [isBoletaModalOpen, setIsBoletaModalOpen] = useState(false);

  // Función para abrir el modal con los detalles de un estudiante específico
  const openStudentDetailsModal = (estudiante: EstudianteFormData) => {
    setSelectedStudentDetails(estudiante);
    setIsModalOpen(true);
  };

  // Función para cerrar el modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedStudentDetails(null);
  };

 

  // Función para abrir el modal de la boleta de pago
  const openBoletaModal = () => {
    setIsBoletaModalOpen(true);
    
    // Iniciar descarga automáticamente
    console.log("Iniciando descarga automática de boleta...");
    // En un caso real, aquí se haría la llamada a la API para generar y descargar el PDF
    setTimeout(() => {
      // Simulación de descarga completada
      console.log("Boleta descargada automáticamente");
    }, 1000);
  };

  // Función para cerrar el modal de la boleta de pago y resetear
  const closeBoletaModal = () => {``
    setIsBoletaModalOpen(false);
    
    // Resetear datos y redirigir al step 1
    const newEstudiante = createNewEstudiante();
    setEstudiantes([newEstudiante]);
    setActiveStudentIndex(0);
    setStep(1);
    setSelectedAreas([]);
    setCostoTotal(0);
    setCostoTotalGeneral(0);
    
    // Resetear el formulario
    setFormData({
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
      id_convocatoria: convocatoria ? convocatoria.id : '',
      areas_seleccionadas: [],
      tutores_academicos: [],
    });
  };

  // Inicializar el primer estudiante cuando se monta el componente
  useEffect(() => {
    const newEstudiante = createNewEstudiante();
    setEstudiantes([newEstudiante]);
    fetchInitialData();
  }, []);

  // Función para crear un nuevo estudiante con valores iniciales
  const createNewEstudiante = (): EstudianteFormData => {
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

  // Sincronizar formData con estudiante activo
  useEffect(() => {
    if (estudiantes.length > 0 && activeStudentIndex < estudiantes.length) {
      const activeStudent = estudiantes[activeStudentIndex];
      
      // Utilizamos una verificación para evitar actualizaciones innecesarias
      if (
        formData.nombres !== activeStudent.nombres ||
        formData.apellidos !== activeStudent.apellidos ||
        formData.ci !== activeStudent.ci ||
        formData.fecha_nacimiento !== activeStudent.fecha_nacimiento ||
        formData.email !== activeStudent.email ||
        formData.id_grado !== activeStudent.id_grado ||
        JSON.stringify(formData.unidad_educativa) !== JSON.stringify(activeStudent.unidad_educativa) ||
        JSON.stringify(formData.tutor_legal) !== JSON.stringify(activeStudent.tutor_legal)
      ) {
        setFormData({
          ...formData,
          nombres: activeStudent.nombres,
          apellidos: activeStudent.apellidos,
          ci: activeStudent.ci,
          fecha_nacimiento: activeStudent.fecha_nacimiento,
          email: activeStudent.email,
          id_grado: activeStudent.id_grado,
          unidad_educativa: activeStudent.unidad_educativa,
          tutor_legal: activeStudent.tutor_legal,
        });
      }
      
      // Solo actualizamos las áreas seleccionadas si son diferentes
      if (JSON.stringify(areas_seleccionadas) !== JSON.stringify(activeStudent.areas_seleccionadas || [])) {
        setSelectedAreas(activeStudent.areas_seleccionadas || []);
      }
      
      // Calculamos el costo solo cuando cambiamos de estudiante
      let costoEstudiante = 0;
      if (activeStudent.areas_seleccionadas && activeStudent.areas_seleccionadas.length > 0) {
        costoEstudiante = activeStudent.areas_seleccionadas.reduce((total, area) => 
          total + (parseFloat(area.costo) || 0), 0);
      }
      setCostoTotal(costoEstudiante);
    }
  }, [activeStudentIndex, estudiantes]); // Solo dependemos del índice activo y el array de estudiantes

  // Recalcular costo total general cuando cambian las áreas seleccionadas de cualquier estudiante
  useEffect(() => {
    const costoGeneral = estudiantes.reduce((total, estudiante) => {
      if (estudiante.areas_seleccionadas && estudiante.areas_seleccionadas.length > 0) {
        return total + estudiante.areas_seleccionadas.reduce((subtotal, area) => 
          subtotal + (parseFloat(area.costo) || 0), 0);
      }
      return total;
    }, 0);
    
    setCostoTotalGeneral(costoGeneral);
  }, [estudiantes]); // Solo dependemos del array de estudiantes

  // Actualizar los datos del estudiante activo cuando cambia formData
  const updateActiveStudent = (newFormData, newSelectedAreas) => {
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

  // Añadir un nuevo estudiante
  const addNewStudent = () => {
    setEstudiantes([...estudiantes, createNewEstudiante()]);
    setActiveStudentIndex(estudiantes.length);
    // Redirigir al paso 1 para completar los datos del nuevo estudiante
    setStep(1);
  };

  // Eliminar un estudiante
  const removeStudent = (index: number) => {
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

  // Función para copiar datos del estudiante actual al siguiente
  const copyToNextStudent = () => {
    if (activeStudentIndex === estudiantes.length - 1) {
      // Si es el último estudiante, crear uno nuevo con los datos copiados
      const currentStudent = estudiantes[activeStudentIndex];
      const newStudent = {
        ...currentStudent,
        id: `estudiante-${Date.now()}`,
        nombres: '',
        apellidos: '',
        ci: '',
        email: '',
        // Mantener datos de unidad educativa y tutor legal
      };
      
      setEstudiantes([...estudiantes, newStudent]);
      setActiveStudentIndex(estudiantes.length);
    } else {
      // Copiar al siguiente estudiante existente
      const currentStudent = estudiantes[activeStudentIndex];
      const updatedEstudiantes = [...estudiantes];
      updatedEstudiantes[activeStudentIndex + 1] = {
        ...updatedEstudiantes[activeStudentIndex + 1],
        unidad_educativa: {...currentStudent.unidad_educativa},
        tutor_legal: {...currentStudent.tutor_legal},
      };
      
      setEstudiantes(updatedEstudiantes);
      setActiveStudentIndex(activeStudentIndex + 1);
    }
  };

  // Cargar datos iniciales cuando se monta el componente
  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const data = await getDatosInscripcion();
      console.log('Datos iniciales recibidos:', data);
      console.log('Grados recibidos:', data.grados);
      setConvocatoria(data.convocatoria);
      setGrados(data.grados);
      setFormData(prev => ({
        ...prev,
        id_convocatoria: data.convocatoria.id,
      }));
    } catch (error) {
      console.error('Error al obtener datos iniciales:', error);
      setErrorMessage('No se pudieron cargar los datos iniciales. Por favor, intente de nuevo más tarde.');
    } finally {
      setIsLoading(false);
    }
  };
  
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
          setErrorMessage('No se pudieron cargar las áreas disponibles para el grado seleccionado.');
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchAreasPorGrado();
    }
  }, [formData.id_grado, formData.id_convocatoria]);

  // Función para manejar la verificación del código
  const handleVerification = async () => {
    if (!verificationCode.trim()) {
      setErrorMessage('Por favor ingrese un código de verificación');
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');
    
    try {
      // Llamar a la API para verificar el código
      const response = await verificarCodigoOrden(verificationCode);
      
      // Verificar el estado de la orden
      if (response.orden.estado === 'pagada') {
        setErrorMessage('Esta orden de pago ya ha sido pagada. No es necesario subir un comprobante.');
        setIsVerifying(false);
        return;
      }
      
      if (response.orden.estado === 'vencida') {
        setErrorMessage('Esta orden de pago está vencida. Por favor genere una nueva orden.');
        setIsVerifying(false);
        return;
      }
      
      // Verificar si ya tiene comprobante asociado
      if (response.tiene_comprobante) {
        setErrorMessage('Esta orden ya tiene un comprobante de pago en proceso de verificación.');
        setIsVerifying(false);
        return;
      }
      
      // Almacenar la información de la orden
      setOrdenInfo(response);
      setIsVerified(true);
    } catch (error) {
      let message = 'Error al verificar el código';
      
      if (error.response) {
        // Error con respuesta del servidor
        if (error.response.status === 404) {
          message = 'No se encontró una orden con ese código';
        } else if (error.response.data?.message) {
          message = error.response.data.message;
        }
      }
      
      setErrorMessage(message);
    } finally {
      setIsVerifying(false);
    }
  };

  // Función para manejar la selección de archivo
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    } 
  };

  // Función para manejar la carga del archivo
  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMessage('Por favor seleccione un archivo para cargar');
      return;
    }
      
    if (!ordenInfo) {
      setErrorMessage('No hay información de la orden para proceder');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setErrorMessage('');

    // Crear FormData para enviar el archivo
    const formData = new FormData();
    formData.append('codigo_orden', ordenInfo.orden.codigo_unico);
    formData.append('numero_comprobante', `COMP-${Math.floor(Math.random() * 10000)}`); // Ejemplo, idealmente se pediría este dato
    formData.append('nombre_pagador', ordenInfo.orden.tipo_origen === 'individual' ? 
      (ordenInfo.estudiante?.nombre_completo || 'Pagador') : 
      (ordenInfo.unidad_educativa || 'Institución'));
    formData.append('fecha_pago', new Date().toISOString().split('T')[0]);
    formData.append('monto_pagado', ordenInfo.orden.monto_total);
    formData.append('pdf_comprobante', selectedFile);

    try {
      // Simular progreso de carga
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 10;
          if (newProgress >= 90) {
            clearInterval(interval);
            return 90; // Dejamos en 90% hasta que termine la solicitud real
          }
          return newProgress;
        });
      }, 300);

      // Llamar a la API para subir el comprobante
      await subirComprobantePago(formData);

      // Completar la carga
      setUploadProgress(100);
      setUploadComplete(true);
      
      clearInterval(interval);
    } catch (error) {
      let message = 'Error al subir el comprobante';
      if (error.response && error.response.data?.message) {
        message = error.response.data.message;
      }
      setErrorMessage(message);
    } finally {
      setIsUploading(false);
    }
  };

  // Función para reiniciar el proceso
  const resetVerification = () => {
    setVerificationCode('');
    setIsVerified(false);
    setOrdenInfo(null);
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    setUploadComplete(false);
    setErrorMessage('');
  };

  // Función para manejar la selección de áreas
  const handleAreaSelect = (areaNivel) => {
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

  // Función para validar campos obligatorios del paso 1
  const validateStep1 = () => {
    // Lista de campos obligatorios del estudiante
    const requiredFields = [
      { field: formData.nombres, name: 'Nombres' },
      { field: formData.apellidos, name: 'Apellidos' },
      { field: formData.ci, name: 'Cédula de Identidad' },
      { field: formData.fecha_nacimiento, name: 'Fecha de Nacimiento' },
      { field: formData.email, name: 'Correo Electrónico' },
      { field: formData.id_grado, name: 'Grado' },
      { field: formData.unidad_educativa.nombre, name: 'Unidad Educativa' },
    ];
    
    // Campos obligatorios del tutor legal
    const requiredTutorFields = [
      { field: formData.tutor_legal.nombres, name: 'Nombres del Tutor Legal' },
      { field: formData.tutor_legal.apellidos, name: 'Apellidos del Tutor Legal' },
      { field: formData.tutor_legal.ci, name: 'CI del Tutor Legal' },
      { field: formData.tutor_legal.email, name: 'Email del Tutor Legal' },
      { field: formData.tutor_legal.telefono, name: 'Teléfono del Tutor Legal' },
      { field: formData.tutor_legal.parentesco, name: 'Parentesco del Tutor Legal' },
    ];
    
    // Verificar campos del estudiante
    for (const { field, name } of requiredFields) {
      if (!field || field.trim() === '') {
        setFormErrorMessage(`El campo ${name} es obligatorio`);
        return false;
      }
    }
    
    // Verificar campos del tutor legal
    for (const { field, name } of requiredTutorFields) {
      if (!field || field.trim() === '') {
        setFormErrorMessage(`El campo ${name} es obligatorio`);
        return false;
      }
    }
    
    // Validar formato de email del estudiante
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormErrorMessage('El formato del correo electrónico no es válido');
      return false;
    }
    
    // Validar formato de email del tutor legal
    if (!emailRegex.test(formData.tutor_legal.email)) {
      setFormErrorMessage('El formato del correo electrónico del tutor legal no es válido');
      return false;
    }
    
    // Si todo es válido
    setFormErrorMessage('');
    return true;
  };
  
  // Función para validar todos los estudiantes antes de avanzar al siguiente paso
  const validateAllStudents = () => {
    // Guardar el índice actual para restaurarlo después
    const currentIndex = activeStudentIndex;
    
    // Verificar cada estudiante
    for (let i = 0; i < estudiantes.length; i++) {
      setActiveStudentIndex(i);
      
      // Esperar a que se actualice el estado
      setTimeout(() => {
        if (!validateStep1()) {
          return false;
        }
      }, 0);
    }
    
    // Restaurar el índice original
    setActiveStudentIndex(currentIndex);
    return true;
  };
  
  // Validar si el estudiante actual tiene los datos requeridos
  const isCurrentStudentValid = () => {
    // Validación básica de campos obligatorios del estudiante actual
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

  // Función para manejar el cambio al siguiente paso
  const handleNextStep = () => {
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
    } else if (step === 2) {
      // Verificar si al menos un estudiante tiene áreas seleccionadas
      const hasSelectedAreas = estudiantes.some(e => 
        e.areas_seleccionadas && e.areas_seleccionadas.length > 0
      );
      
      if (!hasSelectedAreas) {
        setFormErrorMessage('Debe seleccionar al menos un área para un estudiante');
        return;
      }
      
      setFormErrorMessage('');
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  // Función para manejar cambios en los inputs del formulario
  const handleFormChange = (field, value) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    updateActiveStudent(newFormData, areas_seleccionadas);
  };

  // Función para manejar cambios en los campos anidados
  const handleNestedChange = (parentField, field, value) => {
    const newFormData = { 
      ...formData, 
      [parentField]: { 
        ...formData[parentField], 
        [field]: value 
      } 
    };
    setFormData(newFormData);
    updateActiveStudent(newFormData, areas_seleccionadas);
  };

  // Actualizar los tutores en el paso 3
  const handleTutorAcademicoChange = (index, field, value) => {
    const newTutores = [...formData.tutores_academicos];
    if (index >= 0) {
      newTutores[index] = { 
        ...newTutores[index], 
        [field]: value 
      };
      
      const newFormData = {
        ...formData,
        tutores_academicos: newTutores
      };
      
      setFormData(newFormData);
      updateActiveStudent(newFormData, areas_seleccionadas);
    }
  };

  // Crear un componente reutilizable para la barra de navegación entre estudiantes
  const EstudiantesNavBar = ({
    estudiantes,
    activeStudentIndex,
    setActiveStudentIndex,
    removeStudent,
    addNewStudent,
    copyToNextStudent,
    costoTotalGeneral,
    isCurrentStudentValid
  }) => (
    <div className="bg-gray-50 border rounded-lg p-3 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-base font-medium">Estudiantes</h4>
        <div className="flex items-center">
          <span className="text-sm text-gray-600 mr-2">Total: {costoTotalGeneral} Bs.</span>
          <button
            onClick={addNewStudent}
            className={`${!isCurrentStudentValid ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'} text-white rounded-md p-1.5 flex items-center justify-center transition-colors`}
            title={!isCurrentStudentValid ? "Complete los datos del estudiante actual antes de agregar uno nuevo" : "Añadir nuevo estudiante"}
            disabled={!isCurrentStudentValid}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
      
      <div className="flex flex-nowrap overflow-x-auto space-x-2 pb-2">
        {estudiantes.map((estudiante, index) => (
          <div 
            key={estudiante.id}
            className={`flex-shrink-0 flex items-center space-x-1 px-3 py-2 rounded-md cursor-pointer border ${activeStudentIndex === index 
              ? 'bg-blue-50 border-blue-300 text-blue-800' 
              : 'bg-white border-gray-200 hover:bg-gray-50'}`}
            onClick={() => setActiveStudentIndex(index)}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
              activeStudentIndex === index ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {index + 1}
            </div>
            <span className="text-sm font-medium truncate max-w-[120px]">
              {estudiante.nombres || estudiante.apellidos 
                ? `${estudiante.nombres} ${estudiante.apellidos}`.trim() 
                : `Estudiante ${index + 1}`}
            </span>
            
            {estudiantes.length > 1 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  removeStudent(index);
                }}
                className="text-gray-400 hover:text-red-500 ml-1"
                title="Eliminar estudiante"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
      
      <div className="flex justify-between items-center mt-2">
        <div className="flex items-center text-sm text-gray-600">
          <Users size={16} className="mr-1" />
          <span>{estudiantes.length} estudiante(s)</span>
        </div>
        <button
          onClick={copyToNextStudent}
          className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
          title="Copiar datos a un nuevo estudiante"
        >
          <Copy size={14} className="mr-1" />
          Copiar datos
        </button>
      </div>
    </div>
  );

  // Función que maneja la adición de un nuevo estudiante con validación
  const handleAddNewStudent = () => {
    // Verificar si el estudiante actual tiene datos completos antes de permitir añadir uno nuevo
    if (!isCurrentStudentValid()) {
      setFormErrorMessage('Debe completar los datos del estudiante actual antes de agregar uno nuevo.');
      return;
    }
    
    const newStudent = createNewEstudiante();
    setEstudiantes([...estudiantes, newStudent]);
    setActiveStudentIndex(estudiantes.length);
    
    // Redirigir al paso 1 para completar los datos del nuevo estudiante
    setStep(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-4">Inscripción</h1>
        <p className="text-gray-600 text-center mb-8">
          Completa el proceso de inscripción para participar en las olimpiadas científicas
        </p>

        {/* Active Call Section */}
        <div className="border rounded-lg p-6 mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 text-sm">⏱</span>
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-1">Convocatoria Activa</h2>
              {isLoading ? (
                <p className="text-sm text-gray-600 mb-1">Cargando información de convocatoria...</p>
              ) : convocatoria ? (
                <>
                  <p className="text-sm text-gray-600 mb-1">Te estás inscribiendo a: <span className="font-semibold">{convocatoria.nombre}</span></p>
                  <p className="text-sm text-gray-500">
                    Periodo de inscripción: {new Date(convocatoria.fecha_inicio).toLocaleDateString()} - {new Date(convocatoria.fecha_fin).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Puedes inscribirte hasta en <span className="font-semibold">{convocatoria.max_areas}</span> áreas
                  </p>
                </>
              ) : (
                <p className="text-sm text-red-600 mb-1">No hay convocatorias activas en este momento</p>
              )}
            </div>
          </div>
        </div>

        {/* Verification Code Section */}
        <div className="border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Completar Inscripción</h2>
          <p className="text-sm text-gray-600 mb-6">
            Si ya ha generado su boleta de pago y realizado el pago en cajas, complete su inscripción aquí
          </p>

          {/* Mensaje de error */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
              <p className="text-red-700 text-sm">{errorMessage}</p>
            </div>
          )}

          {!isVerified ? (
            <div className="mb-4">
              <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-1">
                Código de Inscripción
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="verificationCode"
                  className="flex-grow px-4 py-2 border rounded-l-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ingrese su código de inscripción"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  disabled={isVerifying}
                />
                <button
                  className={`${isVerifying ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-2 rounded-r-md flex items-center transition-colors`}
                  onClick={handleVerification}
                  disabled={isVerifying}
                >
                  <span className="mr-2">{isVerifying ? 'Verificando...' : 'Verificar'}</span>
                  {isVerifying ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                  ) : (
                    <Check size={16} />
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-start">
                <div className="flex-shrink-0 mr-3">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <div className="w-full">
                  <h3 className="text-green-800 font-medium">Código verificado correctamente</h3>
                  <p className="text-green-700 text-sm mt-1">
                    {ordenInfo?.orden.tipo_origen === 'individual' 
                      ? `Inscripción para ${ordenInfo?.estudiante?.nombre_completo}` 
                      : `Inscripción para ${ordenInfo?.unidad_educativa} (${ordenInfo?.estudiantes_count} estudiantes)`}
                  </p>
                  <div className="text-green-700 text-sm mt-2 flex flex-wrap justify-between">
                    <span>Monto total: <b>{ordenInfo?.orden.monto_total} Bs.</b></span>
                    <span>Estado: <span className="font-bold uppercase">{ordenInfo?.orden.estado}</span></span>
                    <span>Vence el: {new Date(ordenInfo?.orden.fecha_vencimiento).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {!uploadComplete ? (
                <div className="border border-gray-200 rounded-md p-4">
                  <h3 className="font-medium mb-3">Subir comprobante de pago</h3>
                  {!selectedFile ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => document.getElementById('fileInput').click()}>
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 mb-1">Haga clic para seleccionar un archivo</p>
                      <p className="text-xs text-gray-400">Formatos aceptados: JPG, PNG, PDF (máx. 5MB)</p>
                      <input 
                        type="file" 
                        id="fileInput" 
                        accept=".jpg,.jpeg,.png,.pdf" 
                        className="hidden" 
                        onChange={handleFileChange}
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md mb-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-blue-100 rounded-md flex items-center justify-center mr-3">
                            <span className="text-blue-600 font-medium text-sm">
                              {selectedFile.name.split('.').pop().toUpperCase()}
                            </span>
                          </div>
                          <div className="overflow-hidden">
                            <p className="font-medium text-sm truncate" title={selectedFile.name}>
                              {selectedFile.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(selectedFile.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <button 
                          className="text-gray-500 hover:text-gray-700" 
                          onClick={() => setSelectedFile(null)}
                          type="button"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {isUploading ? (
                        <div className="space-y-2">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                              style={{ width: `${uploadProgress}%` }}>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 text-right">{uploadProgress}% completado</p>
                        </div>
                      ) : (
                        <button 
                          onClick={handleUpload} 
                          type="button"
                          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 flex items-center justify-center"
                        >
                          <Upload size={16} className="mr-2" />
                          Subir comprobante
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Check className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-blue-800 font-medium">¡Inscripción completada con éxito!</h3>
                  </div>
                  <p className="text-blue-700 text-sm mb-4">
                    Su comprobante de pago ha sido recibido y su inscripción ha sido completada. Recibirá un correo electrónico con todos los detalles de su inscripción.
                  </p>
                  <div className="flex justify-between">
                    <button
                      onClick={resetVerification}
                      type="button"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Realizar otra inscripción
                    </button>
                    <button
                      type="button"
                      className="bg-blue-600 text-white px-4 py-1 text-sm rounded hover:bg-blue-700"
                    >
                      Ver detalles
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Estudiantes Navigation Bar - Moved to top level */}
        <div className="border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-2">Estudiantes para Inscripción</h2>
          <p className="text-sm text-gray-600 mb-4">
            Gestiona los estudiantes que deseas inscribir en esta convocatoria
          </p>

          <EstudiantesNavBar
            estudiantes={estudiantes}
            activeStudentIndex={activeStudentIndex}
            setActiveStudentIndex={setActiveStudentIndex}
            removeStudent={removeStudent}
            addNewStudent={addNewStudent}
            copyToNextStudent={copyToNextStudent}
            costoTotalGeneral={costoTotalGeneral}
            isCurrentStudentValid={isCurrentStudentValid()}
          />
        </div>

        {/* Registration Process Section */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Proceso de Inscripción</h2>
          <p className="text-sm text-gray-600 mb-6">
            Sigue los pasos para completar tu inscripción
          </p>

          {/* Steps */}
          <div className="flex justify-between mb-8">
            {/* Step 1 */}
            <div className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${step === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                <Check size={20} />
              </div>
              <div className="text-center mt-2">
                <p className="font-medium">Datos Personales</p>
                <p className="text-xs text-gray-500">Información del estudiante</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${step === 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                <Check size={20} />
              </div>
              <div className="text-center mt-2">
                <p className="font-medium">Selección de Áreas</p>
                <p className="text-xs text-gray-500">Áreas y niveles</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${step === 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                <Check size={20} />
              </div>
              <div className="text-center mt-2">
                <p className="font-medium">Tutores</p>
                <p className="text-xs text-gray-500">Información de tutores</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${step === 4 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                <Check size={20} />
              </div>
              <div className="text-center mt-2">
                <p className="font-medium">Confirmación</p>
                <p className="text-xs text-gray-500">Revisión y pago</p>
              </div>
            </div>
          </div>

          {/* Form Content based on step */}
          {step === 1 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Datos Personales</h3>
              <p className="text-sm text-gray-600 mb-3">Ingrese sus datos personales para la inscripción</p>
              
              {/* Mensaje de error del formulario */}
              {formErrorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{formErrorMessage}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Nombres */}
                <div>
                  <label htmlFor="nombres" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombres<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="nombres"
                    className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ingrese sus nombres"
                    value={formData.nombres}
                    onChange={(e) => handleFormChange('nombres', e.target.value)}
                    required
                  />
                </div>

                {/* Apellidos */}
                <div>
                  <label htmlFor="apellidos" className="block text-sm font-medium text-gray-700 mb-1">
                    Apellidos<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="apellidos"
                    className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ingrese sus apellidos"
                    value={formData.apellidos}
                    onChange={(e) => handleFormChange('apellidos', e.target.value)}
                    required
                  />
                </div>

                {/* Cédula de Identidad */}
                <div>
                  <label htmlFor="cedula" className="block text-sm font-medium text-gray-700 mb-1">
                    Cédula de Identidad<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="cedula"
                    className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Número de CI"
                    value={formData.ci}
                    onChange={(e) => handleFormChange('ci', e.target.value)}
                    required
                  />
                </div>

                {/* Fecha de Nacimiento */}
                <div>
                  <label htmlFor="fechaNacimiento" className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Nacimiento<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="fechaNacimiento"
                      className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Seleccione una fecha"
                      value={formData.fecha_nacimiento}
                      onChange={(e) => handleFormChange('fecha_nacimiento', e.target.value)}
                      required
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <Calendar size={18} className="text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Correo Electrónico */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Correo Electrónico<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ejemplo@email.com"
                    value={formData.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                    required
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    id="telefono"
                    className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Número de teléfono"
                  />
                </div>

                {/* Unidad Educativa - Cambiado de dropdown a campo de texto */}
                <div>
                  <label htmlFor="unidadEducativa" className="block text-sm font-medium text-gray-700 mb-1">
                    Unidad Educativa<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="unidadEducativa"
                    className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ingrese su unidad educativa"
                    value={formData.unidad_educativa.nombre}
                    onChange={(e) => handleNestedChange('unidad_educativa', 'nombre', e.target.value)}
                    required
                  />
                </div>

                {/* Curso */}
                <div>
                  <label htmlFor="id_grado" className="block text-sm font-medium text-gray-700 mb-1">
                    Grado<span className="text-red-500">*</span>
                  </label>
                  <select
                    id="id_grado"
                    name="id_grado"
                    className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
                    value={formData.id_grado}
                    onChange={(e) => {
                      console.log("Grado seleccionado:", e.target.value);
                      handleFormChange('id_grado', e.target.value);
                    }}
                    required
                  >
                    <option value="" className="text-gray-800">Seleccione su grado</option>
                    {isLoading ? (
                      <option disabled className="text-gray-800">Cargando grados...</option>
                    ) : (
                      grados.map((grado) => (
                        <option key={grado.id} value={grado.id} className="text-gray-800">
                          {grado.nombre || grado.nombre_grado}
                        </option>
                      ))
                    )}
                  </select>
                  {formData.id_grado && (
                    <p className="text-xs text-green-600 mt-1">
                      Los grados determinan las áreas y niveles disponibles en la siguiente sección.
                    </p>
                  )}
                </div>

                {/* Departamento */}
                <div>
                  <label htmlFor="departamento" className="block text-sm font-medium text-gray-700 mb-1">
                    Departamento<span className="text-red-500">*</span>
                  </label>
                  <select
                    id="departamento"
                    className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                    value={formData.unidad_educativa.departamento}
                    onChange={(e) => handleNestedChange('unidad_educativa', 'departamento', e.target.value)}
                    required
                  >
                    <option value="">Seleccione su departamento</option>
                    <option value="La Paz">La Paz</option>
                    <option value="Santa Cruz">Santa Cruz</option>
                    <option value="Cochabamba">Cochabamba</option>
                    <option value="Oruro">Oruro</option>
                    <option value="Potosí">Potosí</option>
                    <option value="Tarija">Tarija</option>
                    <option value="Beni">Beni</option>
                    <option value="Pando">Pando</option>
                    <option value="Chuquisaca">Chuquisaca</option>
                  </select>
                </div>
                
                {/* Provincia */}
                <div>
                  <label htmlFor="provincia" className="block text-sm font-medium text-gray-700 mb-1">
                    Provincia<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="provincia"
                    className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ingrese su provincia"
                    value={formData.unidad_educativa.provincia}
                    onChange={(e) => handleNestedChange('unidad_educativa', 'provincia', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Tutor Legal Section */}
              <div className="border rounded-lg p-6 mb-6 mt-6">
                <h4 className="text-base font-semibold mb-1">Tutor Legal</h4>
                <p className="text-xs text-gray-500 mb-4">Información del tutor legal (obligatorio)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  {/* Nombres */}
                  <div>
                    <label htmlFor="nombresTutorLegal" className="block text-sm font-medium text-gray-700 mb-1">
                      Nombres<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="nombresTutorLegal"
                      className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nombres del tutor"
                      value={formData.tutor_legal.nombres}
                      onChange={(e) => handleNestedChange('tutor_legal', 'nombres', e.target.value)}
                      required
                    />
                  </div>

                  {/* Apellidos */}
                  <div>
                    <label htmlFor="apellidosTutorLegal" className="block text-sm font-medium text-gray-700 mb-1">
                      Apellidos<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="apellidosTutorLegal"
                      className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Apellidos del tutor"
                      value={formData.tutor_legal.apellidos}
                      onChange={(e) => handleNestedChange('tutor_legal', 'apellidos', e.target.value)}
                      required
                    />
                  </div>

                  {/* Cédula de Identidad */}
                  <div>
                    <label htmlFor="cedulaTutorLegal" className="block text-sm font-medium text-gray-700 mb-1">
                      Cédula de Identidad<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="cedulaTutorLegal"
                      className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Número de CI"
                      value={formData.tutor_legal.ci}
                      onChange={(e) => handleNestedChange('tutor_legal', 'ci', e.target.value)}
                      required
                    />
                  </div>

                  {/* Parentesco */}
                  <div>
                    <label htmlFor="parentesco" className="block text-sm font-medium text-gray-700 mb-1">
                      Parentesco<span className="text-red-500">*</span>
                    </label>
                    <select
                      id="parentesco"
                      className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                      value={formData.tutor_legal.parentesco}
                      onChange={(e) => handleNestedChange('tutor_legal', 'parentesco', e.target.value)}
                      required
                    >
                      <option value="">Selecciona el parentesco</option>
                      <option value="Padre">Padre</option>
                      <option value="Madre">Madre</option>
                      <option value="Abuelo/a">Abuelo/a</option>
                      <option value="Tío/a">Tío/a</option>
                      <option value="Hermano/a">Hermano/a</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>

                  {/* Correo Electrónico */}
                  <div>
                    <label htmlFor="emailTutorLegal" className="block text-sm font-medium text-gray-700 mb-1">
                      Correo Electrónico<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="emailTutorLegal"
                      className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="correo@ejemplo.com"
                      value={formData.tutor_legal.email}
                      onChange={(e) => handleNestedChange('tutor_legal', 'email', e.target.value)}
                      required
                    />
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label htmlFor="telefonoTutorLegal" className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="telefonoTutorLegal"
                      className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Número de teléfono"
                      value={formData.tutor_legal.telefono}
                      onChange={(e) => handleNestedChange('tutor_legal', 'telefono', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleNextStep}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center"
                >
                  <span className="mr-2">Continuar</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Selección de Áreas</h3>
              <p className="text-sm text-gray-600 mb-6">
                Selecciona las áreas y niveles en los que deseas participar
                {convocatoria && ` en ${convocatoria.nombre}`}
              </p>

              {isLoading ? (
                <div className="flex justify-center items-center h-60">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                </div>
              ) : areasNiveles.length === 0 ? (
                <div className="text-center p-8 border rounded-lg">
                  <p className="text-gray-600 mb-2">No hay áreas disponibles para el grado seleccionado</p>
                  <p className="text-sm text-gray-500">Por favor, selecciona otro grado o contacta con el administrador.</p>
                </div>
              ) : (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <h4 className="text-base font-semibold">Áreas Disponibles</h4>
                      {convocatoria && (
                        <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          {areas_seleccionadas.length}/{convocatoria.max_areas}
                        </span>
                      )}
                      <div className="ml-2 text-gray-400 cursor-help" title="Puedes seleccionar hasta el máximo de áreas permitidas">
                        <span>ⓘ</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Costo Total</p>
                      <p className="font-bold">{costoTotal} Bs.</p>
                    </div>
                  </div>
                  
                  {/* Mensaje de error */}
                  {formErrorMessage && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 flex items-start">
                      <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
                      <p className="text-red-700 text-sm">{formErrorMessage}</p>
                    </div>
                  )}

                  {/* Lista de áreas disponibles */}
                  {areasNiveles.map((areaNivel) => (
                    <div key={areaNivel.id_convocatoria_nivel} className="border rounded-lg p-4 mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="font-semibold">{areaNivel.area.nombre}</h5>
                        <div className="flex items-center">
                          <span className="text-sm mr-2">{areaNivel.costo} Bs.</span>
                          <input 
                            type="checkbox" 
                            className="h-5 w-5 text-blue-600" 
                            checked={areas_seleccionadas.some(area => area.id_convocatoria_nivel === areaNivel.id_convocatoria_nivel)}
                            onChange={() => handleAreaSelect(areaNivel)}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">Nivel: <strong>{areaNivel.nivel.nombre}</strong></p>
                      </div>
                      {areas_seleccionadas.some(area => area.id_convocatoria_nivel === areaNivel.id_convocatoria_nivel) && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-green-600">✓ Área seleccionada. En el siguiente paso deberás ingresar la información del tutor académico.</p>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Mensaje para seleccionar al menos un área */}
                  {areas_seleccionadas.length === 0 && (
                    <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-md mt-4">
                      <p className="text-yellow-700 text-sm">Debes seleccionar al menos un área para continuar</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="border border-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-50 flex items-center"
                >
                  <span>Atrás</span>
                </button>
                <button
                  onClick={handleNextStep}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center"
                  disabled={areas_seleccionadas.length === 0}
                >
                  <span className="mr-2">Continuar</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Tutores Académicos</h3>
              <p className="text-sm text-gray-600 mb-6">
                Ingresa la información de tus tutores académicos para cada área seleccionada
              </p>

              {/* Mensaje de error del formulario */}
              {formErrorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{formErrorMessage}</p>
                </div>
              )}

              {/* Tutores Académicos Tab */}
              <div className="flex mb-4">
                <button className="flex-1 text-center py-2 border-b-2 border-blue-600 text-blue-600 font-medium">
                  Tutores Académicos
                </button>
                <button className="flex-1 text-center py-2 border-b border-gray-200 text-gray-500 bg-gray-50">
                  Reutilizar Datos
                </button>
              </div>

              {areas_seleccionadas.length === 0 ? (
                <div className="text-center p-8 border rounded-lg">
                  <p className="text-gray-600 mb-2">No has seleccionado áreas en el paso anterior</p>
                  <p className="text-sm text-gray-500">Por favor, regresa al paso anterior y selecciona al menos un área.</p>
                </div>
              ) : (
                <>
                  {/* Tutores académicos para cada área seleccionada */}
                  {areas_seleccionadas.map((area, index) => {
                    // Encontrar el índice del tutor académico correspondiente
                    const tutorIndex = formData.tutores_academicos.findIndex(
                      tutor => tutor.id_convocatoria_nivel === area.id_convocatoria_nivel
                    );

                    return (
                      <div key={area.id_convocatoria_nivel} className="border rounded-lg p-6 mb-6">
                        <h4 className="text-base font-semibold mb-1">Tutor para {area.area_nombre}</h4>
                        <p className="text-xs text-gray-500 mb-4">
                          Información del tutor académico para {area.area_nombre} - {area.nivel_nombre} (opcional)
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                          {/* Nombres */}
                          <div>
                            <label htmlFor={`nombres_${area.id_convocatoria_nivel}`} className="block text-sm font-medium text-gray-700 mb-1">
                              Nombres
                            </label>
                            <input
                              type="text"
                              id={`nombres_${area.id_convocatoria_nivel}`}
                              className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Nombres del tutor"
                              value={tutorIndex >= 0 ? formData.tutores_academicos[tutorIndex].nombres : ''}
                              onChange={(e) => handleTutorAcademicoChange(tutorIndex, 'nombres', e.target.value)}
                            />
                          </div>

                          {/* Apellidos */}
                          <div>
                            <label htmlFor={`apellidos_${area.id_convocatoria_nivel}`} className="block text-sm font-medium text-gray-700 mb-1">
                              Apellidos
                            </label>
                            <input
                              type="text"
                              id={`apellidos_${area.id_convocatoria_nivel}`}
                              className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Apellidos del tutor"
                              value={tutorIndex >= 0 ? formData.tutores_academicos[tutorIndex].apellidos : ''}
                              onChange={(e) => handleTutorAcademicoChange(tutorIndex, 'apellidos', e.target.value)}
                            />
                          </div>

                          {/* Correo Electrónico */}
                          <div>
                            <label htmlFor={`email_${area.id_convocatoria_nivel}`} className="block text-sm font-medium text-gray-700 mb-1">
                              Correo Electrónico
                            </label>
                            <input
                              type="email"
                              id={`email_${area.id_convocatoria_nivel}`}
                              className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                              placeholder="correo@ejemplo.com"
                              value={tutorIndex >= 0 ? formData.tutores_academicos[tutorIndex].email : ''}
                              onChange={(e) => handleTutorAcademicoChange(tutorIndex, 'email', e.target.value)}
                            />
                          </div>

                          {/* Teléfono */}
                          <div>
                            <label htmlFor={`telefono_${area.id_convocatoria_nivel}`} className="block text-sm font-medium text-gray-700 mb-1">
                              Teléfono
                            </label>
                            <input
                              type="tel"
                              id={`telefono_${area.id_convocatoria_nivel}`}
                              className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Número de teléfono"
                              value={tutorIndex >= 0 ? formData.tutores_academicos[tutorIndex].telefono : ''}
                              onChange={(e) => handleTutorAcademicoChange(tutorIndex, 'telefono', e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Cédula de Identidad */}
                        <div>
                          <label htmlFor={`ci_${area.id_convocatoria_nivel}`} className="block text-sm font-medium text-gray-700 mb-1">
                            Cédula de Identidad
                          </label>
                          <input
                            type="text"
                            id={`ci_${area.id_convocatoria_nivel}`}
                            className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Ingrese solo números"
                            value={tutorIndex >= 0 && formData.tutores_academicos[tutorIndex].ci ? formData.tutores_academicos[tutorIndex].ci : ''}
                            onChange={(e) => {
                              // Validar que solo se ingresen números
                              const value = e.target.value.replace(/[^0-9]/g, '');
                              handleTutorAcademicoChange(tutorIndex, 'ci', value);
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setStep(2)}
                  className="border border-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-50 flex items-center"
                >
                  <span>Atrás</span>
                </button>
                <button
                  onClick={handleNextStep}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center"
                >
                  <span className="mr-2">Continuar</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Confirmación y Boleta de Pago</h3>
              <p className="text-sm text-gray-600 mb-6">
                Revisa los datos de tu inscripción y descarga tu boleta de pago
              </p>

              {/* Información de la Convocatoria */}
              <div className="border-b pb-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-base font-semibold">Información de la Convocatoria</h4>
                  <button className="text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 011.414 0L10 10.586l-3.293-3.293a1 1 011.414-1.414l-4 4a1 1 01-1.414 0l-4-4a1 1 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                {convocatoria && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Nombre</p>
                      <p className="font-medium">{convocatoria.nombre}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Período de Inscripción</p>
                      <p className="font-medium">
                        {new Date(convocatoria.fecha_inicio).toLocaleDateString()} - {new Date(convocatoria.fecha_fin).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Áreas máximas por estudiante</p>
                      <p className="font-medium">{convocatoria.max_areas}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total de estudiantes</p>
                      <p className="font-medium">{estudiantes.length}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Resumen de Estudiantes */}
              <div className="border-b pb-4 mb-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-base font-semibold">Resumen de Estudiantes</h4>
                  <div className="flex items-center">
                    <span className="text-sm font-medium mr-2">Total: {estudiantes.length} estudiante(s)</span>
                    <button className="text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 011.414 0L10 10.586l-3.293-3.293a1 1 011.414-1.414l-4 4a1 1 01-1.414 0l-4-4a1 1 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {estudiantes.map((estudiante, index) => {
                    // Cálculo del costo por estudiante
                    const costoPorEstudiante = estudiante.areas_seleccionadas ? 
                      estudiante.areas_seleccionadas.reduce((total, area) => total + (parseFloat(area.costo) || 0), 0) : 0;
                      
                    // Determinar el color para el acordeón
                    const acordeonColor = index % 2 === 0 ? 'bg-gray-50' : 'bg-white';
                      
                    return (
                      <div key={estudiante.id} className={`rounded-lg border ${acordeonColor}`}>
                        <div className="p-4">
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mr-3 font-medium">
                                {index + 1}
                              </div>
                              <h5 className="font-medium">
                                {estudiante.nombres} {estudiante.apellidos}
                              </h5>
                            </div>
                            <div className="flex items-center">
                              <button 
                                onClick={() => openStudentDetailsModal(estudiante)}
                                className="mr-3 text-blue-600 hover:text-blue-800 flex items-center text-sm"
                                title="Ver detalles completos"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span className="ml-1">Ver detalles</span>
                              </button>
                              <div className="text-right">
                                <p className="text-sm text-gray-500">Costo</p>
                                <p className="font-medium">{costoPorEstudiante} Bs.</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm mb-3">
                            <div>
                              <span className="text-gray-500">CI:</span> {estudiante.ci}
                            </div>
                            <div>
                              <span className="text-gray-500">Email:</span> {estudiante.email}
                            </div>
                            <div>
                              <span className="text-gray-500">Grado:</span> {
                                grados.find(grado => grado.id.toString() === estudiante.id_grado.toString())?.nombre || ''
                              }
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <p className="text-sm font-medium mb-2">Áreas seleccionadas:</p>
                            <div className="space-y-1">
                              {estudiante.areas_seleccionadas && estudiante.areas_seleccionadas.length > 0 ? 
                                estudiante.areas_seleccionadas.map((area, i) => (
                                  <div key={i} className="flex justify-between text-sm border-b pb-1">
                                    <span>{area.area_nombre} - {area.nivel_nombre}</span>
                                    <span>{area.costo} Bs.</span>
                                  </div>
                                )) : 
                                <p className="text-sm text-gray-500">No hay áreas seleccionadas</p>
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="flex justify-end mt-4 pt-2">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Monto total general</p>
                    <p className="text-lg font-bold">{costoTotalGeneral} Bs.</p>
                  </div>
                </div>
              </div>
              

              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md mb-6">
                <p className="font-medium text-yellow-800 mb-1">Importante: Su inscripción no está completa</p>
                <p className="text-sm text-yellow-700 mb-2">Para completar su inscripción, siga estos pasos:</p>
                <ol className="text-sm text-yellow-700 list-decimal pl-5 space-y-1">
                  <li>Descargue la boleta de pago consolidada para todos los estudiantes</li>
                  <li>Realice el pago en las cajas de la facultad</li>
                  <li>Regrese a la página de inscripción e introduzca su código de inscripción</li>
                  <li>Suba el comprobante de pago para finalizar la inscripción de todos los estudiantes</li>
                </ol>
              </div>
              
              {/* Botones de acción */}
              <div className="flex gap-3 mb-6">
                <button
                  className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 flex items-center justify-center"
                  onClick={() => {
                    console.log(estudiantes);
                    fetchCodigoUnico();
                    openBoletaModal(); // Abre el modal con los detalles de la boleta
                    // La funcionalidad de descarga se implementará posteriormente
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 011-1h12a1 1 110 2H4a1 1 01-1-1zm3.293-7.707a1 1 011.414 0L9 10.586V3a1 1 112 0v7.586l1.293-1.293a1 1 011.414 1.414l-3 3a1 1 01-1.414 0l-3-3a1 1 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Descargar Boleta de Pago
                </button>
                <button
                  className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 flex items-center justify-center"
                  onClick={handleAddNewStudent}
                  title="Añadir nuevo estudiante"
                >
                  <Plus size={20} className="mr-2" />
                  Agregar Estudiante
                </button>
              </div>

             

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setStep(3)}
                  className="border border-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-50"
                >
                  Atrás
                </button>
              </div>
            </div>
          )}
        </div>

      {/* Modal de detalles del estudiante */}
      {isModalOpen && selectedStudentDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                Detalles de {selectedStudentDetails.nombres} {selectedStudentDetails.apellidos}
              </h3>
              <button 
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              {/* Datos Personales */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-800 mb-2 border-b pb-1">Datos Personales</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Nombres</p>
                    <p className="font-medium">{selectedStudentDetails.nombres}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Apellidos</p>
                    <p className="font-medium">{selectedStudentDetails.apellidos}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">CI</p>
                    <p className="font-medium">{selectedStudentDetails.ci}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fecha de Nacimiento</p>
                    <p className="font-medium">{selectedStudentDetails.fecha_nacimiento}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{selectedStudentDetails.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Grado</p>
                    <p className="font-medium">
                      {grados.find(g => g.id.toString() === selectedStudentDetails.id_grado.toString())?.nombre || ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Unidad Educativa */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-800 mb-2 border-b pb-1">Unidad Educativa</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Nombre</p>
                    <p className="font-medium">{selectedStudentDetails.unidad_educativa.nombre}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Departamento</p>
                    <p className="font-medium">{selectedStudentDetails.unidad_educativa.departamento}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Provincia</p>
                    <p className="font-medium">{selectedStudentDetails.unidad_educativa.provincia}</p>
                  </div>
                </div>
              </div>

              {/* Tutor Legal */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-800 mb-2 border-b pb-1">Tutor Legal</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Nombres</p>
                    <p className="font-medium">{selectedStudentDetails.tutor_legal.nombres}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Apellidos</p>
                    <p className="font-medium">{selectedStudentDetails.tutor_legal.apellidos}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">CI</p>
                    <p className="font-medium">{selectedStudentDetails.tutor_legal.ci}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Parentesco</p>
                    <p className="font-medium">{selectedStudentDetails.tutor_legal.parentesco}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{selectedStudentDetails.tutor_legal.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Teléfono</p>
                    <p className="font-medium">{selectedStudentDetails.tutor_legal.telefono}</p>
                  </div>
                </div>
              </div>

              {/* Áreas y tutores académicos */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-800 mb-2 border-b pb-1">Áreas seleccionadas</h4>
                {selectedStudentDetails.areas_seleccionadas && selectedStudentDetails.areas_seleccionadas.length > 0 ? (
                  <div className="space-y-4">
                    {selectedStudentDetails.areas_seleccionadas.map((area, index) => {
                      // Buscar el tutor académico para esta área
                      const tutorAcademico = selectedStudentDetails.tutores_academicos?.find(
                        tutor => tutor.id_convocatoria_nivel === area.id_convocatoria_nivel
                      );

                      return (
                        <div key={index} className="border p-3 rounded-md">
                          <div className="flex justify-between mb-2">
                            <h5 className="font-medium">{area.area_nombre} - {area.nivel_nombre}</h5>
                            <span className="text-sm font-medium">{area.costo} Bs.</span>
                          </div>
                          {tutorAcademico && (
                            <div className="mt-2 pt-2 border-t">
                              <p className="text-sm font-medium text-gray-700">Tutor Académico:</p>
                              <div className="grid grid-cols-2 gap-2 text-sm mt-1">
                                {tutorAcademico.nombres && (
                                  <div>
                                    <span className="text-gray-500">Nombres:</span> {tutorAcademico.nombres}
                                  </div>
                                )}
                                {tutorAcademico.apellidos && (
                                  <div>
                                    <span className="text-gray-500">Apellidos:</span> {tutorAcademico.apellidos}
                                  </div>
                                )}
                                {tutorAcademico.ci && (
                                  <div>
                                    <span className="text-gray-500">CI:</span> {tutorAcademico.ci}
                                  </div>
                                )}
                                {tutorAcademico.email && (
                                  <div>
                                    <span className="text-gray-500">Email:</span> {tutorAcademico.email}
                                  </div>
                                )}
                                {tutorAcademico.telefono && (
                                  <div>
                                    <span className="text-gray-500">Teléfono:</span> {tutorAcademico.telefono}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No hay áreas seleccionadas</p>
                )}
              </div>

              <div className="flex justify-end mt-4 pt-2 border-t">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de la boleta de pago */}
      {isBoletaModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Boleta de Pago Consolidada</h3>
              <button 
                onClick={closeBoletaModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Código de Inscripción</p>
                    <p className="font-medium">{codigo_unico}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Fecha</p>
                    <p className="font-medium">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-500">Tutor Legal Responsable</p>
                  <p className="font-medium">{estudiantes[0]?.tutor_legal.nombres} {estudiantes[0]?.tutor_legal.apellidos}</p>
                  <p className="text-sm text-gray-500">CI: {estudiantes[0]?.tutor_legal.ci}</p>
                </div>
                
                <div className="border rounded-lg p-4 mb-4 bg-gray-50">
                  <h4 className="font-medium text-gray-800 mb-3">Detalle de Estudiantes</h4>
                  <div className="border-t border-b py-2">
                    <div className="grid grid-cols-12 gap-2 mb-2 text-sm font-medium">
                      <div className="col-span-1">#</div>
                      <div className="col-span-4">Estudiante</div>
                      <div className="col-span-2">CI</div>
                      <div className="col-span-3">Áreas</div>
                      <div className="col-span-2 text-right">Costo</div>
                    </div>
                    
                    {estudiantes.map((estudiante, index) => {
                      const costoPorEstudiante = estudiante.areas_seleccionadas ? 
                        estudiante.areas_seleccionadas.reduce((total, area) => total + (parseFloat(area.costo) || 0), 0) : 0;
                        
                      return (
                        <div key={estudiante.id} className="grid grid-cols-12 gap-2 mb-1 text-sm py-1 border-b border-gray-100">
                          <div className="col-span-1">{index + 1}</div>
                          <div className="col-span-4">{estudiante.nombres} {estudiante.apellidos}</div>
                          <div className="col-span-2">{estudiante.ci}</div>
                          <div className="col-span-3">
                            {estudiante.areas_seleccionadas && estudiante.areas_seleccionadas.length > 0 ? (
                              <div className="flex flex-col">
                                {estudiante.areas_seleccionadas.map((area, i) => (
                                  <span key={i} className="text-xs">{area.area_nombre} - {area.nivel_nombre}</span>
                                ))}
                              </div>
                            ) : 'Sin áreas'}
                          </div>
                          <div className="col-span-2 text-right">{costoPorEstudiante} Bs.</div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="flex justify-between items-center py-2 text-sm">
                    <p className="font-medium">Subtotal</p>
                    <p className="font-medium">{costoTotalGeneral} Bs.</p>
                  </div>
                  <div className="flex justify-between items-center py-2 text-sm font-bold">
                    <p>TOTAL A PAGAR</p>
                    <p>{costoTotalGeneral} Bs.</p>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md mb-6">
                  <p className="font-medium text-yellow-800 mb-1">Instrucciones de pago</p>
                  <ol className="text-sm text-yellow-700 list-decimal pl-5 space-y-1">
                    <li>Presente esta boleta en las cajas de la facultad</li>
                    <li>Realice el pago del monto total indicado</li>
                    <li>Conserve el comprobante que le entregarán</li>
                    <li>Regrese a la página de inscripción e introduzca el código de verificación de esta boleta</li>
                    <li>Suba el comprobante de pago para finalizar la inscripción</li>
                  </ol>
                </div>

                <div className="border-t pt-4 mt-4 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500">Esta boleta es válida hasta:</p>
                    <p className="font-medium text-sm">{new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                  </div>
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                    onClick={() => {
                      // Al hacer clic en "Aceptar", cerramos el modal
                      closeBoletaModal();
                    }}
                  >
                    <Check size={18} className="mr-2" />
                    Aceptar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

</div>
  );
}