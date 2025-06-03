import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  ArrowRightIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/solid';
import { getEstadoConvocatoria, transicionarEstadoConvocatoria } from '../api/adminConvocatoriaApi';

interface EstadoConvocatoriaProps {
  convocatoriaId: number;
  onEstadoChanged?: () => void;
}

interface EstadoInfo {
  estado_actual: string;
  puede_abrir: boolean;
  debe_cerrar: boolean;
  fecha_apertura?: string;
  requisitos: {
    areas_asignadas: boolean;
    niveles_configurados: boolean;
    costos_establecidos: boolean;
    requisitos_faltantes: string[];
  };
  transiciones_validas: TransicionValida[];
}

interface TransicionValida {
  estado: string;
  label: string;
  requiere_validacion: boolean;
}

const EstadoConvocatoria: React.FC<EstadoConvocatoriaProps> = ({ 
  convocatoriaId, 
  onEstadoChanged 
}) => {
  const [estadoInfo, setEstadoInfo] = useState<EstadoInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState<string | null>(null);
  const cargarEstadoInfo = useCallback(async () => {
    setLoading(true);
    try {
      const info = await getEstadoConvocatoria(convocatoriaId);
      setEstadoInfo(info);
    } catch (err: unknown) {
      setError('Error al cargar información del estado');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [convocatoriaId]);
  useEffect(() => {
    cargarEstadoInfo();
  }, [cargarEstadoInfo]);
  const handleTransicion = async (nuevoEstado: string) => {
    setTransitioning(nuevoEstado);
    setError(null);
    
    try {
      await transicionarEstadoConvocatoria(convocatoriaId, nuevoEstado);
      // Recargar la información del estado primero
      await cargarEstadoInfo();
      // Luego notificar al componente padre para actualizar la lista
      onEstadoChanged?.();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; data?: unknown } } };
      const errorMessage = error.response?.data?.message || 'Error al cambiar estado';
      setError(errorMessage);
      
      // Si hay requisitos faltantes, mostrarlos
      if (error.response?.data?.data) {
        console.log('Requisitos faltantes:', error.response.data.data);
      }
    } finally {
      setTransitioning(null);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'planificada':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'abierta':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cerrada':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'finalizada':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'planificada':
        return <ClockIcon className="w-5 h-5" />;
      case 'abierta':
        return <CheckCircleIcon className="w-5 h-5" />;
      case 'cerrada':
        return <XCircleIcon className="w-5 h-5" />;
      case 'finalizada':
        return <CheckCircleIcon className="w-5 h-5" />;
      default:
        return <InformationCircleIcon className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow border">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-200 h-10 w-10"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!estadoInfo) {
    return (
      <div className="bg-white p-6 rounded-lg shadow border">
        <div className="text-center text-gray-500">
          No se pudo cargar la información del estado
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Estado de la Convocatoria</h3>
        
        {/* Estado actual */}
        <div className={`flex items-center px-3 py-2 rounded-full border ${getEstadoColor(estadoInfo.estado_actual)}`}>
          {getEstadoIcon(estadoInfo.estado_actual)}
          <span className="ml-2 font-medium capitalize">
            {estadoInfo.estado_actual}
          </span>
        </div>
      </div>      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-2" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {/* Requisitos para abrir (solo si está en planificada) */}
      {estadoInfo.estado_actual === 'planificada' && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-800 mb-3">
            Requisitos para Abrir la Convocatoria
          </h4>
          
          <div className="space-y-2">
            <RequisitoItem
              label="Áreas Asignadas"
              completado={estadoInfo.requisitos.areas_asignadas}
            />
            <RequisitoItem
              label="Niveles y Grados Configurados"
              completado={estadoInfo.requisitos.niveles_configurados}
            />
            <RequisitoItem
              label="Costos Establecidos"
              completado={estadoInfo.requisitos.costos_establecidos}
            />
          </div>

          {estadoInfo.requisitos.requisitos_faltantes.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <h5 className="text-sm font-medium text-yellow-800 mb-2">
                Requisitos pendientes:
              </h5>
              <ul className="text-sm text-yellow-700 space-y-1">
                {estadoInfo.requisitos.requisitos_faltantes.map((requisito: string, index: number) => (
                  <li key={index} className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-2"></span>
                    {requisito}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}      {/* Información para convocatoria abierta */}
      {estadoInfo.estado_actual === 'abierta' && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-800 mb-3">
            Estado de la Convocatoria Abierta
          </h4>
          
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-start">
              <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800 mb-2">
                  ✅ Convocatoria actualmente abierta para inscripciones
                </p>
                <p className="text-sm text-green-700 mb-3">
                  La convocatoria se cerrará automáticamente cuando pase la fecha fin de inscripciones. 
                  No es necesario realizar ninguna acción manual.
                </p>
                
                {estadoInfo.fecha_apertura && (
                  <div className="mt-3 p-3 bg-white border border-green-300 rounded-md">
                    <div className="text-sm">
                      <div className="font-medium text-green-800 mb-1">📅 Información de Apertura:</div>
                      <div className="text-green-700">
                        Abierta el: {new Date(estadoInfo.fecha_apertura).toLocaleDateString()} a las{' '}
                        {new Date(estadoInfo.fecha_apertura).toLocaleTimeString()}
                      </div>
                      <div className="text-green-600 mt-1">
                        ⏱️ Tiempo transcurrido: {(() => {
                          const now = new Date();
                          const apertura = new Date(estadoInfo.fecha_apertura);
                          const diffMs = now.getTime() - apertura.getTime();
                          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                          const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                          const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                          
                          if (diffDays > 0) {
                            return `${diffDays} día${diffDays > 1 ? 's' : ''}, ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
                          } else if (diffHours > 0) {
                            return `${diffHours} hora${diffHours > 1 ? 's' : ''}, ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
                          } else {
                            return `${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
                          }
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Acciones disponibles */}
      {estadoInfo.transiciones_validas.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-800 mb-3">
            Acciones Disponibles
          </h4>
          
          <div className="space-y-2">
            {estadoInfo.transiciones_validas.map((transicion: TransicionValida) => (
              <button
                key={transicion.estado}
                onClick={() => handleTransicion(transicion.estado)}
                disabled={
                  transitioning !== null || 
                  (transicion.requiere_validacion && !estadoInfo.puede_abrir)
                }
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-colors ${
                  transitioning === transicion.estado
                    ? 'bg-gray-100 cursor-not-allowed'
                    : transicion.requiere_validacion && !estadoInfo.puede_abrir
                    ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                }`}
              >
                <span className="font-medium">{transicion.label}</span>
                <div className="flex items-center">
                  {transitioning === transicion.estado ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                  ) : (
                    <ArrowRightIcon className="w-4 h-4" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mensaje de advertencia para convocatorias que deben cerrarse */}
      {estadoInfo.debe_cerrar && (
        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-orange-400 mr-2" />
            <span className="text-orange-700 text-sm font-medium">
              Esta convocatoria ha pasado su fecha de fin y debería ser cerrada.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

interface RequisitoItemProps {
  label: string;
  completado: boolean;
}

const RequisitoItem: React.FC<RequisitoItemProps> = ({ label, completado }) => (
  <div className="flex items-center space-x-3">
    <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
      completado ? 'bg-green-100' : 'bg-gray-100'
    }`}>
      {completado ? (
        <CheckCircleIcon className="w-4 h-4 text-green-600" />
      ) : (
        <XCircleIcon className="w-4 h-4 text-gray-400" />
      )}
    </div>
    <span className={`text-sm ${completado ? 'text-gray-900' : 'text-gray-500'}`}>
      {label}
    </span>
  </div>
);

export default EstadoConvocatoria;
