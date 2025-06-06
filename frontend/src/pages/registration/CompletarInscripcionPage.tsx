import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/layout/PageHeader';
import CodeVerificationForm from '../../components/forms/CodeVerificationForm';
import FileUploadForm from '../../components/forms/FileUploadForm';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import { useCodeVerification, useFileUpload } from '../../hooks/registration';
import { subirComprobantePago } from '../../api/registration';

// Tipos
interface OrdenInfo {
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
  tiene_comprobante?: boolean;
}

export default function CompletarInscripcionPage() {
  const navigate = useNavigate();
  
  // Obtener código de URL params si existe
  const searchParams = new URLSearchParams(window.location.search);
  const codigoFromUrl = searchParams.get('codigo') || '';
    const [isVerified, setIsVerified] = useState(false);
  const [ordenInfo, setOrdenInfo] = useState<OrdenInfo | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);

  // Hook para verificación de código
  const { verifyCode, isLoading: isVerifying, error: verifyError } = useCodeVerification();  // Crear un wrapper para la función de upload que convierte File a FormData
  const uploadWrapper = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append('pdf_comprobante', file);
    // Usar el código de la orden verificada o el código de la URL
    const codigo = ordenInfo?.orden.codigo_unico || codigoFromUrl || '';
    
    if (!codigo) {
      throw new Error('No se encontró un código de orden válido');
    }
    
    formData.append('codigo_orden', codigo);
    return subirComprobantePago(formData);
  }, [codigoFromUrl, ordenInfo]);

  // Hook para subida de archivos
  const { uploadFile, isUploading, error: uploadError } = useFileUpload(uploadWrapper);

  // Función personalizada para verificar código con validaciones específicas
  const handleVerification = useCallback(async (code: string) => {
    try {
      const response = await verifyCode(code);
      
      // Validaciones específicas
      const fechaVencimiento = new Date(response.orden.fecha_vencimiento);
      const fechaActual = new Date();

      if (fechaVencimiento < fechaActual) {
        throw new Error('Esta orden de pago ha vencido. Por favor genere una nueva orden.');
      }
      
      if (response.orden.estado === 'pagada') {
        throw new Error('Esta orden de pago ya ha sido pagada. No es necesario subir un comprobante.');
      }
      
      if (response.orden.estado === 'vencida') {
        throw new Error('Esta orden de pago está vencida. Por favor genere una nueva orden.');
      }
      
      if (response.tiene_comprobante) {
        throw new Error('Esta orden ya tiene un comprobante de pago en proceso de verificación.');
      }
      
      setOrdenInfo(response);
      setIsVerified(true);
    } catch (error: unknown) {
      let errorMessage = 'Error al verificar el código';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  }, [verifyCode]);

  // Auto-verificar si hay código en la URL
  useEffect(() => {
    if (codigoFromUrl && !isVerified) {
      handleVerification(codigoFromUrl);
    }
  }, [codigoFromUrl, isVerified, handleVerification]);
  const handleFileUpload = async (file: File) => {
    if (!ordenInfo) {
      throw new Error('No hay información de la orden para proceder');
    }

    await uploadFile(file);
    setUploadComplete(true);
  };

  const handleStartOver = () => {
    setIsVerified(false);
    setOrdenInfo(null);
    setUploadComplete(false);
  };

  const breadcrumbs = [
    { label: 'Inscripción', href: '/registration' },
    { label: 'Completar Inscripción' }
  ];
  return (
    <PageContainer maxWidth="6xl" variant="wide">
      <PageHeader
        title="Completar Inscripción"
        subtitle="Suba su comprobante de pago para finalizar el proceso de inscripción"
        breadcrumbs={breadcrumbs}        actions={
          <Button 
            variant="secondary" 
            onClick={() => navigate('/gestionar-inscripciones')}
          >
            Volver a Gestión
          </Button>
        }
      />      {!isVerified ? (
        // Paso 1: Verificación de código
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-3 text-lg">Instrucciones</h3>
            <ol className="text-blue-800 list-decimal list-inside space-y-2">
              <li>Ingrese el código de inscripción que recibió al completar su pre-inscripción</li>
              <li>Una vez verificado, podrá subir su comprobante de pago</li>
              <li>Solo se aceptan archivos PDF de máximo 10MB</li>
            </ol>
          </div>

          <CodeVerificationForm
            onVerify={handleVerification}
            loading={isVerifying}
            error={verifyError}
            placeholder="Código de inscripción (ej: O-SANSI-2024-12345)"
            buttonText="Verificar Código"
            helperText="Ingrese el código que recibió al completar su pre-inscripción"
          />
        </div>      ) : !uploadComplete ? (
        // Paso 2: Información de orden y subida de archivo
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Información de la orden */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="font-semibold text-green-900 mb-4 text-lg">✓ Código verificado correctamente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4">
                <span className="text-sm font-medium text-green-700">Código:</span>
                <p className="text-lg font-semibold text-green-900">{ordenInfo?.orden.codigo_unico}</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <span className="text-sm font-medium text-green-700">Monto:</span>
                <p className="text-lg font-semibold text-green-900">{ordenInfo?.orden.monto_total} Bs.</p>
              </div>
              {ordenInfo?.estudiante && (
                <div className="bg-white rounded-lg p-4">
                  <span className="text-sm font-medium text-green-700">Estudiante:</span>
                  <p className="text-sm font-semibold text-green-900">{ordenInfo.estudiante.nombre_completo}</p>
                </div>
              )}
              {ordenInfo?.estudiantes_count && (
                <div className="bg-white rounded-lg p-4">
                  <span className="text-sm font-medium text-green-700">Estudiantes:</span>
                  <p className="text-lg font-semibold text-green-900">{ordenInfo.estudiantes_count}</p>
                </div>
              )}
            </div>          </div>

          {/* Información específica sobre el formato del recibo */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-2xl mx-auto">
            <h4 className="font-semibold text-yellow-900 mb-3">Formato requerido del recibo</h4>
            <p className="text-yellow-800 text-sm mb-3">
              Asegúrese de que su recibo de caja contenga los siguientes campos:
            </p>
            <ul className="text-yellow-800 text-sm space-y-1 list-disc list-inside">
              <li><strong>Nro.:</strong> Número del recibo</li>
              <li><strong>Fecha:</strong> Fecha del pago</li>
              <li><strong>Recibí de:</strong> Su nombre completo</li>
              <li><strong>Total:</strong> Monto pagado</li>
              <li><strong>Aclaración:</strong> Debe contener el código de inscripción</li>
            </ul>
          </div>

          <div className="max-w-2xl mx-auto">            <FileUploadForm
              onUpload={handleFileUpload}
              loading={isUploading}
              error={uploadError}
              title="Subir Recibo de Caja"
              description="Seleccione el recibo de caja en formato PDF (máximo 10MB)"
            />
          </div>

          <div className="flex justify-center">
            <Button
              variant="secondary"
              onClick={handleStartOver}
              disabled={isUploading}
            >
              Verificar Otro Código
            </Button>
          </div>
        </div>      ) : (
        // Paso 3: Confirmación de éxito
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">
              ¡Comprobante subido exitosamente!
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Su comprobante de pago ha sido recibido y está siendo procesado. 
              Recibirá una confirmación por correo electrónico una vez que sea verificado.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
            <Alert
              type="info"
              title="¿Qué sigue?"
              message="El proceso de verificación puede tomar hasta 24 horas hábiles. Le notificaremos por correo cuando su pago haya sido confirmado."
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
            <Button
              onClick={() => navigate('/gestionar-inscripciones')}
              className="flex-1 sm:flex-none"
            >
              Volver a Gestión
            </Button>
            <Button
              onClick={() => navigate('/registration')}
              className="flex-1 sm:flex-none"
            >
              Nueva Inscripción
            </Button>
            <Button
              variant="secondary"
              onClick={handleStartOver}
              className="flex-1 sm:flex-none"
            >
              Subir Otro Comprobante
            </Button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
