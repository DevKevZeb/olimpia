import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { inscripcionService } from '../services';

export function Registration() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [datosInscripcion, setDatosInscripcion] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para el formulario
  const [formData, setFormData] = useState({
    estudiante: {
      nombres: '',
      apellidos: '',
      ci: '',
      fecha_nacimiento: '',
      email: '',
      id_unidad_educativa: '',
      id_grado: ''
    },
    tutor_legal: {
      nombres: '',
      apellidos: '',
      ci: '',
      telefono: '',
      email: '',
      parentesco: 'Familiar',
      es_el_mismo_estudiante: false
    },
    tutor_academico: {
      nombres: '',
      apellidos: '',
      ci: '',
      telefono: '',
      email: ''
    },
    areas_seleccionadas: [] as { id_convocatoria_area: number, id_convocatoria_nivel: number }[]
  });

  // Cargar datos iniciales para el formulario
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await inscripcionService.getDatosInscripcion();
        if (response.status === 'success') {
          setDatosInscripcion(response.data);
          setError(null);
        } else {
          setError(response.message || 'Error al cargar datos para inscripción');
        }
      } catch (err: any) {
        console.error('Error cargando datos de inscripción:', err);
        setError(err.friendlyMessage || 'Error al conectar con el servidor');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Identificar a qué sección pertenece el campo (estudiante, tutor_legal, tutor_academico)
    if (name.startsWith('estudiante.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        estudiante: {
          ...prev.estudiante,
          [field]: value
        }
      }));
    } else if (name.startsWith('tutor_legal.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        tutor_legal: {
          ...prev.tutor_legal,
          [field]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }
      }));
    } else if (name.startsWith('tutor_academico.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        tutor_academico: {
          ...prev.tutor_academico,
          [field]: value
        }
      }));
    }
  };

  const handleAreaToggle = (areaId: number, nivelId: number) => {
    setFormData(prev => {
      // Verificar si ya está seleccionada esta combinación de área y nivel
      const isSelected = prev.areas_seleccionadas.some(
        item => item.id_convocatoria_area === areaId && item.id_convocatoria_nivel === nivelId
      );
      
      if (isSelected) {
        // Si ya está seleccionada, quitarla
        return {
          ...prev,
          areas_seleccionadas: prev.areas_seleccionadas.filter(
            item => !(item.id_convocatoria_area === areaId && item.id_convocatoria_nivel === nivelId)
          )
        };
      } else {
        // Si no está seleccionada, agregarla
        return {
          ...prev,
          areas_seleccionadas: [
            ...prev.areas_seleccionadas,
            { id_convocatoria_area: areaId, id_convocatoria_nivel: nivelId }
          ]
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Asignar ID de unidad educativa y grado si no están seleccionados
      if (!formData.estudiante.id_unidad_educativa && datosInscripcion?.unidades_educativas?.length > 0) {
        formData.estudiante.id_unidad_educativa = datosInscripcion.unidades_educativas[0].id_unidad_educativa;
      }
      
      if (!formData.estudiante.id_grado && datosInscripcion?.grados?.length > 0) {
        formData.estudiante.id_grado = datosInscripcion.grados[0].id_grado;
      }
      
      const response = await inscripcionService.inscribirEstudiante(formData);
      
      if (response.status === 'success') {
        // Navegar a la página de confirmación con los datos de la orden
        navigate('/confirmacion', { 
          state: { 
            ordenPago: response.data.orden_pago,
            estudiante: response.data.estudiante,
            costoTotal: response.data.costo_total
          } 
        });
      } else {
        setError(response.message || 'Error al realizar la inscripción');
      }
    } catch (err: any) {
      console.error('Error realizando inscripción:', err);
      setError(err.friendlyMessage || 'Error al procesar la inscripción');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando formulario de inscripción...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Formulario de Inscripción</h1>
          
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Datos del Estudiante */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Datos del Estudiante</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="estudiante.nombres" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombres*
                  </label>
                  <input
                    type="text"
                    id="estudiante.nombres"
                    name="estudiante.nombres"
                    required
                    value={formData.estudiante.nombres}
                    onChange={handleChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="estudiante.apellidos" className="block text-sm font-medium text-gray-700 mb-1">
                    Apellidos*
                  </label>
                  <input
                    type="text"
                    id="estudiante.apellidos"
                    name="estudiante.apellidos"
                    required
                    value={formData.estudiante.apellidos}
                    onChange={handleChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="estudiante.ci" className="block text-sm font-medium text-gray-700 mb-1">
                    CI*
                  </label>
                  <input
                    type="text"
                    id="estudiante.ci"
                    name="estudiante.ci"
                    required
                    value={formData.estudiante.ci}
                    onChange={handleChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="estudiante.fecha_nacimiento" className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Nacimiento*
                  </label>
                  <input
                    type="date"
                    id="estudiante.fecha_nacimiento"
                    name="estudiante.fecha_nacimiento"
                    required
                    value={formData.estudiante.fecha_nacimiento}
                    onChange={handleChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="estudiante.email" className="block text-sm font-medium text-gray-700 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    id="estudiante.email"
                    name="estudiante.email"
                    value={formData.estudiante.email}
                    onChange={handleChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="estudiante.id_grado" className="block text-sm font-medium text-gray-700 mb-1">
                    Grado*
                  </label>
                  <select
                    id="estudiante.id_grado"
                    name="estudiante.id_grado"
                    required
                    value={formData.estudiante.id_grado}
                    onChange={handleChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Seleccione un grado</option>
                    {datosInscripcion?.grados?.map((grado: any) => (
                      <option key={grado.id_grado} value={grado.id_grado}>
                        {grado.nombre_grado}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="estudiante.id_unidad_educativa" className="block text-sm font-medium text-gray-700 mb-1">
                    Unidad Educativa*
                  </label>
                  <select
                    id="estudiante.id_unidad_educativa"
                    name="estudiante.id_unidad_educativa"
                    required
                    value={formData.estudiante.id_unidad_educativa}
                    onChange={handleChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Seleccione una unidad educativa</option>
                    {datosInscripcion?.unidades_educativas?.map((unidad: any) => (
                      <option key={unidad.id_unidad_educativa} value={unidad.id_unidad_educativa}>
                        {unidad.nombre} - {unidad.departamento}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Datos del Tutor Legal */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Datos del Tutor Legal</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="tutor_legal.nombres" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombres*
                  </label>
                  <input
                    type="text"
                    id="tutor_legal.nombres"
                    name="tutor_legal.nombres"
                    required
                    value={formData.tutor_legal.nombres}
                    onChange={handleChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="tutor_legal.apellidos" className="block text-sm font-medium text-gray-700 mb-1">
                    Apellidos*
                  </label>
                  <input
                    type="text"
                    id="tutor_legal.apellidos"
                    name="tutor_legal.apellidos"
                    required
                    value={formData.tutor_legal.apellidos}
                    onChange={handleChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="tutor_legal.ci" className="block text-sm font-medium text-gray-700 mb-1">
                    CI*
                  </label>
                  <input
                    type="text"
                    id="tutor_legal.ci"
                    name="tutor_legal.ci"
                    required
                    value={formData.tutor_legal.ci}
                    onChange={handleChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="tutor_legal.telefono" className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono*
                  </label>
                  <input
                    type="tel"
                    id="tutor_legal.telefono"
                    name="tutor_legal.telefono"
                    required
                    value={formData.tutor_legal.telefono}
                    onChange={handleChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="tutor_legal.email" className="block text-sm font-medium text-gray-700 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    id="tutor_legal.email"
                    name="tutor_legal.email"
                    value={formData.tutor_legal.email}
                    onChange={handleChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="tutor_legal.parentesco" className="block text-sm font-medium text-gray-700 mb-1">
                    Parentesco*
                  </label>
                  <select
                    id="tutor_legal.parentesco"
                    name="tutor_legal.parentesco"
                    required
                    value={formData.tutor_legal.parentesco}
                    onChange={handleChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="Padre">Padre</option>
                    <option value="Madre">Madre</option>
                    <option value="Familiar">Otro Familiar</option>
                    <option value="Tutor">Tutor</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Áreas de Competencia */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Áreas de Competencia</h2>
              <p className="text-sm text-gray-500 mb-4">
                Selecciona las áreas y niveles en los que deseas participar.
                Puedes seleccionar hasta {datosInscripcion?.convocatoria?.max_areas || 2} áreas.
              </p>
              
              {datosInscripcion?.areas && (
                <div className="space-y-4">
                  {datosInscripcion.areas.map((area: any) => {
                    const nivelesArea = datosInscripcion.niveles_por_area[area.id_area] || [];
                    
                    return (
                      <div key={area.id} className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-2">{area.nombre}</h3>
                        <p className="text-sm text-gray-500 mb-2">Costo: Bs. {area.costo}</p>
                        
                        <div className="mt-3 space-y-2">
                          {nivelesArea.map((nivel: any) => {
                            const isSelected = formData.areas_seleccionadas.some(
                              item => item.id_convocatoria_area === area.id && item.id_convocatoria_nivel === nivel.id
                            );
                            
                            return (
                              <label key={nivel.id} className="flex items-start">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleAreaToggle(area.id, nivel.id)}
                                  className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <span className="ml-2 block text-sm">
                                  <span className="font-medium text-gray-700">{nivel.nombre}</span>
                                  <span className="text-gray-500 block text-xs">
                                    Grados: {nivel.grado_min} a {nivel.grado_max}
                                  </span>
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {formData.areas_seleccionadas.length === 0 && (
                <p className="text-sm text-red-500 mt-2">
                  Debes seleccionar al menos un área y nivel
                </p>
              )}
            </div>
            
            {/* Botón de envío */}
            <div>
              <button
                type="submit"
                disabled={loading || formData.areas_seleccionadas.length === 0}
                className={`w-full py-3 px-4 bg-blue-600 text-white rounded-md font-medium 
                  ${(loading || formData.areas_seleccionadas.length === 0) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
              >
                {loading ? 'Procesando...' : 'Completar Inscripción'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}