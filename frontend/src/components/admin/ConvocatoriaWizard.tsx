import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, ArrowRight, Check, AlertCircle, Loader, ChevronDown } from 'lucide-react';
import { adminService } from '../../services';

interface ConvocatoriaWizardProps {
  onClose: () => void;
}

const ConvocatoriaWizard: React.FC<ConvocatoriaWizardProps> = ({ onClose }) => {
  // Estado para controlar los pasos del wizard
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  
  // Estados para los datos del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    fecha_inicio_inscripcion: '',
    fecha_fin_inscripcion: '',
    max_areas_por_estudiante: 2,
    estado: 'planificada',
    areas: [] as { id_area: number, costo_inscripcion: number }[],
    niveles: [] as { id_nivel: number }[],
  });
  
  // Estados para los catálogos de datos
  const [areas, setAreas] = useState<any[]>([]);
  const [niveles, setNiveles] = useState<any[]>([]);
  const [grados, setGrados] = useState<any[]>([]);
  
  // Estado para manejo de errores y carga
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Estados para debugging
  const [debugData, setDebugData] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);
  
  // Cargar datos iniciales para los catálogos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setDataLoading(true);
        console.log("Fetching dashboard data...");
        const response = await adminService.getDashboardData();
        console.log("Dashboard data response:", response);
        
        if (response.status === 'success' && response.data) {
          // Guardar toda la respuesta para debugging
          setDebugData(response.data);
          
          // Verificar si los catálogos existen en la respuesta
          if (response.data.catalogos) {
            setAreas(response.data.catalogos.areas || []);
            setNiveles(response.data.catalogos.niveles || []);
            setGrados(response.data.catalogos.grados || []);
            console.log("Áreas cargadas:", response.data.catalogos.areas);
            console.log("Niveles cargados:", response.data.catalogos.niveles);
            console.log("Grados cargados:", response.data.catalogos.grados);
          } else {
            // Si no existe la estructura esperada, intentamos adaptarnos
            setAreas(response.data.areas || []);
            setNiveles(response.data.niveles || []);
            setGrados(response.data.grados || []);
            console.warn("Estructura de respuesta no estándar, adaptando...");
          }
        } else {
          setError(response.message || 'Error al cargar los datos del dashboard');
          console.error("Error en respuesta:", response);
        }
      } catch (err) {
        setError('Error al cargar los datos necesarios. Por favor, intente nuevamente.');
        console.error('Error loading data:', err);
      } finally {
        setDataLoading(false);
      }
    };
    
    // También intentamos cargar los datos directamente desde los endpoints CRUD
    const fetchCrudData = async () => {
      try {
        // Si no tenemos datos del dashboard, intentamos con endpoints individuales
        const areasResponse = await fetch('/api/v1/areas');
        const nivelesResponse = await fetch('/api/v1/niveles');
        const gradosResponse = await fetch('/api/v1/grados');
        
        if (areasResponse.ok) {
          const areasData = await areasResponse.json();
          setAreas(areasData.data || []);
          console.log("Áreas cargadas (CRUD):", areasData.data);
        }
        
        if (nivelesResponse.ok) {
          const nivelesData = await nivelesResponse.json();
          setNiveles(nivelesData.data || []);
          console.log("Niveles cargados (CRUD):", nivelesData.data);
        }
        
        if (gradosResponse.ok) {
          const gradosData = await gradosResponse.json();
          setGrados(gradosData.data || []);
          console.log("Grados cargados (CRUD):", gradosData.data);
        }
      } catch (err) {
        console.error('Error loading CRUD data:', err);
      }
    };
    
    fetchData();
    // Intentar también con los endpoints CRUD si falla
    setTimeout(() => {
      if (areas.length === 0 || niveles.length === 0 || grados.length === 0) {
        fetchCrudData();
      }
    }, 1000);
  }, []);
  
  // Manejar cambios en los campos del formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };
  
  // Manejar selección/deselección de áreas
  const handleAreaToggle = (areaId: number) => {
    setFormData(prev => {
      // Verificar si el área ya está seleccionada
      const areaIndex = prev.areas.findIndex(a => a.id_area === areaId);
      
      if (areaIndex >= 0) {
        // Si ya existe, quitarla
        const newAreas = [...prev.areas];
        newAreas.splice(areaIndex, 1);
        return { ...prev, areas: newAreas };
      } else {
        // Si no existe, agregarla con un costo por defecto
        return { 
          ...prev, 
          areas: [...prev.areas, { id_area: areaId, costo_inscripcion: 100 }]
        };
      }
    });
  };
  
  // Actualizar el costo de un área
  const handleAreaCostChange = (areaId: number, costo: number) => {
    setFormData(prev => {
      const newAreas = prev.areas.map(area => 
        area.id_area === areaId 
          ? { ...area, costo_inscripcion: costo } 
          : area
      );
      return { ...prev, areas: newAreas };
    });
  };
  
  // Manejar selección/deselección de niveles
  const handleNivelToggle = (nivelId: number) => {
    setFormData(prev => {
      // Verificar si el nivel ya está seleccionado
      const nivelIndex = prev.niveles.findIndex(n => n.id_nivel === nivelId);
      
      if (nivelIndex >= 0) {
        // Si ya existe, quitarlo
        const newNiveles = [...prev.niveles];
        newNiveles.splice(nivelIndex, 1);
        return { ...prev, niveles: newNiveles };
      } else {
        // Si no existe, agregarlo
        return { 
          ...prev, 
          niveles: [...prev.niveles, { id_nivel: nivelId }]
        };
      }
    });
  };
  
  // Avanzar al siguiente paso
  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };
  
  // Volver al paso anterior
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };
  
  // Validar el paso actual antes de avanzar
  const validateCurrentStep = (): boolean => {
    setError(null);
    
    switch (currentStep) {
      case 1: // Datos básicos
        if (!formData.nombre) {
          setError('El nombre de la convocatoria es obligatorio');
          return false;
        }
        if (!formData.fecha_inicio_inscripcion) {
          setError('La fecha de inicio es obligatoria');
          return false;
        }
        if (!formData.fecha_fin_inscripcion) {
          setError('La fecha de fin es obligatoria');
          return false;
        }
        if (new Date(formData.fecha_fin_inscripcion) <= new Date(formData.fecha_inicio_inscripcion)) {
          setError('La fecha de fin debe ser posterior a la fecha de inicio');
          return false;
        }
        return true;
        
      case 2: // Selección de áreas
        if (formData.areas.length === 0) {
          setError('Debe seleccionar al menos un área');
          return false;
        }
        return true;
        
      case 3: // Selección de niveles
        if (formData.niveles.length === 0) {
          setError('Debe seleccionar al menos un nivel');
          return false;
        }
        return true;
        
      default:
        return true;
    }
  };
  
  // Enviar el formulario completo
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Enviando datos:", formData);
      
      const response = await adminService.crearConvocatoriaCompleta(formData);
      console.log("Respuesta de creación:", response);
      
      if (response.status === 'success') {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(response.message || 'Error al crear la convocatoria');
      }
    } catch (err: any) {
      setError(err.friendlyMessage || 'Error al crear la convocatoria');
      console.error('Error submitting form:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Renderizar el contenido según el paso actual
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Datos Básicos de la Convocatoria</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Convocatoria*
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Ej: Olimpiada de Ciencias 2023"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Inicio de Inscripción*
                </label>
                <input
                  type="date"
                  name="fecha_inicio_inscripcion"
                  value={formData.fecha_inicio_inscripcion}
                  onChange={handleChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Fin de Inscripción*
                </label>
                <input
                  type="date"
                  name="fecha_fin_inscripcion"
                  value={formData.fecha_fin_inscripcion}
                  onChange={handleChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Máximo de Áreas por Estudiante
              </label>
              <input
                type="number"
                name="max_areas_por_estudiante"
                value={formData.max_areas_por_estudiante}
                onChange={handleChange}
                min={1}
                max={10}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado Inicial
              </label>
              <select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="planificada">Planificada</option>
                <option value="abierta">Abierta</option>
                <option value="cerrada">Cerrada</option>
              </select>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Selección de Áreas</h3>
            <p className="text-sm text-gray-500 mb-4">
              Seleccione las áreas de competencia y defina el costo de inscripción para cada una.
            </p>
            
            {dataLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="animate-spin h-6 w-6 text-blue-500 mr-2" />
                <span>Cargando áreas...</span>
              </div>
            ) : areas.length > 0 ? (
              <div className="space-y-4">
                {areas.map((area) => {
                  // Compatibilidad con diferentes estructuras de respuesta
                  const areaId = area.id_area !== undefined ? area.id_area : (area.id || 0);
                  const areaName = area.nombre_area !== undefined ? area.nombre_area : (area.nombre || area.name || `Área ${areaId}`);
                  
                  const isSelected = formData.areas.some(a => a.id_area === areaId);
                  const selectedArea = formData.areas.find(a => a.id_area === areaId);
                  
                  return (
                    <div 
                      key={areaId}
                      className={`p-4 rounded-lg border ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={`area-${areaId}`}
                            checked={isSelected}
                            onChange={() => handleAreaToggle(areaId)}
                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <label 
                            htmlFor={`area-${areaId}`}
                            className="ml-2 text-sm font-medium text-gray-700"
                          >
                            {areaName}
                          </label>
                        </div>
                        
                        {isSelected && (
                          <div className="flex items-center">
                            <span className="text-sm text-gray-500 mr-2">Costo (Bs):</span>
                            <input
                              type="number"
                              value={selectedArea?.costo_inscripcion || 0}
                              onChange={(e) => handleAreaCostChange(areaId, Number(e.target.value))}
                              min={0}
                              step={10}
                              className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-gray-700 font-medium">No hay áreas disponibles</p>
                <p className="text-sm text-gray-500 mt-1">Debe crear áreas antes de continuar.</p>
              </div>
            )}
          </div>
        );
        
      case 3:
        // Compatibilidad con diferentes estructuras de respuesta
        const filterNivelesPorArea = () => {
          const areasSeleccionadas = formData.areas.map(a => a.id_area);
          
          return niveles.filter(nivel => {
            // Compatibilidad con diferentes estructuras de respuesta
            const nivelAreaId = nivel.id_area !== undefined ? nivel.id_area : (nivel.areaId || 0);
            return areasSeleccionadas.includes(nivelAreaId);
          });
        };
        
        const filteredNiveles = filterNivelesPorArea();
        
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Selección de Niveles</h3>
            <p className="text-sm text-gray-500 mb-4">
              Seleccione los niveles que estarán disponibles para cada área.
            </p>
            
            {dataLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="animate-spin h-6 w-6 text-blue-500 mr-2" />
                <span>Cargando niveles...</span>
              </div>
            ) : filteredNiveles.length > 0 ? (
              <div className="space-y-4">
                {filteredNiveles.map((nivel) => {
                  // Compatibilidad con diferentes estructuras de respuesta
                  const nivelId = nivel.id_nivel !== undefined ? nivel.id_nivel : (nivel.id || 0);
                  const nivelName = nivel.nombre_nivel !== undefined ? nivel.nombre_nivel : (nivel.nombre || nivel.name || `Nivel ${nivelId}`);
                  const nivelAreaId = nivel.id_area !== undefined ? nivel.id_area : (nivel.areaId || 0);
                  
                  const isSelected = formData.niveles.some(n => n.id_nivel === nivelId);
                  
                  // Encontrar el área correspondiente
                  const areaCorrespondiente = areas.find(a => {
                    const areaId = a.id_area !== undefined ? a.id_area : (a.id || 0);
                    return areaId === nivelAreaId;
                  });
                  
                  const areaName = areaCorrespondiente 
                    ? (areaCorrespondiente.nombre_area || areaCorrespondiente.nombre || areaCorrespondiente.name || '') 
                    : '';
                  
                  // Encontrar los grados min y max (si están disponibles)
                  let gradoMinInfo = '';
                  let gradoMaxInfo = '';
                  
                  if (nivel.id_grado_min !== undefined && grados.length > 0) {
                    const gradoMin = grados.find(g => g.id_grado === nivel.id_grado_min);
                    gradoMinInfo = gradoMin ? (gradoMin.nombre_grado || gradoMin.nombre || '') : '';
                  }
                  
                  if (nivel.id_grado_max !== undefined && grados.length > 0) {
                    const gradoMax = grados.find(g => g.id_grado === nivel.id_grado_max);
                    gradoMaxInfo = gradoMax ? (gradoMax.nombre_grado || gradoMax.nombre || '') : '';
                  }
                  
                  return (
                    <div 
                      key={nivelId}
                      className={`p-4 rounded-lg border ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`nivel-${nivelId}`}
                          checked={isSelected}
                          onChange={() => handleNivelToggle(nivelId)}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <div className="ml-2">
                          <label 
                            htmlFor={`nivel-${nivelId}`}
                            className="text-sm font-medium text-gray-700"
                          >
                            {nivelName}
                          </label>
                          <div className="text-xs text-gray-500">
                            {areaName && <span className="font-medium">{areaName}</span>}
                            {gradoMinInfo && gradoMaxInfo && (
                              <span> - Grados: {gradoMinInfo} a {gradoMaxInfo}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-gray-700 font-medium">No hay niveles disponibles para las áreas seleccionadas</p>
                <p className="text-sm text-gray-500 mt-1">
                  Seleccione otras áreas o verifique que haya niveles creados.
                </p>
              </div>
            )}
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Resumen y Confirmación</h3>
            
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <h4 className="font-medium text-gray-800 mb-2">Datos de la Convocatoria</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <span className="text-sm text-gray-500">Nombre:</span>
                  <p className="font-medium">{formData.nombre}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Estado:</span>
                  <p className="font-medium capitalize">{formData.estado}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Fecha de inicio:</span>
                  <p className="font-medium">{formData.fecha_inicio_inscripcion}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Fecha de fin:</span>
                  <p className="font-medium">{formData.fecha_fin_inscripcion}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Máximo de áreas por estudiante:</span>
                  <p className="font-medium">{formData.max_areas_por_estudiante}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <h4 className="font-medium text-gray-800 mb-2">Áreas Seleccionadas ({formData.areas.length})</h4>
              {formData.areas.length > 0 ? (
                <div className="space-y-2">
                  {formData.areas.map(areaItem => {
                    const areaInfo = areas.find(a => {
                      const areaId = a.id_area !== undefined ? a.id_area : (a.id || 0);
                      return areaId === areaItem.id_area;
                    });
                    
                    const areaName = areaInfo 
                      ? (areaInfo.nombre_area || areaInfo.nombre || areaInfo.name || `Área ${areaItem.id_area}`) 
                      : `Área ${areaItem.id_area}`;
                    
                    return (
                      <div key={areaItem.id_area} className="flex justify-between">
                        <span>{areaName}</span>
                        <span className="font-medium">Bs. {areaItem.costo_inscripcion}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No se han seleccionado áreas.</p>
              )}
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <h4 className="font-medium text-gray-800 mb-2">Niveles Seleccionados ({formData.niveles.length})</h4>
              {formData.niveles.length > 0 ? (
                <div className="space-y-2">
                  {formData.niveles.map(nivelItem => {
                    const nivelInfo = niveles.find(n => {
                      const nivelId = n.id_nivel !== undefined ? n.id_nivel : (n.id || 0);
                      return nivelId === nivelItem.id_nivel;
                    });
                    
                    const nivelName = nivelInfo 
                      ? (nivelInfo.nombre_nivel || nivelInfo.nombre || nivelInfo.name || `Nivel ${nivelItem.id_nivel}`) 
                      : `Nivel ${nivelItem.id_nivel}`;
                    
                    const nivelAreaId = nivelInfo 
                      ? (nivelInfo.id_area !== undefined ? nivelInfo.id_area : (nivelInfo.areaId || 0))
                      : 0;
                    
                    const areaInfo = areas.find(a => {
                      const areaId = a.id_area !== undefined ? a.id_area : (a.id || 0);
                      return areaId === nivelAreaId;
                    });
                    
                    const areaName = areaInfo 
                      ? (areaInfo.nombre_area || areaInfo.nombre || areaInfo.name || '') 
                      : '';
                    
                    return (
                      <div key={nivelItem.id_nivel} className="text-sm">
                        <span className="font-medium">{nivelName}</span>
                        {areaName && <span className="text-gray-500"> - {areaName}</span>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No se han seleccionado niveles.</p>
              )}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Componente para depuración
  const DebugSection = () => {
    if (!showDebug) return null;
    
    return (
      <div className="mt-6 border-t border-gray-200 pt-4">
        <h4 className="font-medium text-gray-700 mb-2">Datos Cargados:</h4>
        <div className="bg-gray-50 p-3 rounded text-xs font-mono overflow-auto max-h-40">
          <pre>{JSON.stringify({ areas, niveles, grados }, null, 2)}</pre>
        </div>
        
        {debugData && (
          <>
            <h4 className="font-medium text-gray-700 mt-4 mb-2">Respuesta Completa:</h4>
            <div className="bg-gray-50 p-3 rounded text-xs font-mono overflow-auto max-h-40">
              <pre>{JSON.stringify(debugData, null, 2)}</pre>
            </div>
          </>
        )}
      </div>
    );
  };
  
  if (dataLoading && currentStep === 1) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando datos...</span>
        </div>
      </div>
    );
  }
  
  if (success) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl mx-auto">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="rounded-full bg-green-100 p-3 mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-medium text-green-600 mb-2">Convocatoria Creada con Éxito</h3>
          <p className="text-gray-600">La convocatoria ha sido configurada correctamente.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl mx-auto relative">
      {/* Botón de cerrar */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        aria-label="Cerrar"
      >
        <X size={20} />
      </button>
      
      {/* Título */}
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Crear Nueva Convocatoria</h2>
      
      {/* Indicador de pasos */}
      <div className="flex justify-between mb-8">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div 
            key={index}
            className={`flex-1 h-2 mx-1 rounded-full ${
              currentStep > index + 1 
                ? 'bg-blue-600' 
                : currentStep === index + 1 
                  ? 'bg-blue-400' 
                  : 'bg-gray-200'
            }`}
          ></div>
        ))}
      </div>
      
      {/* Mensaje de error */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}
      
      {/* Contenido del paso actual */}
      <div className="mb-8">
        {renderStepContent()}
      </div>
      
      {/* Botón de depuración */}
      <button
        type="button"
        onClick={() => setShowDebug(!showDebug)}
        className="text-xs text-gray-400 hover:text-gray-600 flex items-center mb-4"
      >
        <ChevronDown size={14} className={`mr-1 transition-transform ${showDebug ? 'rotate-180' : ''}`} />
        {showDebug ? 'Ocultar detalles técnicos' : 'Mostrar detalles técnicos'}
      </button>
      
      {/* Sección de depuración */}
      <DebugSection />
      
      {/* Botones de navegación */}
      <div className="flex justify-between pt-4 border-t border-gray-200">
        <button
          onClick={currentStep === 1 ? onClose : prevStep}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center"
        >
          <ArrowLeft size={16} className="mr-1" />
          {currentStep === 1 ? 'Cancelar' : 'Anterior'}
        </button>
        
        <button
          onClick={currentStep === totalSteps ? handleSubmit : nextStep}
          disabled={loading}
          className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center ${
            loading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {loading && currentStep === totalSteps ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
              Procesando...
            </>
          ) : currentStep === totalSteps ? (
            <>
              Crear Convocatoria
              <Check size={16} className="ml-1" />
            </>
          ) : (
            <>
              Siguiente
              <ArrowRight size={16} className="ml-1" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ConvocatoriaWizard;
