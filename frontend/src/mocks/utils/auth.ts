import { db } from '../db';
import { noAutenticado } from './http';

/** Credenciales del administrador de la demo (mismas que el AdminSeeder local). */
export const ADMIN_DEMO = {
  id: 1,
  nombre: 'Administrador',
  email: 'admin@olimpia.test',
  password: 'admin123',
} as const;

export const PREFIJO_TOKEN = 'demo|';

/** Token con el formato de Sanctum ("{id}|{40 caracteres}"). */
export const generarToken = (): string => {
  const alfabeto = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const aleatorio = crypto.getRandomValues(new Uint8Array(40));
  return PREFIJO_TOKEN + Array.from(aleatorio, (n) => alfabeto[n % alfabeto.length]).join('');
};

export const tokenDe = (request: Request): string | null => {
  const cabecera = request.headers.get('Authorization') ?? '';
  return cabecera.startsWith('Bearer ') ? cabecera.slice(7) : null;
};

/**
 * Se aceptan todos los tokens emitidos por la demo que no se hayan cerrado; así
 * la sesión del administrador sobrevive a una recarga aunque el estado se reinicie.
 */
export const tokenValido = (token: string | null): token is string =>
  token !== null && token.startsWith(PREFIJO_TOKEN) && !db.tokensRevocados.has(token);

/** Middleware auth:sanctum: devuelve la respuesta 401 o `null` si la petición está autenticada. */
export const requiereAdmin = (request: Request) => (tokenValido(tokenDe(request)) ? null : noAutenticado());

export const adminPublico = () => ({ id: ADMIN_DEMO.id, nombre: ADMIN_DEMO.nombre, email: ADMIN_DEMO.email });
