import React, { useState } from 'react';
import { Upload, X, AlertCircle, Check } from 'lucide-react';
import { verificarCodigoOrden, subirComprobantePago } from '../../api/registration/comprobantePagoApi';

// Tipos para la orden y comprobante
interface ComprobantePago {
  id: number;
  numero_comprobante: string;
  nombre_pagador: string;
  fecha_pago: string;
  monto_pagado: number;
  datos_ocr?: {
    nombre?: string;
    numero_comprobante?: string;
    fecha?: string;
    monto?: number;
    [key: string]: any;
  };
  estado_verificacion: string;
}

interface OrdenInfo {
  orden: {
    id: number;
    codigo_unico: string;
    monto_total: number;
    fecha_emision: string;
    fecha_vencimiento: string;
    estado: string;
    tipo_origen: string;
    [key: string]: any;
  };
  estudiante?: {
    nombre_completo: string;
    ci: string;
  };
  unidad_educativa?: string;
  estudiantes_count?: number;
  comprobantes?: ComprobantePago[];
  [key: string]: any;
}

export default function CompletarInscripcion() {
  // Estados para completar inscripción
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [ordenInfo, setOrdenInfo] = useState<OrdenInfo | null>(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Función para manejar la verificación del código
  const handleVerification = async () => {
    if (!verificationCode.trim()) {
      setErrorMessage('Por favor ingrese un código de verificación');
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');
    
    try {
      // Llamar a la API para verificar el código
      const response = await verificarCodigoOrden(verificationCode);
      
      // Obtener la fecha de vencimiento de la orden
      const fechaVencimiento = new Date(response.orden.fecha_vencimiento);
      const fechaActual = new Date();

      // Verificar si la orden ha vencido
      if (fechaVencimiento < fechaActual) {
        setErrorMessage('Esta orden de pago ha vencido. Por favor genere una nueva orden.');
        setIsVerifying(false);
        return;
      }
      
      // Verificar el estado de la orden
      if (response.orden.estado === 'pagada') {
        setErrorMessage('Esta orden de pago ya ha sido pagada. No es necesario subir un comprobante.');
        setIsVerifying(false);
        return;
      }
      
      if (response.orden.estado === 'vencida') {
        setErrorMessage('Esta orden de pago está vencida. Por favor genere una nueva orden.');
        setIsVerifying(false);
        return;
      }
      
      // Verificar si ya tiene comprobante asociado
      if (response.tiene_comprobante) {
        setErrorMessage('Esta orden ya tiene un comprobante de pago en proceso de verificación.');
        setIsVerifying(false);
        return;
      }
      
      // Almacenar la información de la orden
      setOrdenInfo(response);
      setIsVerified(true);
    } catch (error) {
      let message = 'Error al verificar el código';
      
      if (error.response) {
        // Error con respuesta del servidor
        if (error.response.status === 404) {
          message = 'No se encontró una orden con ese código';
        } else if (error.response.data?.message) {
          message = error.response.data.message;
        }
      }
      setErrorMessage(message);
    } finally {
      setIsVerifying(false);
    }
  };

  // Función para manejar la selección de archivo
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    } 
  };

  // Función para manejar la carga del archivo
  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMessage('Por favor seleccione un archivo para cargar');
      return;
    }
      
    if (!ordenInfo) {
      setErrorMessage('No hay información de la orden para proceder');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setErrorMessage('');

    // Crear FormData para enviar el archivo
    const formData = new FormData();
    formData.append('codigo_orden', ordenInfo.orden.codigo_unico);
    formData.append('numero_comprobante', `COMP-${Math.floor(Math.random() * 10000)}`); // Ejemplo, idealmente se pediría este dato
    formData.append('nombre_pagador', ordenInfo.orden.tipo_origen === 'individual' ? 
      (ordenInfo.estudiante?.nombre_completo || 'Pagador') : 
      (ordenInfo.unidad_educativa || 'Institución'));
    formData.append('fecha_pago', new Date().toISOString().split('T')[0]);
    formData.append('monto_pagado', ordenInfo.orden.monto_total);
    formData.append('pdf_comprobante', selectedFile);

    try {
      // Simular progreso de carga
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 10;
          if (newProgress >= 90) {
            clearInterval(interval);
            return 90; // Dejamos en 90% hasta que termine la solicitud real
          }
          return newProgress;
        });
      }, 300);

      // Llamar a la API para subir el comprobante
      await subirComprobantePago(formData);

      // Completar la carga
      setUploadProgress(100);
      setUploadComplete(true);
      
      clearInterval(interval);
    } catch (error) {
      let message = 'Error al subir el comprobante';
      if (error.response && error.response.data?.message) {
        message = error.response.data.message;
      }
      setErrorMessage(message);
    } finally {
      setIsUploading(false);
    }
  };
  // Función para resetear el estado del componente
  const handleResetComponent = () => {
    setIsVerified(false);
    setUploadComplete(false);
    setSelectedFile(null);
    setUploadProgress(0);
    setOrdenInfo(null);
    setVerificationCode('');
    setErrorMessage('');
  };

  return (
    <div className="border rounded-lg p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4">Completar Inscripción</h2>
      <p className="text-sm text-gray-600 mb-6">
        Si ya ha generado su boleta de pago y realizado el pago en cajas, complete su inscripción aquí
      </p>

      {/* Mensaje de error */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
          <p className="text-red-700 text-sm">{errorMessage}</p>
        </div>
      )}

      {!isVerified ? (
        <div className="mb-4">
          <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-1">
            Código de Inscripción
          </label>
          <div className="flex">
            <input
              type="text"
              id="verificationCode"
              className="flex-grow px-4 py-2 border rounded-l-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ingrese su código de inscripción"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              disabled={isVerifying}
            />
            <button
              className={`${isVerifying ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-2 rounded-r-md flex items-center transition-colors`}
              onClick={handleVerification}
              disabled={isVerifying}
            >
              <span className="mr-2">{isVerifying ? 'Verificando...' : 'Verificar'}</span>
              {isVerifying ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
              ) : (
                <Check size={16} />
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-start">
            <div className="flex-shrink-0 mr-3">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="w-full">
              <h3 className="text-green-800 font-medium">Código verificado correctamente</h3>
              <p className="text-green-700 text-sm mt-1">
                {ordenInfo?.orden.tipo_origen === 'individual' 
                  ? `Inscripción para ${ordenInfo?.estudiante?.nombre_completo}` 
                  : `Inscripción para ${ordenInfo?.unidad_educativa} (${ordenInfo?.estudiantes_count} estudiantes)`}
              </p>
              <div className="text-green-700 text-sm mt-2 flex flex-wrap justify-between">
                <span>Monto total: <b>{ordenInfo?.orden.monto_total} Bs.</b></span>
                <span>Estado: <span className="font-bold uppercase">{ordenInfo?.orden.estado}</span></span>
                <span>Vence el: {new Date(ordenInfo?.orden.fecha_vencimiento).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {!uploadComplete ? (
            <div className="border border-gray-200 rounded-md p-4">
              <h3 className="font-medium mb-3">Subir comprobante de pago</h3>
              {!selectedFile ? (
                <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => document.getElementById('fileInput').click()}>
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 mb-1">Haga clic para seleccionar un archivo</p>
                  <p className="text-xs text-gray-400">Formatos aceptados: JPG, PNG, PDF (máx. 5MB)</p>
                  <input 
                    type="file" 
                    id="fileInput" 
                    accept=".jpg,.jpeg,.png,.pdf" 
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md mb-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-blue-100 rounded-md flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-medium text-sm">
                          {selectedFile.name.split('.').pop().toUpperCase()}
                        </span>
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-medium text-sm truncate" title={selectedFile.name}>
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button 
                      className="text-gray-500 hover:text-gray-700" 
                      onClick={() => setSelectedFile(null)}
                      type="button"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {isUploading ? (
                    <div className="space-y-2">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                          style={{ width: `${uploadProgress}%` }}>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 text-right">{uploadProgress}% completado</p>
                    </div>
                  ) : (
                    <button 
                      onClick={handleUpload} 
                      type="button"
                      className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 flex items-center justify-center"
                    >
                      <Upload size={16} className="mr-2" />
                      Subir comprobante
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Check className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-blue-800 font-medium">¡Inscripción completada con éxito!</h3>
              </div>
              <p className="text-blue-700 text-sm mb-4">
                Su comprobante de pago ha sido recibido y su inscripción ha sido completada. Recibirá un correo electrónico con todos los detalles de su inscripción.
              </p>              <div className="flex justify-end">
                <button
                  type="button"
                  className="bg-blue-600 text-white px-4 py-1 text-sm rounded hover:bg-blue-700"
                  onClick={handleResetComponent}
                >
                  Aceptar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
