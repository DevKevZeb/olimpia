import { useState, useEffect, useCallback } from 'react';
import { Check, X } from 'lucide-react';

import { getDatosInscripcion, inscribirEstudiante, estudianteEstaInscrito } from '../../api/registration/inscripcionCompletaApi';
import { 
  EstudianteFormData, 
  Convocatoria, 
  Grado, 
  RequisitoGuardado,
  RequisitoConvocatoria,
  ComprobanteDetails,
  TutorAcademico,
  AreaSeleccionada
} from '../../types/index';

interface OrdenInfo {
  orden: {
    id: number;
    codigo_unico: string;
    monto_total: number;
    fecha_emision: string;
    fecha_vencimiento: string;
    estado: string;
    tipo_origen: string;
    [key: string]: unknown;
  };
  estudiante?: {
    nombre_completo: string;
    ci: string;
  };
  unidad_educativa?: string;
  estudiantes_count?: number;
  [key: string]: unknown;
}

import { fetchRequisitosConvocatoria } from '../../api/requisitoConvocatoria';
import { 
  StudentForm, 
  AreasSelection, 
  TutoresAcademicos, 
  ResumenInscripcion, 
  StudentsManager 
} from '../../components/registration';

// Importar custom hooks
import { 
  useStudentForm, 
  useMultipleStudents, 
  useAreasSelection 
} from '../../hooks/registration';

// Importar funciones utilitarias
import { validateStep1 } from '../../utils/registration/validationUtils';
import { createNewEstudiante, updateRequisitosValues } from '../../utils/registration/formUtils';

