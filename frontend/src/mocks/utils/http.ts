import { HttpResponse } from 'msw';

/**
 * Helpers que replican los sobres de respuesta del backend:
 * - ApiController::successResponse -> { success, message, data }
 * - ApiController::errorResponse   -> { status: 'Error', message, data, errors? }
 * - Handler de excepciones (422)   -> { status: 'Error', message, data: null, errors }
 */

export type Json = string | number | boolean | null | Json[] | { [clave: string]: Json | undefined };
export type ErroresValidacion = Record<string, string[]>;

export const ok = (data: Json, message: string, status = 200) =>
  HttpResponse.json({ success: true, message, data }, { status });

/** errorResponse(): con 422 los detalles van en `errors`; con otros códigos, en `data`. */
export const error = (message: string, status = 400, detalles?: Json) => {
  if (status === 422 && detalles !== undefined) {
    return HttpResponse.json({ status: 'Error', message, data: null, errors: detalles }, { status });
  }
  return HttpResponse.json({ status: 'Error', message, data: detalles ?? null }, { status });
};

/** Error 500 de serverErrorResponse() con APP_DEBUG activo (incluye la excepción). */
export const errorServidor = (message: string, excepcion: string) => error(message, 500, { exception: excepcion });

export const noEncontrado = (message: string) => error(message, 404);

/** 404 de NotFoundHttpException (ruta o route-model-binding inexistente). */
export const urlNoExiste = () => error('La URL especificada no existe', 404);

/** 401 del middleware auth:sanctum. */
export const noAutenticado = () =>
  HttpResponse.json({ status: 'Error', message: 'Unauthenticated or token expired', data: null }, { status: 401 });

// ---------------------------------------------------------------------------
// Lectura del cuerpo de la petición
// ---------------------------------------------------------------------------

export type Registro = Record<string, unknown>;

export const esRegistro = (valor: unknown): valor is Registro =>
  typeof valor === 'object' && valor !== null && !Array.isArray(valor);

/** Lee el JSON del cuerpo; si no hay cuerpo o es inválido devuelve `null`. */
export const leerJson = async (request: Request): Promise<unknown> => {
  try {
    const texto = await request.text();
    return texto ? (JSON.parse(texto) as unknown) : null;
  } catch {
    return null;
  }
};

export const leerObjeto = async (request: Request): Promise<Registro> => {
  const cuerpo = await leerJson(request);
  return esRegistro(cuerpo) ? cuerpo : {};
};

/** Valor presente según la regla `required` de Laravel. */
export const presente = (valor: unknown): boolean => {
  if (valor === undefined || valor === null) return false;
  if (typeof valor === 'string') return valor.trim() !== '';
  if (Array.isArray(valor)) return valor.length > 0;
  return true;
};

export const texto = (valor: unknown): string | null => {
  if (typeof valor === 'string') return valor;
  if (typeof valor === 'number') return String(valor);
  return null;
};

export const numero = (valor: unknown): number | null => {
  if (typeof valor === 'number' && Number.isFinite(valor)) return valor;
  if (typeof valor === 'string' && valor.trim() !== '' && Number.isFinite(Number(valor))) return Number(valor);
  return null;
};

export const esBooleano = (valor: unknown): boolean =>
  [true, false, 0, 1, '0', '1'].some((permitido) => permitido === valor);

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------------------------------------------------------------------------
// Validación al estilo Laravel
// ---------------------------------------------------------------------------

/** Nombre visible de un atributo en los mensajes por defecto de Laravel. */
export const atributo = (campo: string): string => campo.replace(/_/g, ' ');

export const mensajes = {
  requerido: (campo: string) => `The ${atributo(campo)} field is required.`,
  unico: (campo: string) => `The ${atributo(campo)} has already been taken.`,
  existe: (campo: string) => `The selected ${atributo(campo)} is invalid.`,
  minTexto: (campo: string, n: number) => `The ${atributo(campo)} must be at least ${n} characters.`,
  maxTexto: (campo: string, n: number) => `The ${atributo(campo)} must not be greater than ${n} characters.`,
  numerico: (campo: string) => `The ${atributo(campo)} must be a number.`,
  minNumero: (campo: string, n: number) => `The ${atributo(campo)} must be at least ${n}.`,
  email: (campo: string) => `The ${atributo(campo)} must be a valid email address.`,
  fecha: (campo: string) => `The ${atributo(campo)} is not a valid date.`,
  booleano: (campo: string) => `The ${atributo(campo)} field must be true or false.`,
  arreglo: (campo: string) => `The ${atributo(campo)} must be an array.`,
  entero: (campo: string) => `The ${atributo(campo)} must be an integer.`,
};

/** Acumula errores por campo (uno por campo, como cuando falla la primera regla). */
export class Validador {
  readonly errores: ErroresValidacion = {};

  agregar(campo: string, mensaje: string): void {
    if (!this.errores[campo]) this.errores[campo] = [mensaje];
  }

  tiene(campo: string): boolean {
    return campo in this.errores;
  }

  get falla(): boolean {
    return Object.keys(this.errores).length > 0;
  }

  get primerMensaje(): string {
    const [primero] = Object.values(this.errores);
    return primero?.[0] ?? '';
  }

  /** Respuesta del Handler para ValidationException (FormRequest). */
  respuesta() {
    return error(this.primerMensaje, 422, this.errores);
  }

  /** Respuesta de `errorResponse($validator->errors()->first(), 422)` sin detalle de errores. */
  respuestaSoloMensaje() {
    return error(this.primerMensaje, 422);
  }
}
