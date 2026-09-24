/**
 * Formatos de fecha que produce el backend de Laravel.
 * - Timestamps y casts `datetime`/`date` serializados: 2026-09-24T02:13:51.000000Z
 * - Columnas crudas de consultas DB::select: 2026-09-24 02:13:51
 */

const DIA_MS = 24 * 60 * 60 * 1000;

const pad = (n: number, largo = 2): string => String(n).padStart(largo, '0');

/** Fecha ISO al estilo Laravel (microsegundos y zona UTC). */
export const isoLaravel = (fecha: Date): string =>
  fecha.toISOString().replace(/\.(\d{3})Z$/, '.$1000Z');

/** Timestamp actual al estilo Laravel. */
export const ahoraLaravel = (): string => isoLaravel(new Date());

/** YYYY-MM-DD en UTC (como guarda Laravel las columnas `date`). */
export const soloFecha = (fecha: Date): string =>
  `${fecha.getUTCFullYear()}-${pad(fecha.getUTCMonth() + 1)}-${pad(fecha.getUTCDate())}`;

/** Columna `date` serializada con cast: YYYY-MM-DDT00:00:00.000000Z */
export const fechaCast = (fechaYmd: string): string => `${fechaYmd}T00:00:00.000000Z`;

/** YYYY-MM-DD HH:MM:SS en UTC, como devuelve SQLite en consultas crudas. */
export const fechaSql = (fecha: Date): string =>
  `${soloFecha(fecha)} ${pad(fecha.getUTCHours())}:${pad(fecha.getUTCMinutes())}:${pad(fecha.getUTCSeconds())}`;

/** Convierte un timestamp ISO de Laravel a formato SQL crudo. */
export const isoASql = (iso: string): string => fechaSql(new Date(iso));

/** Desplaza una fecha una cantidad de días (negativo = pasado). */
export const sumarDias = (base: Date, dias: number): Date => new Date(base.getTime() + dias * DIA_MS);

/** Desplaza una fecha una cantidad de minutos. */
export const sumarMinutos = (base: Date, minutos: number): Date => new Date(base.getTime() + minutos * 60 * 1000);

/** Fecha válida en formato reconocible por `strtotime` (simplificado). */
export const esFechaValida = (valor: unknown): valor is string =>
  typeof valor === 'string' && valor.trim() !== '' && !Number.isNaN(Date.parse(valor));

/** Normaliza una fecha de entrada a YYYY-MM-DD. */
export const aFechaYmd = (valor: string): string => soloFecha(new Date(valor.length === 10 ? `${valor}T00:00:00Z` : valor));

const MESES_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Etiqueta de Carbon `format('M Y')`, p. ej. "Sep 2026". */
export const etiquetaMes = (anio: number, mesIndice: number): string => `${MESES_EN[mesIndice]} ${anio}`;
