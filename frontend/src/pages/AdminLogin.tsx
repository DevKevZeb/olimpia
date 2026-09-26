import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Lock, User, AlertCircle, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// En modo demo el acceso es con un botón, sin mostrar ni escribir credenciales
const ES_DEMO = import.meta.env.VITE_DEMO_MODE === 'true';
const CUENTA_DEMO = { email: 'admin@olimpia.test', password: 'admin123' };

export default function AdminLogin() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = location.state?.from?.pathname || '/admin';
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError('');
  };

  const iniciarSesion = async (email: string, password: string) => {
    setIsLoading(true);
    setError('');

    try {
      const result = await login(email, password);
      if (result.success) {
        const redirectTo = location.state?.from?.pathname || '/admin';
        navigate(redirectTo, { replace: true });
      } else {
        setError(result.message || 'Credenciales inválidas');
      }
    } catch {
      setError('Error inesperado. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    iniciarSesion(formData.email, formData.password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Botón de regreso */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium group transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Volver al inicio
          </button>
        </div>

        {/* Logo y título */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-6">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Acceso Administrativo
          </h2>
          <p className="text-gray-600">
            Ingresa tus credenciales para acceder al panel de administración
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10 border border-gray-200">
          {ES_DEMO && (
            <div className="mb-6">
              <button
                type="button"
                onClick={() => iniciarSesion(CUENTA_DEMO.email, CUENTA_DEMO.password)}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-md text-sm font-semibold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <LogIn className="h-5 w-5" />
                Entrar como administrador (demo)
              </button>
              <p className="mt-2 text-center text-xs text-gray-500">
                Accede al panel con una cuenta de demostración y datos ficticios.
              </p>
              <div className="relative mt-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">o ingresa con tu cuenta</span>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Campo de email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                  placeholder="correo@ejemplo.com"
                />
              </div>
            </div>

            {/* Campo de contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>            {/* Mensaje de error */}
            {error && (
              <div className={`border rounded-md p-4 ${
                error.includes('Demasiados intentos') 
                  ? 'bg-orange-50 border-orange-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex">
                  <AlertCircle className={`h-5 w-5 ${
                    error.includes('Demasiados intentos') 
                      ? 'text-orange-400' 
                      : 'text-red-400'
                  }`} />
                  <div className="ml-3">
                    <p className={`text-sm ${
                      error.includes('Demasiados intentos') 
                        ? 'text-orange-700' 
                        : 'text-red-700'
                    }`}>{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Botón de submit */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Iniciando sesión...
                  </div>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            ¿Problemas para acceder?{' '}
            <button
              onClick={() => navigate('/')}
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              Contacta al administrador del sistema
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
