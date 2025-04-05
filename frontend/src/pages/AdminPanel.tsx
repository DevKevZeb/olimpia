import React, { useState, useEffect } from 'react';
import { 
  getConvocatoriasActivas, 
  getAreasCompetencia, 
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
  const [selectedConvocatoria, setSelectedConvocatoria] = useState('');
  const [selectedAreas, setSelectedAreas] = useState([]);

  useEffect(() => {
    if (showConvocatoriaForm || showAsociarAreasForm) {
      fetchData();
    }
  }, [showConvocatoriaForm, showAsociarAreasForm]);

  const fetchData = async () => {
    try {
      // Obtener convocatorias siempre
      if (showConvocatoriaForm || showAsociarAreasForm) {
        const convocatoriasResponse = await getConvocatoriasActivas();
        console.log('Respuesta convocatorias:', convocatoriasResponse); // Para depuración
        
        // ApiController->successResponse devuelve un objeto con data y message
        if (convocatoriasResponse && convocatoriasResponse.data) {
          setConvocatorias(convocatoriasResponse.data);
        } else if (convocatoriasResponse && Array.isArray(convocatoriasResponse)) {
          // En caso de que la respuesta sea directamente un array
          setConvocatorias(convocatoriasResponse);
        } else {
          console.error('Formato de respuesta inesperado:', convocatoriasResponse);
        }
      }

      // Obtener áreas solo si es necesario
      if (showAsociarAreasForm) {
        const areasResponse = await getAreasCompetencia();
        console.log('Respuesta áreas:', areasResponse); // Para depuración
        
        // Maneja diferentes formatos posibles de respuesta
        if (areasResponse && areasResponse.data) {
          setAreas(areasResponse.data);
        } else if (areasResponse && Array.isArray(areasResponse)) {
          setAreas(areasResponse);
        } else {
          console.error('Formato de respuesta inesperado:', areasResponse);
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
      console.log('Convocatoria creada:', response);
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
    } else {
      setSelectedAreas([...selectedAreas, { id_area: areaId, costo_inscripcion: '' }]); // Inicializar con string vacío
    }
  };

  const handleAreaCostChange = (areaId, cost) => {
    setSelectedAreas((prev) =>
      prev.map((area) =>
        area.id_area === areaId ? { ...area, costo_inscripcion: cost } : area
      )
    );
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

    try {
      const dataToSubmit = {
        id_convocatoria: selectedConvocatoria,
        areas: selectedAreas.map(area => ({
          ...area,
          costo_inscripcion: parseInt(area.costo_inscripcion, 10) // Convertir a entero
        })),
      };

      console.log('Enviando datos:', dataToSubmit);

      const response = await asociarAreas(dataToSubmit);
      console.log('Respuesta del servidor:', response);

      alert('Áreas asociadas exitosamente');
      setShowAsociarAreasForm(false);
      setSelectedConvocatoria('');
      setSelectedAreas([]);
      fetchData();
    } catch (error) {
      console.error('Error al asociar áreas:', error);
      if (error.response) {
        console.error('Detalles del error:', error.response.data);
        alert(`Error al asociar áreas: ${error.response.data.message || 'Error desconocido'}`);
      } else {
        alert('Error al asociar áreas. Por favor, verifica tu conexión.');
      }
    }
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
          <h2 className="text-2xl font-bold mb-6">Asociar Áreas a Convocatoria</h2>

          {convocatorias.length === 0 && <p className="text-amber-600 mb-4">Cargando convocatorias...</p>}
          {areas.length === 0 && <p className="text-amber-600 mb-4">Cargando áreas...</p>}

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

          <h3 className="text-xl font-bold mb-4">Seleccionar Áreas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {areas.map((area) => (
              <div key={area.id_area} className="border rounded-lg p-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={`area-${area.id_area}`}
                    checked={selectedAreas.some((a) => a.id_area === area.id_area)}
                    onChange={() => handleAreaSelect(area.id_area)}
                    className="mr-2"
                  />
                  <label htmlFor={`area-${area.id_area}`} className="font-medium">
                    {area.nombre_area}
                  </label>
                </div>
                {selectedAreas.some((a) => a.id_area === area.id_area) && (
                  <div className="mt-4">
                    <label className="block text-sm text-gray-600 mb-1">Costo de Inscripción (Bs.)</label>
                    <input
                      type="number"
                      min="1"
                      step="1" // Solo permitir números enteros
                      value={
                        selectedAreas.find((a) => a.id_area === area.id_area)?.costo_inscripcion || ''
                      }
                      onChange={(e) => handleAreaCostChange(area.id_area, e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1"
                      placeholder="Ingrese costo"
                      required
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-green-700 transition"
            >
              Guardar Áreas
            </button>
          </div>
        </form>
      )}
    </div>
  );
}