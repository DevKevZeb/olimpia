import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Trophy, FlaskRound as Flask, Code, Calendar } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [areas, setAreas] = useState([]);

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


  const downloadPDF = async (id_area,  area_nombre) => {
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
          <p className="text-xl mb-8">Inscríbete y participa en las áreas de tu interés</p>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition">
            Iniciar Inscripción →
          </button>
          <button 
            className="bg-white text-blue-600 px-6 py-3 rounded-md font-medium hover:bg-blue-100 transition ml-4"
            onClick={() => navigate('/estadoInscripcion')}
          >
            Ver estado de inscripción
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
              <p className="col-span-full text-center text-gray-500">Cargando áreas...</p>
            )}
          </div>
        </div>
      </section>

      {/* Fechas Importantes (igual que antes) */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Fechas Importantes</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 bg-white rounded-lg shadow text-center">
              <Calendar className="w-8 h-8 mx-auto mb-4 text-blue-600" />
              <h3 className="font-semibold mb-2">Inscripciones</h3>
              <p className="text-gray-600">1 - 30 de Marzo, 2025</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow text-center">
              <Calendar className="w-8 h-8 mx-auto mb-4 text-blue-600" />
              <h3 className="font-semibold mb-2">Examen Clasificatorio</h3>
              <p className="text-gray-600">15 de Abril, 2025</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow text-center">
              <Calendar className="w-8 h-8 mx-auto mb-4 text-blue-600" />
              <h3 className="font-semibold mb-2">Final Nacional</h3>
              <p className="text-gray-600">1 de Mayo, 2025</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow text-center">
              <Calendar className="w-8 h-8 mx-auto mb-4 text-blue-600" />
              <h3 className="font-semibold mb-2">Premiación</h3>
              <p className="text-gray-600">15 de Mayo, 2025</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}