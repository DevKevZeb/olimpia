import { NIVEL } from './catalogos';

/**
 * Convocatorias ficticias. Las fechas son relativas al día en que se abre la
 * demo para que siempre exista una convocatoria abierta y vigente.
 */

export type EstadoConvocatoria = 'planificada' | 'abierta' | 'cerrada' | 'finalizada';

export type NivelAreaSeed = {
  nivel: string;
  /** Orden (= id) del grado mínimo y máximo. */
  gradoMin: number;
  gradoMax: number;
};

export type AreaConvocatoriaSeed = {
  area: string;
  costo: number;
  niveles: NivelAreaSeed[];
};

export type ConvocatoriaSeed = {
  clave: 'actual' | 'anterior' | 'planificada';
  nombre: (anio: number) => string;
  estado: EstadoConvocatoria;
  /** Días respecto de hoy. */
  inicio: number;
  fin: number;
  creada: number;
  apertura: number | null;
  maxAreas: number;
  areas: AreaConvocatoriaSeed[];
};

export const CONVOCATORIAS_SEED: readonly ConvocatoriaSeed[] = [
  {
    clave: 'anterior',
    nombre: (anio) => `Olimpiada Científica Estudiantil ${anio - 1}`,
    estado: 'finalizada',
    inicio: -385,
    fin: -335,
    creada: -400,
    apertura: -385,
    maxAreas: 2,
    areas: [
      {
        area: 'Matemáticas',
        costo: 15,
        niveles: [
          { nivel: NIVEL.primaria, gradoMin: 4, gradoMax: 6 },
          { nivel: NIVEL.secundariaInicial, gradoMin: 7, gradoMax: 9 },
          { nivel: NIVEL.secundariaAvanzado, gradoMin: 10, gradoMax: 12 },
        ],
      },
      {
        area: 'Física',
        costo: 15,
        niveles: [{ nivel: NIVEL.secundariaAvanzado, gradoMin: 10, gradoMax: 12 }],
      },
      {
        area: 'Química',
        costo: 15,
        niveles: [{ nivel: NIVEL.secundariaAvanzado, gradoMin: 10, gradoMax: 12 }],
      },
    ],
  },
  {
    clave: 'actual',
    nombre: (anio) => `Olimpiada Científica Estudiantil ${anio}`,
    estado: 'abierta',
    inicio: -21,
    fin: 39,
    creada: -30,
    apertura: -21,
    maxAreas: 2,
    areas: [
      {
        area: 'Matemáticas',
        costo: 20,
        niveles: [
          { nivel: NIVEL.primaria, gradoMin: 4, gradoMax: 6 },
          { nivel: NIVEL.secundariaInicial, gradoMin: 7, gradoMax: 9 },
          { nivel: NIVEL.secundariaAvanzado, gradoMin: 10, gradoMax: 12 },
        ],
      },
      {
        area: 'Física',
        costo: 20,
        niveles: [
          { nivel: NIVEL.secundariaInicial, gradoMin: 8, gradoMax: 9 },
          { nivel: NIVEL.secundariaAvanzado, gradoMin: 10, gradoMax: 12 },
        ],
      },
      {
        area: 'Química',
        costo: 20,
        niveles: [{ nivel: NIVEL.secundariaAvanzado, gradoMin: 10, gradoMax: 12 }],
      },
      {
        area: 'Robótica',
        costo: 30,
        niveles: [
          { nivel: NIVEL.primaria, gradoMin: 4, gradoMax: 6 },
          { nivel: NIVEL.unico, gradoMin: 7, gradoMax: 12 },
        ],
      },
    ],
  },
  {
    // Convocatoria a medio configurar: permite probar asignar áreas, niveles,
    // costos, campos obligatorios y la transición planificada -> abierta.
    clave: 'planificada',
    nombre: (anio) => `Olimpiada de Robótica e Informática ${anio + 1}`,
    estado: 'planificada',
    inicio: 75,
    fin: 110,
    creada: -3,
    apertura: null,
    maxAreas: 1,
    areas: [
      { area: 'Robótica', costo: 0, niveles: [] },
      { area: 'Informática', costo: 0, niveles: [] },
    ],
  },
];

/** Anexos (bases de la convocatoria) precargados por área para la convocatoria actual. */
export const ANEXOS_SEED: readonly string[] = ['Matemáticas', 'Física', 'Química', 'Robótica'];

/** Campos obligatorios ya configurados para la convocatoria planificada. */
export const REQUISITOS_SEED: readonly { entidad: string; campo: string }[] = [
  { entidad: 'postulante', campo: 'fecha_nacimiento' },
  { entidad: 'postulante', campo: 'genero' },
  { entidad: 'tutorLegal', campo: 'telefono' },
];
