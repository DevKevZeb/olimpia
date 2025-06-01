import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/layout/PageHeader';
import CodeVerificationForm from '../../components/forms/CodeVerificationForm';
import Button from '../../components/ui/Button';
import { BoletaInfo } from '../../components/registration';
import { useCodeVerification } from '../../hooks/registration';
import { descargarBoleta } from '../../api/registration';
import { EstudianteFormData } from '../../types/registration';

interface EncargadoData {
  nombre: string;
  ci: string;
  email?: string;
}

export default function DescargarBoletaPage() {
  const navigate = useNavigate();
  const componentRef = useRef<HTMLDivElement>(null);
  
  // Obtener código de URL params si existe
  const searchParams = new URLSearchParams(window.location.search);
  const codigoFromUrl = searchParams.get('codigo') || '';
  
  const [isVerified, setIsVerified] = useState(false);
  const [estudiantes, setEstudiantes] = useState<EstudianteFormData[]>([]);
  const [costoTotalGeneral, setCostoTotalGeneral] = useState(0);  const [encargado, setEncargado] = useState<EncargadoData>({
    nombre: '',
    ci: '',
    email: ''
  });
  const [codigoBoleta, setCodigoBoleta] = useState(codigoFromUrl);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  // Hook personalizado para verificación
  const { isLoading: isVerifying, error: verifyError } = useCodeVerification();

  const handleVerification = useCallback(async (code: string) => {
    setCodigoBoleta(code);
    
    try {
      const data = await descargarBoleta(code);
      setEstudiantes(data.estudiantes);
      setCostoTotalGeneral(data.costoTotalGeneral);
      setEncargado(data.encargado);
      setIsVerified(true);
      
      // Auto-generar PDF después de un pequeño delay para que se renderice
      setTimeout(() => {
        generatePDF();
      }, 500);
    } catch (error: unknown) {
      let errorMessage = 'Error al verificar el código';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  }, []);

  // Auto-verificar si hay código en la URL
  useEffect(() => {
    if (codigoFromUrl && !isVerified) {
      handleVerification(codigoFromUrl);
    }
  }, [codigoFromUrl, isVerified, handleVerification]);

  const generatePDF = async () => {
    if (!componentRef.current) return;
    
    setIsGeneratingPDF(true);
    
    try {
      const payment = componentRef.current;
      const canvas = await html2canvas(payment, { 
        scale: window.devicePixelRatio 
      });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);

      const date = new Date();
      const dateParsed = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
      pdf.save(`Boleta de inscripcion ${dateParsed}.pdf`);
    } catch (error) {
      console.error('Error generando PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleStartOver = () => {
    setIsVerified(false);
    setEstudiantes([]);
    setCostoTotalGeneral(0);
    setEncargado({ nombre: '', ci: '', email: '' });
    setCodigoBoleta('');
  };

  const breadcrumbs = [
    { label: 'Inscripción', href: '/registration' },
    { label: 'Descargar Boleta' }
  ];
  return (
    <PageContainer maxWidth="6xl" variant="wide">
      <PageHeader
        title="Descargar Boleta de Pago"
        subtitle="Ingrese su código de inscripción para descargar la boleta de pago"
        breadcrumbs={breadcrumbs}        actions={
          <Button 
            variant="secondary" 
            onClick={() => navigate('/gestionar-inscripciones')}
          >
            Volver a Gestión
          </Button>
        }
      />      {!isVerified ? (
        // Verificación de código
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-3 text-lg">Instrucciones</h3>
            <ol className="text-blue-800 list-decimal list-inside space-y-2">
              <li>Ingrese su código de inscripción</li>
              <li>La boleta se descargará automáticamente una vez verificado</li>
              <li>Presente esta boleta en las cajas para realizar el pago</li>
              <li>Conserve el comprobante de pago que le entreguen</li>
            </ol>
          </div>

          <CodeVerificationForm
            onVerify={handleVerification}
            loading={isVerifying}
            error={verifyError}
            placeholder="Código de inscripción (ej: O-SANSI-2024-12345)"
            buttonText="Descargar Boleta"
            helperText="Ingrese el código que recibió al completar su pre-inscripción"
          />
        </div>
      ) : (
        // Visualización de boleta y opciones
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-900 mb-2">✓ Boleta generada exitosamente</h3>
            <p className="text-sm text-green-800">
              Su boleta ha sido descargada. Si no se descargó automáticamente, 
              puede hacer clic en el botón "Descargar PDF" para obtenerla nuevamente.
            </p>
          </div>

          {/* Componente de boleta para visualización y PDF */}
          <div ref={componentRef}>
            <BoletaInfo
              estudiantes={estudiantes}
              costoTotalGeneral={costoTotalGeneral}
              encargado={encargado}
              codigoBoleta={codigoBoleta}
            />
          </div>          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-4xl mx-auto">
            <Button
              onClick={generatePDF}
              loading={isGeneratingPDF}
              disabled={isGeneratingPDF}
              className="flex-1 sm:flex-none"
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar PDF
            </Button>
            
            <Button
              variant="secondary"
              onClick={handleStartOver}
              disabled={isGeneratingPDF}
              className="flex-1 sm:flex-none"
            >
              Descargar Otra Boleta
            </Button>
              <Button
              variant="secondary"
              onClick={() => navigate('/complete-registration')}
              className="flex-1 sm:flex-none"
            >
              Completar Inscripción
            </Button>
            
            <Button
              variant="secondary"
              onClick={() => navigate('/gestionar-inscripciones')}
              className="flex-1 sm:flex-none"
            >
              Volver a Gestión
            </Button>
          </div>          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-4xl mx-auto">
            <h3 className="font-semibold text-yellow-800 mb-3 text-lg">Instrucciones de Pago</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ol className="text-yellow-700 list-decimal list-inside space-y-2">
                <li>Presente esta boleta en las cajas de la facultad</li>
                <li>Realice el pago del monto total indicado</li>
                <li>Conserve el comprobante que le entregarán</li>
              </ol>
              <ol className="text-yellow-700 list-decimal list-inside space-y-2" start={4}>
                <li>Regrese a "Completar Inscripción" e introduzca su código</li>
                <li>Suba el comprobante de pago para finalizar la inscripción</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
