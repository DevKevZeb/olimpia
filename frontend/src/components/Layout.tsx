import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Phone, Mail, MapPin } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="bg-white shadow-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <Trophy className="w-8 h-8 text-blue-600" />
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  Oh! SanSi
                </span>
              </Link>
            </div>
            <div className="flex items-center space-x-8">
              <Link 
                to="/" 
                className="text-gray-700 hover:text-blue-600 font-medium px-3 py-2 rounded-md text-sm transition-colors duration-200 hover:bg-blue-50"
              >
                Inicio
              </Link>
              <Link 
                to="/inscripcion" 
                className="text-gray-700 hover:text-blue-600 font-medium px-3 py-2 rounded-md text-sm transition-colors duration-200 hover:bg-blue-50"
              >
                Inscripción
              </Link>
              <Link 
                to="/admin" 
                className="text-gray-700 hover:text-blue-600 font-medium px-3 py-2 rounded-md text-sm transition-colors duration-200 hover:bg-blue-50"
              >
                Panel Admin
              </Link>
              <button className="bg-red-600 text-white px-5 py-2.5 rounded-md text-sm font-medium hover:bg-red-700 transition-colors duration-200 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Oh! SanSi</h3>
              <p className="text-gray-400">
                Olimpiadas de Ciencias y Tecnología, fomentando el talento y la innovación en la juventud.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Contacto</h3>
              <div className="space-y-2">
                <p className="flex items-center">
                  <Mail className="w-5 h-5 mr-2" />
                  contacto@ohsansi.edu
                </p>
                <p className="flex items-center">
                  <Phone className="w-5 h-5 mr-2" />
                  +591 123 456 789
                </p>
                <p className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  La Paz, Bolivia
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Enlaces Útiles</h3>
              <ul className="space-y-2">
                <li><Link to="/" className="text-gray-400 hover:text-white">Reglamento</Link></li>
                <li><Link to="/" className="text-gray-400 hover:text-white">Áreas de Competencia</Link></li>
                <li><Link to="/" className="text-gray-400 hover:text-white">Preguntas Frecuentes</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}