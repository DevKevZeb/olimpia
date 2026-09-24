/**
 * Unidades educativas, estudiantes y tutores ficticios. Nombres, CI, correos
 * (dominio reservado .test) y teléfonos son inventados.
 */

export type UnidadSeed = {
  nombre: string;
  departamento: string;
  provincia: string;
};

/** Las provincias coinciden con las listas que usa el reporte por provincia. */
export const UNIDADES_SEED: readonly UnidadSeed[] = [
  { nombre: 'U.E. Illimani', departamento: 'La Paz', provincia: 'Pedro Domingo Murillo' },
  { nombre: 'Colegio Sol de los Andes', departamento: 'La Paz', provincia: 'Pedro Domingo Murillo' },
  { nombre: 'U.E. Lago Sagrado', departamento: 'La Paz', provincia: 'Omasuyos' },
  { nombre: 'Colegio Tunari', departamento: 'Cochabamba', provincia: 'Cercado' },
  { nombre: 'U.E. Valle Alto', departamento: 'Cochabamba', provincia: 'Punata' },
  { nombre: 'Colegio Guapay', departamento: 'Santa Cruz', provincia: 'Andrés Ibáñez' },
  { nombre: 'U.E. Nueva Esperanza', departamento: 'Santa Cruz', provincia: 'Ignacio Warnes' },
  { nombre: 'Colegio Ciudad Blanca', departamento: 'Chuquisaca', provincia: 'Oropeza' },
  { nombre: 'U.E. Cerro de Plata', departamento: 'Potosí', provincia: 'Tomás Frías' },
  { nombre: 'Colegio Minero del Altiplano', departamento: 'Oruro', provincia: 'Cercado' },
  { nombre: 'U.E. Valle Central', departamento: 'Tarija', provincia: 'Cercado' },
  { nombre: 'U.E. Río Mamoré', departamento: 'Beni', provincia: 'Cercado' },
];

export type PersonaSeed = {
  nombres: string;
  apellidos: string;
  ci: string;
  telefono: string;
};

export type TutorLegalSeed = PersonaSeed & { parentesco: string };

export type EstudianteSeed = PersonaSeed & {
  genero: 'Masculino' | 'Femenino';
  /** Id (= orden) del grado. */
  grado: number;
  /** Índice en UNIDADES_SEED. */
  unidad: number;
  /** Mes y día de nacimiento (MM-DD); el año se calcula a partir del grado. */
  nacimiento: string;
  tutor: TutorLegalSeed;
};

const e = (
  ci: string,
  nombres: string,
  apellidos: string,
  genero: EstudianteSeed['genero'],
  grado: number,
  unidad: number,
  nacimiento: string,
  tutor: [nombres: string, apellidos: string, ci: string, parentesco: string],
): EstudianteSeed => ({
  ci,
  nombres,
  apellidos,
  genero,
  grado,
  unidad,
  nacimiento,
  telefono: `7${ci.slice(-7)}`,
  tutor: {
    nombres: tutor[0],
    apellidos: tutor[1],
    ci: tutor[2],
    parentesco: tutor[3],
    telefono: `6${tutor[2].slice(-7).padStart(7, '0')}`,
  },
});

