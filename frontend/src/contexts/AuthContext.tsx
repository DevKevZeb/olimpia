import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../api/apiService';

interface Admin {
  id: number;
  nombre: string;
  email: string;
}

interface AuthContextType {
  admin: Admin | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!admin && !!token;
  // Función para login
  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      setIsLoading(true);
      const response = await apiService.post('/admin/login', { email, password });
      
      if (response.success) {
        const { admin: adminData, token: newToken } = response.data;
        
        // Guardar en estado y localStorage
        setAdmin(adminData);
        setToken(newToken);
        localStorage.setItem('admin_token', newToken);
        
        // Configurar token en apiService para futuras peticiones
        apiService.setAuthToken(newToken);
        
        return { success: true, message: response.message };
      } else {
        return { success: false, message: response.message };
      }    } catch (error: any) {
      console.error('Error en login - Full error object:', error);
      console.error('Error en login - error.response:', error.response);
      console.error('Error en login - error.request:', error.request);
      console.error('Error en login - error.message:', error.message);
      
      // Manejar diferentes tipos de errores
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
        
        if (error.response.status === 401) {
          return { 
            success: false, 
            message: error.response.data?.message || 'Credenciales incorrectas' 
          };
        } else if (error.response.status === 422) {
          return { 
            success: false, 
            message: error.response.data?.message || 'Datos de entrada inválidos' 
          };
        } else {
          return { 
            success: false, 
            message: error.response.data?.message || `Error del servidor (${error.response.status})` 
          };
        }
      } else if (error.request) {
        console.error('Error request - no response received:', error.request);
        return { 
          success: false, 
          message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.' 
        };
      } else {
        console.error('Error setting up request:', error.message);
        return { 
          success: false, 
          message: 'Error inesperado. Por favor, intenta nuevamente.' 
        };
      }
    }finally {
      setIsLoading(false);
    }
  };

  // Función para logout
  const logout = async () => {
    try {
      if (token) {
        await apiService.post('/admin/logout');
      }
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      // Limpiar estado y localStorage
      setAdmin(null);
      setToken(null);
      localStorage.removeItem('admin_token');
      apiService.setAuthToken(null);
    }
  };

  // Función para verificar autenticación
  const checkAuth = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      // Configurar token en apiService
      apiService.setAuthToken(token);
      
      const response = await apiService.get('/admin/check-auth');
      
      if (response.success) {
        setAdmin(response.data.admin);
      } else {
        // Token inválido, limpiar
        logout();
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar autenticación al montar el componente
  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    admin,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
