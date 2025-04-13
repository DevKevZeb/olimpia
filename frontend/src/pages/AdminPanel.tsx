import React, { useState, useEffect } from 'react';
import { 
  getConvocatoriasActivas, 
  getAreasCompetencia,
  getNivelesCategoria,
  getGrados,
  crearConvocatoria,
  asociarAreas,
  asociarNivelesGrados,
  getAreasPorConvocatoria
} from '../api/adminConvocatoriaApi';

export default function AdminPanel() {
  // Estados para controlar qué formulario mostrar
  const [showCrearConvocatoriaForm, setShowCrearConvocatoriaForm] = useState(false);
  const [showAsignarAreasForm, setShowAsignarAreasForm] = useState(false);
  const [showConfigurarNivelesForm, setShowConfigurarNivelesForm] = useState(false);
  
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

  // Cargar las áreas de una convocatoria cuando cambia la selección en "Configurar Niveles"
  useEffect(() => {
    if (selectedConvocatoriaNiveles) {
      fetchAreasPorConvocatoria(selectedConvocatoriaNiveles);
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

  // Manejadores para el formulario de Asignar Áreas
  const handleAreaSelect = (areaId) => {
    const isSelected = selectedAreas.some((area) => area.id_area === areaId);
    if (isSelected) {
      setSelectedAreas(selectedAreas.filter((area) => area.id_area !== areaId));
    } else {
      setSelectedAreas([...selectedAreas, { id_area: areaId, costo_inscripcion: '' }]);
    }
  };

  const handleAreaCostChange = (areaId, cost) => {
    setSelectedAreas((prev) =>
      prev.map((area) =>
        area.id_area === areaId ? { ...area, costo_inscripcion: cost } : area
      )
    );
  };

  const handleAsignarAreas = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!selectedConvocatoria) {
      alert('Debe seleccionar una convocatoria');
      return;
    }
    
    if (selectedAreas.length === 0) {
      alert('Debe seleccionar al menos un área');
      return;
    }
    
    // Verificar que todas las áreas tengan costo
    const areasConCosto = selectedAreas.every(area => area.costo_inscripcion);
    if (!areasConCosto) {
      alert('Todas las áreas deben tener un costo de inscripción');
      return;
    }
    
    setIsLoading(true);
    try {
      // Preparar datos de áreas correctamente formateados
      const areasData = selectedAreas.map(area => ({
        id_area: area.id_area,
        costo_inscripcion: parseInt(area.costo_inscripcion, 10)
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
    const isSelected = selectedNiveles.some(n => n.id_nivel === nivelId && n.id_area === areaId);
    if (isSelected) {
      setSelectedNiveles(selectedNiveles.filter(n => !(n.id_nivel === nivelId && n.id_area === areaId)));
      // Eliminar los grados seleccionados para este nivel
      const updatedGrados = { ...nivelGrados };
      delete updatedGrados[`${areaId}-${nivelId}`];
      setNivelGrados(updatedGrados);
    } else {
      setSelectedNiveles([...selectedNiveles, { id_nivel: nivelId, id_area: areaId }]);
      // Inicializar un array vacío para los grados de este nivel
      setNivelGrados({
        ...nivelGrados,
        [`${areaId}-${nivelId}`]: []
      });
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

  // Renderizado de niveles disponibles
  const renderNiveles = (selectedArea) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {niveles.map(nivel => (
          <div 
            key={`nivel-${selectedArea.id_area}-${nivel.id_nivel}`}
            className={`border rounded-lg p-3 cursor-pointer transition-all ${
              selectedNiveles.some(n => n.id_nivel === nivel.id_nivel && n.id_area === selectedArea.id_area)
                ? 'border-green-500 bg-green-50'
                : 'hover:border-gray-400'
            }`}
            onClick={() => handleNivelSelect(nivel.id_nivel, selectedArea.id_area)}
          >
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedNiveles.some(n => n.id_nivel === nivel.id_nivel && n.id_area === selectedArea.id_area)}
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
        </div>
      </div>

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
          <p className="text-gray-600 mb-6">Selecciona las áreas y sus costos para una convocatoria existente</p>
          
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
                    <div 
                      key={`assigned-${area.id_area}`} 
                      className="px-3 py-2 bg-blue-100 text-blue-800 rounded-md flex items-center"
                    >
                      <span className="text-sm font-medium">{area.nombre_area}</span>
                      <span className="ml-2 text-xs bg-blue-200 px-2 py-1 rounded-full">
                        {area.costo_inscripcion} Bs.
                      </span>
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
                        
                        {selectedAreas.some(a => a.id_area === area.id_area) && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <label className="block text-sm text-gray-600 mb-1">Costo de Inscripción (Bs.)</label>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={selectedAreas.find(a => a.id_area === area.id_area)?.costo_inscripcion || ''}
                              onChange={(e) => handleAreaCostChange(area.id_area, e.target.value)}
                              className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
                              placeholder="Ingrese costo"
                              onClick={(e) => e.stopPropagation()}
                              required
                            />
                          </div>
                        )}
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
            
            {/* Áreas disponibles para esta convocatoria */}
            {selectedConvocatoriaNiveles && areasConvocatoria.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4">Configuración de niveles y grados</h3>
                
                <div className="space-y-4">
                  {areasConvocatoria.map(area => (
                    <div key={`config-${area.id_area}`} className="border rounded-lg p-4">
                      <h4 className="text-lg font-semibold mb-2">{area.nombre_area}</h4>
                      
                      <div className="mt-4">
                        <h5 className="font-medium text-gray-700 mb-3">Selecciona niveles para {area.nombre_area}</h5>
                        {renderNiveles(area)}
                        
                        {/* Si hay niveles seleccionados para esta área, mostrar los grados para cada nivel */}
                        {selectedNiveles.filter(n => n.id_area === area.id_area).length > 0 && (
                          <div className="mt-4">
                            <h5 className="font-medium text-gray-700 mb-3">Selecciona grados para cada nivel</h5>
                            <div className="space-y-3">
                              {selectedNiveles
                                .filter(n => n.id_area === area.id_area)
                                .map(selectedNivel => renderGrados(area.id_area, selectedNivel.id_nivel))
                              }
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
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

            <div className="flex justify-end mt-8">
              <button
                type="submit"
                disabled={isLoading || areasConvocatoria.length === 0}
                className={`px-6 py-3 rounded-md font-medium transition ${
                  isLoading || areasConvocatoria.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {isLoading ? 'Configurando...' : 'Configurar Niveles y Grados'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Si no hay ningún formulario visible, mostrar la lista de convocatorias */}
      {!showCrearConvocatoriaForm && !showAsignarAreasForm && !showConfigurarNivelesForm && (
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
    </div>
  );
}