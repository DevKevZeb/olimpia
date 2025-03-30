/**
 * Configuración de la aplicación
 */

// Obtener el entorno de la variable de entorno o usar desarrollo por defecto
const ENV = import.meta.env.MODE || 'development';

// Definir la estructura de la configuración
type Config = {
  apiUrl: string;
  projectFolder: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

// Función para obtener la configuración base según el entorno
const getBaseConfig = (): Config => {
  // Configuración por defecto
  const config: Config = {
    apiUrl: '',
    projectFolder: '/oh-sansi',  // Mantener esta ruta ya que es correcta
    isDevelopment: ENV === 'development',
    isProduction: ENV === 'production',
  };

  // Configuración específica por entorno
  if (ENV === 'development') {
    config.apiUrl = `http://localhost${config.projectFolder}/backend/public/api`;
  } else if (ENV === 'production') {
    // URL de producción - reemplaza esto con tu URL real de producción
    config.apiUrl = `https://tu-dominio-produccion.com/api`;
  } else if (ENV === 'test') {
    config.apiUrl = `http://localhost${config.projectFolder}/backend/public/api`;
  }

  return config;
};

// Crear la configuración
const config = getBaseConfig();

// Exportar la configuración
export default config;

// Exportar la URL de la API para compatibilidad con código existente
export const API_BASE_URL = config.apiUrl;
