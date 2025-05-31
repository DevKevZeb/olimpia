import { useState } from 'react';
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
  const [isVerified, setIsVerified] = useState(false);
  const [ordenInfo, setOrdenInfo] = useState<OrdenInfo | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  // Hook para verificación de código
  const { verifyCode, isLoading: isVerifying, error: verifyError } = useCodeVerification();

  // Hook para subida de archivos
  const { uploadFile, isUploading, error: uploadError } = useFileUpload(subirComprobantePago);

  // Función personalizada para verificar código con validaciones específicas
  const handleVerification = async (code: string) => {
    setVerificationCode(code);
    
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
    } catch (error: any) {
      throw error;
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!ordenInfo) {
      throw new Error('No hay información de la orden para proceder');
    }

    try {
      await uploadFile(file);
      setUploadComplete(true);
    } catch (error) {
      throw error;
    }
  };

  const handleStartOver = () => {
    setIsVerified(false);
    setOrdenInfo(null);
    setUploadComplete(false);
    setVerificationCode('');
  };

  const breadcrumbs = [
    { label: 'Inscripción', href: '/registration' },
    { label: 'Completar Inscripción' }
  ];

  return (
    <PageContainer maxWidth="md">
      <PageHeader
        title="Completar Inscripción"
        subtitle="Suba su comprobante de pago para finalizar el proceso de inscripción"
        breadcrumbs={breadcrumbs}
        actions={
          <Button 
            variant="secondary" 
            onClick={() => navigate('/registration')}
          >
            Volver a Inscripción
          </Button>
        }
      />

      {!isVerified ? (
        // Paso 1: Verificación de código
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Instrucciones</h3>
            <ol className="text-sm text-blue-800 list-decimal list-inside space-y-1">
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
        </div>
      ) : !uploadComplete ? (
        // Paso 2: Información de orden y subida de archivo
        <div className="space-y-6">
          {/* Información de la orden */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-900 mb-3">✓ Código verificado correctamente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-green-800">Código:</span> {ordenInfo?.orden.codigo_unico}
              </div>
              <div>
                <span className="font-medium text-green-800">Monto:</span> {ordenInfo?.orden.monto_total} Bs.
              </div>
              {ordenInfo?.estudiante && (
                <div>
                  <span className="font-medium text-green-800">Estudiante:</span> {ordenInfo.estudiante.nombre_completo}
                </div>
              )}
              {ordenInfo?.estudiantes_count && (
                <div>
                  <span className="font-medium text-green-800">Estudiantes:</span> {ordenInfo.estudiantes_count}
                </div>
              )}
            </div>
          </div>

          <FileUploadForm
            onUpload={handleFileUpload}
            loading={isUploading}
            error={uploadError}
            title="Subir Comprobante de Pago"
            description="Seleccione el comprobante de pago en formato PDF"
          />

          <div className="flex justify-between">
            <Button
              variant="secondary"
              onClick={handleStartOver}
              disabled={isUploading}
            >
              Verificar Otro Código
            </Button>
          </div>
        </div>
      ) : (
        // Paso 3: Confirmación de éxito
        <div className="text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              ¡Comprobante subido exitosamente!
            </h3>
            <p className="text-gray-600">
              Su comprobante de pago ha sido recibido y está siendo procesado. 
              Recibirá una confirmación por correo electrónico una vez que sea verificado.
            </p>
          </div>

          <Alert
            type="info"
            title="¿Qué sigue?"
            message="El proceso de verificación puede tomar hasta 24 horas hábiles. Le notificaremos por correo cuando su pago haya sido confirmado."
          />

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => navigate('/registration')}
            >
              Nueva Inscripción
            </Button>
            <Button
              variant="secondary"
              onClick={handleStartOver}
            >
              Subir Otro Comprobante
            </Button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
