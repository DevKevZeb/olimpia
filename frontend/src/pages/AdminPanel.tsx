import React, { useState, useEffect } from 'react';
import { 
  getConvocatoriasActivas, 
  getAreasCompetencia,
  getNivelesCategoria,
  getGrados,
  crearConvocatoria,
  asociarAreas,
  asociarNivelesGrados,
  getAreasPorConvocatoria,
  getNivelesPorConvocatoria,
  createNivelCategoria,
  setCostoGeneralConvocatoria
} from '../api/adminConvocatoriaApi';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';
import { useRef } from 'react';

export default function AdminPanel() {
  // Estados para controlar qué formulario mostrar
  const [showCrearConvocatoriaForm, setShowCrearConvocatoriaForm] = useState(false);
  const [showAsignarAreasForm, setShowAsignarAreasForm] = useState(false);
  const [showConfigurarNivelesForm, setShowConfigurarNivelesForm] = useState(false);
  const [showCrearNivelForm, setShowCrearNivelForm] = useState(false);
  // Estado para el formulario de costo general
  const [showCostoGeneralForm, setShowCostoGeneralForm] = useState(false);
  const [selectedConvocatoriaCosto, setSelectedConvocatoriaCosto] = useState('');
  const [costoGeneral, setCostoGeneral] = useState('');
  const [costoGeneralError, setCostoGeneralError] = useState('');
  
  // Estados para datos y selecciones
  const [convocatorias, setConvocatorias] = useState([]);
  const [areas, setAreas] = useState([]);
  const [niveles, setNiveles] = useState([]);
  const [grados, setGrados] = useState([]);
  const [areasConvocatoria, setAreasConvocatoria] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado nuevo para áreas ya asignadas a la convocatoria seleccionada
  const [areasAsignadas, setAreasAsignadas] = useState([]);
  const [areasDisponibles, setAreasDisponibles] = useState([]);
  
  // Estado nuevo para niveles ya asignados a la convocatoria seleccionada
  const [nivelesAsignados, setNivelesAsignados] = useState([]);
  const [nivelesDisponiblesPorArea, setNivelesDisponiblesPorArea] = useState({});
  
  // Estados para formulario de Crear Convocatoria
  const [formDataConvocatoria, setFormDataConvocatoria] = useState({
    nombre: '',
    fecha_inicio_inscripcion: '',
    fecha_fin_inscripcion: '',
    max_areas_por_estudiante: 2,
    estado: 'planificada',
  });
  
  // Estado para mensajes de error
  const [formErrors, setFormErrors] = useState({
    nombre: '',
    fecha_inicio_inscripcion: '',
    fecha_fin_inscripcion: '',
    general: ''
  });

  // Estados para formulario de Asignar Áreas
  const [selectedConvocatoria, setSelectedConvocatoria] = useState('');
  const [selectedAreas, setSelectedAreas] = useState([]);
  
  // Estados para formulario de Configurar Niveles
  const [selectedConvocatoriaNiveles, setSelectedConvocatoriaNiveles] = useState('');
  const [selectedNiveles, setSelectedNiveles] = useState([]);
  const [nivelGrados, setNivelGrados] = useState({});
  const [loadingNiveles, setLoadingNiveles] = useState(false); // Nuevo estado para control específico de carga de niveles
  // NUEVO: Estados para selección masiva y accordion
  const [selectedAreasBatch, setSelectedAreasBatch] = useState([]); // Áreas seleccionadas para batch
  const [accordionOpen, setAccordionOpen] = useState({}); // Controla qué áreas están expandidas

  // Estado para el nuevo nivel
  const [nuevoNivel, setNuevoNivel] = useState('');
  const [nivelError, setNivelError] = useState('');

  // Estado para mostrar el costo actual de la convocatoria seleccionada
  const [costoActualConvocatoria, setCostoActualConvocatoria] = useState<string | null>(null);
  const [mensajeCostoConvocatoria, setMensajeCostoConvocatoria] = useState('');

  // Toast para feedback inmediato
  const [toast, setToast] = useState({ show: false, type: '', message: '' });
  const toastTimeout = useRef(null);
  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast({ show: false, type: '', message: '' }), 3000);
  };

  // Cargar datos iniciales
  useEffect(() => {
    fetchData();
  }, []);

  // Cargar las áreas de una convocatoria cuando cambia la selección en "Asignar Áreas"
  useEffect(() => {
    if (selectedConvocatoria) {
      setIsLoading(true);
      
      // Obtener áreas asignadas a la convocatoria seleccionada
      getAreasPorConvocatoria(selectedConvocatoria)
        .then(areasAsignadas => {
          // Guardar las áreas ya asignadas
          setAreasAsignadas(areasAsignadas);
          
          // Filtrar las áreas disponibles (todas las áreas menos las ya asignadas)
          const idsAreasAsignadas = areasAsignadas.map(area => area.id_area);
          const disponibles = areas.filter(area => !idsAreasAsignadas.includes(area.id_area));
          
          setAreasDisponibles(disponibles);
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Error al cargar áreas asignadas:', error);
          setIsLoading(false);
        });
    } else {
      // Si no hay convocatoria seleccionada, resetear estados
      setAreasAsignadas([]);
      setAreasDisponibles(areas);
    }
  }, [selectedConvocatoria, areas]);

  // Cargar las áreas y niveles de una convocatoria cuando cambia la selección en "Configurar Niveles"
  useEffect(() => {
    if (selectedConvocatoriaNiveles) {
      setIsLoading(true);
      setLoadingNiveles(true);
      
      // Limpiar estados previos completamente
      setAreasConvocatoria([]);
      setNivelesAsignados([]);
      setNivelesDisponiblesPorArea({});
      setSelectedNiveles([]);
      setNivelGrados({});
      
      console.log(`Cargando datos para convocatoria ID: ${selectedConvocatoriaNiveles}`);
      
      // Cargar todo lo necesario de una vez para evitar problemas con estados desactualizados
      Promise.all([
        getAreasPorConvocatoria(selectedConvocatoriaNiveles),
        getNivelesPorConvocatoria(selectedConvocatoriaNiveles), 
        getNivelesCategoria()
      ])
        .then(([areasData, nivelesData, todosLosNiveles]) => {
          console.log('Áreas recibidas:', areasData);
          console.log('Niveles ya asignados:', nivelesData);
          console.log('Todos los niveles disponibles:', todosLosNiveles);
          
          // Verificar y formatear las respuestas
          const areasArray = Array.isArray(areasData) ? areasData : [];
          const nivelesArray = Array.isArray(nivelesData) ? nivelesData : [];
          const todosLosNivelesArray = Array.isArray(todosLosNiveles) ? todosLosNiveles : [];
          
          // Actualizar áreas y niveles asignados
          setAreasConvocatoria(areasArray);
          setNivelesAsignados(nivelesArray);
          
          if (areasArray.length === 0) {
            console.log('No hay áreas asignadas a esta convocatoria');
            setIsLoading(false);
            setLoadingNiveles(false);
            return;
          }
          
          // Crear un nuevo objeto para los niveles disponibles por área
          const nivelesDisponibles = {};
          
          // Para cada área asignada a la convocatoria
          areasArray.forEach(area => {
            const areaId = area.id_area;
            
            // Filtrar los niveles ya asignados a esta área específica
            const nivelesAsignadosAEstaArea = nivelesArray.filter(
              nivel => nivel.id_area === areaId
            );
            
            // Obtener IDs de niveles ya asignados a esta área específica
            const idsNivelesAsignados = nivelesAsignadosAEstaArea.map(n => n.id_nivel);
            console.log(`Área ${areaId} (${area.nombre_area}): Niveles ya asignados:`, idsNivelesAsignados);
            
            // Todos los niveles que no están ya asignados a esta área específica están disponibles
            const nivelesDisponiblesParaEstaArea = todosLosNivelesArray.filter(
              nivel => !idsNivelesAsignados.includes(nivel.id_nivel)
            );
            
            // Guardar los niveles disponibles para esta área
            nivelesDisponibles[areaId] = nivelesDisponiblesParaEstaArea;
            
            console.log(`Área ${areaId} (${area.nombre_area}): Niveles disponibles:`, 
              nivelesDisponiblesParaEstaArea.map(n => `${n.id_nivel}-${n.nombre_nivel}`));
          });
          
          // Actualizar el estado con los niveles disponibles por área
          setNivelesDisponiblesPorArea(nivelesDisponibles);
          setIsLoading(false);
          setLoadingNiveles(false);
        })
        .catch(error => {
          console.error('Error al cargar datos para configurar niveles:', error);
          
          // Mostrar mensaje de error más específico
          let errorMessage = 'Error al cargar datos.';
          
          if (error.response) {
            errorMessage += ` Respuesta del servidor: ${
              error.response.data?.message || 
              error.response.statusText || 
              `Error ${error.response.status}`
            }`;
            console.error('Datos del error:', error.response.data);
          } else if (error.request) {
            errorMessage += ' No se recibió respuesta del servidor.';
          } else {
            errorMessage += ` ${error.message || 'Error desconocido'}`;
          }
          
          alert(errorMessage + ' Por favor, inténtelo de nuevo.');
          
          // Resetear los estados relevantes
          setAreasConvocatoria([]);
          setNivelesAsignados([]);
          setNivelesDisponiblesPorArea({});
          setIsLoading(false);
          setLoadingNiveles(false);
        });
    } else {
      // Si no hay convocatoria seleccionada, resetear estados
      setAreasConvocatoria([]);
      setNivelesAsignados([]);
      setNivelesDisponiblesPorArea({});
      setSelectedNiveles([]);
      setNivelGrados({});
    }
  }, [selectedConvocatoriaNiveles]);

  // Función para cargar datos generales
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Cargar convocatorias
      const convocatoriasResponse = await getConvocatoriasActivas();
      setConvocatorias(Array.isArray(convocatoriasResponse) ? convocatoriasResponse : []);
      
      // Cargar áreas, niveles y grados
      const areasResponse = await getAreasCompetencia();
      setAreas(Array.isArray(areasResponse) ? areasResponse : []);
      
      const nivelesResponse = await getNivelesCategoria();
      setNiveles(Array.isArray(nivelesResponse) ? nivelesResponse : []);
      
      const gradosResponse = await getGrados();
      setGrados(Array.isArray(gradosResponse) ? gradosResponse : []);
      
      console.log('Datos cargados correctamente');
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      alert('Error al cargar los datos. Por favor, inténtelo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar áreas por convocatoria
  const fetchAreasPorConvocatoria = async (idConvocatoria) => {
    setIsLoading(true);
    try {
      const response = await getAreasPorConvocatoria(idConvocatoria);
      setAreasConvocatoria(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error(`Error al cargar áreas para convocatoria ${idConvocatoria}:`, error);
      alert('Error al cargar las áreas de la convocatoria.');
    } finally {
      setIsLoading(false);
    }
  };

  // Manejadores para el formulario de Crear Convocatoria
  const handleInputChangeConvocatoria = (e) => {
    const { name, value } = e.target;
    
    // Resetear el error específico al cambiar el valor del campo
    setFormErrors(prev => ({
      ...prev,
      [name]: ''
    }));
    
    setFormDataConvocatoria({
      ...formDataConvocatoria,
      [name]: value,
    });
  };

  // Función para validar el formulario de convocatoria
  const validarFormularioConvocatoria = () => {
    const errores = {
      nombre: '',
      fecha_inicio_inscripcion: '',
      fecha_fin_inscripcion: '',
      general: ''
    };
    let esValido = true;

    // Validar nombre duplicado
    const nombreDuplicado = convocatorias.some(
      convocatoria => convocatoria.nombre.toLowerCase() === formDataConvocatoria.nombre.toLowerCase().trim()
    );
    
    if (nombreDuplicado) {
      errores.nombre = "Ya existe una convocatoria con este nombre";
      esValido = false;
    }

    // Obtener la fecha actual sin la hora (solo la fecha)
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    // Obtener solo la parte de fecha de los inputs
    const [yearInicio, monthInicio, dayInicio] = formDataConvocatoria.fecha_inicio_inscripcion.split('-').map(Number);
    const [yearFin, monthFin, dayFin] = formDataConvocatoria.fecha_fin_inscripcion.split('-').map(Number);
    
    // Crear objetos Date con la hora establecida a medianoche
    const fechaInicio = new Date(yearInicio, monthInicio - 1, dayInicio, 0, 0, 0, 0);
    const fechaFin = new Date(yearFin, monthFin - 1, dayFin, 0, 0, 0, 0);

    // Validar que la fecha de inicio no sea anterior a la fecha actual
    // Usamos setHours(0,0,0,0) para comparar solo fechas sin hora
    const hoyString = hoy.toDateString();
    const inicioString = fechaInicio.toDateString();
    
    if (fechaInicio < hoy && inicioString !== hoyString) {
      errores.fecha_inicio_inscripcion = "La fecha de inicio no puede ser anterior a la fecha actual";
      esValido = false;
    }
    
    // Validar que la fecha de fin no sea anterior a la fecha actual
    if (fechaFin < hoy && fechaFin.toDateString() !== hoyString) {
      errores.fecha_fin_inscripcion = "La fecha de fin no puede ser anterior a la fecha actual";
      esValido = false;
    }
    
    // Validar que la fecha de inicio sea menor o igual a la fecha de fin
    if (fechaInicio > fechaFin) {
      errores.fecha_fin_inscripcion = "La fecha de fin debe ser igual o posterior a la fecha de inicio";
      esValido = false;
    }

    setFormErrors(errores);
    return esValido;
  };

  const handleCrearConvocatoria = async (e) => {
    e.preventDefault();
    
    // Resetear errores previos
    setFormErrors({
      nombre: '',
      fecha_inicio_inscripcion: '',
      fecha_fin_inscripcion: '',
      general: ''
    });
    
    // Validaciones básicas
    if (!formDataConvocatoria.nombre || 
        !formDataConvocatoria.fecha_inicio_inscripcion || 
        !formDataConvocatoria.fecha_fin_inscripcion) {
      setFormErrors(prev => ({...prev, general: 'Por favor complete todos los campos requeridos'}));
      return;
    }
    
    // Validar criterios adicionales
    if (!validarFormularioConvocatoria()) {
      return;
    }
    
    setIsLoading(true);
    try {
      // Crear la convocatoria
      const response = await crearConvocatoria(formDataConvocatoria);
      console.log('Convocatoria creada:', response);
      
      // Mensaje de éxito y reset de formulario
      alert('Convocatoria creada exitosamente');
      setFormDataConvocatoria({
        nombre: '',
        fecha_inicio_inscripcion: '',
        fecha_fin_inscripcion: '',
        max_areas_por_estudiante: 2,
        estado: 'planificada',
      });
      setShowCrearConvocatoriaForm(false);
      
      // Actualizar lista de convocatorias
      fetchData();
    } catch (error) {
      console.error('Error al crear la convocatoria:', error);
      // Mostrar mensaje de error del servidor si está disponible
      if (error.response && error.response.data && error.response.data.message) {
        setFormErrors(prev => ({...prev, general: `Error: ${error.response.data.message}`}));
      } else {
        setFormErrors(prev => ({...prev, general: 'Error al crear la convocatoria. Por favor, inténtelo de nuevo.'}));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handler para asignar costo general
  const handleSetCostoGeneral = async (e) => {
    e.preventDefault();
    setCostoGeneralError('');
    if (!selectedConvocatoriaCosto) {
      setCostoGeneralError('Debe seleccionar una convocatoria');
      return;
    }
    if (!costoGeneral || isNaN(Number(costoGeneral)) || Number(costoGeneral) <= 0) {
      setCostoGeneralError('Ingrese un costo válido (> 0)');
      return;
    }
    setIsLoading(true);
    try {
      await setCostoGeneralConvocatoria(selectedConvocatoriaCosto, Number(costoGeneral));
      alert('Costo general asignado correctamente');
      setShowCostoGeneralForm(false);
      setSelectedConvocatoriaCosto('');
      setCostoGeneral('');
      fetchData();
    } catch (error) {
      setCostoGeneralError('Error al asignar el costo general.');
    } finally {
      setIsLoading(false);
    }
  };

  // Manejadores para el formulario de Asignar Áreas
  const handleAreaSelect = (areaId) => {
    const isSelected = selectedAreas.some((area) => area.id_area === areaId);
    if (isSelected) {
      setSelectedAreas(selectedAreas.filter((area) => area.id_area !== areaId));
    } else {
      setSelectedAreas([...selectedAreas, { id_area: areaId }]);
    }
  };

  const handleAsignarAreas = async (e) => {
    e.preventDefault();
    if (!selectedConvocatoria) {
      alert('Debe seleccionar una convocatoria');
      return;
    }
    if (selectedAreas.length === 0) {
      alert('Debe seleccionar al menos un área');
      return;
    }
    setIsLoading(true);
    try {
      // Preparar datos de áreas correctamente formateados
      const areasData = selectedAreas.map(area => ({
        id_area: area.id_area,
        costo_inscripcion: null
      }));
      
      // Enviar datos al servidor
      const dataToSubmit = {
        id_convocatoria: selectedConvocatoria,
        areas: areasData
      };
      
      const response = await asociarAreas(dataToSubmit);
      console.log('Áreas asignadas:', response);
      
      // Mensaje de éxito y reset de formulario
      alert('Áreas asignadas exitosamente');
      setSelectedAreas([]);
      setShowAsignarAreasForm(false);
      fetchData(); // Actualizar los datos después de asignar áreas
    } catch (error) {
      console.error('Error al asignar áreas:', error);
      alert('Error al asignar áreas. Por favor, inténtelo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Manejadores para el formulario de Configurar Niveles
  const handleNivelSelect = (nivelId, areaId) => {
    // Verificar que el nivel no esté ya asignado a esta área específica
    const nivelYaAsignado = nivelesAsignados.some(
      n => n.id_nivel === nivelId && n.id_area === areaId
    );
    
    if (nivelYaAsignado) {
      // No permitir seleccionar un nivel ya asignado a esta área. Seleccione otro nivel o configure otro diferente.
      alert('Este nivel ya está asignado a esta área. Seleccione otro nivel o configure otro diferente.');
      return;
    }
    
    const isSelected = selectedNiveles.some(n => n.id_nivel === nivelId && n.id_area === areaId);
    
    console.log('Seleccionando nivel:', {nivelId, areaId, isSelected});
    
    if (isSelected) {
      // Si ya estaba seleccionado, lo eliminamos
      setSelectedNiveles(selectedNiveles.filter(n => !(n.id_nivel === nivelId && n.id_area === areaId)));
      
      // Eliminar los grados seleccionados para este nivel
      const updatedGrados = { ...nivelGrados };
      delete updatedGrados[`${areaId}-${nivelId}`];
      setNivelGrados(updatedGrados);
      
      console.log('Nivel deseleccionado y grados eliminados');
    } else {
      // Si no estaba seleccionado, lo añadimos
      setSelectedNiveles(prevSelected => [...prevSelected, { id_nivel: nivelId, id_area: areaId }]);
      
      // Inicializar un array vacío para los grados de este nivel
      setNivelGrados(prevGrados => ({
        ...prevGrados,
        [`${areaId}-${nivelId}`]: []
      }));
      
      console.log('Nivel seleccionado y array de grados inicializado');
    }
  };

  const handleGradoSelect = (gradoId, areaId, nivelId) => {
    const key = `${areaId}-${nivelId}`;
    const currentGrados = nivelGrados[key] || [];
    const isSelected = currentGrados.includes(gradoId);
    
    if (isSelected) {
      setNivelGrados({
        ...nivelGrados,
        [key]: currentGrados.filter(g => g !== gradoId)
      });
    } else {
      setNivelGrados({
        ...nivelGrados,
        [key]: [...currentGrados, gradoId]
      });
    }
  };

  const handleConfigurarNiveles = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!selectedConvocatoriaNiveles) {
      alert('Debe seleccionar una convocatoria');
      return;
    }
    
    if (selectedNiveles.length === 0) {
      alert('Debe seleccionar al menos un nivel');
      return;
    }
    
    // Validar que todos los niveles tengan al menos un grado seleccionado
    const nivelesValidos = selectedNiveles.every(nivel => {
      const key = `${nivel.id_area}-${nivel.id_nivel}`;
      return nivelGrados[key] && nivelGrados[key].length > 0;
    });

    if (!nivelesValidos) {
      alert('Todos los niveles deben tener al menos un grado seleccionado');
      return;
    }
    
    setIsLoading(true);
    try {
      // Preparar datos de niveles con el formato correcto para el backend
      const nivelesData = selectedNiveles.map(nivel => {
        const key = `${nivel.id_area}-${nivel.id_nivel}`;
        const gradosSeleccionados = nivelGrados[key] || [];
        
        return {
          id_nivel: nivel.id_nivel,
          id_area: nivel.id_area,
          id_grado_min: Math.min(...gradosSeleccionados),
          id_grado_max: Math.max(...gradosSeleccionados)
        };
      });
      
      const dataToSubmit = {
        id_convocatoria: selectedConvocatoriaNiveles,
        niveles: nivelesData
      };
      
      const response = await asociarNivelesGrados(dataToSubmit);
      console.log('Niveles configurados:', response);
      
      // Mensaje de éxito y reset de formulario
      alert('Niveles y grados configurados exitosamente');
      setSelectedNiveles([]);
      setNivelGrados({});
      setShowConfigurarNivelesForm(false);
    } catch (error) {
      console.error('Error al configurar niveles y grados:', error);
      alert('Error al configurar niveles y grados. Por favor, inténtelo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // NUEVO: Handler para selección de áreas en batch
  const handleBatchAreaSelect = (areaId) => {
    setSelectedAreasBatch(prev =>
      prev.includes(areaId) ? prev.filter(id => id !== areaId) : [...prev, areaId]
    );
  };

  // NUEVO: Handler para accordion
  const toggleAccordion = (areaId) => {
    setAccordionOpen(prev => ({ ...prev, [areaId]: !prev[areaId] }));
  };

  // Guardado parcial por área
  const handleGuardarArea = async (areaId) => {
    // Filtrar niveles seleccionados para esta área
    const nivelesArea = selectedNiveles.filter(n => n.id_area === areaId);
    if (nivelesArea.length === 0) {
      showToast('warning', 'Seleccione al menos un nivel para esta área.');
      return;
    }
    // Validar grados
    const nivelesValidos = nivelesArea.every(nivel => {
      const key = `${areaId}-${nivel.id_nivel}`;
      return nivelGrados[key] && nivelGrados[key].length > 0;
    });
    if (!nivelesValidos) {
      showToast('warning', 'Todos los niveles deben tener al menos un grado seleccionado.');
      return;
    }
    setIsLoading(true);
    try {
      const nivelesData = nivelesArea.map(nivel => {
        const key = `${areaId}-${nivel.id_nivel}`;
        const gradosSeleccionados = nivelGrados[key] || [];
        return {
          id_nivel: nivel.id_nivel,
          id_area: areaId,
          id_grado_min: Math.min(...gradosSeleccionados),
          id_grado_max: Math.max(...gradosSeleccionados)
        };
      });
      const dataToSubmit = {
        id_convocatoria: selectedConvocatoriaNiveles,
        niveles: nivelesData
      };
      await asociarNivelesGrados(dataToSubmit);
      showToast('success', 'Configuración guardada para el área.');
      // Refrescar datos
      setSelectedNiveles(selectedNiveles.filter(n => n.id_area !== areaId));
      setNivelGrados(prev => {
        const nuevo = { ...prev };
        Object.keys(nuevo).forEach(k => { if (k.startsWith(`${areaId}-`)) delete nuevo[k]; });
        return nuevo;
      });
      setTimeout(() => setSelectedConvocatoriaNiveles(selectedConvocatoriaNiveles), 500);
    } catch (error) {
      showToast('error', 'Error al guardar la configuración.');
    } finally {
      setIsLoading(false);
    }
  };

  // NUEVO: Guardado masivo para áreas seleccionadas
  const handleGuardarBatch = async () => {
    if (selectedAreasBatch.length === 0) {
      showToast('warning', 'Seleccione al menos un área.');
      return;
    }
    // Validar que haya al menos un nivel seleccionado para cada área
    const areasValidas = selectedAreasBatch.every(areaId =>
      selectedNiveles.some(n => n.id_area === areaId)
    );
    if (!areasValidas) {
      showToast('warning', 'Cada área seleccionada debe tener al menos un nivel.');
      return;
    }
    // Validar grados para cada nivel de cada área
    const nivelesValidos = selectedNiveles.every(nivel => {
      const key = `${nivel.id_area}-${nivel.id_nivel}`;
      return nivelGrados[key] && nivelGrados[key].length > 0;
    });
    if (!nivelesValidos) {
      showToast('warning', 'Todos los niveles deben tener al menos un grado seleccionado.');
      return;
    }
    setIsLoading(true);
    try {
      const nivelesData = selectedNiveles.map(nivel => {
        const key = `${nivel.id_area}-${nivel.id_nivel}`;
        const gradosSeleccionados = nivelGrados[key] || [];
        return {
          id_nivel: nivel.id_nivel,
          id_area: nivel.id_area,
          id_grado_min: Math.min(...gradosSeleccionados),
          id_grado_max: Math.max(...gradosSeleccionados)
        };
      });
      const dataToSubmit = {
        id_convocatoria: selectedConvocatoriaNiveles,
        niveles: nivelesData
      };
      await asociarNivelesGrados(dataToSubmit);
      showToast('success', 'Configuración guardada para las áreas seleccionadas.');
      // Limpiar selección
      setSelectedNiveles([]);
      setNivelGrados({});
      setSelectedAreasBatch([]);
      // Refrescar datos de áreas y niveles asignados/disponibles
      if (selectedConvocatoriaNiveles) {
        setIsLoading(true);
        Promise.all([
          getAreasPorConvocatoria(selectedConvocatoriaNiveles),
          getNivelesPorConvocatoria(selectedConvocatoriaNiveles),
          getNivelesCategoria()
        ]).then(([areasData, nivelesData, todosLosNiveles]) => {
          const areasArray = Array.isArray(areasData) ? areasData : [];
          const nivelesArray = Array.isArray(nivelesData) ? nivelesData : [];
          const todosLosNivelesArray = Array.isArray(todosLosNiveles) ? todosLosNiveles : [];
          setAreasConvocatoria(areasArray);
          setNivelesAsignados(nivelesArray);
          const nivelesDisponibles = {};
          areasArray.forEach(area => {
            const areaId = area.id_area;
            const nivelesAsignadosAEstaArea = nivelesArray.filter(
              nivel => nivel.id_area === areaId
            );
            const idsNivelesAsignados = nivelesAsignadosAEstaArea.map(n => n.id_nivel);
            const nivelesDisponiblesParaEstaArea = todosLosNivelesArray.filter(
              nivel => !idsNivelesAsignados.includes(nivel.id_nivel)
            );
            nivelesDisponibles[areaId] = nivelesDisponiblesParaEstaArea;
          });
          setNivelesDisponiblesPorArea(nivelesDisponibles);
        }).finally(() => setIsLoading(false));
      }
    } catch (error) {
      showToast('error', 'Error al guardar la configuración.');
      setIsLoading(false);
    }
  };

  // Renderizado de niveles disponibles para un área específica
  const renderNivelesDisponibles = (area) => {
    // Obtener niveles disponibles para esta área
    const nivelesDisponibles = nivelesDisponiblesPorArea[area.id_area] || [];
    
    if (nivelesDisponibles.length === 0) {
      return (
        <div className="text-sm text-orange-600 p-2">
          No hay niveles disponibles para asignar a esta área.
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {nivelesDisponibles.map(nivel => (
          <div 
            key={`nivel-${area.id_area}-${nivel.id_nivel}`}
            className={`border rounded-lg p-3 cursor-pointer transition ${
              selectedNiveles.some(n => n.id_nivel === nivel.id_nivel && n.id_area === area.id_area)
                ? 'border-green-500 bg-green-50'
                : 'hover:border-gray-400'
            }`}
            onClick={() => handleNivelSelect(nivel.id_nivel, area.id_area)}
          >
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedNiveles.some(n => n.id_nivel === nivel.id_nivel && n.id_area === area.id_area)}
                onChange={() => {}}
                className="mr-2 h-4 w-4 text-green-600"
              />
              <label className="font-medium text-gray-700">
                {nivel.nombre_nivel}
              </label>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Renderizado de niveles ya asignados para un área específica
  const renderNivelesAsignados = (area) => {
    // Filtrar niveles ya asignados a esta área
    const nivelesDeEstaArea = nivelesAsignados.filter(nivel => nivel.id_area === area.id_area);
    
    if (nivelesDeEstaArea.length === 0) {
      return null;
    }
    
    return (
      <div className="mb-4">
        <h5 className="font-medium text-gray-700 mb-2">Niveles ya asignados</h5>
        <div className="flex flex-wrap gap-2">
          {nivelesDeEstaArea.map(nivel => (
            <div 
              key={`nivel-asignado-${nivel.id_convocatoria_nivel}`}
              className="bg-blue-100 text-blue-800 px-3 py-2 rounded-md flex flex-col"
            >
              <div className="font-medium">{nivel.nombre_nivel}</div>
              <div className="text-xs mt-1">
                Grados: {nivel.nombre_grado_min} a {nivel.nombre_grado_max}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Handler para crear un nuevo nivel de categoría
  const handleCrearNivel = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!nuevoNivel.trim()) {
      setNivelError('El nombre del nivel no puede estar vacío');
      return;
    }
    
    setIsLoading(true);
    setNivelError('');
    
    try {
      const response = await createNivelCategoria(nuevoNivel.trim());
      console.log('Nivel creado:', response);
      
      // Mensaje de éxito y reset de formulario
      alert('Nivel creado exitosamente');
      setNuevoNivel('');
      setShowCrearNivelForm(false);
      
      // Actualizar lista de niveles
      fetchData();
    } catch (error) {
      console.error('Error al crear nivel:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setNivelError(`Error: ${error.response.data.message}`);
      } else {
        setNivelError('Error al crear el nivel. Por favor, inténtelo de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Renderizado de grados disponibles para un nivel
  const renderGrados = (areaId, nivelId) => {
    const key = `${areaId}-${nivelId}`;
    const nivel = niveles.find(n => n.id_nivel === nivelId);
    
    if (!nivel) return null;
    
    return (
      <div key={`grados-${key}`} className="p-3 border rounded-lg bg-gray-50 mb-3">
        <h6 className="font-medium text-gray-700 mb-2">{nivel.nombre_nivel}</h6>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {grados.map(grado => {
            const isSelected = (nivelGrados[key] || []).includes(grado.id_grado);
            
            return (
              <div 
                key={`grado-${key}-${grado.id_grado}`}
                className={`border rounded-lg p-2 cursor-pointer transition-all text-center ${
                  isSelected 
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'hover:border-gray-400 text-gray-700'
                }`}
                onClick={() => handleGradoSelect(grado.id_grado, areaId, nivelId)}
              >
                <span className="font-medium">{grado.nombre_grado}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Cuando selecciona una convocatoria en el formulario de costo general, obtener el costo actual
  useEffect(() => {
    if (showCostoGeneralForm && selectedConvocatoriaCosto) {
      setCostoActualConvocatoria(null);
      setMensajeCostoConvocatoria('');
      getAreasPorConvocatoria(selectedConvocatoriaCosto)
        .then((areas: any[]) => {
          if (!areas || areas.length === 0) {
            setCostoActualConvocatoria(null);
            setMensajeCostoConvocatoria('Esta convocatoria no tiene áreas asignadas.');
            return;
          }
          const costos = areas.map(a => a.costo_inscripcion);
          const todosNull = costos.every(c => c === null || c === undefined);
          const unicos = Array.from(new Set(costos.filter(c => c !== null && c !== undefined)));
          if (todosNull) {
            setCostoActualConvocatoria(null);
            setMensajeCostoConvocatoria('Esta convocatoria no tiene un costo asignado.');
          } else if (unicos.length === 1) {
            setCostoActualConvocatoria(unicos[0]);
            setMensajeCostoConvocatoria('');
            setCostoGeneral(unicos[0]);
          } else {
            setCostoActualConvocatoria(null);
            setMensajeCostoConvocatoria('Esta convocatoria tiene costos diferentes por área. Puede definir un costo general para unificarlos.');
          }
        })
        .catch(() => {
          setCostoActualConvocatoria(null);
          setMensajeCostoConvocatoria('No se pudo obtener el costo actual.');
        });
    } else {
      setCostoActualConvocatoria(null);
      setMensajeCostoConvocatoria('');
      setCostoGeneral('');
    }
  }, [showCostoGeneralForm, selectedConvocatoriaCosto]);

  // Utilidad para mapear niveles automáticos a grados
  const getAutoGradoForNivel = (nivelNombre) => {
    // Mapear niveles como "3P" a "3ro Primaria", "1S" a "1ro Secundaria", etc.
    const mapPrimaria = {
      '3P': '3ro primaria',
      '4P': '4to primaria',
      '5P': '5to primaria',
      '6P': '6to primaria',
    };
    const mapSecundaria = {
      '1S': '1ro secundaria',
      '2S': '2do secundaria',
      '3S': '3ro secundaria',
      '4S': '4to secundaria',
      '5S': '5to secundaria',
      '6S': '6to secundaria',
    };
    if (mapPrimaria[nivelNombre]) {
      return grados.find(g => g.nombre_grado.toLowerCase() === mapPrimaria[nivelNombre]);
    }
    if (mapSecundaria[nivelNombre]) {
      return grados.find(g => g.nombre_grado.toLowerCase() === mapSecundaria[nivelNombre]);
    }
    return null; // No es automático
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Panel Administrativo</h1>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => {
              setShowCrearConvocatoriaForm(!showCrearConvocatoriaForm);
              setShowAsignarAreasForm(false);
              setShowConfigurarNivelesForm(false);
              setShowCrearNivelForm(false);
              
              if (showCrearConvocatoriaForm) {
                // Reiniciar el formulario al cerrar
                setFormDataConvocatoria({
                  nombre: '',
                  fecha_inicio_inscripcion: '',
                  fecha_fin_inscripcion: '',
                  max_areas_por_estudiante: 2,
                  estado: 'planificada',
                });
              }
            }}
            className={`px-4 py-2 rounded-md font-medium transition ${
              showCrearConvocatoriaForm 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {showCrearConvocatoriaForm ? 'Cancelar' : 'Crear Convocatoria'}
          </button>
          
          <button 
            onClick={() => {
              setShowAsignarAreasForm(!showAsignarAreasForm);
              setShowCrearConvocatoriaForm(false);
              setShowConfigurarNivelesForm(false);
              setShowCrearNivelForm(false);
              
              if (showAsignarAreasForm) {
                // Reiniciar el formulario al cerrar
                setSelectedConvocatoria('');
                setSelectedAreas([]);
              }
            }}
            className={`px-4 py-2 rounded-md font-medium transition ${
              showAsignarAreasForm 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {showAsignarAreasForm ? 'Cancelar' : 'Asignar Áreas'}
          </button>
          
          <button 
            onClick={() => {
              setShowConfigurarNivelesForm(!showConfigurarNivelesForm);
              setShowCrearConvocatoriaForm(false);
              setShowAsignarAreasForm(false);
              setShowCrearNivelForm(false);
              
              if (showConfigurarNivelesForm) {
                // Reiniciar el formulario al cerrar
                setSelectedConvocatoriaNiveles('');
                setSelectedNiveles([]);
                setNivelGrados({});
              }
            }}
            className={`px-4 py-2 rounded-md font-medium transition ${
              showConfigurarNivelesForm 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {showConfigurarNivelesForm ? 'Cancelar' : 'Configurar Niveles'}
          </button>
          
          <button 
            onClick={() => {
              setShowCrearNivelForm(!showCrearNivelForm);
              setShowCrearConvocatoriaForm(false);
              setShowAsignarAreasForm(false);
              setShowConfigurarNivelesForm(false);
              
              if (showCrearNivelForm) {
                // Reiniciar el formulario al cerrar
                setNuevoNivel('');
                setNivelError('');
              }
            }}
            className={`px-4 py-2 rounded-md font-medium transition ${
              showCrearNivelForm 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-yellow-500 hover:bg-yellow-600 text-white'
            }`}
          >
            {showCrearNivelForm ? 'Cancelar' : 'Crear Nivel'}
          </button>

          <button
            onClick={() => {
              setShowCostoGeneralForm(!showCostoGeneralForm);
              setShowCrearConvocatoriaForm(false);
              setShowAsignarAreasForm(false);
              setShowConfigurarNivelesForm(false);
              setShowCrearNivelForm(false);
              if (showCostoGeneralForm) {
                setSelectedConvocatoriaCosto('');
                setCostoGeneral('');
                setCostoGeneralError('');
              }
            }}
            className={`px-4 py-2 rounded-md font-medium transition ${
              showCostoGeneralForm
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {showCostoGeneralForm ? 'Cancelar' : 'Agregar costo convocatoria'}
          </button>
        </div>
      </div>

      {/* Formulario para agregar costo general */}
      {showCostoGeneralForm && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Agregar costo general a convocatoria</h2>
          <form onSubmit={handleSetCostoGeneral} className="space-y-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Seleccionar Convocatoria</label>
              <select
                value={selectedConvocatoriaCosto}
                onChange={e => setSelectedConvocatoriaCosto(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                required
              >
                <option value="">-- Seleccione una convocatoria --</option>
                {convocatorias.map(convocatoria => (
                  <option key={convocatoria.id_convocatoria} value={convocatoria.id_convocatoria}>
                    {convocatoria.nombre}
                  </option>
                ))}
              </select>
            </div>
            {selectedConvocatoriaCosto && (
              <div className="mb-2">
                {mensajeCostoConvocatoria ? (
                  <div className="p-2 bg-yellow-100 text-yellow-800 rounded mb-2">{mensajeCostoConvocatoria}</div>
                ) : (
                  <div className="p-2 bg-blue-100 text-blue-800 rounded mb-2">
                    Costo actual: <span className="font-bold">{costoActualConvocatoria} Bs.</span>
                  </div>
                )}
              </div>
            )}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Costo de inscripción (Bs.)</label>
              <input
                type="number"
                min="1"
                step="1"
                value={costoGeneral}
                onChange={e => setCostoGeneral(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
                placeholder="Ingrese costo general"
                required
              />
            </div>
            {costoGeneralError && (
              <div className="p-2 bg-red-100 text-red-700 rounded">{costoGeneralError}</div>
            )}
            <div className="flex justify-end mt-8">
              <button
                type="submit"
                disabled={isLoading}
                className={`px-6 py-3 rounded-md font-medium transition ${
                  isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {isLoading ? 'Guardando...' : 'Guardar costo general'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Formulario para Crear Convocatoria */}
      {showCrearConvocatoriaForm && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Nueva Convocatoria</h2>
          <p className="text-gray-600 mb-6">Crea una nueva convocatoria para olimpiadas científicas</p>
          
          {formErrors.general && (
            <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
              {formErrors.general}
            </div>
          )}
          
          <form onSubmit={handleCrearConvocatoria} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={formDataConvocatoria.nombre}
                  onChange={handleInputChangeConvocatoria}
                  className={`w-full border rounded-lg px-4 py-2 ${formErrors.nombre ? 'border-red-500' : 'border-gray-300'}`}
                  required
                  maxLength={50}
                />
                {formErrors.nombre && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.nombre}</p>
                )}
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Fecha de Inicio</label>
                <input
                  type="date"
                  name="fecha_inicio_inscripcion"
                  value={formDataConvocatoria.fecha_inicio_inscripcion}
                  onChange={handleInputChangeConvocatoria}
                  className={`w-full border rounded-lg px-4 py-2 ${formErrors.fecha_inicio_inscripcion ? 'border-red-500' : 'border-gray-300'}`}
                  required
                />
                {formErrors.fecha_inicio_inscripcion && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.fecha_inicio_inscripcion}</p>
                )}
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Fecha de Fin</label>
                <input
                  type="date"
                  name="fecha_fin_inscripcion"
                  value={formDataConvocatoria.fecha_fin_inscripcion}
                  onChange={handleInputChangeConvocatoria}
                  className={`w-full border rounded-lg px-4 py-2 ${formErrors.fecha_fin_inscripcion ? 'border-red-500' : 'border-gray-300'}`}
                  required
                />
                {formErrors.fecha_fin_inscripcion && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.fecha_fin_inscripcion}</p>
                )}
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Máximo de Áreas por Estudiante</label>
                <input
                  type="number"
                  name="max_areas_por_estudiante"
                  value={formDataConvocatoria.max_areas_por_estudiante}
                  onChange={handleInputChangeConvocatoria}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Estado</label>
                <select
                  name="estado"
                  value={formDataConvocatoria.estado}
                  onChange={handleInputChangeConvocatoria}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  required
                >
                  <option value="planificada">Planificada</option>
                  <option value="abierta">Abierta</option>
                  <option value="cerrada">Cerrada</option>
                  <option value="finalizada">Finalizada</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <button
                type="submit"
                disabled={isLoading}
                className={`px-6 py-3 rounded-md font-medium transition ${
                  isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isLoading ? 'Creando...' : 'Crear Convocatoria'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Formulario para Asignar Áreas */}
      {showAsignarAreasForm && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Asignar Áreas a Convocatoria</h2>
          <p className="text-gray-600 mb-6">Selecciona las áreas para una convocatoria existente</p>
          <form onSubmit={handleAsignarAreas} className="space-y-6">
            {/* Selector de Convocatoria */}
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">Seleccionar Convocatoria</label>
              <select
                value={selectedConvocatoria}
                onChange={(e) => {
                  setSelectedConvocatoria(e.target.value);
                  setSelectedAreas([]);  // Resetear áreas seleccionadas al cambiar de convocatoria
                }}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                required
              >
                <option value="">-- Seleccione una convocatoria --</option>
                {convocatorias.map(convocatoria => (
                  <option key={convocatoria.id_convocatoria} value={convocatoria.id_convocatoria}>
                    {convocatoria.nombre}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Mostrar áreas ya asignadas si hay alguna */}
            {selectedConvocatoria && areasAsignadas.length > 0 && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Áreas ya asignadas</h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  {areasAsignadas.map(area => (
                    <div key={`assigned-${area.id_area}`} className="px-3 py-2 bg-blue-100 text-blue-800 rounded-md flex items-center">
                      <span className="text-sm font-medium">{area.nombre_area}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Estas áreas ya están asignadas a la convocatoria y no pueden seleccionarse nuevamente.
                </p>
              </div>
            )}
            
            {/* Selector de Áreas Disponibles */}
            {selectedConvocatoria && (
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4">
                  Áreas disponibles para asignar
                  {areasDisponibles.length === 0 && (
                    <span className="text-sm font-normal ml-2 text-orange-600">
                      (No hay áreas disponibles para asignar)
                    </span>
                  )}
                </h3>
                
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : areasDisponibles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {areasDisponibles.map((area) => (
                      <div 
                        key={area.id_area} 
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedAreas.some(a => a.id_area === area.id_area) 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'hover:border-gray-400'
                        }`}
                        onClick={() => handleAreaSelect(area.id_area)}
                      >
                        <div className="flex items-center mb-2">
                          <input
                            type="checkbox"
                            checked={selectedAreas.some(a => a.id_area === area.id_area)}
                            onChange={() => {}}
                            className="mr-3 h-4 w-4 text-blue-600"
                          />
                          <label className="font-medium text-gray-700">
                            {area.nombre_area}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center border border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-500">
                      {selectedConvocatoria ? 
                        "Todas las áreas ya han sido asignadas a esta convocatoria." : 
                        "Seleccione una convocatoria para ver las áreas disponibles."
                      }
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {selectedAreas.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xl font-bold mb-2">Áreas seleccionadas</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedAreas.map(selectedArea => {
                    const area = areas.find(a => a.id_area === selectedArea.id_area);
                    return (
                      <div key={`tag-${selectedArea.id_area}`} className="bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center">
                        <span>{area?.nombre_area}</span>
                        <button 
                          type="button" 
                          className="ml-2 text-green-600 hover:text-green-800"
                          onClick={() => handleAreaSelect(selectedArea.id_area)}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end mt-8">
              <button
                type="submit"
                disabled={isLoading || selectedAreas.length === 0}
                className={`px-6 py-3 rounded-md font-medium transition ${
                  isLoading || selectedAreas.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isLoading ? 'Asignando...' : 'Asignar Áreas'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Formulario para Configurar Niveles y Grados */}
      {showConfigurarNivelesForm && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Configurar Niveles y Grados</h2>
          <p className="text-gray-600 mb-6">Selecciona los niveles y grados para cada área de una convocatoria</p>
          
          <form onSubmit={handleConfigurarNiveles} className="space-y-6">
            {/* Selector de Convocatoria */}
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">Seleccionar Convocatoria</label>
              <select
                value={selectedConvocatoriaNiveles}
                onChange={(e) => {
                  setSelectedConvocatoriaNiveles(e.target.value);
                  // Reset niveles y grados al cambiar convocatoria
                  setSelectedNiveles([]);
                  setNivelGrados({});
                  setSelectedAreasBatch([]);
                  setAccordionOpen({});
                }}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                required
              >
                <option value="">-- Seleccione una convocatoria --</option>
                {convocatorias.map(convocatoria => (
                  <option key={convocatoria.id_convocatoria} value={convocatoria.id_convocatoria}>
                    {convocatoria.nombre}
                  </option>
                ))}
              </select>
            </div>
            {/* NUEVO: Selección masiva de áreas */}
            {selectedConvocatoriaNiveles && areasConvocatoria.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Selecciona áreas para configurar niveles y grados</h3>
                <div className="flex flex-wrap gap-3 mb-2">
                  {areasConvocatoria.map(area => (
                    <label key={area.id_area} className={`px-3 py-2 rounded cursor-pointer border ${selectedAreasBatch.includes(area.id_area) ? 'bg-blue-100 border-blue-400' : 'bg-gray-50 border-gray-200'}`}>
                      <input
                        type="checkbox"
                        checked={selectedAreasBatch.includes(area.id_area)}
                        onChange={() => handleBatchAreaSelect(area.id_area)}
                        className="mr-2"
                      />
                      {area.nombre_area}
                    </label>
                  ))}
                </div>
                {selectedAreasBatch.length > 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded mb-2">
                    <span className="font-medium">Configuración masiva:</span> Los niveles y grados seleccionados se aplicarán a todas las áreas marcadas.
                  </div>
                )}
              </div>
            )}
            {/* NUEVO: Configuración masiva de niveles y grados */}
            {selectedAreasBatch.length > 0 && (
              <div className="mb-8 border rounded-lg p-4 bg-gray-50">
                <h4 className="text-md font-semibold mb-2">Configurar niveles y grados para áreas seleccionadas</h4>
                {/* Niveles disponibles (chips compactos) */}
                <div className="mb-4">
                  <h5 className="font-medium text-gray-700 mb-3">Selecciona niveles</h5>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {niveles.filter(nivel =>
                      selectedAreasBatch.every(areaId =>
                        (nivelesDisponiblesPorArea[areaId] || []).some(n => n.id_nivel === nivel.id_nivel)
                      )
                    ).map(nivel => {
                      const isSelected = selectedAreasBatch.every(areaId => selectedNiveles.some(n => n.id_nivel === nivel.id_nivel && n.id_area === areaId));
                      const autoGrado = getAutoGradoForNivel(nivel.nombre_nivel);
                      return (
                        <button
                          key={`batch-nivel-${nivel.id_nivel}`}
                          type="button"
                          className={`px-4 py-2 rounded-full border text-sm font-medium flex items-center gap-2 transition-all ${isSelected ? 'bg-green-100 border-green-500 text-green-800' : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-400'}`}
                          onClick={() => {
                            const nuevos = [...selectedNiveles];
                            selectedAreasBatch.forEach(areaId => {
                              const existe = nuevos.some(n => n.id_nivel === nivel.id_nivel && n.id_area === areaId);
                              const key = `${areaId}-${nivel.id_nivel}`;
                              if (existe) {
                                const idx = nuevos.findIndex(n => n.id_nivel === nivel.id_nivel && n.id_area === areaId);
                                if (idx !== -1) nuevos.splice(idx, 1);
                                delete nivelGrados[key];
                              } else {
                                nuevos.push({ id_nivel: nivel.id_nivel, id_area: areaId });
                                if (autoGrado) {
                                  nivelGrados[key] = [autoGrado.id_grado];
                                } else {
                                  nivelGrados[key] = nivelGrados[key] || [];
                                }
                              }
                            });
                            setSelectedNiveles([...nuevos]);
                            setNivelGrados({ ...nivelGrados });
                          }}
                        >
                          <span>{nivel.nombre_nivel}</span>
                          {autoGrado && isSelected && (
                            <span className="ml-2 px-2 py-0.5 rounded bg-green-200 text-green-900 text-xs font-semibold border border-green-300">
                              {autoGrado.nombre_grado}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {/* Grados para cada nivel seleccionado (solo si no es automático) */}
                {niveles.filter(nivel => selectedAreasBatch.every(areaId => selectedNiveles.some(n => n.id_nivel === nivel.id_nivel && n.id_area === areaId))).map(nivel => {
                  const autoGrado = getAutoGradoForNivel(nivel.nombre_nivel);
                  if (autoGrado) return null;
                  // Si no es automático, mostrar selección manual de grados
                  return (
                    <div key={`batch-grados-${nivel.id_nivel}`} className="mb-4">
                      <h6 className="font-medium text-gray-700 mb-2">Selecciona grados para {nivel.nombre_nivel}</h6>
                      <div className="flex flex-wrap gap-2">
                        {grados.map(grado => {
                          const key = `${selectedAreasBatch[0]}-${nivel.id_nivel}`;
                          const isSelected = (nivelGrados[key] || []).includes(grado.id_grado);
                          return (
                            <button
                              key={`batch-grado-${nivel.id_nivel}-${grado.id_grado}`}
                              type="button"
                              className={`px-3 py-1 rounded-full border text-xs font-medium transition-all ${isSelected ? 'bg-purple-100 border-purple-500 text-purple-800' : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-purple-50 hover:border-purple-400'}`}
                              onClick={() => {
                                selectedAreasBatch.forEach(areaId => {
                                  const k = `${areaId}-${nivel.id_nivel}`;
                                  const current = nivelGrados[k] || [];
                                  if (isSelected) {
                                    nivelGrados[k] = current.filter(g => g !== grado.id_grado);
                                  } else {
                                    nivelGrados[k] = [...current, grado.id_grado];
                                  }
                                });
                                setNivelGrados({ ...nivelGrados });
                              }}
                            >
                              {grado.nombre_grado}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {/* Botón de guardado masivo */}
                <div className="flex justify-end mt-4">
                  <button
                    type="button"
                    disabled={isLoading}
                    className={`px-5 py-2 rounded-md font-medium transition ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                    onClick={handleGuardarBatch}
                  >
                    Guardar configuración de áreas seleccionadas
                  </button>
                </div>
              </div>
            )}
            {/* Mostrar niveles ya asignados para todas las áreas (fuera del formulario de configuración masiva) SOLO si hay al menos un área con niveles configurados */}
            {selectedConvocatoriaNiveles && areasConvocatoria.length > 0 && nivelesAsignados.some(n => n.id_area) && (
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4">Niveles ya configurados por área</h3>
                <div className="flex flex-wrap gap-4">
                  {areasConvocatoria.map(area => {
                    const nivelesDeEstaArea = nivelesAsignados.filter(nivel => nivel.id_area === area.id_area);
                    if (nivelesDeEstaArea.length === 0) return null;
                    return (
                      <div key={`niveles-asignados-${area.id_area}`} className="border rounded-lg p-3 bg-blue-50 min-w-[220px] flex flex-col">
                        <div className="flex items-center gap-2 font-semibold text-blue-900 mb-2">
                          {area.nombre_area}
                          <CheckCircleIcon className="w-5 h-5 text-green-500" title="Área configurada" />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {nivelesDeEstaArea.map(nivel => (
                            <span key={`nivel-asignado-${nivel.id_convocatoria_nivel}`} className="bg-blue-200 text-blue-900 px-3 py-1 rounded-full text-xs font-medium flex flex-col items-center">
                              <span>{nivel.nombre_nivel}</span>
                              <span className="text-[10px] text-blue-800">{nivel.nombre_grado_min} a {nivel.nombre_grado_max}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {selectedConvocatoriaNiveles && areasConvocatoria.length === 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-700">
                  Esta convocatoria no tiene áreas asignadas. Primero asigne áreas a la convocatoria.
                </p>
              </div>
            )}
            {/* Al final del formulario de configuración masiva, agregar botón "Aceptar" para cerrar el formulario */}
            {selectedConvocatoriaNiveles && (
              <div className="flex justify-end mt-8">
                <button
                  type="button"
                  className="px-6 py-3 rounded-md font-medium transition bg-gray-600 hover:bg-gray-700 text-white"
                  onClick={() => setShowConfigurarNivelesForm(false)}
                >
                  Aceptar
                </button>
              </div>
            )}
          </form>
        </div>
      )}
      
      {/* Formulario para Crear Nivel */}
      {showCrearNivelForm && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Crear Nuevo Nivel</h2>
          <p className="text-gray-600 mb-6">Agrega un nuevo nivel al catálogo del sistema</p>
          
          {nivelError && (
            <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
              {nivelError}
            </div>
          )}
          
          <form onSubmit={handleCrearNivel} className="space-y-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Nombre del Nivel</label>
              <input
                type="text"
                value={nuevoNivel}
                onChange={(e) => setNuevoNivel(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                required
                maxLength={100}
              />
              <p className="mt-1 text-sm text-gray-500">
                Ingrese un nombre único para el nivel. Este nombre aparecerá en las opciones de niveles para las áreas de competencia.
              </p>
            </div>

            <div className="flex justify-end mt-8">
              <button
                type="submit"
                disabled={isLoading}
                className={`px-6 py-3 rounded-md font-medium transition ${
                  isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                }`}
              >
                {isLoading ? 'Creando...' : 'Crear Nivel'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Si no hay ningún formulario visible, mostrar la lista de convocatorias */}
      {!showCrearConvocatoriaForm && !showAsignarAreasForm && !showConfigurarNivelesForm && !showCrearNivelForm && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Convocatorias Existentes</h2>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : convocatorias.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No hay convocatorias disponibles.</p>
              <button 
                onClick={() => setShowCrearConvocatoriaForm(true)}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition"
              >
                Crear una convocatoria
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fechas
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Áreas
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {convocatorias.map((convocatoria) => (
                    <tr key={convocatoria.id_convocatoria}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{convocatoria.nombre}</div>
                        <div className="text-xs text-gray-500">Máx. {convocatoria.max_areas_por_estudiante} áreas</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          Del {new Date(convocatoria.fecha_inicio_inscripcion).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-900">
                          al {new Date(convocatoria.fecha_fin_inscripcion).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${convocatoria.estado === 'abierta' ? 'bg-green-100 text-green-800' : 
                            convocatoria.estado === 'cerrada' ? 'bg-red-100 text-red-800' : 
                            convocatoria.estado === 'finalizada' ? 'bg-gray-100 text-gray-800' : 
                            'bg-blue-100 text-blue-800'}`}>
                          {convocatoria.estado.charAt(0).toUpperCase() + convocatoria.estado.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {convocatoria.areas && convocatoria.areas.length > 0 ? (
                          <div>
                            <div className="text-xs font-medium text-gray-700 mb-1">
                              {convocatoria.areas.length} {convocatoria.areas.length === 1 ? 'área' : 'áreas'}:
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {convocatoria.areas.map((areaItem) => (
                                <span 
                                  key={`area-${convocatoria.id_convocatoria}-${areaItem.id_area}`}
                                  className="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs"
                                >
                                  {areaItem.area ? areaItem.area.nombre_area : `Área ${areaItem.id_area}`}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">Sin áreas asignadas</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => {
                            setSelectedConvocatoria(convocatoria.id_convocatoria);
                            setShowAsignarAreasForm(true);
                          }}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          Asignar Áreas
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedConvocatoriaNiveles(convocatoria.id_convocatoria);
                            setShowConfigurarNivelesForm(true);
                          }}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          Configurar Niveles
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {/* Toast de feedback */}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-3 rounded shadow-lg flex items-center gap-3 text-white transition-all animate-fade-in-down
          ${toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-yellow-500'}`}
        >
          {toast.type === 'success' && <CheckCircleIcon className="w-6 h-6" />}
          {toast.type === 'error' && <ExclamationCircleIcon className="w-6 h-6" />}
          {toast.type === 'warning' && <ExclamationCircleIcon className="w-6 h-6" />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}