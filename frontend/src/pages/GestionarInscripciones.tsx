import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileDown, Upload, CreditCard, Search, Info, CheckCircle, Clock, XCircle } from 'lucide-react';
import { verificarCodigoOrden } from '../api/registration/boletaPagoApi';
import axios from 'axios';

interface EstadoInscripcion {
  orden: {
    id: number;
    codigo_unico: string;
    monto_total: number;
    fecha_emision: string;
    fecha_vencimiento: string;
    estado: string;
    tipo_origen: string;
  };
  estudiante?: {
    nombre_completo: string;
    ci: string;
  };
  unidad_educativa?: string;
  estudiantes_count?: number;
  tiene_comprobante: boolean;
}

export default function GestionarInscripciones() {
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState('');
  const [estadoInscripcion, setEstadoInscripcion] = useState<EstadoInscripcion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const consultarEstado = async () => {
    if (!codigo.trim()) {
      setError('Por favor ingrese su código de inscripción');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const response = await verificarCodigoOrden(codigo.trim());
      setEstadoInscripcion(response);    } catch (error: unknown) {
      let errorMessage = 'Error al consultar el estado';
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      setError(errorMessage);
      setEstadoInscripcion(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getEstadoInfo = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <Clock className="w-4 h-4" />,
          label: 'Pendiente de Pago',
          description: 'Descargue su boleta y realice el pago'
        };
      case 'pagada':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <CheckCircle className="w-4 h-4" />,
          label: 'Pagada',
          description: 'Su inscripción ha sido completada exitosamente'
        };
      case 'vencida':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <XCircle className="w-4 h-4" />,
          label: 'Vencida',
          description: 'Esta orden de pago ha vencido'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <Info className="w-4 h-4" />,
          label: estado,
          description: 'Estado desconocido'
        };
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-lg shadow-lg p-8">        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Gestionar Inscripciones
          </h1>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Consulte el estado de su inscripción, descargue boletas y complete su proceso de pago. 
            Use los accesos rápidos o consulte el estado detallado con su código de inscripción.
          </p>
        </div>{/* Accesos Rápidos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileDown className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-blue-900 mb-2">Descargar Boleta</h3>
            <p className="text-sm text-blue-700 mb-4">
              Descargue su boleta de pago para realizar el pago en cajas
            </p>
            <button
              onClick={() => navigate('/download-boleta')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
            >
              Ir a Descargar
            </button>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-green-900 mb-2">Subir Comprobante</h3>
            <p className="text-sm text-green-700 mb-4">
              Suba su comprobante de pago para completar la inscripción
            </p>
            <button
              onClick={() => navigate('/complete-registration')}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
            >
              Ir a Completar
            </button>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-purple-900 mb-2">Nueva Inscripción</h3>
            <p className="text-sm text-purple-700 mb-4">
              Iniciar un nuevo proceso de inscripción
            </p>
            <button
              onClick={() => navigate('/registration')}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 text-sm"
            >
              Inscribirse
            </button>
          </div>
        </div>        {/* Consultar Estado */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Search className="w-5 h-5 mr-2" />
            Consultar Estado de Inscripción
          </h2>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-2">¿Cómo obtener su código de inscripción?</h3>
            <p className="text-sm text-blue-800">
              Su código de inscripción fue generado al completar el proceso de pre-inscripción. 
              Tiene el formato: <code className="bg-blue-100 px-1 rounded">O-SANSI-2024-XXXXX</code>
            </p>
          </div>
          
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              placeholder="Código de inscripción (ej: O-SANSI-2024-12345)"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && consultarEstado()}
            />
            <button
              onClick={consultarEstado}
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Consultando...' : 'Consultar'}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {estadoInscripcion && (
            <div className="bg-gray-50 border rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información General */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Información General</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Código:</span>
                      <span className="ml-2">{estadoInscripcion.orden.codigo_unico}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Monto Total:</span>
                      <span className="ml-2">{estadoInscripcion.orden.monto_total} Bs.</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Fecha de Emisión:</span>
                      <span className="ml-2">{formatFecha(estadoInscripcion.orden.fecha_emision)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Vence:</span>
                      <span className="ml-2">{formatFecha(estadoInscripcion.orden.fecha_vencimiento)}</span>
                    </div>
                    {estadoInscripcion.estudiante && (
                      <div>
                        <span className="font-medium text-gray-700">Estudiante:</span>
                        <span className="ml-2">{estadoInscripcion.estudiante.nombre_completo}</span>
                      </div>
                    )}
                    {estadoInscripcion.estudiantes_count && (
                      <div>
                        <span className="font-medium text-gray-700">Estudiantes:</span>
                        <span className="ml-2">{estadoInscripcion.estudiantes_count}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Estado y Acciones */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Estado y Acciones</h3>
                  
                  {/* Estado */}
                  <div className={`border rounded-lg p-3 mb-4 ${getEstadoInfo(estadoInscripcion.orden.estado).color}`}>
                    <div className="flex items-center">
                      {getEstadoInfo(estadoInscripcion.orden.estado).icon}
                      <span className="ml-2 font-medium">
                        {getEstadoInfo(estadoInscripcion.orden.estado).label}
                      </span>
                    </div>
                    <p className="text-xs mt-1">
                      {getEstadoInfo(estadoInscripcion.orden.estado).description}
                    </p>
                  </div>

                  {/* Acciones disponibles */}
                  <div className="space-y-2">                    {estadoInscripcion.orden.estado === 'pendiente' && (
                      <>
                        <button
                          onClick={() => navigate(`/download-boleta?codigo=${estadoInscripcion.orden.codigo_unico}`)}
                          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center justify-center transition-colors"
                        >
                          <FileDown className="w-4 h-4 mr-2" />
                          Descargar Boleta
                        </button>
                        
                        {!estadoInscripcion.tiene_comprobante && (
                          <button
                            onClick={() => navigate(`/complete-registration?codigo=${estadoInscripcion.orden.codigo_unico}`)}
                            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 flex items-center justify-center transition-colors"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Subir Comprobante
                          </button>
                        )}
                        
                        {estadoInscripcion.tiene_comprobante && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-yellow-800 text-sm">
                              ✓ Comprobante subido. En proceso de verificación.
                            </p>
                          </div>
                        )}
                      </>
                    )}
                    
                    {estadoInscripcion.orden.estado === 'pagada' && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-green-800 text-sm font-medium">
                          ✓ Inscripción completada exitosamente
                        </p>
                        <p className="text-green-700 text-xs mt-1">
                          Su proceso de inscripción está completo. Estará atento a futuras comunicaciones.
                        </p>
                      </div>
                    )}
                    
                    {estadoInscripcion.orden.estado === 'vencida' && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-red-800 text-sm font-medium">
                          ⚠ Orden de pago vencida
                        </p>
                        <p className="text-red-700 text-xs mt-1">
                          Debe generar una nueva orden de pago para continuar con su inscripción.
                        </p>
                        <button
                          onClick={() => navigate('/registration')}
                          className="mt-2 w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 text-sm"
                        >
                          Generar Nueva Orden
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
