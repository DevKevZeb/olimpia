import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Trophy, Calendar } from 'lucide-react';
import { getDatosInscripcion } from '../api/registration/inscripcionCompletaApi';

interface Area {
  id_area: number;
  nombre_area: string;
  descripcion: string;
}

interface Convocatoria {
  id: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  updated_at: string;
  max_areas: number;
  estado: string;
}

export default function Home() {
  const navigate = useNavigate();
  const [areas, setAreas] = useState<Area[]>([]);
  const [convocatoria, setConvocatoria] = useState<Convocatoria | null>(null);
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/areas-de-convocatoria');
        setAreas(response.data.data.areas);
      } catch (error) {
        console.error('Error al cargar las áreas:', error);
      }
    };

    fetchAreas();
  }, []);

  useEffect(() => {
    const fetchConvocatoria = async () => {
      try {
        const data = await getDatosInscripcion();
        setConvocatoria(data.convocatoria);
      } catch (error) {
        console.error('Error al cargar datos de convocatoria:', error);
      }
    };

    fetchConvocatoria();
  }, []);


  const downloadPDF = async (id_area: number, area_nombre: string) => {
    try {
   
      const response = await axios.get(`http://localhost:8000/api/documentos/descargar/${id_area}` ,  {
      responseType: 'blob', // Ensure binary data is handled correctly
      });
  
      // Create a blob from the response
      const blob = new Blob([response.data], { type: 'application/pdf' });
  
      // Create a temporary download link
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', area_nombre + '-anexo.pdf'); // Desired file name
  
      // Trigger download
      document.body.appendChild(link);
      link.click();
  
      // Cleanup
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      alert("No existe un anexo para esta area aùn");
      console.error('Error downloading the PDF file:', error);
    }
  };
  
  return (
    <>
      {/* Hero Section (igual que antes) */}
      <div 
        className="relative bg-gray-900 h-[500px] flex items-center justify-center"
        style={{
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url("https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="text-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Oh! SanSi - Olimpiadas de Ciencias y Tecnología</h1>
          <p className="text-xl mb-8">Inscríbete y participa en las áreas de tu interés</p>          <button 
            className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition"
            onClick={() => navigate('/registration')}
          >
            Iniciar Inscripción →
          </button>
          <button 
            className="bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-green-700 transition ml-4"
            onClick={() => navigate('/gestionar-inscripciones')}
          >
            Tramitar Inscripciones
          </button>
        </div>
      </div>

      {/* Areas de Competencia */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Áreas de Competencia</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {areas.length > 0 ? (
              areas.map((area) => (
                <div key={area.id_area} className="p-6 bg-white rounded-lg shadow-lg text-center">
                  {/* Puedes usar un ícono dinámico o uno por defecto */}
                  <Trophy className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="text-xl font-semibold mb-2">{area.nombre_area}</h3>
                  <p className="text-gray-600 mb-4">{area.descripcion}</p>
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() => downloadPDF(area.id_area, area.nombre_area)}
                  >
                    Descargar
                  </button>
                </div>
              ))
            ) : (
              <p className="col-span-full text-center text-gray-500">Cargando áreas...</p>            )}
          </div>
        </div>
      </section>

      {/* Gestión de Inscripciones */}
      <section className="py-16 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">¿Ya te inscribiste?</h2>
            <p className="text-gray-600">Continúa con tu proceso de inscripción y pago de manera fácil</p>
          </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-lg text-center hover:shadow-xl transition">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Descargar Boleta</h3>
              <p className="text-gray-600 mb-6 min-h-[3rem]">
                Descarga tu boleta de pago para realizar el pago en cajas de la facultad
              </p>              <button
                onClick={() => navigate('/download-boleta')}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition font-medium"
              >
                Descargar Boleta
              </button>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-lg text-center hover:shadow-xl transition">
              <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Subir Comprobante</h3>
              <p className="text-gray-600 mb-6 min-h-[3rem]">
                Sube tu comprobante de pago para completar el proceso de inscripción
              </p>
              <button
                onClick={() => navigate('/complete-registration')}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition font-medium"
              >
                Subir Comprobante
              </button>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-lg text-center hover:shadow-xl transition md:col-span-2 lg:col-span-1">
              <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Consultar Estado</h3>
              <p className="text-gray-600 mb-6 min-h-[3rem]">
                Consulta el estado actual de tu inscripción
              </p>
              <button
                onClick={() => navigate('/gestionar-inscripciones')}
                className="w-full bg-purple-600 text-white px-6 py-3 rounded-md hover:bg-purple-700 transition font-medium"
              >
                Consultar Estado
              </button>
            </div>
          </div>
        </div>
      </section>      {/* Fechas Importantes */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Fechas Importantes</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 bg-white rounded-lg shadow text-center">
              <Calendar className="w-8 h-8 mx-auto mb-4 text-blue-600" />
              <h3 className="font-semibold mb-2">Inscripciones</h3>
              {convocatoria ? (
                <p className="text-gray-600">
                  {new Date(convocatoria.fecha_inicio).toLocaleDateString()} - {new Date(convocatoria.fecha_fin).toLocaleDateString()}
                </p>
              ) : (
                <p className="text-gray-500">Cargando fechas...</p>
              )}
            </div>
            
          </div>
        </div>
      </section>
    </>
  );
}