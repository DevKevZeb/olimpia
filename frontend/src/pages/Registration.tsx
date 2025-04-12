import React, { useState, useEffect } from 'react';
import { Calendar, Check, ChevronRight, Upload, X, AlertCircle } from 'lucide-react';
import { verificarCodigoOrden, subirComprobantePago } from '../api/comprobantePagoApi';
import { getDatosInscripcion, getAreasPorGrado, inscribirEstudiante, buscarUnidadesEducativas } from '../api/inscripcionCompletaApi';

export default function Registration() {
  // Estados originales para verificación de código
  const [step, setStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [ordenInfo, setOrdenInfo] = useState(null); 
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Estados para la inscripción
  const [isLoading, setIsLoading] = useState(false);
  const [convocatoria, setConvocatoria] = useState(null);
  const [grados, setGrados] = useState([]);
  const [areasNiveles, setAreasNiveles] = useState([]);
  const [unidadesEducativas, setUnidadesEducativas] = useState([]);
  const [buscandoUnidades, setBuscandoUnidades] = useState(false);
  
  // Estados para almacenar los datos del formulario
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    ci: '',
    fecha_nacimiento: '',
    email: '',
    id_grado: '',
    unidad_educativa: {
      id_unidad_educativa: null,
      nombre: '',
      departamento: '',
      provincia: '',
    },
    tutor_legal: {
      nombres: '',
      apellidos: '',
      ci: '',
      telefono: '',
      email: '',
      parentesco: '',
      es_el_mismo_estudiante: false,
    },
    id_convocatoria: '',
    areas_seleccionadas: [],
    tutores_academicos: [],
  });
  
  // Estado para rastrear las áreas seleccionadas con sus niveles y costos
  const [selectedAreas, setSelectedAreas] = useState([]);
  
  // Estado para almacenar el costo total
  const [costoTotal, setCostoTotal] = useState(0);

  // Cargar datos iniciales cuando se monta el componente
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const data = await getDatosInscripcion();
        console.log('Datos iniciales recibidos:', data);
        console.log('Grados recibidos:', data.grados);
        setConvocatoria(data.convocatoria);
        setGrados(data.grados);
        setFormData(prev => ({
          ...prev,
          id_convocatoria: data.convocatoria.id,
        }));
      } catch (error) {
        console.error('Error al obtener datos iniciales:', error);
        setErrorMessage('No se pudieron cargar los datos iniciales. Por favor, intente de nuevo más tarde.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);
  
  // Cargar áreas disponibles cuando se selecciona un grado
  useEffect(() => {
    if (formData.id_grado && formData.id_convocatoria) {
      const fetchAreasPorGrado = async () => {
        setIsLoading(true);
        try {
          const data = await getAreasPorGrado(parseInt(formData.id_grado), parseInt(formData.id_convocatoria));
          setAreasNiveles(data.areas_niveles);
          // Resetear áreas seleccionadas cuando cambia el grado
          setSelectedAreas([]);
          setCostoTotal(0);
        } catch (error) {
          console.error('Error al obtener áreas por grado:', error);
          setErrorMessage('No se pudieron cargar las áreas disponibles para el grado seleccionado.');
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchAreasPorGrado();
    }
  }, [formData.id_grado, formData.id_convocatoria]);

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

  // Función para reiniciar el proceso
  const resetVerification = () => {
    setVerificationCode('');
    setIsVerified(false);
    setOrdenInfo(null);
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    setUploadComplete(false);
    setErrorMessage('');
  };

  // Función para manejar la selección de áreas
  const handleAreaSelect = (areaNivel) => {
    // Verificar si ya está seleccionada
    const isSelected = selectedAreas.some(item => item.id_convocatoria_nivel === areaNivel.id_convocatoria_nivel);
    
    // Verificar límite de áreas si estamos añadiendo una nueva
    if (!isSelected && convocatoria && selectedAreas.length >= convocatoria.max_areas) {
      setErrorMessage(`No puede seleccionar más de ${convocatoria.max_areas} áreas`);
      return;
    }
    
    // Actualizar las áreas seleccionadas
    if (isSelected) {
      setSelectedAreas(selectedAreas.filter(item => item.id_convocatoria_nivel !== areaNivel.id_convocatoria_nivel));
      // Actualizar formData para eliminar esta área
      setFormData(prevState => ({
        ...prevState,
        areas_seleccionadas: prevState.areas_seleccionadas.filter(
          area => area.id_convocatoria_nivel !== areaNivel.id_convocatoria_nivel
        ),
        tutores_academicos: prevState.tutores_academicos.filter(
          tutor => tutor.id_convocatoria_nivel !== areaNivel.id_convocatoria_nivel
        )
      }));
      // Actualizar el costo total
      setCostoTotal(prevTotal => prevTotal - areaNivel.costo);
    } else {
      const newArea = {
        id_convocatoria_nivel: areaNivel.id_convocatoria_nivel,
        area_nombre: areaNivel.area.nombre,
        nivel_nombre: areaNivel.nivel.nombre,
        costo: areaNivel.costo
      };
      setSelectedAreas([...selectedAreas, newArea]);
      
      // Actualizar formData para añadir esta área
      setFormData(prevState => ({
        ...prevState,
        areas_seleccionadas: [
          ...prevState.areas_seleccionadas,
          { id_convocatoria_nivel: areaNivel.id_convocatoria_nivel }
        ],
        tutores_academicos: [
          ...prevState.tutores_academicos,
          {
            id_convocatoria_nivel: areaNivel.id_convocatoria_nivel,
            nombres: '',
            apellidos: '',
            ci: '',
            telefono: '',
            email: ''
          }
        ]
      }));
      // Actualizar el costo total
      setCostoTotal(prevTotal => prevTotal + areaNivel.costo);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-4">Inscripción</h1>
        <p className="text-gray-600 text-center mb-8">
          Completa el proceso de inscripción para participar en las olimpiadas científicas
        </p>

        {/* Active Call Section */}
        <div className="border rounded-lg p-6 mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 text-sm">⏱</span>
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-1">Convocatoria Activa</h2>
              {isLoading ? (
                <p className="text-sm text-gray-600 mb-1">Cargando información de convocatoria...</p>
              ) : convocatoria ? (
                <>
                  <p className="text-sm text-gray-600 mb-1">Te estás inscribiendo a: <span className="font-semibold">{convocatoria.nombre}</span></p>
                  <p className="text-sm text-gray-500">
                    Periodo de inscripción: {new Date(convocatoria.fecha_inicio).toLocaleDateString()} - {new Date(convocatoria.fecha_fin).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Puedes inscribirte hasta en <span className="font-semibold">{convocatoria.max_areas}</span> áreas
                  </p>
                </>
              ) : (
                <p className="text-sm text-red-600 mb-1">No hay convocatorias activas en este momento</p>
              )}
            </div>
          </div>
        </div>

        {/* Verification Code Section */}
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
                  </p>
                  <div className="flex justify-between">
                    <button
                      onClick={resetVerification}
                      type="button"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Realizar otra inscripción
                    </button>
                    <button
                      type="button"
                      className="bg-blue-600 text-white px-4 py-1 text-sm rounded hover:bg-blue-700"
                    >
                      Ver detalles
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Registration Process Section */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Proceso de Inscripción</h2>
          <p className="text-sm text-gray-600 mb-6">
            Sigue los pasos para completar tu inscripción
          </p>

          {/* Steps */}
          <div className="flex justify-between mb-8">
            {/* Step 1 */}
            <div className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${step === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                <Check size={20} />
              </div>
              <div className="text-center mt-2">
                <p className="font-medium">Datos Personales</p>
                <p className="text-xs text-gray-500">Información del estudiante</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${step === 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                <Check size={20} />
              </div>
              <div className="text-center mt-2">
                <p className="font-medium">Selección de Áreas</p>
                <p className="text-xs text-gray-500">Áreas y niveles</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${step === 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                <Check size={20} />
              </div>
              <div className="text-center mt-2">
                <p className="font-medium">Tutores</p>
                <p className="text-xs text-gray-500">Información de tutores</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${step === 4 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                <Check size={20} />
              </div>
              <div className="text-center mt-2">
                <p className="font-medium">Confirmación</p>
                <p className="text-xs text-gray-500">Revisión y pago</p>
              </div>
            </div>
          </div>

          {/* Form Content based on step */}
          {step === 1 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Datos Personales</h3>
              <p className="text-sm text-gray-600 mb-6">Ingrese sus datos personales para la inscripción</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Nombres */}
                <div>
                  <label htmlFor="nombres" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombres
                  </label>
                  <input
                    type="text"
                    id="nombres"
                    className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ingrese sus nombres"
                  />
                </div>

                {/* Apellidos */}
                <div>
                  <label htmlFor="apellidos" className="block text-sm font-medium text-gray-700 mb-1">
                    Apellidos
                  </label>
                  <input
                    type="text"
                    id="apellidos"
                    className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ingrese sus apellidos"
                  />
                </div>

                {/* Cédula de Identidad */}
                <div>
                  <label htmlFor="cedula" className="block text-sm font-medium text-gray-700 mb-1">
                    Cédula de Identidad
                  </label>
                  <input
                    type="text"
                    id="cedula"
                    className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Número de CI"
                  />
                </div>

                {/* Fecha de Nacimiento */}
                <div>
                  <label htmlFor="fechaNacimiento" className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Nacimiento
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="fechaNacimiento"
                      className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Seleccione una fecha"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <Calendar size={18} className="text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Correo Electrónico */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ejemplo@email.com"
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    id="telefono"
                    className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Número de teléfono"
                  />
                </div>

                {/* Unidad Educativa */}
                <div>
                  <label htmlFor="unidadEducativa" className="block text-sm font-medium text-gray-700 mb-1">
                    Unidad Educativa
                  </label>
                  <select
                    id="unidadEducativa"
                    className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option>Seleccione su unidad educativa</option>
                  </select>
                </div>

                {/* Curso */}
                <div>
                  <label htmlFor="id_grado" className="block text-sm font-medium text-gray-700 mb-1">
                    Grado
                  </label>
                  <select
                    id="id_grado"
                    name="id_grado"
                    className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
                    value={formData.id_grado}
                    onChange={(e) => {
                      console.log("Grado seleccionado:", e.target.value);
                      setFormData({...formData, id_grado: e.target.value});
                    }}
                  >
                    <option value="" className="text-gray-800">Seleccione su grado</option>
                    {isLoading ? (
                      <option disabled className="text-gray-800">Cargando grados...</option>
                    ) : (
                      grados.map((grado) => (
                        <option key={grado.id} value={grado.id} className="text-gray-800">
                          {grado.nombre || grado.nombre_grado}
                        </option>
                      ))
                    )}
                  </select>
                  {formData.id_grado && (
                    <p className="text-xs text-green-600 mt-1">
                      Los grados determinan las áreas y niveles disponibles en la siguiente sección.
                    </p>
                  )}
                </div>

                {/* Departamento */}
                <div>
                  <label htmlFor="departamento" className="block text-sm font-medium text-gray-700 mb-1">
                    Departamento
                  </label>
                  <select
                    id="departamento"
                    className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option>Seleccione su departamento</option>
                    <option>La Paz</option>
                    <option>Santa Cruz</option>
                    <option>Cochabamba</option>
                    <option>Oruro</option>
                    <option>Potosí</option>
                    <option>Tarija</option>
                    <option>Beni</option>
                    <option>Pando</option>
                    <option>Chuquisaca</option>
                  </select>
                </div>
                
                {/* Provincia */}
                <div>
                  <label htmlFor="provincia" className="block text-sm font-medium text-gray-700 mb-1">
                    Provincia
                  </label>
                  <input
                    type="text"
                    id="provincia"
                    className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ingrese su provincia"
                  />
                </div>
              </div>

              {/* Tutor Legal Section */}
              <div className="border rounded-lg p-6 mb-6 mt-6">
                <h4 className="text-base font-semibold mb-1">Tutor Legal</h4>
                <p className="text-xs text-gray-500 mb-4">Información del tutor legal (obligatorio)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  {/* Nombres */}
                  <div>
                    <label htmlFor="nombresTutorLegal" className="block text-sm font-medium text-gray-700 mb-1">
                      Nombres
                    </label>
                    <input
                      type="text"
                      id="nombresTutorLegal"
                      className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nombres del tutor"
                    />
                  </div>

                  {/* Apellidos */}
                  <div>
                    <label htmlFor="apellidosTutorLegal" className="block text-sm font-medium text-gray-700 mb-1">
                      Apellidos
                    </label>
                    <input
                      type="text"
                      id="apellidosTutorLegal"
                      className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Apellidos del tutor"
                    />
                  </div>

                  {/* Cédula de Identidad */}
                  <div>
                    <label htmlFor="cedulaTutorLegal" className="block text-sm font-medium text-gray-700 mb-1">
                      Cédula de Identidad
                    </label>
                    <input
                      type="text"
                      id="cedulaTutorLegal"
                      className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Número de CI"
                    />
                  </div>

                  {/* Parentesco */}
                  <div>
                    <label htmlFor="parentesco" className="block text-sm font-medium text-gray-700 mb-1">
                      Parentesco
                    </label>
                    <select
                      id="parentesco"
                      className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option>Selecciona el parentesco</option>
                      <option>Padre</option>
                      <option>Madre</option>
                      <option>Abuelo/a</option>
                      <option>Tío/a</option>
                      <option>Hermano/a</option>
                      <option>Otro</option>
                    </select>
                  </div>

                  {/* Correo Electrónico */}
                  <div>
                    <label htmlFor="emailTutorLegal" className="block text-sm font-medium text-gray-700 mb-1">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      id="emailTutorLegal"
                      className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="correo@ejemplo.com"
                    />
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label htmlFor="telefonoTutorLegal" className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      id="telefonoTutorLegal"
                      className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Número de teléfono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center"
                >
                  <span className="mr-2">Continuar</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Selección de Áreas</h3>
              <p className="text-sm text-gray-600 mb-6">
                Selecciona las áreas y niveles en los que deseas participar
                {convocatoria && ` en ${convocatoria.nombre}`}
              </p>

              {isLoading ? (
                <div className="flex justify-center items-center h-60">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                </div>
              ) : areasNiveles.length === 0 ? (
                <div className="text-center p-8 border rounded-lg">
                  <p className="text-gray-600 mb-2">No hay áreas disponibles para el grado seleccionado</p>
                  <p className="text-sm text-gray-500">Por favor, selecciona otro grado o contacta con el administrador.</p>
                </div>
              ) : (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <h4 className="text-base font-semibold">Áreas Disponibles</h4>
                      {convocatoria && (
                        <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          {selectedAreas.length}/{convocatoria.max_areas}
                        </span>
                      )}
                      <div className="ml-2 text-gray-400 cursor-help" title="Puedes seleccionar hasta el máximo de áreas permitidas">
                        <span>ⓘ</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Costo Total</p>
                      <p className="font-bold">{costoTotal} Bs.</p>
                    </div>
                  </div>
                  
                  {/* Mensaje de error */}
                  {errorMessage && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 flex items-start">
                      <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
                      <p className="text-red-700 text-sm">{errorMessage}</p>
                    </div>
                  )}

                  {/* Lista de áreas disponibles */}
                  {areasNiveles.map((areaNivel) => (
                    <div key={areaNivel.id_convocatoria_nivel} className="border rounded-lg p-4 mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="font-semibold">{areaNivel.area.nombre}</h5>
                        <div className="flex items-center">
                          <span className="text-sm mr-2">{areaNivel.costo} Bs.</span>
                          <input 
                            type="checkbox" 
                            className="h-5 w-5 text-blue-600" 
                            checked={selectedAreas.some(area => area.id_convocatoria_nivel === areaNivel.id_convocatoria_nivel)}
                            onChange={() => handleAreaSelect(areaNivel)}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">Nivel: <strong>{areaNivel.nivel.nombre}</strong></p>
                      </div>
                      {selectedAreas.some(area => area.id_convocatoria_nivel === areaNivel.id_convocatoria_nivel) && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-green-600">✓ Área seleccionada. En el siguiente paso deberás ingresar la información del tutor académico.</p>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Mensaje para seleccionar al menos un área */}
                  {selectedAreas.length === 0 && (
                    <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-md mt-4">
                      <p className="text-yellow-700 text-sm">Debes seleccionar al menos un área para continuar</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="border border-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-50 flex items-center"
                >
                  <span>Atrás</span>
                </button>
                <button
                  onClick={() => {
                    if (selectedAreas.length === 0) {
                      setErrorMessage('Debes seleccionar al menos un área para continuar');
                      return;
                    }
                    setErrorMessage('');
                    setStep(3);
                  }}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center"
                  disabled={selectedAreas.length === 0}
                >
                  <span className="mr-2">Continuar</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Tutores Académicos</h3>
              <p className="text-sm text-gray-600 mb-6">
                Ingresa la información de tus tutores académicos para cada área seleccionada
              </p>

              {/* Tutores Académicos Tab */}
              <div className="flex mb-4">
                <button className="flex-1 text-center py-2 border-b-2 border-blue-600 text-blue-600 font-medium">
                  Tutores Académicos
                </button>
                <button className="flex-1 text-center py-2 border-b border-gray-200 text-gray-500 bg-gray-50">
                  Reutilizar Datos
                </button>
              </div>

              {/* Tutor para Matemáticas */}
              <div className="border rounded-lg p-6 mb-6">
                <h4 className="text-base font-semibold mb-1">Tutor para Matemáticas</h4>
                <p className="text-xs text-gray-500 mb-4">Información del tutor académico para esta área (opcional)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  {/* Nombres */}
                  <div>
                    <label htmlFor="nombresTutorMat" className="block text-sm font-medium text-gray-700 mb-1">
                      Nombres
                    </label>
                    <input
                      type="text"
                      id="nombresTutorMat"
                      className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nombres del tutor"
                    />
                  </div>

                  {/* Apellidos */}
                  <div>
                    <label htmlFor="apellidosTutorMat" className="block text-sm font-medium text-gray-700 mb-1">
                      Apellidos
                    </label>
                    <input
                      type="text"
                      id="apellidosTutorMat"
                      className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Apellidos del tutor"
                    />
                  </div>

                  {/* Correo Electrónico */}
                  <div>
                    <label htmlFor="emailTutorMat" className="block text-sm font-medium text-gray-700 mb-1">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      id="emailTutorMat"
                      className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="correo@ejemplo.com"
                    />
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label htmlFor="telefonoTutorMat" className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      id="telefonoTutorMat"
                      className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Número de teléfono"
                    />
                  </div>
                </div>

                {/* Institución */}
                <div>
                  <label htmlFor="institucionTutorMat" className="block text-sm font-medium text-gray-700 mb-1">
                    Institución
                  </label>
                  <input
                    type="text"
                    id="institucionTutorMat"
                    className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Institución educativa"
                  />
                </div>
              </div>

              {/* Tutor para Física */}
              <div className="border rounded-lg p-6 mb-6">
                <h4 className="text-base font-semibold mb-1">Tutor para Física</h4>
                <p className="text-xs text-gray-500 mb-4">Información del tutor académico para esta área (opcional)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  {/* Nombres */}
                  <div>
                    <label htmlFor="nombresTutorFis" className="block text-sm font-medium text-gray-700 mb-1">
                      Nombres
                    </label>
                    <input
                      type="text"
                      id="nombresTutorFis"
                      className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nombres del tutor"
                    />
                  </div>

                  {/* Apellidos */}
                  <div>
                    <label htmlFor="apellidosTutorFis" className="block text-sm font-medium text-gray-700 mb-1">
                      Apellidos
                    </label>
                    <input
                      type="text"
                      id="apellidosTutorFis"
                      className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Apellidos del tutor"
                    />
                  </div>

                  {/* Correo Electrónico */}
                  <div>
                    <label htmlFor="emailTutorFis" className="block text-sm font-medium text-gray-700 mb-1">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      id="emailTutorFis"
                      className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="correo@ejemplo.com"
                    />
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label htmlFor="telefonoTutorFis" className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      id="telefonoTutorFis"
                      className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Número de teléfono"
                    />
                  </div>
                </div>

                {/* Institución */}
                <div>
                  <label htmlFor="institucionTutorFis" className="block text-sm font-medium text-gray-700 mb-1">
                    Institución
                  </label>
                  <input
                    type="text"
                    id="institucionTutorFis"
                    className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Institución educativa"
                  />
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setStep(2)}
                  className="border border-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-50 flex items-center"
                >
                  <span>Atrás</span>
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center"
                >
                  <span className="mr-2">Continuar</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Confirmación y Boleta de Pago</h3>
              <p className="text-sm text-gray-600 mb-6">
                Revisa los datos de tu inscripción y descarga tu boleta de pago
              </p>

              {/* Información de la Convocatoria */}
              <div className="border-b pb-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-base font-semibold">Información de la Convocatoria</h4>
                  <button className="text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Datos Personales */}
              <div className="border-b pb-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-base font-semibold">Datos Personales</h4>
                  <button className="text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Nombres</p>
                    <p className="font-medium">Juan Carlos</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Apellidos</p>
                    <p className="font-medium">Pérez Gómez</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">CI</p>
                    <p className="font-medium">12345678</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fecha Nacimiento</p>
                    <p className="font-medium">15/05/2006</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">juan.perez@gmail.com</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Teléfono</p>
                    <p className="font-medium">70123456</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Unidad Educativa</p>
                    <p className="font-medium">Colegio San Agustín</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Curso</p>
                    <p className="font-medium">4° de Secundaria</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Departamento</p>
                    <p className="font-medium">La Paz</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Provincia</p>
                    <p className="font-medium">Murillo</p>
                  </div>
                </div>
              </div>

              {/* Áreas Seleccionadas */}
              <div className="border-b pb-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-base font-semibold">Áreas Seleccionadas</h4>
                  <button className="text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293-3.293a1 1 0 01-1.414-1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Matemáticas</p>
                        <p className="text-sm text-gray-500">Nivel Intermedio</p>
                      </div>
                      <p className="font-medium">50 Bs.</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Física</p>
                        <p className="text-sm text-gray-500">Nivel Intermedio</p>
                      </div>
                      <p className="font-medium">50 Bs.</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-2">
                    <p className="font-medium">Total</p>
                    <p className="font-bold">100 Bs.</p>
                  </div>
                </div>
              </div>

              {/* Información de Tutores */}
              <div className="border-b pb-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-base font-semibold">Información de Tutores</h4>
                  <button className="text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Boleta de Pago */}
              <div className="border rounded-lg p-6 mb-6">
                <h4 className="text-base font-semibold mb-1">Boleta de Pago</h4>
                <p className="text-xs text-gray-500 mb-6">
                  Descarga tu boleta de pago para realizar el pago en cajas de la facultad
                </p>
                <div className="bg-gray-50 p-4 rounded-md mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Código de Inscripción</p>
                      <p className="font-medium">OCEP-2024-12345</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Fecha</p>
                      <p className="font-medium">4/6/2025</p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Estudiante</p>
                    <p className="font-medium">Juan Carlos Pérez Gómez</p>
                    <p className="text-sm text-gray-500">CI: 12345678</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Detalle</p>
                    <div className="border-t border-b py-2">
                      <div className="grid grid-cols-3 gap-2 mb-1 text-sm font-medium">
                        <div>Área</div>
                        <div>Nivel</div>
                        <div className="text-right">Costo</div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-1 text-sm">
                        <div>Matemáticas</div>
                        <div>Nivel Intermedio</div>
                        <div className="text-right">50 Bs.</div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>Física</div>
                        <div>Nivel Intermedio</div>
                        <div className="text-right">50 Bs.</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-2 text-sm">
                      <p className="font-medium">Subtotal</p>
                      <p className="font-medium">100 Bs.</p>
                    </div>
                    <div className="flex justify-between items-center py-2 text-sm font-bold">
                      <p>TOTAL A PAGAR</p>
                      <p>100 Bs.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md mb-6">
                  <p className="font-medium text-yellow-800 mb-1">Importante: Su inscripción no está completa</p>
                  <p className="text-sm text-yellow-700 mb-2">Para completar su inscripción, siga estos pasos:</p>
                  <ol className="text-sm text-yellow-700 list-decimal pl-5 space-y-1">
                    <li>Descargue la boleta de pago</li>
                    <li>Realice el pago en las cajas de la facultad</li>
                    <li>Regrese a la página de inscripción e introduzca su código de inscripción</li>
                    <li>Suba el comprobante de pago para finalizar su inscripción</li>
                  </ol>
                </div>
                <button className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Descargar Boleta de Pago
                </button>
              </div>

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setStep(3)}
                  className="border border-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-50"
                >
                  Atrás
                </button>
                <button
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                >
                  Completar Inscripción
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}