import React from 'react';
import { Trophy, FlaskRound as Flask, Code, Calendar, Phone, Mail, MapPin } from 'lucide-react';

export default function Home() {
  return (
    <>
      {/* Hero Section */}
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
        </div>
      </div>

      {/* Areas de Competencia */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Áreas de Competencia</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-lg shadow-lg text-center">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-xl font-semibold mb-2">Matemáticas</h3>
              <p className="text-gray-600">Resolución de problemas y pensamiento lógico</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-lg text-center">
              <Flask className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-xl font-semibold mb-2">Física</h3>
              <p className="text-gray-600">Experimentación y comprensión del universo</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-lg text-center">
              <Code className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-xl font-semibold mb-2">Informática</h3>
              <p className="text-gray-600">Programación y desarrollo tecnológico</p>
            </div>
          </div>
        </div>
      </section>

      {/* Fechas Importantes */}
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