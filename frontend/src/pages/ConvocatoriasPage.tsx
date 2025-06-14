import { useState, useRef } from 'react';
import { crearConvocatoria } from '../api/adminConvocatoriaApi';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';
import FormInput from '../components/FormInput';
import EstadoConvocatoria from '../components/EstadoConvocatoria';
import { useConvocatorias } from '../hooks/useConvocatorias';

function formatNombre(str: string): string {
  if (!str) return '';
  const s = str.normalize('NFC').trim();
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export default function ConvocatoriasPage() {
  const { convocatorias, loading, refetch } = useConvocatorias();
  const [isLoading, setIsLoading] = useState(false);
  const [showCrearConvocatoriaForm, setShowCrearConvocatoriaForm] = useState(false);  const [formDataConvocatoria, setFormDataConvocatoria] = useState({
    nombre: '',
    fecha_inicio_inscripcion: '',
    fecha_fin_inscripcion: '',
    max_areas_por_estudiante: 2,
  });
  const [formErrors, setFormErrors] = useState({
    nombre: '',
    fecha_inicio_inscripcion: '',
    fecha_fin_inscripcion: '',
    general: ''
  });  const [toast, setToast] = useState({ show: false, type: '', message: '' });
  const toastTimeout = useRef<number | null>(null);
  const showToast = (type: string, message: string) => {
    setToast({ show: true, type, message });
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast({ show: false, type: '', message: '' }), 3000);
  };
  const handleInputChangeConvocatoria = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let newValue = value;
    if (name === 'nombre') {
      newValue = formatNombre(value);
    }
    setFormErrors(prev => ({ ...prev, [name]: '' }));
    setFormDataConvocatoria({
      ...formDataConvocatoria,
      [name]: newValue,
    });
  };

  const validarFormularioConvocatoria = () => {
    const errores = {
      nombre: '',
      fecha_inicio_inscripcion: '',
      fecha_fin_inscripcion: '',
      general: ''
    };
    let esValido = true;
    const nombreActual = formDataConvocatoria.nombre.normalize('NFC').trim();
    const nombreDuplicado = convocatorias.some(
      convocatoria => (convocatoria.nombre || '').normalize('NFC').trim() === nombreActual
    );
    if (nombreDuplicado) {
      errores.nombre = "Ya existe una convocatoria con este nombre (incluyendo acentos y mayúsculas).";
      esValido = false;
    }
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const [yearInicio, monthInicio, dayInicio] = formDataConvocatoria.fecha_inicio_inscripcion.split('-').map(Number);
    const [yearFin, monthFin, dayFin] = formDataConvocatoria.fecha_fin_inscripcion.split('-').map(Number);
    const fechaInicio = new Date(yearInicio, monthInicio - 1, dayInicio, 0, 0, 0, 0);
    const fechaFin = new Date(yearFin, monthFin - 1, dayFin, 0, 0, 0, 0);
    const hoyString = hoy.toDateString();
    const inicioString = fechaInicio.toDateString();
    if (fechaInicio < hoy && inicioString !== hoyString) {
      errores.fecha_inicio_inscripcion = "La fecha de inicio no puede ser anterior a la fecha actual";
      esValido = false;
    }
    if (fechaFin < hoy && fechaFin.toDateString() !== hoyString) {
      errores.fecha_fin_inscripcion = "La fecha de fin no puede ser anterior a la fecha actual";
      esValido = false;
    }
    if (fechaInicio > fechaFin) {
      errores.fecha_fin_inscripcion = "La fecha de fin debe ser igual o posterior a la fecha de inicio";
      esValido = false;
    }
    setFormErrors(errores);
    return esValido;
  };
  const handleCrearConvocatoria = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({
      nombre: '',
      fecha_inicio_inscripcion: '',
      fecha_fin_inscripcion: '',
      general: ''
    });
    if (!formDataConvocatoria.nombre || 
        !formDataConvocatoria.fecha_inicio_inscripcion || 
        !formDataConvocatoria.fecha_fin_inscripcion) {
      setFormErrors(prev => ({...prev, general: 'Por favor complete todos los campos requeridos'}));
      return;
    }
    if (!validarFormularioConvocatoria()) {
      return;
    }
    setIsLoading(true);
    try {      await crearConvocatoria(formDataConvocatoria);
      showToast('success', 'Convocatoria creada exitosamente');      
      setFormDataConvocatoria({
        nombre: '',
        fecha_inicio_inscripcion: '',
        fecha_fin_inscripcion: '',
        max_areas_por_estudiante: 2,
      });      setShowCrearConvocatoriaForm(false);
      // Refresh data instead of reloading the entire page
      await refetch();} catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      if (err.response?.data?.message) {
        setFormErrors(prev => ({...prev, general: `Error: ${err.response?.data?.message}`}));
      } else {
        setFormErrors(prev => ({...prev, general: 'Error al crear la convocatoria. Por favor, inténtelo de nuevo.'}));
      }
    }finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Convocatorias Existentes</h1>
        <button
          onClick={() => setShowCrearConvocatoriaForm(!showCrearConvocatoriaForm)}
          className={`px-4 py-2 rounded-md font-medium transition ${
            showCrearConvocatoriaForm
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {showCrearConvocatoriaForm ? 'Cancelar' : 'Crear Convocatoria'}
        </button>
      </div>
      {showCrearConvocatoriaForm && (
        <form onSubmit={handleCrearConvocatoria} className="space-y-6">
          <FormInput
            label="Nombre"
            type="text"
            name="nombre"
            value={formDataConvocatoria.nombre}
            onChange={handleInputChangeConvocatoria}
            maxLength={50}
            required
            error={formErrors.nombre}
          />
          <FormInput
            label="Fecha de Inicio"
            type="date"
            name="fecha_inicio_inscripcion"
            value={formDataConvocatoria.fecha_inicio_inscripcion}
            onChange={handleInputChangeConvocatoria}
            required
            error={formErrors.fecha_inicio_inscripcion}
          />
          <FormInput
            label="Fecha de Fin"
            type="date"
            name="fecha_fin_inscripcion"
            value={formDataConvocatoria.fecha_fin_inscripcion}
            onChange={handleInputChangeConvocatoria}
            required
            error={formErrors.fecha_fin_inscripcion}
          />          <FormInput
            label="Máximo de Áreas por Estudiante"
            type="number"
            name="max_areas_por_estudiante"
            value={formDataConvocatoria.max_areas_por_estudiante}
            onChange={handleInputChangeConvocatoria}            
            min="1"
            required
            error=""
          />
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
      )}
      <div className="bg-white rounded-lg shadow-lg p-8 mt-8">
        
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : convocatorias.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No hay convocatorias disponibles.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fechas</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado y Gestión</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Áreas</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {convocatorias.map((convocatoria) => (
                  <tr key={convocatoria.id_convocatoria}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{convocatoria.nombre}</div>
                      <div className="text-xs text-gray-500">Máx. {convocatoria.max_areas_por_estudiante} áreas</div>
                    </td>                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium text-gray-700 mb-1">Fechas de Inscripción:</div>
                        <div>Del {new Date(convocatoria.fecha_inicio_inscripcion).toLocaleDateString()}</div>
                        <div>al {new Date(convocatoria.fecha_fin_inscripcion).toLocaleDateString()}</div>
                        
                        {convocatoria.fecha_apertura && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="font-medium text-green-700 mb-1">Convocatoria Abierta:</div>
                            <div className="text-green-600">
                              {new Date(convocatoria.fecha_apertura).toLocaleDateString()} a las{' '}
                              {new Date(convocatoria.fecha_apertura).toLocaleTimeString()}
                            </div>
                            <div className="text-xs text-green-600 mt-1">
                              Duración: {(() => {
                                const now = new Date();
                                const apertura = new Date(convocatoria.fecha_apertura);
                                const diffMs = now.getTime() - apertura.getTime();
                                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                                const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                                
                                if (diffDays > 0) {
                                  return `${diffDays} día${diffDays > 1 ? 's' : ''}, ${diffHours}h`;
                                } else if (diffHours > 0) {
                                  return `${diffHours}h ${diffMinutes}m`;
                                } else {
                                  return `${diffMinutes} minutos`;
                                }
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    </td><td className="px-6 py-4">
                      <EstadoConvocatoria 
                        convocatoriaId={convocatoria.id_convocatoria}
                        onEstadoChanged={() => refetch()}
                      />
                    </td>
                    <td className="px-6 py-4">
                      {convocatoria.areas && convocatoria.areas.length > 0 ? (
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
                      ) : (
                        <div className="text-xs text-gray-500">Sin áreas asignadas</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
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
