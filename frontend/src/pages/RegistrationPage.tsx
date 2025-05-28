import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/ui/Button';
import { getDatosInscripcion, inscribirEstudiante } from '../api/registration/inscripcionCompletaApi';
import { 
  EstudianteFormData, 
  Convocatoria, 
  Grado, 
  RequisitoGuardado,
  RequisitoConvocatoria,
  TutorAcademico
} from '../types/index';
import { fetchRequisitosConvocatoria } from '../api/requisitoConvocatoria';
import StudentForm from '../components/registration/StudentForm';
import AreasSelection from '../components/registration/AreasSelection';
import TutoresAcademicos from '../components/registration/TutoresAcademicos';
import ResumenInscripcion from '../components/registration/ResumenInscripcion';
import StudentsManager from '../components/registration/StudentsManager';

// Importar custom hooks
import { useStudentForm } from '../hooks/registration/useStudentForm';
import { useMultipleStudents } from '../hooks/registration/useMultipleStudents';
import { useAreasSelection } from '../hooks/registration/useAreasSelection';

// Importar funciones utilitarias
import { validateStep1 } from '../utils/registration/validationUtils';
import { createNewEstudiante } from '../utils/registration/formUtils';

export default function RegistrationPage() {
  const navigate = useNavigate();
  
  // Estados esenciales para navegación y convocatoria
  const [step, setStep] = useState(1);
  const [encargadoApellido, setencargadoApellido] = useState('');
  const [encargadoNombre, setencargadoNombre] = useState('');
  const [encargadoCI, setencargadoCI] = useState('');
  const [encargadoCorreo, setVencargadoCorreo] = useState('');
  const codigo_unico = `O-SANSI-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
  
  // Estados para la inscripción
  const [isLoading, setIsLoading] = useState(false);
  const [convocatoria, setConvocatoria] = useState<Convocatoria | null>(null);
  const [grados, setGrados] = useState<Grado[]>([]);
  const [requisitosGuardados, setRequisitosGuardados] = useState<Record<string, RequisitoGuardado>>({});

  // Estados para modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState<EstudianteFormData | null>(null);
  const [isBoletaModalOpen, setIsBoletaModalOpen] = useState(false);

  // Cargar datos iniciales cuando se monta el componente
  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const data = await getDatosInscripcion();
      setConvocatoria(data.convocatoria);
      setGrados(data.grados);
      setFormData(prev => ({
        ...prev,
        id_convocatoria: data.convocatoria.id.toString(),
      }));
    } catch (error) {
      console.error('Error al obtener datos iniciales:', error);
      setFormErrorMessage('No se pudieron cargar los datos iniciales. Por favor, intente de nuevo más tarde.');
    } finally {
      setIsLoading(false);
    }
  };

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
    initializeFirstStudent
  } = useMultipleStudents({ convocatoria });

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
    validateStep1: validateStep1Hook
  } = useStudentForm({
    initialFormData: estudiantes[activeStudentIndex] || createNewEstudiante(),
    areas_seleccionadas: estudiantes[activeStudentIndex]?.areas_seleccionadas || [],
    requisitosGuardados,
    updateActiveStudent
  });

  // Hook para gestión de selección de áreas
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
    updateActiveStudent
  });

  // useEffect para cargar requisitos obligatorios cuando cambia la convocatoria
  useEffect(() => {
    const loadRequisitos = async () => {
      if (convocatoria) {
        try {
          const data = await fetchRequisitosConvocatoria(convocatoria.id);
          const initialRequisitosGuardados: Record<string, RequisitoGuardado> = {};
          data.forEach((requisito: RequisitoConvocatoria) => {
            const key = `${requisito.entidad}.${requisito.campo}`;
            initialRequisitosGuardados[key] = {
              obligatorio: requisito.es_obligatorio,
              valor: undefined,
            };
          });
          setRequisitosGuardados(initialRequisitosGuardados);
        } catch (error: unknown) {
          console.error('Error al cargar los requisitos:', (error as Error).message);
          setRequisitosGuardados({});
        }
      } else {
        setRequisitosGuardados({});
      }
    };

    loadRequisitos();
  }, [convocatoria]);

  // useEffect para inicializar el primer estudiante
  useEffect(() => {
    if (estudiantes.length === 0) {
      initializeFirstStudent();
    }
    fetchInitialData();
  }, [estudiantes.length, initializeFirstStudent]);

  // Función para enviar la inscripción
  const fetchCodigoUnico = async () => {
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

  // Función para cerrar el modal de la boleta de pago y resetear
  const closeBoletaModal = () => {
    setIsBoletaModalOpen(false);
    
    // Resetear datos y redirigir al step 1
    const newEstudiante = createNewEstudiante();
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
  };

  // Función para manejar el cambio al siguiente paso
  const handleNextStep = () => {
    if (step === 1) {
      if (validateStep1Hook()) {
        const validation = validateStep1(formData, requisitosGuardados);
        
        if (validation.camposObligatoriosVacios.length > 0) {
          setFormErrorMessage(`Por favor, complete los siguientes campos obligatorios: ${validation.camposObligatoriosVacios.join(', ')}`);
          return;
        }

        setFormErrorMessage('');
        setStep(2);
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
  const handleAddNewStudent = () => {
    if (!isCurrentStudentValid()) {
      setFormErrorMessage('Debe completar los datos del estudiante actual antes de agregar uno nuevo.');
      return;
    }
    
    const newStudent = createNewEstudiante();
    setEstudiantes([...estudiantes, newStudent]);
    setActiveStudentIndex(estudiantes.length);
    setStep(1);
  };

  const breadcrumbs = [
    { label: 'Inscripción' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Inscripción a Olimpiadas Científicas"
        subtitle="Completa el proceso de inscripción para participar en las olimpiadas científicas"
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              onClick={() => navigate('/download-payment-slip')}
            >
              Descargar Boleta
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => navigate('/complete-registration')}
            >
              Completar Inscripción
            </Button>
          </div>
        }
      />

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

      {/* Students Manager */}
      <StudentsManager
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
        </div>

        {/* Form Content based on step */}
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
        )}

        {step === 2 && (
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
        )}

        {step === 3 && (
          <TutoresAcademicos
            areas_seleccionadas={areas_seleccionadas}
            tutores_academicos={formData.tutores_academicos}
            formErrorMessage={formErrorMessage}
            onTutorChange={handleTutorAcademicoChange}
            onPrevStep={() => setStep(2)}
            onNextStep={handleNextStep}
          />
        )}

        {step === 4 && (
          <ResumenInscripcion
            convocatoria={convocatoria}
            estudiantes={estudiantes}
            grados={grados}
            costoTotalGeneral={costoTotalGeneral}
            encargadoNombre={encargadoNombre}
            encargadoApellido={encargadoApellido}
            encargadoCorreo={encargadoCorreo}
            encargadoCI={encargadoCI}
            isModalOpen={isModalOpen}
            isBoletaModalOpen={isBoletaModalOpen}
            isComprobanteModalOpen={false}
            selectedStudentDetails={selectedStudentDetails}
            codigo_unico={codigo_unico}
            comprobanteDetails={null}
            ordenInfo={null}
            onEncargadoNombreChange={setencargadoNombre}
            onEncargadoApellidoChange={setencargadoApellido}
            onEncargadoCorreoChange={setVencargadoCorreo}
            onEncargadoCIChange={setencargadoCI}
            onOpenStudentDetailsModal={openStudentDetailsModal}
            onCloseModal={closeModal}
            onCloseBoletaModal={closeBoletaModal}
            onSetIsComprobanteModalOpen={() => {}}
            onFetchCodigoUnico={fetchCodigoUnico}
            onAddNewStudent={handleAddNewStudent}
            onPrevStep={() => setStep(3)}
          />
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
                ×
              </button>
            </div>
            {/* ... resto del modal ... */}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