export default function RegistrationPage() {  // Estados esenciales para navegación y convocatoria
  const [step, setStep] = useState(1);
  const [encargadoApellido, setEncargadoApellido] = useState('');
  const [encargadoNombre, setEncargadoNombre] = useState('');
  const [encargadoCI, setEncargadoCI] = useState('');
  const [encargadoCorreo, setEncargadoCorreo] = useState('');
  const codigo_unico = `O-SANSI-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
  
  const [showEncargadoForm, setShowEncargadoForm] = useState(false);
  
  // Estados para la inscripción
  const [isLoading, setIsLoading] = useState(false);
  const [convocatoria, setConvocatoria] = useState<Convocatoria | null>(null);
  const [grados, setGrados] = useState<Grado[]>([]);
  // Estados para cargar requisitos obligatorios
  const [requisitosGuardados, setRequisitosGuardados] = useState<Record<string, RequisitoGuardado>>({});
  // Cargar datos iniciales cuando se monta el componente
  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getDatosInscripcion();
      console.log('Datos iniciales recibidos:', data);
      console.log('Grados recibidos:', data.grados);
      setConvocatoria(data.convocatoria);
      setGrados(data.grados);    } catch (error) {
      console.error('Error al obtener datos iniciales:', error);
    } finally {
      setIsLoading(false);
    }
  }, []); // Solo se ejecuta una vez - todas las funciones set son estables
  // Hook para gestión múltiple de estudiantes
  const {
    estudiantes,
    activeStudentIndex,
    costoTotalGeneral,
    setEstudiantes,
    setActiveStudentIndex,
    updateActiveStudent,
    removeStudent,
    isCurrentStudentValid,
    initializeFirstStudent  } = useMultipleStudents({ convocatoria });  // Function to update requirements when form data changes
  const updateRequisitos = useCallback((formData: EstudianteFormData) => {
    setRequisitosGuardados(currentRequisitos => {
      if (Object.keys(currentRequisitos).length > 0) {
        return updateRequisitosValues(formData, currentRequisitos);
      }
      return currentRequisitos;
    });
  }, []); // No dependencies needed since we use functional update

  // Hook para gestión del formulario del estudiante
  const {
    formData,
    formErrors,
    formErrorMessage,
    setFormData,
    setFormErrorMessage,
    handleFormChange,
    handleNestedChange,
    handleStudentInfoLoaded,
    handleTutorLoaded,
    validateStep1: validateStep1Hook  } = useStudentForm({
    initialFormData: estudiantes[activeStudentIndex] || createNewEstudiante(convocatoria || undefined),
    areas_seleccionadas: estudiantes[activeStudentIndex]?.areas_seleccionadas || [],
    requisitosGuardados,
    updateActiveStudent,
    updateRequisitos
  });  // Hook para gestión de selección de áreas
  // Debug: Log formData values before calling useAreasSelection
  console.log('🔍 RegistrationPage: formData values antes de useAreasSelection:');
  console.log('  - id_grado:', formData.id_grado, '(tipo:', typeof formData.id_grado, ')');
  console.log('  - id_convocatoria:', formData.id_convocatoria, '(tipo:', typeof formData.id_convocatoria, ')');
  console.log('  - step:', step);

  // Debug: Track formData changes
  useEffect(() => {
    console.log('🔄 RegistrationPage: formData cambió:');
    console.log('  - id_grado:', formData.id_grado, '(tipo:', typeof formData.id_grado, ')');
    console.log('  - id_convocatoria:', formData.id_convocatoria, '(tipo:', typeof formData.id_convocatoria, ')');
    console.log('  - step:', step);
    console.log('  - timestamp:', new Date().toISOString());
  }, [formData.id_grado, formData.id_convocatoria, step]);
  const {
    areasNiveles,
    areas_seleccionadas,
    costoTotal,
    handleAreaSelect,
    setSelectedAreas,
    setCostoTotal
  } = useAreasSelection({
    formData,
    setFormData,
    convocatoria,
    setFormErrorMessage,
    setIsLoading,
    updateActiveStudent,
    isStep2: step === 2  // Usamos esto solo para optimizar la visualización, no para bloquear la carga
  });

  // useEffect para cargar requisitos obligatorios cuando cambia la convocatoria
  useEffect(() => {
    const loadRequisitos = async () => {
      if (convocatoria) {
        try {
          console.log('convocatoria', convocatoria.id)
          const data = await fetchRequisitosConvocatoria(convocatoria.id);
          const initialRequisitosGuardados: Record<string, RequisitoGuardado> = {};
          data.forEach((requisito: RequisitoConvocatoria) => {
            const key = `${requisito.entidad}.${requisito.campo}`;
            initialRequisitosGuardados[key] = {
              obligatorio: requisito.es_obligatorio,
              valor: undefined,
            };
          });          setRequisitosGuardados(initialRequisitosGuardados);
          console.log('Requirements loaded for convocatoria:', convocatoria.id);
        } catch (error: unknown) {
          console.error('Error al cargar los requisitos:', (error as Error).message);
          setRequisitosGuardados({});
        }
      } else {
        setRequisitosGuardados({});
      }
    };

    loadRequisitos();
  }, [convocatoria]);  // useEffect para inicializar datos cuando se monta el componente
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]); // Solo se ejecuta una vez al montar
  // useEffect para actualizar id_convocatoria cuando se carga la convocatoria
  useEffect(() => {
    if (convocatoria && formData.id_convocatoria !== convocatoria.id.toString()) {
      console.log('🔄 RegistrationPage: Actualizando id_convocatoria en formData');
      console.log('  - Convocatoria cargada con ID:', convocatoria.id);
      console.log('  - Valor actual en formData:', formData.id_convocatoria);
      
      const updatedFormData = {
        ...formData,
        id_convocatoria: convocatoria.id.toString()
      };
      
      setFormData(updatedFormData);
      updateActiveStudent(updatedFormData, areas_seleccionadas);
      
      console.log('✅ RegistrationPage: id_convocatoria actualizado a:', convocatoria.id.toString());
    }
  }, [convocatoria, formData.id_convocatoria, setFormData, updateActiveStudent, formData, areas_seleccionadas]);

  // useEffect para asegurar que las áreas se cargan cuando llegamos al step 2
  useEffect(() => {
    if (step === 2 && formData.id_grado && formData.id_convocatoria) {
      console.log('🎯 RegistrationPage: Step 2 detectado con datos válidos');
      console.log('  - id_grado:', formData.id_grado);
      console.log('  - id_convocatoria:', formData.id_convocatoria);
      console.log('  - Las áreas deberían cargarse automáticamente via useAreasSelection');
    }
  }, [step, formData.id_grado, formData.id_convocatoria]);
  // useEffect para inicializar el primer estudiante
  useEffect(() => {
    if (estudiantes.length === 0) {
      initializeFirstStudent();
    }
  }, [estudiantes.length, initializeFirstStudent]);

  // useEffect para actualizar el formData cuando se carga la convocatoria
  useEffect(() => {
    if (convocatoria && setFormData) {
      setFormData(prev => ({
        ...prev,
        id_convocatoria: convocatoria.id.toString(),
      }));
    }  }, [convocatoria, setFormData]);

  // Función para enviar la inscripción
  const fetchCodigoUnico = async () => {
    try {
        const payload = {
          lista_inscripcion: estudiantes,
          id_convocatoria: convocatoria!.id.toString(),
        };
        const response = await estudianteEstaInscrito(payload);
        console.log('Respuesta de verificación exitosa:', response);
    } catch (error: any) {
      if (error.response?.status === 422 && error.response?.data?.errors) {
        const messages = Object.values(error.response.data.errors).flat() as string[];
        alert(`\nErrores de validación:\n${messages.join('\n')}`);
        return;
      } else if (error.response?.status === 409) {
        alert("Opsie! El estudiante ya está inscrito en esta materia y nivel.");
        return;
      } else {
        alert(`Opsie! Algo salió mal: ${error.response?.data?.message || error.message || 'Error desconocido'}`);
        return;
      }
    }
    
    const isEmailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(encargadoCorreo);
    const isEncargadoValido =
      encargadoNombre.trim() !== '' &&
      encargadoApellido.trim() !== '' &&
      isEmailValido &&
      encargadoCI.trim().length >= 7;

    if (!isEncargadoValido) {
      alert("Por favor completa correctamente todos los campos del encargado de pago antes de continuar.");
      return;
    }
    try {
      const datos = {
        lista_inscripcion: estudiantes,
        id_convocatoria: convocatoria!.id.toString(),
        codigo_unico: codigo_unico,
        encargado_pago: {
          ci_encargado: encargadoCI,
          nombres_encargado: encargadoNombre,
          apellidos_encargado: encargadoApellido,
          email_encargado: encargadoCorreo
        },
      };
      await inscribirEstudiante(JSON.stringify(datos));
      alert("Pre-inscripcion realizada satisfactoriamente! Yey! 🎉 \n  su codigo de inscripcion es: " + codigo_unico);
    } catch (error) {
      console.error("Error al obtener el código:", error);
      setIsLoading(false);
    }
  };

  // Estados para el modal de detalles de estudiante
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState<EstudianteFormData | null>(null);
  // Estado para el modal de la boleta de pago
  const [isBoletaModalOpen, setIsBoletaModalOpen] = useState(false);
  // Estado para el modal de detalles del comprobante
  const [isComprobanteModalOpen, setIsComprobanteModalOpen] = useState(false);
  // Estado para los detalles del comprobante (solo lectura)
  const [comprobanteDetails] = useState<ComprobanteDetails | null>(null);
  // Estado para ordenInfo (solo lectura)
  const [ordenInfo] = useState<OrdenInfo | null>(null);  // Función para abrir el modal con los detalles de un estudiante específico
  const openStudentDetailsModal = (estudiante: EstudianteFormData) => {
    setSelectedStudentDetails(estudiante);
    setIsModalOpen(true);
  };

  // Función para cerrar el modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedStudentDetails(null);
  };

  // Función para cerrar el modal de la boleta de pago y resetear
  const closeBoletaModal = () => {
    setIsBoletaModalOpen(false);
      // Resetear datos y redirigir al step 1
    const newEstudiante = createNewEstudiante(convocatoria || undefined);
    setEstudiantes([newEstudiante]);
    setActiveStudentIndex(0);
    setStep(1);
    setSelectedAreas([]);
    setCostoTotal(0);
    
    // Resetear el formulario
    setFormData({
      nombres: '',
      apellidos: '',
      ci: '',
      fecha_nacimiento: '',
      email: '',
      id_grado: '',
      genero: '',
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
      id_convocatoria: convocatoria ? convocatoria.id.toString() : '',
      areas_seleccionadas: [],
      tutores_academicos: [],
    });
  }
  
  const handleNextStep = () => {
    if (step === 1) {
      if (validateStep1Hook()) {
        const validation = validateStep1(formData, requisitosGuardados);
        
        if (validation.camposObligatoriosVacios.length > 0) {
          setFormErrorMessage(`Por favor, complete los siguientes campos obligatorios: ${validation.camposObligatoriosVacios.join(', ')}`);
          return;
        }        
        setFormErrorMessage('');
        console.log("📋 RegistrationPage: Paso 1->2 - Datos del formulario:");
        console.log("  - formData completo:", JSON.stringify(formData, null, 2));
        console.log("  - id_grado:", formData.id_grado, "(tipo:", typeof formData.id_grado, ")");
        console.log("  - id_convocatoria:", formData.id_convocatoria, "(tipo:", typeof formData.id_convocatoria, ")");
        console.log("  - ¿Los valores están definidos?", {
          id_grado_defined: formData.id_grado !== undefined && formData.id_grado !== null && formData.id_grado !== '',
          id_convocatoria_defined: formData.id_convocatoria !== undefined && formData.id_convocatoria !== null && formData.id_convocatoria !== ''
        });
        
        // Ir al paso 2
        setStep(2);
        
        console.log("🎯 RegistrationPage: Transición a Step 2 completada - las áreas deberían cargarse automáticamente");
      }
    } else if (step === 2) {
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
      setShowEncargadoForm(true);
      setStep(4);
    }
  };

  // Actualizar los tutores en el paso 3
  const handleTutorAcademicoChange = (index: number, field: keyof TutorAcademico, value: string) => {
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

  // Función que maneja la adición de un nuevo estudiante con validación
  const handleAddNewStudent = async () => {
    try {
        const payload = {
          lista_inscripcion: estudiantes,
          id_convocatoria: convocatoria!.id.toString(),
        };
        const response = await estudianteEstaInscrito(payload);
        console.log('Respuesta de verificación exitosa:', response);
    } catch (error: any) {
      if (error.response?.status === 422 && error.response?.data?.errors) {
        const messages = Object.values(error.response.data.errors).flat() as string[];
        alert(`\nErrores de validación:\n${messages.join('\n')}`);
        return;
      } else if (error.response?.status === 409) {
        alert("Opsie! El estudiante ya está inscrito en esta materia y nivel.");
        return;
      } else {
        alert(`Opsie! Algo salió mal: ${error.response?.data?.message || error.message || 'Error desconocido'}`);
        return;
      }
    }
    // Verificar si el estudiante actual tiene datos completos antes de permitir añadir uno nuevo
    if (!isCurrentStudentValid()) {
      setFormErrorMessage('Debe completar los datos del estudiante actual antes de agregar uno nuevo.');
      return;
    }
    

    const newStudent = createNewEstudiante(convocatoria || undefined);
    setEstudiantes([...estudiantes, newStudent]);
    setActiveStudentIndex(estudiantes.length);
    
    // Redirigir al paso 1 para completar los datos del nuevo estudiante    setStep(1);
  };
  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-lg shadow-lg  p-8">
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
          </div>        </div>        {/* Students Manager */}        <StudentsManager
          estudiantes={estudiantes}
          activeStudentIndex={activeStudentIndex}
          costoTotalGeneral={costoTotalGeneral}
          isCurrentStudentValid={isCurrentStudentValid()}
          formErrorMessage={formErrorMessage}
          onActiveStudentChange={setActiveStudentIndex}
          onRemoveStudent={removeStudent}
          onAddNewStudent={handleAddNewStudent}
        />

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
          </div>          {/* Form Content based on step */}
          {step === 1 && (
            <StudentForm
              formData={formData}
              formErrors={formErrors}
              formErrorMessage={formErrorMessage}
              grados={grados}
              isLoading={isLoading}
              onFormChange={handleFormChange}
              onNestedChange={handleNestedChange}
              onNextStep={handleNextStep}
              onStudentInfoLoaded={handleStudentInfoLoaded}
              onTutorLoaded={handleTutorLoaded}
            />
          )}          {step === 2 && (
            <AreasSelection
              areasNiveles={areasNiveles}
              areas_seleccionadas={areas_seleccionadas}
              convocatoria={convocatoria}
              isLoading={isLoading}
              costoTotal={costoTotal}
              formErrorMessage={formErrorMessage}
              onAreaSelect={handleAreaSelect}
              onPrevStep={() => setStep(1)}
              onNextStep={handleNextStep}
            />
          )}{step === 3 && (
            <TutoresAcademicos
              areas_seleccionadas={areas_seleccionadas}
              tutores_academicos={formData.tutores_academicos}
              formErrorMessage={formErrorMessage}
              onTutorChange={handleTutorAcademicoChange}
              onPrevStep={() => setStep(2)}
              onNextStep={handleNextStep}
            />
          )}          {step === 4 && (            
            <ResumenInscripcion
              convocatoria={convocatoria}
              estudiantes={estudiantes}
              grados={grados}
              costoTotalGeneral={costoTotalGeneral}
              encargadoNombre={encargadoNombre}
              encargadoApellido={encargadoApellido}
              encargadoCorreo={encargadoCorreo}
              encargadoCI={encargadoCI}
              showEncargadoForm={showEncargadoForm}
              isModalOpen={isModalOpen}
              isBoletaModalOpen={isBoletaModalOpen}
              isComprobanteModalOpen={isComprobanteModalOpen}
              selectedStudentDetails={selectedStudentDetails}
              codigo_unico={codigo_unico}
              comprobanteDetails={comprobanteDetails}
              ordenInfo={ordenInfo}
              onEncargadoNombreChange={setEncargadoNombre}
              onEncargadoApellidoChange={setEncargadoApellido}
              onEncargadoCorreoChange={setEncargadoCorreo}
              onEncargadoCIChange={setEncargadoCI}
              onOpenStudentDetailsModal={openStudentDetailsModal}
              onCloseModal={closeModal}
              onCloseBoletaModal={closeBoletaModal}
              onSetIsComprobanteModalOpen={setIsComprobanteModalOpen}
              onFetchCodigoUnico={fetchCodigoUnico} 
              onFinalizeRegistration={fetchCodigoUnico}             
              onAddNewStudent={handleAddNewStudent}
              onPrevStep={() => setStep(3)}
            />
          )}
        </div>
      </div>
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
                    <p className="text-sm text-gray-500">Genero</p>
                    <p className="font-medium">{selectedStudentDetails.genero}</p>
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
                        estudiante.areas_seleccionadas.reduce((total: number, area: AreaSeleccionada) => total + (parseFloat(area.costo) || 0), 0) : 0;
                        
                      return (
                        <div key={estudiante.id} className="grid grid-cols-12 gap-2 mb-1 text-sm py-1 border-b border-gray-100">
                          <div className="col-span-1">{index + 1}</div>
                          <div className="col-span-4">{estudiante.nombres} {estudiante.apellidos}</div>
                          <div className="col-span-2">{estudiante.ci}</div>
                          <div className="col-span-3">
                            {estudiante.areas_seleccionadas && estudiante.areas_seleccionadas.length > 0 ? (
                              <div className="flex flex-col">
                                {estudiante.areas_seleccionadas.map((area: AreaSeleccionada, i: number) => (
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

      {/* Modal de detalles del comprobante */}
      {isComprobanteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setIsComprobanteModalOpen(false)}
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-semibold mb-4">Detalles del Comprobante de Pago</h3>
            {comprobanteDetails ? (
              <>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Nombre del pagador:</span> {comprobanteDetails.nombre ? comprobanteDetails.nombre : <span className="text-red-500">No extraído</span>}
                  </div>
                  <div>
                    <span className="font-medium">Número de comprobante:</span> {comprobanteDetails.numero_comprobante ? comprobanteDetails.numero_comprobante : <span className="text-red-500">No extraído</span>}
                  </div>
                  <div>
                    <span className="font-medium">Fecha de pago:</span> {comprobanteDetails.fecha ? comprobanteDetails.fecha : <span className="text-red-500">No extraído</span>}
                  </div>
                  <div>
                    <span className="font-medium">Monto pagado:</span> {comprobanteDetails.monto !== undefined && comprobanteDetails.monto !== null ? comprobanteDetails.monto : (ordenInfo?.orden?.monto_total ?? <span className="text-red-500">No extraído</span>)} Bs.
                  </div>
                </div>
                {(!comprobanteDetails.nombre || !comprobanteDetails.numero_comprobante) && (
                  <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 text-sm rounded">
                    <b>Advertencia:</b> No se pudo extraer correctamente el nombre del pagador o el número de comprobante. Por favor, verifique que el comprobante sea legible y válido.
                  </div>
                )}
                {comprobanteDetails.ocr_text && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-blue-600 underline">Ver texto OCR crudo</summary>
                    <pre className="bg-gray-100 p-2 rounded text-xs mt-1 max-h-40 overflow-auto">{comprobanteDetails.ocr_text}</pre>
                  </details>
                )}
              </>
            ) : (
              <p>No se encontraron detalles del comprobante.</p>
            )}
            <div className="flex justify-end mt-6">              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                onClick={() => setIsComprobanteModalOpen(false)}
              >
                Cerrar
              </button>
            </div>
          </div>        </div>
      )}
    </>
  );
}