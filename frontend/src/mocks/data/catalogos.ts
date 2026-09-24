/**
 * Catálogos base del modo demo. Los grados siguen el catálogo real
 * (GradosSeeder): "1ro Primaria" ... "6to Secundaria" con orden 1..12;
 * en la demo el id coincide con el orden.
 */

export const GRADOS_SEED: readonly string[] = [
  '1ro Primaria',
  '2do Primaria',
  '3ro Primaria',
  '4to Primaria',
  '5to Primaria',
  '6to Primaria',
  '1ro Secundaria',
  '2do Secundaria',
  '3ro Secundaria',
  '4to Secundaria',
  '5to Secundaria',
  '6to Secundaria',
];

export type AreaSeed = {
  nombre: string;
  descripcion: string;
};

export const AREAS_SEED: readonly AreaSeed[] = [
  { nombre: 'Matemáticas', descripcion: 'Razonamiento lógico, álgebra, geometría y resolución de problemas.' },
  { nombre: 'Física', descripcion: 'Mecánica, energía, ondas y fenómenos físicos cotidianos.' },
  { nombre: 'Química', descripcion: 'Estructura de la materia, reacciones y química experimental.' },
  { nombre: 'Robótica', descripcion: 'Diseño, construcción y programación de robots en equipo.' },
  { nombre: 'Informática', descripcion: 'Algoritmos, estructuras de datos y programación competitiva.' },
  { nombre: 'Biología', descripcion: 'Seres vivos, ecología y biodiversidad de Bolivia.' },
];

export const NIVELES_SEED: readonly string[] = [
  'Nivel Primaria',
  'Nivel Secundaria Inicial',
  'Nivel Secundaria Avanzado',
  'Nivel Único',
  'Nivel Olímpico',
];

/** Nombres de nivel reutilizados por los datos de convocatorias. */
export const NIVEL = {
  primaria: 'Nivel Primaria',
  secundariaInicial: 'Nivel Secundaria Inicial',
  secundariaAvanzado: 'Nivel Secundaria Avanzado',
  unico: 'Nivel Único',
} as const;

export const DEPARTAMENTOS_BOLIVIA: readonly string[] = [
  'Chuquisaca',
  'La Paz',
  'Cochabamba',
  'Oruro',
  'Potosí',
  'Tarija',
  'Santa Cruz',
  'Beni',
  'Pando',
];
