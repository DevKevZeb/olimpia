import { AlertCircle, Check } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { descargarBoleta } from '../api/boletaPagoApi';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import BoletaInfo from './BoletaInfo';
import { EstudianteFormData} from '../types/index';

export default function DescargarBoleta() {
  const componentRef = useRef<HTMLDivElement>(null);

  const [codigoBoleta, setCodigoBoleta] = useState('');
  const [isVerifyingBoleta, setIsVerifyingBoleta] = useState(false);
  const [errorMessageBoleta, setErrorMessageBoleta] = useState(''); // Error para sección "Completar Inscripción"
  const [boletaErrorMessage, setBoletaErrorMessage] = useState(''); // Error para sección "descargar boleta"
  const [isVerified, setIsVerified] = useState(false);
  

  const [estudiantes, setEstudiantes] = useState<EstudianteFormData[]>([]);
  const [costoTotalGeneral ,setCostoTotalGeneral ] = useState(0);

     // Función para manejar la verificación del código
     const handleDescargarBoleta = async (data) => {

        if (!codigoBoleta.trim()) {
            setBoletaErrorMessage('Por favor ingrese un código de verificación');
          return;
        }
  
        setIsVerifyingBoleta(true);
        setBoletaErrorMessage('');
  
        
        try {
          // Llamar a la API para verificar el código
          const data = await descargarBoleta(codigoBoleta);
          setEstudiantes(data.estudiantes);
          setCostoTotalGeneral(data.costoTotalGeneral);
          // Almacenar la información de la orden
          setTimeout(() => {
              generatePDF();
            
          }, 500);
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
           
          setBoletaErrorMessage(message);
        } finally {
          setIsVerifyingBoleta(false);
        }
      };


      const generatePDF = async () => {
        if (!componentRef.current) return;
        const payment =componentRef.current;
    
        const canvas = await html2canvas(payment , {scale:  window.devicePixelRatio });
        const imgData = canvas.toDataURL('image/png');
    
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [ canvas.width , canvas.height],
        });
    
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    
        const date = new Date();
        const dateParsed = date.getDate() + "-"+ date.getMonth()+ "-" +date.getFullYear();
        pdf.save(`Boleta de inscripcion ${dateParsed}.pdf`);
      };

      return (
        
            <div className="border rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Descargar Boleta de pago</h2>
            <p className="text-sm text-gray-600 mb-6">
              Si ya ha realizado su pre-inscripcion, ingrese su codigo de inscripcion  para descargar la boleta de pago
            </p>
  
            {/* Mensaje de error */}
            {boletaErrorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
                <p className="text-red-700 text-sm">{boletaErrorMessage}</p>
              </div>
            )}
  
             
              <div className="mb-4">
                <label htmlFor="codigoBoleta" className="block text-sm font-medium text-gray-700 mb-1">
                  Código de Inscripcion
                </label>
                <div className="flex">
                  <input
                    type="text"
                    id="codigoBoleta"
                    className="flex-grow px-4 py-2 border rounded-l-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ingrese su código de inscripción"
                    value={codigoBoleta}
                    onChange={(e) => setCodigoBoleta(e.target.value)}
                    disabled={isVerifyingBoleta}
                  />
                  <button
                    className={`${isVerifyingBoleta ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-2 rounded-r-md flex items-center transition-colors`}
                    onClick={handleDescargarBoleta}
                    disabled={isVerifyingBoleta}
                  >
                    <span className="mr-2">{isVerifyingBoleta ? 'Verificando...' : 'Descargar'}</span>
                    {isVerifyingBoleta  && (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                    ) }
                  </button>
                </div>
              </div>
            { (<BoletaInfo componentRef={componentRef}
                  estudiantes={estudiantes} costoTotalGeneral={costoTotalGeneral}
                />) }
          </div>
      )   
}