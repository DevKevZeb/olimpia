import React, { useState, useEffect } from 'react';
import { 
  getConvocatoriasActivas, 
  getAreasCompetencia,
  getNivelesCategoria,
  getGrados,
  crearConvocatoria,
  asociarAreas 
} from '../api/adminConvocatoriaApi';

export default function AdminPanel() {
  const [showConvocatoriaForm, setShowConvocatoriaForm] = useState(false);
  const [showAsociarAreasForm, setShowAsociarAreasForm] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    fecha_inicio_inscripcion: '',
    fecha_fin_inscripcion: '',
    max_areas_por_estudiante: 2,
    estado: 'planificada',
  });
  const [convocatorias, setConvocatorias] = useState([]);
  const [areas, setAreas] = useState([]);
  const [niveles, setNiveles] = useState([]);
  const [grados, setGrados] = useState([]);
  const [selectedConvocatoria, setSelectedConvocatoria] = useState('');
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [selectedNiveles, setSelectedNiveles] = useState([]);
  const [nivelGrados, setNivelGrados] = useState({});

  useEffect(() => {
    if (showConvocatoriaForm || showAsociarAreasForm) {
      fetchData();
    }
  }, [showConvocatoriaForm, showAsociarAreasForm]);

  const fetchData = async () => {
    try {
      if (showConvocatoriaForm || showAsociarAreasForm) {
        const convocatoriasResponse = await getConvocatoriasActivas();
        if (convocatoriasResponse && convocatoriasResponse.data) {
          setConvocatorias(convocatoriasResponse.data);
        } else if (convocatoriasResponse && Array.isArray(convocatoriasResponse)) {
          setConvocatorias(convocatoriasResponse);
        } else {
          console.error('Formato de respuesta inesperado:', convocatoriasResponse);
        }
      }

      if (showAsociarAreasForm) {
        const areasResponse = await getAreasCompetencia();
        if (areasResponse && areasResponse.data) {
          setAreas(areasResponse.data);
        } else if (areasResponse && Array.isArray(areasResponse)) {
          setAreas(areasResponse);
        } else {
          console.error('Formato de respuesta inesperado:', areasResponse);
        }

        const nivelesResponse = await getNivelesCategoria();
        if (nivelesResponse && nivelesResponse.data) {
          setNiveles(nivelesResponse.data);
        } else if (nivelesResponse && Array.isArray(nivelesResponse)) {
          setNiveles(nivelesResponse);
        } else {
          console.error('Formato de respuesta inesperado (niveles):', nivelesResponse);
        }

        const gradosResponse = await getGrados();
        if (gradosResponse && gradosResponse.data) {
          setGrados(gradosResponse.data);
        } else if (gradosResponse && Array.isArray(gradosResponse)) {
          setGrados(gradosResponse);
        } else {
          console.error('Formato de respuesta inesperado (grados):', gradosResponse);
        }
      }
    } catch (error) {
      console.error('Error detallado al cargar los datos:', error);
      alert('Error al cargar los datos. Por favor, inténtelo de nuevo.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await crearConvocatoria(formData);
      alert('Convocatoria creada exitosamente');
      setShowConvocatoriaForm(false);
      setFormData({
        nombre: '',
        fecha_inicio_inscripcion: '',
        fecha_fin_inscripcion: '',
        max_areas_por_estudiante: 2,
        estado: 'planificada',
      });
      fetchData();
    } catch (error) {
      console.error('Error al crear la convocatoria:', error.response?.data || error.message);
      alert('Error al crear la convocatoria');
    }
  };

  const handleAreaSelect = (areaId) => {
    const isSelected = selectedAreas.some((area) => area.id_area === areaId);
    if (isSelected) {
      setSelectedAreas(selectedAreas.filter((area) => area.id_area !== areaId));
      setSelectedNiveles(selectedNiveles.filter(nivel => nivel.id_area !== areaId));
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

  const handleNivelSelect = (nivelId, areaId) => {
    const isSelected = selectedNiveles.some(n => n.id_nivel === nivelId);
    if (isSelected) {
      setSelectedNiveles(selectedNiveles.filter(n => n.id_nivel !== nivelId));
      setNivelGrados({...nivelGrados, [nivelId]: []});
    } else {
      setSelectedNiveles([...selectedNiveles, { id_nivel: nivelId, id_area: areaId }]);
      if (!nivelGrados[nivelId]) {
        setNivelGrados({...nivelGrados, [nivelId]: []});
      }
    }
  };

  const handleGradoSelect = (gradoId, nivelId) => {
    const currentGrados = nivelGrados[nivelId] || [];
    const isSelected = currentGrados.includes(gradoId);
    if (isSelected) {
      setNivelGrados({
        ...nivelGrados,
        [nivelId]: currentGrados.filter(g => g !== gradoId)
      });
    } else {
      setNivelGrados({
        ...nivelGrados,
        [nivelId]: [...currentGrados, gradoId]
      });
    }
  };

  const handleAsociarAreasSubmit = async (e) => {
    e.preventDefault();

    if (!selectedConvocatoria) {
      alert('Debe seleccionar una convocatoria');
      return;
    }

    if (selectedAreas.length === 0) {
      alert('Debe seleccionar al menos un área');
      return;
    }

    if (selectedNiveles.length === 0) {
      alert('Debe seleccionar al menos un nivel');
      return;
    }

    const nivelesConGrados = selectedNiveles.every(nivel => 
      nivelGrados[nivel.id_nivel] && nivelGrados[nivel.id_nivel].length > 0
    );

    if (!nivelesConGrados) {
      alert('Todos los niveles deben tener al menos un grado seleccionado');
      return;
    }

    try {
      const dataToSubmit = {
        id_convocatoria: selectedConvocatoria,
        areas: selectedAreas.map(area => ({
          ...area,
          costo_inscripcion: parseInt(area.costo_inscripcion, 10)
        })),
        niveles: selectedNiveles.map(nivel => ({
          id_nivel: nivel.id_nivel,
          grados: nivelGrados[nivel.id_nivel] || []
        }))
      };

      const response = await asociarAreas(dataToSubmit);
      alert('Configuración guardada exitosamente');
      setShowAsociarAreasForm(false);
      setSelectedConvocatoria('');
      setSelectedAreas([]);
      setSelectedNiveles([]);
      setNivelGrados({});
      fetchData();
    } catch (error) {
      console.error('Error al asociar áreas y niveles:', error);
      if (error.response) {
        alert(`Error: ${error.response.data.message || 'Error desconocido'}`);
      } else {
        alert('Error al guardar. Por favor, verifica tu conexión.');
      }
    }
  };

  const getNivelesByArea = (areaId) => {
    return niveles.filter(nivel => nivel.id_area === areaId);
  };

  const getGradosByRange = (minGradoId, maxGradoId) => {
    return grados.filter(grado => {
      const gradoId = grado.id_grado;
      return gradoId >= minGradoId && gradoId <= maxGradoId;
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Panel Administrativo</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setShowConvocatoriaForm(!showConvocatoriaForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition"
          >
            {showConvocatoriaForm ? 'Cancelar' : 'Nueva Convocatoria'}
          </button>
          <button
            onClick={() => setShowAsociarAreasForm(!showAsociarAreasForm)}
            className="bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 transition"
          >
            {showAsociarAreasForm ? 'Cancelar' : 'Asociar Áreas'}
          </button>
        </div>
      </div>

      {showConvocatoriaForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Crear Nueva Convocatoria</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Nombre</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">Fecha de Inicio</label>
              <input
                type="date"
                name="fecha_inicio_inscripcion"
                value={formData.fecha_inicio_inscripcion}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">Fecha de Fin</label>
              <input
                type="date"
                name="fecha_fin_inscripcion"
                value={formData.fecha_fin_inscripcion}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">Máximo de Áreas por Estudiante</label>
              <input
                type="number"
                name="max_areas_por_estudiante"
                value={formData.max_areas_por_estudiante}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">Estado</label>
              <select
                name="estado"
                value={formData.estado}
                onChange={handleInputChange}
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

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-green-700 transition"
            >
              Guardar Convocatoria
            </button>
          </div>
        </form>
      )}

      {showAsociarAreasForm && (
        <form onSubmit={handleAsociarAreasSubmit} className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Configurar Convocatoria</h2>

          {convocatorias.length === 0 && <p className="text-amber-600 mb-4">Cargando convocatorias...</p>}
          {areas.length === 0 && <p className="text-amber-600 mb-4">Cargando áreas...</p>}
          {niveles.length === 0 && <p className="text-amber-600 mb-4">Cargando niveles...</p>}
          {grados.length === 0 && <p className="text-amber-600 mb-4">Cargando grados...</p>}

          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">Seleccionar Convocatoria</label>
            <select
              value={selectedConvocatoria}
              onChange={(e) => setSelectedConvocatoria(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              required
            >
              <option value="">Seleccione una convocatoria</option>
              {convocatorias.map((convocatoria) => (
                <option key={convocatoria.id_convocatoria} value={convocatoria.id_convocatoria}>
                  {convocatoria.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">1. Seleccionar Áreas de Competencia</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {areas.map((area) => (
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
                      id={`area-${area.id_area}`}
                      checked={selectedAreas.some(a => a.id_area === area.id_area)}
                      onChange={() => {}}
                      className="mr-3 h-4 w-4 text-blue-600"
                    />
                    <label htmlFor={`area-${area.id_area}`} className="font-medium text-gray-700">
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
          </div>

          {selectedAreas.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4">2. Seleccionar Niveles por Área</h3>
              
              <div className="space-y-6">
                {selectedAreas.map(selectedArea => {
                  const area = areas.find(a => a.id_area === selectedArea.id_area);
                  const nivelesFiltrados = getNivelesByArea(selectedArea.id_area);
                  
                  return (
                    <div key={`nivel-section-${selectedArea.id_area}`} className="p-4 border rounded-lg bg-gray-50">
                      <h4 className="text-lg font-semibold mb-3 text-blue-800">
                        Niveles para {area?.nombre_area}
                      </h4>
                      
                      {nivelesFiltrados.length === 0 ? (
                        <p className="text-gray-500 italic">No hay niveles disponibles para esta área.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {nivelesFiltrados.map(nivel => (
                            <div 
                              key={`nivel-${nivel.id_nivel}`}
                              className={`border rounded-lg p-3 cursor-pointer transition-all ${
                                selectedNiveles.some(n => n.id_nivel === nivel.id_nivel)
                                  ? 'border-green-500 bg-green-50'
                                  : 'hover:border-gray-400'
                              }`}
                              onClick={() => handleNivelSelect(nivel.id_nivel, selectedArea.id_area)}
                            >
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`nivel-${nivel.id_nivel}`}
                                  checked={selectedNiveles.some(n => n.id_nivel === nivel.id_nivel)}
                                  onChange={() => {}}
                                  className="mr-2 h-4 w-4 text-green-600"
                                />
                                <label htmlFor={`nivel-${nivel.id_nivel}`} className="font-medium text-gray-700">
                                  {nivel.nombre_nivel}
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {selectedNiveles.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4">3. Seleccionar Grados por Nivel</h3>
              
              <div className="space-y-6">
                {selectedNiveles.map(selectedNivel => {
                  const nivel = niveles.find(n => n.id_nivel === selectedNivel.id_nivel);
                  const area = areas.find(a => a.id_area === selectedNivel.id_area);
                  const gradosDisponibles = getGradosByRange(nivel?.id_grado_min, nivel?.id_grado_max);
                  
                  return (
                    <div key={`grado-section-${selectedNivel.id_nivel}`} className="p-4 border rounded-lg bg-gray-50">
                      <h4 className="text-lg font-semibold mb-2 text-green-800">
                        Grados para {nivel?.nombre_nivel} ({area?.nombre_area})
                      </h4>
                      
                      {gradosDisponibles.length === 0 ? (
                        <p className="text-gray-500 italic">No hay grados disponibles para este nivel.</p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                          {gradosDisponibles.map(grado => {
                            const isSelected = nivelGrados[selectedNivel.id_nivel]?.includes(grado.id_grado);
                            
                            return (
                              <div 
                                key={`grado-${selectedNivel.id_nivel}-${grado.id_grado}`}
                                className={`border rounded-lg p-2 cursor-pointer transition-all text-center ${
                                  isSelected 
                                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                                    : 'hover:border-gray-400 text-gray-700'
                                }`}
                                onClick={() => handleGradoSelect(grado.id_grado, selectedNivel.id_nivel)}
                              >
                                <span className="font-medium">{grado.nombre_grado}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end mt-8">
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-green-700 transition-colors"
            >
              Guardar Configuración
            </button>
          </div>
        </form>
      )}
    </div>
  );
}