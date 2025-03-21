import React from 'react';
import { Trophy, Calendar, Users, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const areas = [
  {
    title: 'Matemáticas',
    description: 'Resolución de problemas y pensamiento lógico',
    icon: <Trophy className="w-8 h-8 text-blue-500" />,
  },
  {
    title: 'Física',
    description: 'Experimentación y comprensión del universo',
    icon: <Calendar className="w-8 h-8 text-blue-500" />,
  },
  {
    title: 'Informática',
    description: 'Programación y desarrollo tecnológico',
    icon: <Users className="w-8 h-8 text-blue-500" />,
  },
];

export function Home() {
  const navigate = useNavigate();

  return (
    <main className="flex-grow">
      {/* Hero Section */}
      <div 
        className="relative bg-cover bg-center py-32"
        style={{
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url("https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80")',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Ohl SanSi - Olimpiadas de Ciencias y Tecnología
          </h1>
          <p className="text-xl text-gray-200 mb-8">
            Inscríbete y participa en las áreas de tu interés
          </p>
          <button 
            onClick={() => navigate('/registro')}
            className="bg-blue-600 text-white px-8 py-3 rounded-md text-lg font-medium hover:bg-blue-700 transition flex items-center space-x-2 mx-auto"
          >
            <span>Iniciar Inscripción</span>
            <ArrowRight size={20} />
          </button>
        </div>
      </div>

      {/* Areas Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Áreas de Competencia</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {areas.map((area, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                <div className="mb-4">{area.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{area.title}</h3>
                <p className="text-gray-600">{area.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Important Dates */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Fechas Importantes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-lg mb-2">Inscripciones</h3>
              <p className="text-gray-600">1 - 30 de Marzo, 2025</p>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-lg mb-2">Examen Clasificatorio</h3>
              <p className="text-gray-600">15 de Abril, 2025</p>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-lg mb-2">Final Nacional</h3>
              <p className="text-gray-600">1 de Mayo, 2025</p>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-lg mb-2">Premiación</h3>
              <p className="text-gray-600">15 de Mayo, 2025</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}