import React from 'react';
import { Menu, LogIn, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-blue-600">Ohl SanSi</span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
              Inicio
            </Link>
            <Link to="/registro" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
              Inscripción
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/admin" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  Panel Admin
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
                >
                  <LogOut size={18} />
                  <span>Cerrar Sesión</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
              >
                <LogIn size={18} />
                <span>Administrador</span>
              </button>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button className="text-gray-700 hover:text-blue-600">
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}