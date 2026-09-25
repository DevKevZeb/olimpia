import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Phone, Mail, MapPin, Menu, X } from 'lucide-react';
import logo from '../img/logo.svg';

interface LayoutProps {
  children: React.ReactNode;
}

const navLinks = [
  { to: '/', label: 'Inicio' },
  { to: '/registration', label: 'Inscripción' },
  { to: '/gestionar-inscripciones', label: 'Tramitar Inscripciones' },
  { to: '/registroexcel', label: 'Inscripción Excel' },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `font-medium px-3 py-2 rounded-md text-sm transition-colors duration-200 ${
    isActive ? 'text-blue-700 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
  }`;

export default function Layout({ children }: LayoutProps) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { pathname } = useLocation();

  // Cierra el menú móvil al navegar
  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="bg-white shadow-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 sm:h-20 items-center">
            <Link to="/" className="flex items-center shrink-0">
              <img src={logo} alt="Olimpia" className="h-10 sm:h-12 w-auto object-contain" />
            </Link>

            {/* Escritorio */}
            <div className="hidden lg:flex items-center space-x-4 xl:space-x-6">
              {navLinks.map((link) => (
                <NavLink key={link.to} to={link.to} end={link.to === '/'} className={linkClass}>
                  {link.label}
                </NavLink>
              ))}
              <Link
                to="/admin/login"
                className="bg-blue-600 text-white px-5 py-2.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors duration-200 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Iniciar Sesión
              </Link>
            </div>

            {/* Móvil */}
            <button
              type="button"
              className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menuAbierto}
              aria-controls="menu-movil"
              onClick={() => setMenuAbierto((abierto) => !abierto)}
            >
              {menuAbierto ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {menuAbierto && (
          <div id="menu-movil" className="lg:hidden border-t border-gray-100 px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) => `block ${linkClass({ isActive })}`}
              >
                {link.label}
              </NavLink>
            ))}
            <Link
              to="/admin/login"
              className="block text-center mt-2 bg-blue-600 text-white px-5 py-2.5 rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Iniciar Sesión
            </Link>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Olimpia</h3>
              <p className="text-gray-400">
                Sistema de inscripción a olimpiadas académicas: convocatorias, inscripciones, pagos y reportes en un solo lugar.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Contacto</h3>
              <div className="space-y-2">
                <p className="flex items-center break-all">
                  <Mail className="w-5 h-5 mr-2 shrink-0" />
                  contacto@olimpia.test
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