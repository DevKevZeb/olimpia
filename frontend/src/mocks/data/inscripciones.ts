/**
 * Listas de inscripción ficticias. Cada lista genera una orden de pago
 * (OLP-AAAA-NNNNN) con su responsable de pago. Las pendientes son recientes
 * para que su orden no esté vencida y se pueda probar la subida del comprobante.
 */

export type EncargadoSeed =
  /** CI de un tutor legal de ESTUDIANTES_SEED. */
  | { tutorDe: string }
  /** CI de un docente de DOCENTES_SEED. */
  | { docente: string };

export type InscripcionEstudianteSeed = {
  ci: string;
  areas: string[];
  /** CI del docente que figura como tutor académico en esas áreas. */
  tutorAcademico?: string;
};

export type ListaSeed = {
  convocatoria: 'actual' | 'anterior';
  /** Días respecto de hoy (negativo = pasado). */
  dia: number;
  estado: 'pagada' | 'pendiente';
  encargado: EncargadoSeed;
  estudiantes: InscripcionEstudianteSeed[];
};

export const LISTAS_SEED: readonly ListaSeed[] = [
  // --- Convocatoria anterior (todas pagadas) ---
  {
    convocatoria: 'anterior', dia: -380, estado: 'pagada', encargado: { docente: '3300101' },
    estudiantes: [
      { ci: '9123461', areas: ['Matemáticas', 'Física'], tutorAcademico: '3300101' },
      { ci: '9123462', areas: ['Matemáticas', 'Química'], tutorAcademico: '3300101' },
    ],
  },
  {
    convocatoria: 'anterior', dia: -372, estado: 'pagada', encargado: { tutorDe: '8234571' },
    estudiantes: [
      { ci: '8234571', areas: ['Física', 'Química'] },
      { ci: '8234572', areas: ['Matemáticas'] },
    ],
  },
  {
    convocatoria: 'anterior', dia: -365, estado: 'pagada', encargado: { docente: '3300103' },
    estudiantes: [
      { ci: '7345681', areas: ['Matemáticas', 'Física'], tutorAcademico: '3300103' },
      { ci: '7345682', areas: ['Matemáticas'], tutorAcademico: '3300103' },
    ],
  },
  {
    convocatoria: 'anterior', dia: -350, estado: 'pagada', encargado: { tutorDe: '6456791' },
    estudiantes: [
      { ci: '6456791', areas: ['Química'] },
      { ci: '5567901', areas: ['Matemáticas', 'Química'] },
    ],
  },
  // --- Convocatoria actual ---
  {
    convocatoria: 'actual', dia: -20, estado: 'pagada', encargado: { docente: '3300101' },
    estudiantes: [
      { ci: '9123451', areas: ['Matemáticas', 'Física'], tutorAcademico: '3300101' },
      { ci: '9123452', areas: ['Matemáticas', 'Química'], tutorAcademico: '3300101' },
      { ci: '9123453', areas: ['Matemáticas'], tutorAcademico: '3300101' },
      { ci: '9123454', areas: ['Matemáticas', 'Robótica'], tutorAcademico: '3300101' },
    ],
  },
  {
    convocatoria: 'actual', dia: -18, estado: 'pagada', encargado: { tutorDe: '9123455' },
    estudiantes: [{ ci: '9123455', areas: ['Matemáticas', 'Física'] }],
  },
  {
    convocatoria: 'actual', dia: -17, estado: 'pagada', encargado: { tutorDe: '9123456' },
    estudiantes: [{ ci: '9123456', areas: ['Física', 'Matemáticas'] }],
  },
  {
    convocatoria: 'actual', dia: -16, estado: 'pagada', encargado: { tutorDe: '9123457' },
    estudiantes: [{ ci: '9123457', areas: ['Robótica', 'Matemáticas'] }],
  },
  {
    convocatoria: 'actual', dia: -15, estado: 'pagada', encargado: { tutorDe: '9123458' },
    estudiantes: [{ ci: '9123458', areas: ['Matemáticas', 'Robótica'] }],
  },
  {
    convocatoria: 'actual', dia: -14, estado: 'pagada', encargado: { docente: '3300102' },
    estudiantes: [
      { ci: '8234561', areas: ['Matemáticas', 'Física'], tutorAcademico: '3300102' },
      { ci: '8234562', areas: ['Física', 'Química'], tutorAcademico: '3300102' },
      { ci: '8234563', areas: ['Química', 'Matemáticas'], tutorAcademico: '3300102' },
      { ci: '8234564', areas: ['Matemáticas', 'Robótica'] },
      { ci: '8234565', areas: ['Robótica'] },
    ],
  },
  {
    convocatoria: 'actual', dia: -12, estado: 'pagada', encargado: { tutorDe: '8234566' },
    estudiantes: [
      { ci: '8234566', areas: ['Matemáticas', 'Física'] },
      { ci: '8234567', areas: ['Física'] },
    ],
  },
  {
    convocatoria: 'actual', dia: -11, estado: 'pagada', encargado: { docente: '3300103' },
    estudiantes: [
      { ci: '7345671', areas: ['Robótica', 'Matemáticas'], tutorAcademico: '3300103' },
      { ci: '7345672', areas: ['Robótica', 'Física'], tutorAcademico: '3300103' },
      { ci: '7345673', areas: ['Química'] },
      { ci: '7345674', areas: ['Robótica'], tutorAcademico: '3300103' },
    ],
  },
  {
    convocatoria: 'actual', dia: -9, estado: 'pagada', encargado: { tutorDe: '7345675' },
    estudiantes: [
      { ci: '7345675', areas: ['Robótica'] },
      { ci: '7345676', areas: ['Matemáticas', 'Robótica'] },
    ],
  },
  {
    convocatoria: 'actual', dia: -7, estado: 'pagada', encargado: { docente: '3300104' },
    estudiantes: [
      { ci: '6456781', areas: ['Química', 'Matemáticas'], tutorAcademico: '3300104' },
      { ci: '6456782', areas: ['Química', 'Física'], tutorAcademico: '3300104' },
      { ci: '6456783', areas: ['Matemáticas'] },
    ],
  },
  {
    convocatoria: 'actual', dia: -4, estado: 'pendiente', encargado: { docente: '3300105' },
    estudiantes: [
      { ci: '5567891', areas: ['Matemáticas', 'Física'], tutorAcademico: '3300105' },
      { ci: '5567892', areas: ['Matemáticas'], tutorAcademico: '3300105' },
    ],
  },
  {
    convocatoria: 'actual', dia: -3, estado: 'pendiente', encargado: { tutorDe: '4678901' },
    estudiantes: [{ ci: '4678901', areas: ['Física', 'Química'] }],
  },
  {
    convocatoria: 'actual', dia: -3, estado: 'pendiente', encargado: { tutorDe: '4678902' },
    estudiantes: [{ ci: '4678902', areas: ['Matemáticas', 'Física'] }],
  },
  {
    convocatoria: 'actual', dia: -2, estado: 'pendiente', encargado: { tutorDe: '3789011' },
    estudiantes: [
      { ci: '3789011', areas: ['Matemáticas', 'Robótica'] },
      { ci: '3789012', areas: ['Robótica'] },
    ],
  },
  {
    convocatoria: 'actual', dia: -1, estado: 'pendiente', encargado: { tutorDe: '2890121' },
    estudiantes: [
      { ci: '2890121', areas: ['Química'] },
      { ci: '2890122', areas: ['Robótica', 'Matemáticas'] },
    ],
  },
];
