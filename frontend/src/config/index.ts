// Configuración unificada para la aplicación frontend

// Obtención de variables de entorno con valores por defecto
const ENV = import.meta.env.MODE || 'development';
const PROJECT_FOLDER = '/oh-sansi';

// Tipo para la configuración
interface Config {
  apiUrl: string;
  projectFolder: string;
  isDevelopment: boolean;
  isProduction: boolean;
  appName: string;
  defaultPageSize: number;
  maxAreasPerStudent: number;
  dateFormat: string;
  paymentExpirationDays: number;
}

// Función para obtener la configuración según el entorno
const getBaseConfig = (): Config => {
  const config: Config = {
    apiUrl: '',
    projectFolder: PROJECT_FOLDER,
    isDevelopment: ENV === 'development',
    isProduction: ENV === 'production',
    appName: 'Olimpiada de Ciencias SANSI',
    defaultPageSize: 10,
    maxAreasPerStudent: 2,
    dateFormat: 'DD/MM/YYYY',
    paymentExpirationDays: 5
  };

  if (ENV === 'development') {
    // En desarrollo, usar el proxy configurado en Vite
    config.apiUrl = '/api/v1';
  } else if (ENV === 'production') {
    // En producción, usar la ruta relativa
    config.apiUrl = `${config.projectFolder}/backend/public/api/v1`;
  } else if (ENV === 'test') {
    config.apiUrl = `http://localhost${config.projectFolder}/backend/public/api/v1`;
  }

  return config;
};

// Crear la configuración
const config = getBaseConfig();

// Exportar la configuración
export default config;

// Exportar valores individuales para facilitar su uso
export const API_BASE_URL = config.apiUrl;

// Rutas de la API - actualizadas para coincidir con el backend actual
export const API_ROUTES = {
  // Nuevos endpoints orientados a casos de uso
  HOME: {
    CONVOCATORIA_ACTUAL: '/public/convocatoria-actual',
  },
  INSCRIPCION: {
    DATOS: '/public/datos-inscripcion',
    BUSCAR_UNIDADES: '/public/unidades-educativas/buscar',
    INSCRIPCION_COMPLETA: '/public/inscripcion-completa',
  },
  ADMIN: {
    DASHBOARD_DATA: '/admin/dashboard-data',
    CONVOCATORIA_COMPLETA: '/admin/convocatorias/completa',
    CONVOCATORIA_DETALLE: '/admin/convocatorias', // Para /admin/convocatorias/{id}/completa
  },
  
  // Mantener las rutas CRUD por si son necesarias
  AREAS: '/areas',
  CONVOCATORIAS: '/convocatorias',
  CONVOCATORIA_AREAS: '/convocatoria-areas',
  CONVOCATORIA_NIVELES: '/convocatoria-niveles',
  ESTUDIANTES: '/estudiantes',
  ESTUDIANTES_SEARCH: '/estudiantes/search',
  INSCRIPCIONES: '/inscripciones',
  UNIDADES_EDUCATIVAS: '/unidades-educativas',
  GRADOS: '/grados',
  NIVELES: '/niveles',
  TUTORES_LEGALES: '/tutores-legales',
  TUTORES_ACADEMICOS: '/tutores-academicos',
  LISTAS_INSCRIPCION: '/listas-inscripcion',
  ORDENES_PAGO: '/ordenes-pago',
  ORDENES_PAGO_BUSCAR: '/ordenes-pago/buscar-por-codigo',
  COMPROBANTES_PAGO: '/comprobantes-pago',
};

// Constantes de aplicación
export const APP_CONFIG = {
  isDevelopment: config.isDevelopment,
  isProduction: config.isProduction,
  appName: config.appName,
  defaultPageSize: config.defaultPageSize,
  maxAreasPerStudent: config.maxAreasPerStudent,
  dateFormat: config.dateFormat,
  paymentExpirationDays: config.paymentExpirationDays,
};
