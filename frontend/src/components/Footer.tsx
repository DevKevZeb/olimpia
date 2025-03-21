import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Ohl SanSi</h3>
            <p className="text-gray-400">
              Olimpiadas de Ciencias y Tecnología, fomentando el talento y la innovación en la juventud.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-4">Contacto</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Mail size={18} className="text-blue-400" />
                <span>contacto@ohlsansi.edu</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone size={18} className="text-blue-400" />
                <span>+591 123 456 789</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin size={18} className="text-blue-400" />
                <span>La Paz, Bolivia</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-4">Enlaces Útiles</h3>
            <ul className="space-y-2">
              <li>
                <a href="/reglamento" className="text-gray-400 hover:text-blue-400">
                  Reglamento
                </a>
              </li>
              <li>
                <a href="/areas" className="text-gray-400 hover:text-blue-400">
                  Áreas de Competencia
                </a>
              </li>
              <li>
                <a href="/faq" className="text-gray-400 hover:text-blue-400">
                  Preguntas Frecuentes
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>© {new Date().getFullYear()} Ohl SanSi. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}