export const ESTUDIANTES_SEED: readonly EstudianteSeed[] = [
  // --- Convocatoria actual ---
  e('9123451', 'Sofía', 'Mamani Quispe', 'Femenino', 11, 0, '03-14', ['Rosa', 'Quispe Condori', '4812301', 'Madre']),
  e('9123452', 'Diego', 'Choque Apaza', 'Masculino', 12, 0, '07-02', ['Marcelo', 'Choque Limachi', '4812302', 'Padre']),
  e('9123453', 'Valeria', 'Condori Huanca', 'Femenino', 10, 0, '11-23', ['Julia', 'Huanca Mamani', '4812303', 'Madre']),
  e('9123454', 'Mateo', 'Limachi Flores', 'Masculino', 5, 0, '05-09', ['Pedro', 'Limachi Ticona', '4812304', 'Padre']),
  e('9123455', 'Camila', 'Ticona Vargas', 'Femenino', 9, 1, '01-30', ['Ana', 'Vargas Rojas', '4812305', 'Madre']),
  e('9123456', 'Sebastián', 'Rojas Aliaga', 'Masculino', 8, 1, '09-17', ['Luis', 'Rojas Poma', '4812306', 'Padre']),
  e('9123457', 'Lucía', 'Poma Calle', 'Femenino', 6, 1, '04-05', ['Carmen', 'Calle Nina', '4812307', 'Madre']),
  e('9123458', 'Joaquín', 'Nina Mamani', 'Masculino', 7, 2, '12-11', ['Felipe', 'Nina Choque', '4812308', 'Padre']),
  e('8234561', 'Isabella', 'Guzmán Rocha', 'Femenino', 12, 3, '02-21', ['Patricia', 'Rocha Soria', '3712301', 'Madre']),
  e('8234562', 'Nicolás', 'Soria Terrazas', 'Masculino', 11, 3, '06-28', ['Jorge', 'Soria Vega', '3712302', 'Padre']),
  e('8234563', 'Daniela', 'Terrazas Arnez', 'Femenino', 10, 3, '10-03', ['Mónica', 'Arnez Céspedes', '3712303', 'Madre']),
  e('8234564', 'Tomás', 'Céspedes Montaño', 'Masculino', 4, 3, '08-19', ['Ricardo', 'Céspedes Ugarte', '3712304', 'Padre']),
  e('8234565', 'Martina', 'Ugarte Salazar', 'Femenino', 5, 3, '03-07', ['Silvia', 'Salazar Pardo', '3712305', 'Madre']),
  e('8234566', 'Gabriel', 'Mercado Zurita', 'Masculino', 9, 4, '05-25', ['Hugo', 'Mercado Antezana', '3712306', 'Padre']),
  e('8234567', 'Renata', 'Antezana López', 'Femenino', 8, 4, '11-02', ['Elena', 'López Vargas', '3712307', 'Tía']),
  e('7345671', 'Emilia', 'Justiniano Suárez', 'Femenino', 12, 5, '01-12', ['Claudia', 'Suárez Añez', '6512301', 'Madre']),
  e('7345672', 'Santiago', 'Añez Roca', 'Masculino', 11, 5, '07-30', ['Óscar', 'Añez Paz', '6512302', 'Padre']),
  e('7345673', 'Valentina', 'Roca Moreno', 'Femenino', 10, 5, '09-08', ['Gabriela', 'Moreno Chávez', '6512303', 'Madre']),
  e('7345674', 'Benjamín', 'Chávez Egüez', 'Masculino', 6, 5, '04-16', ['Raúl', 'Chávez Rivero', '6512304', 'Padre']),
  e('7345675', 'Mía', 'Rivero Durán', 'Femenino', 7, 6, '12-27', ['Lorena', 'Durán Ortiz', '6512305', 'Madre']),
  e('7345676', 'Leonardo', 'Ortiz Saucedo', 'Masculino', 9, 6, '02-04', ['Víctor', 'Ortiz Peña', '6512306', 'Padre']),
  e('6456781', 'Antonella', 'Arancibia Torres', 'Femenino', 11, 7, '06-13', ['Verónica', 'Torres Padilla', '5212301', 'Madre']),
  e('6456782', 'Alejandro', 'Padilla Serrano', 'Masculino', 12, 7, '10-21', ['Fernando', 'Padilla Rivas', '5212302', 'Padre']),
  e('6456783', 'Julieta', 'Serrano Campos', 'Femenino', 5, 7, '08-01', ['Natalia', 'Campos Iriarte', '5212303', 'Madre']),
  e('5567891', 'Samuel', 'Cruz Mamani', 'Masculino', 10, 8, '03-29', ['Teodoro', 'Cruz Colque', '5612301', 'Padre']),
  e('5567892', 'Luciana', 'Colque Villca', 'Femenino', 8, 8, '05-18', ['Norma', 'Villca Flores', '5612302', 'Madre']),
  e('4678901', 'Matías', 'Villca Choque', 'Masculino', 11, 9, '11-09', ['Germán', 'Villca Copa', '5512301', 'Padre']),
  e('4678902', 'Ariana', 'Copa Mendoza', 'Femenino', 9, 9, '01-26', ['Beatriz', 'Mendoza Cáceres', '5512302', 'Madre']),
  e('3789011', 'Emiliano', 'Vaca Cortez', 'Masculino', 12, 10, '07-15', ['Andrés', 'Vaca Ruiz', '4612301', 'Padre']),
  e('3789012', 'Florencia', 'Cortez Baldiviezo', 'Femenino', 6, 10, '09-24', ['Mariela', 'Baldiviezo Ruiz', '4612302', 'Madre']),
  e('2890121', 'Thiago', 'Melgar Nosa', 'Masculino', 10, 11, '04-02', ['Iván', 'Melgar Rivero', '3812301', 'Padre']),
  e('2890122', 'Abril', 'Nosa Cuéllar', 'Femenino', 7, 11, '12-06', ['Paola', 'Cuéllar Vaca', '3812302', 'Madre']),
  // --- Convocatoria anterior ---
  e('9123461', 'Adrián', 'Quispe Mamani', 'Masculino', 12, 0, '02-17', ['Eva', 'Mamani Rojas', '4812311', 'Madre']),
  e('9123462', 'Paula', 'Huanca Choque', 'Femenino', 11, 1, '06-06', ['René', 'Huanca Apaza', '4812312', 'Padre']),
  e('8234571', 'Bruno', 'Vargas Arnez', 'Masculino', 10, 3, '10-14', ['Liliana', 'Arnez Rocha', '3712311', 'Madre']),
  e('8234572', 'Catalina', 'Rocha Soria', 'Femenino', 9, 3, '08-22', ['Daniel', 'Rocha Mérida', '3712312', 'Padre']),
  e('7345681', 'Maximiliano', 'Paz Suárez', 'Masculino', 12, 5, '03-03', ['Rocío', 'Suárez Vaca', '6512311', 'Madre']),
  e('7345682', 'Zoe', 'Egüez Rivero', 'Femenino', 6, 6, '05-30', ['Marco', 'Egüez Justiniano', '6512312', 'Padre']),
  e('6456791', 'Ignacio', 'Torres Arancibia', 'Masculino', 11, 7, '11-19', ['Sandra', 'Arancibia Rivas', '5212311', 'Madre']),
  e('5567901', 'Regina', 'Flores Colque', 'Femenino', 10, 8, '01-08', ['Wilma', 'Colque Condo', '5612311', 'Madre']),
];

/** Docentes que figuran como tutores académicos y encargados de listas escolares. */
export const DOCENTES_SEED: readonly PersonaSeed[] = [
  { nombres: 'Hernán', apellidos: 'Gutiérrez Laura', ci: '3300101', telefono: '71230101' },
  { nombres: 'Marisol', apellidos: 'Aguilar Vino', ci: '3300102', telefono: '71230102' },
  { nombres: 'Ernesto', apellidos: 'Salvatierra Roca', ci: '3300103', telefono: '71230103' },
  { nombres: 'Cecilia', apellidos: 'Ramírez Ovando', ci: '3300104', telefono: '71230104' },
  { nombres: 'Wálter', apellidos: 'Condo Ayala', ci: '3300105', telefono: '71230105' },
];

/** Correo ficticio a partir de nombres y apellidos (sin tildes). */
export const correoFicticio = (nombres: string, apellidos: string, dominio: string): string => {
  const limpiar = (valor: string) =>
    valor
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .split(' ')[0];
  return `${limpiar(nombres)}.${limpiar(apellidos)}@${dominio}`;
};
