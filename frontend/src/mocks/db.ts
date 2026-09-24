/**
 * Base de datos en memoria del modo demo.
 *
 * Las filas replican las tablas del backend (mismos nombres de columna) para que
 * los handlers puedan construir exactamente las mismas respuestas que los
 * controladores de Laravel. El estado se pierde al recargar la página.
 */
import { AREAS_SEED, GRADOS_SEED, NIVELES_SEED } from './data/catalogos';
import {
  ANEXOS_SEED,
  CONVOCATORIAS_SEED,
  REQUISITOS_SEED,
  type ConvocatoriaSeed,
  type EstadoConvocatoria,
} from './data/convocatorias';
import { LISTAS_SEED } from './data/inscripciones';
import { correoFicticio, DOCENTES_SEED, ESTUDIANTES_SEED, UNIDADES_SEED } from './data/personas';
import { AGENTES, INTENTOS_LOGIN_SEED } from './data/seguridad';
import { fechaSql, isoLaravel, soloFecha, sumarDias, sumarMinutos } from './utils/fechas';

export type { EstadoConvocatoria };

// ---------------------------------------------------------------------------
// Filas (se usan `type` y no `interface` para que sean serializables como Json)
// ---------------------------------------------------------------------------

type Timestamps = { created_at: string; updated_at: string };

export type Grado = { id_grado: number; nombre_grado: string; orden: number } & Timestamps;

export type Area = {
  id_area: number;
  nombre_area: string;
  descripcion: string | null;
  anexo: string | null;
} & Timestamps;

export type Nivel = { id_nivel: number; nombre_nivel: string } & Timestamps;

export type Convocatoria = {
  id_convocatoria: number;
  nombre: string;
  /** YYYY-MM-DD */
  fecha_inicio_inscripcion: string;
  /** YYYY-MM-DD */
  fecha_fin_inscripcion: string;
  max_areas_por_estudiante: number;
  estado: EstadoConvocatoria;
} & Timestamps & { fecha_apertura: string | null };

export type ConvocatoriaArea = {
  id_convocatoria_area: number;
  id_convocatoria: number;
  id_area: number;
  costo_inscripcion: number;
} & Timestamps;

export type ConvocatoriaNivel = {
  id_convocatoria_nivel: number;
  id_convocatoria_area: number;
  id_nivel: number;
  id_grado_min: number;
  id_grado_max: number;
} & Timestamps;

export type UnidadEducativa = {
  id_unidad_educativa: number;
  nombre: string;
  departamento: string;
  provincia: string;
} & Timestamps;

export type TutorLegal = {
  id_tutor_legal: number;
  nombres: string;
  apellidos: string;
  ci: string;
  telefono: string;
  email: string | null;
  parentesco: string;
  es_el_mismo_estudiante: boolean;
} & Timestamps;

export type TutorAcademico = {
  id_tutor_academico: number;
  nombres: string;
  apellidos: string;
  ci: string;
  telefono: string;
  email: string;
} & Timestamps;

export type Estudiante = {
  id_estudiante: number;
  nombres: string;
  apellidos: string;
  ci: string;
  /** YYYY-MM-DD */
  fecha_nacimiento: string;
  email: string | null;
  genero: string;
  telefono: number;
  id_unidad_educativa: number;
  id_grado: number;
  id_tutor_legal: number;
} & Timestamps;

export type ListaInscripcion = { id_lista: number; fecha_creacion: string } & Timestamps;

export type DetalleInscripcion = {
  id_detalle: number;
  id_lista: number;
  id_estudiante: number;
  id_convocatoria_nivel: number;
  id_tutor_academico: number;
  fecha_registro: string;
} & Timestamps;

export type EstadoOrden = 'pendiente' | 'pagada' | 'vencida';

export type OrdenPago = {
  id_orden: number;
  codigo_unico: string;
  tipo_origen: 'lista';
  id_lista: number;
  monto_total: number;
  fecha_emision: string;
  /** YYYY-MM-DD */
  fecha_vencimiento: string;
  estado: EstadoOrden;
} & Timestamps;

export type EncargadoPago = {
  id: number;
  nombres: string;
  apellidos: string;
  ci: string;
  email: string;
  id_lista: number;
} & Timestamps;

export type DatosOcr = {
  ocr_text: string;
  numero_recibo: string;
  fecha_pago: string;
  nombre_pagador: string;
  monto_total: number;
  aclaracion: string;
  codigo_inscripcion_extraido: string;
};

export type ComprobantePago = {
  id_comprobante: number;
  id_orden: number;
  numero_comprobante: string;
  nombre_pagador: string;
  fecha_pago: string;
  monto_pagado: number;
  pdf_url: string | null;
  datos_ocr: DatosOcr;
  estado_verificacion: 'pendiente' | 'verificado' | 'rechazado';
} & Timestamps;

export type Requisito = {
  id: number;
  id_convocatoria: number;
  entidad: string;
  campo: string;
  es_obligatorio: boolean;
} & Timestamps;

export type IntentoLogin = {
  id: number;
  ip_address: string;
  email: string | null;
  successful: boolean;
  user_agent: string;
  /** Epoch en milisegundos. */
  creado: number;
};

export type Db = {
  grados: Grado[];
  areas: Area[];
  niveles: Nivel[];
  convocatorias: Convocatoria[];
  convocatoriaAreas: ConvocatoriaArea[];
  convocatoriaNiveles: ConvocatoriaNivel[];
  unidades: UnidadEducativa[];
  tutoresLegales: TutorLegal[];
  tutoresAcademicos: TutorAcademico[];
  estudiantes: Estudiante[];
  listas: ListaInscripcion[];
  detalles: DetalleInscripcion[];
  ordenes: OrdenPago[];
  encargados: EncargadoPago[];
  comprobantes: ComprobantePago[];
  requisitos: Requisito[];
  intentosLogin: IntentoLogin[];
  /** Archivos de anexo subidos durante la sesión, por id de área. */
  anexos: Map<number, Blob>;
  /** Tokens invalidados con /admin/logout. */
  tokensRevocados: Set<string>;
};

export const db: Db = {
  grados: [],
  areas: [],
  niveles: [],
  convocatorias: [],
  convocatoriaAreas: [],
  convocatoriaNiveles: [],
  unidades: [],
  tutoresLegales: [],
  tutoresAcademicos: [],
  estudiantes: [],
  listas: [],
  detalles: [],
  ordenes: [],
  encargados: [],
  comprobantes: [],
  requisitos: [],
  intentosLogin: [],
  anexos: new Map(),
  tokensRevocados: new Set(),
};

// ---------------------------------------------------------------------------
// Utilidades de acceso
// ---------------------------------------------------------------------------

/** Siguiente id autoincremental de una tabla. */
export const siguienteId = <T>(filas: readonly T[], obtener: (fila: T) => number): number =>
  filas.reduce((max, fila) => Math.max(max, obtener(fila)), 0) + 1;

const marcas = (fecha: Date = new Date()): Timestamps => {
  const iso = isoLaravel(fecha);
  return { created_at: iso, updated_at: iso };
};

/** Actualiza `updated_at` de una fila. */
export const tocar = (fila: Timestamps): void => {
  fila.updated_at = isoLaravel(new Date());
};

export const buscarConvocatoria = (id: number) => db.convocatorias.find((c) => c.id_convocatoria === id);
export const buscarArea = (id: number) => db.areas.find((a) => a.id_area === id);
export const buscarNivel = (id: number) => db.niveles.find((n) => n.id_nivel === id);
export const buscarGrado = (id: number) => db.grados.find((g) => g.id_grado === id);
export const buscarUnidad = (id: number) => db.unidades.find((u) => u.id_unidad_educativa === id);
export const buscarEstudiantePorCi = (ci: string) => db.estudiantes.find((e) => e.ci === ci);
export const buscarOrdenPorCodigo = (codigo: string) => db.ordenes.find((o) => o.codigo_unico === codigo);
export const buscarConvocatoriaNivel = (id: number) =>
  db.convocatoriaNiveles.find((cn) => cn.id_convocatoria_nivel === id);
export const buscarConvocatoriaArea = (id: number) =>
  db.convocatoriaAreas.find((ca) => ca.id_convocatoria_area === id);

export const areasDeConvocatoria = (idConvocatoria: number) =>
  db.convocatoriaAreas.filter((ca) => ca.id_convocatoria === idConvocatoria);

export const nivelesDeConvocatoria = (idConvocatoria: number) => {
  const idsAreas = new Set(areasDeConvocatoria(idConvocatoria).map((ca) => ca.id_convocatoria_area));
  return db.convocatoriaNiveles.filter((cn) => idsAreas.has(cn.id_convocatoria_area));
};

/** Convocatoria a la que pertenece un nivel de convocatoria. */
export const convocatoriaDeNivel = (cn: ConvocatoriaNivel) => buscarConvocatoriaArea(cn.id_convocatoria_area);

export const detallesDeLista = (idLista: number) => db.detalles.filter((d) => d.id_lista === idLista);
export const encargadoDeLista = (idLista: number) => db.encargados.find((e) => e.id_lista === idLista);
/** OrdenPago::where('id_lista', ...)->first() */
export const ordenDeLista = (idLista: number) => db.ordenes.find((o) => o.id_lista === idLista);

/** Momento actual en formato SQL para comparaciones de fecha como las de SQLite. */
export const ahoraSql = (): string => fechaSql(new Date());

// ---------------------------------------------------------------------------
// Reglas de negocio compartidas por los handlers y el seed
// ---------------------------------------------------------------------------

/** Convocatoria::activa(): abierta y dentro del periodo de inscripción. */
export const convocatoriaActiva = (): Convocatoria | undefined => {
  const ahora = ahoraSql();
  return db.convocatorias.find(
    (c) => c.estado === 'abierta' && c.fecha_inicio_inscripcion <= ahora && c.fecha_fin_inscripcion >= ahora,
  );
};

/** Convocatoria abierta más reciente (HomeController / EstadoInscripcionController). */
export const ultimaConvocatoriaAbierta = (): Convocatoria | undefined =>
  [...db.convocatorias].filter((c) => c.estado === 'abierta').sort((a, b) => b.id_convocatoria - a.id_convocatoria)[0];

export type RequisitosApertura = {
  areas_asignadas: boolean;
  niveles_configurados: boolean;
  costos_establecidos: boolean;
  requisitos_faltantes: string[];
};

/** Convocatoria::obtenerRequisitosApertura() */
export const requisitosApertura = (conv: Convocatoria): RequisitosApertura => {
  const areas = areasDeConvocatoria(conv.id_convocatoria);
  const areasAsignadas = areas.length > 0;
  const nivelesConfigurados = nivelesDeConvocatoria(conv.id_convocatoria).length > 0;
  const costosEstablecidos = areas.length > 0 && areas.every((a) => a.costo_inscripcion > 0);
  const faltantes: string[] = [];
  if (!areasAsignadas) faltantes.push('Debe asignar al menos un área de competencia');
  if (!nivelesConfigurados) faltantes.push('Debe configurar niveles y grados para las áreas');
  if (!costosEstablecidos) faltantes.push('Debe establecer costos de inscripción mayores a 0');
  return {
    areas_asignadas: areasAsignadas,
    niveles_configurados: nivelesConfigurados,
    costos_establecidos: costosEstablecidos,
    requisitos_faltantes: faltantes,
  };
};

export const nombreAreaDeNivel = (idConvocatoriaNivel: number): string => {
  const cn = buscarConvocatoriaNivel(idConvocatoriaNivel);
  const ca = cn ? convocatoriaDeNivel(cn) : undefined;
  const area = ca ? buscarArea(ca.id_area) : undefined;
  return area?.nombre_area ?? 'Área Desconocida';
};

export type EstudianteAVerificar = {
  ci: string;
  id_grado: number;
  areas_seleccionadas: { id_convocatoria_nivel: number }[];
};

/** InscripcionCheckerService::checkStudentsForInscripcion() */
export const verificarInscripciones = (
  inscripciones: readonly EstudianteAVerificar[],
  conv: Convocatoria,
): Record<string, string> => {
  const errores: Record<string, string> = {};
  const habilitados = new Set(nivelesDeConvocatoria(conv.id_convocatoria).map((cn) => cn.id_convocatoria_nivel));
  const max = conv.max_areas_por_estudiante;

  for (const inscripcion of inscripciones) {
    const { ci } = inscripcion;
    const nuevas = inscripcion.areas_seleccionadas.length;
    const existente = buscarEstudiantePorCi(ci);
    let previas = 0;

    if (existente) {
      previas = db.detalles.filter(
        (d) => d.id_estudiante === existente.id_estudiante && habilitados.has(d.id_convocatoria_nivel),
      ).length;
      if (existente.id_grado !== inscripcion.id_grado) {
        errores[ci] = `No puede registrar al estudiante con CI ${ci} con un distinto Grado en la misma convocatoria.`;
        continue;
      }
    }

    if (nuevas + previas > max) {
      errores[ci] =
        `El estudiante con CI ${ci} ya tiene ${previas} inscripción(es) previa(s) y está intentando registrar ${nuevas} más, ` +
        `excediendo el máximo de ${max} área(s) permitida(s).`;
      continue;
    }

    for (const { id_convocatoria_nivel } of inscripcion.areas_seleccionadas) {
      const yaInscrito = existente
        ? db.detalles.some(
            (d) => d.id_estudiante === existente.id_estudiante && d.id_convocatoria_nivel === id_convocatoria_nivel,
          )
        : false;
      if (yaInscrito) {
        errores[ci] = `El estudiante con CI ${ci} ya está inscrito en el área '${nombreAreaDeNivel(id_convocatoria_nivel)}'.`;
        break;
      }
    }
  }
  return errores;
};

export type DatosTutorAcademico = {
  id_convocatoria_nivel?: number | null;
  nombres?: string | null;
  apellidos?: string | null;
  ci?: string | null;
  telefono?: string | null;
  email?: string | null;
};

export type DatosEstudianteInscripcion = {
  nombres: string;
  apellidos: string;
  ci: string;
  genero?: string | null;
  fecha_nacimiento: string;
  email?: string | null;
  id_grado: number;
  telefono?: string | null;
  unidad_educativa: {
    id_unidad_educativa?: number | null;
    nombre?: string | null;
    departamento?: string | null;
    provincia?: string | null;
  };
  tutor_legal: {
    nombres: string;
    apellidos: string;
    ci: string;
    telefono?: string | null;
    email?: string | null;
    parentesco?: string | null;
    es_el_mismo_estudiante: boolean;
  };
  areas_seleccionadas: { id_convocatoria_nivel: number }[];
  tutores_academicos?: DatosTutorAcademico[];
};

export type DatosInscripcion = {
  lista_inscripcion: DatosEstudianteInscripcion[];
  codigo_unico: string;
  encargado_pago: {
    nombres_encargado: string;
    apellidos_encargado: string;
    ci_encargado: string;
    email_encargado: string;
  };
};

const upsertUnidad = (datos: DatosEstudianteInscripcion['unidad_educativa'], ts: Timestamps): number => {
  if (datos.id_unidad_educativa) return datos.id_unidad_educativa;
  const nombre = datos.nombre || 'Colegio Desconocido';
  const departamento = datos.departamento || 'No Especificado';
  const provincia = datos.provincia || 'No Especificado';
  const existente = db.unidades.find(
    (u) => u.nombre === nombre && u.departamento === departamento && u.provincia === provincia,
  );
  if (existente) return existente.id_unidad_educativa;
  const nueva: UnidadEducativa = {
    id_unidad_educativa: siguienteId(db.unidades, (u) => u.id_unidad_educativa),
    nombre,
    departamento,
    provincia,
    ...ts,
  };
  db.unidades.push(nueva);
  return nueva.id_unidad_educativa;
};

const upsertTutorLegal = (datos: DatosEstudianteInscripcion['tutor_legal'], ts: Timestamps): TutorLegal => {
  const valores = {
    nombres: datos.nombres,
    apellidos: datos.apellidos,
    ci: datos.ci,
    telefono: datos.telefono || 'Sin Teléfono',
    email: datos.email || 'tutor.sin.email@olimpia.test',
    parentesco: datos.parentesco || 'No Especificado',
    es_el_mismo_estudiante: datos.es_el_mismo_estudiante,
  };
  const existente = db.tutoresLegales.find((t) => t.ci === datos.ci);
  if (existente) {
    Object.assign(existente, valores, { updated_at: ts.updated_at });
    return existente;
  }
  const nuevo: TutorLegal = { id_tutor_legal: siguienteId(db.tutoresLegales, (t) => t.id_tutor_legal), ...valores, ...ts };
  db.tutoresLegales.push(nuevo);
  return nuevo;
};

const upsertEstudiante = (
  datos: DatosEstudianteInscripcion,
  idUnidad: number,
  idTutor: number,
  ts: Timestamps,
): Estudiante => {
  const valores = {
    nombres: datos.nombres,
    apellidos: datos.apellidos,
    genero: datos.genero || 'No Especificado',
    fecha_nacimiento: datos.fecha_nacimiento.slice(0, 10),
    id_unidad_educativa: idUnidad,
    id_grado: datos.id_grado,
    id_tutor_legal: idTutor,
    email: datos.email || 'estudiante.no.tiene.correo@olimpia.test',
    telefono: Number.parseInt(datos.telefono || '0', 10) || 0,
  };
  const existente = buscarEstudiantePorCi(datos.ci);
  if (existente) {
    Object.assign(existente, valores, { updated_at: ts.updated_at });
    return existente;
  }
  const nuevo: Estudiante = {
    id_estudiante: siguienteId(db.estudiantes, (e) => e.id_estudiante),
    ci: datos.ci,
    ...valores,
    ...ts,
  };
  db.estudiantes.push(nuevo);
  return nuevo;
};

const upsertTutorAcademico = (
  tutores: readonly DatosTutorAcademico[],
  idConvocatoriaNivel: number,
  ts: Timestamps,
): TutorAcademico => {
  const datos = tutores.find((t) => t.id_convocatoria_nivel === idConvocatoriaNivel);
  const valores = {
    nombres: datos?.nombres || 'Sin Nombre Asignado',
    apellidos: datos?.apellidos || 'Sin Apellido Asignado',
    ci: datos?.ci || 'SN',
    telefono: datos?.telefono || 'No Registrado',
    email: datos?.email || 'tutoracademico.no.email@olimpia.test',
  };
  const existente = db.tutoresAcademicos.find((t) => t.ci === valores.ci);
  if (existente) {
    Object.assign(existente, valores, { updated_at: ts.updated_at });
    return existente;
  }
  const nuevo: TutorAcademico = {
    id_tutor_academico: siguienteId(db.tutoresAcademicos, (t) => t.id_tutor_academico),
    ...valores,
    ...ts,
  };
  db.tutoresAcademicos.push(nuevo);
  return nuevo;
};

export type ResultadoInscripcion = { lista: ListaInscripcion; orden: OrdenPago; encargado: EncargadoPago };

/** InscripcionService::processInscripcion() (la verificación previa la hace el llamador). */
export const registrarInscripcion = (datos: DatosInscripcion, fecha: Date = new Date()): ResultadoInscripcion => {
  const ts = marcas(fecha);
  const lista: ListaInscripcion = {
    id_lista: siguienteId(db.listas, (l) => l.id_lista),
    fecha_creacion: ts.created_at,
    ...ts,
  };
  db.listas.push(lista);

  let montoTotal = 0;
  for (const estudianteDatos of datos.lista_inscripcion) {
    const idUnidad = upsertUnidad(estudianteDatos.unidad_educativa, ts);
    const tutor = upsertTutorLegal(estudianteDatos.tutor_legal, ts);
    const estudiante = upsertEstudiante(estudianteDatos, idUnidad, tutor.id_tutor_legal, ts);

    for (const { id_convocatoria_nivel } of estudianteDatos.areas_seleccionadas) {
      const tutorAcademico = upsertTutorAcademico(estudianteDatos.tutores_academicos ?? [], id_convocatoria_nivel, ts);
      db.detalles.push({
        id_detalle: siguienteId(db.detalles, (d) => d.id_detalle),
        id_lista: lista.id_lista,
        id_estudiante: estudiante.id_estudiante,
        id_convocatoria_nivel,
        id_tutor_academico: tutorAcademico.id_tutor_academico,
        fecha_registro: ts.created_at,
        ...ts,
      });
      const cn = buscarConvocatoriaNivel(id_convocatoria_nivel);
      const ca = cn ? convocatoriaDeNivel(cn) : undefined;
      montoTotal += ca?.costo_inscripcion ?? 0;
    }
  }

  const orden: OrdenPago = {
    id_orden: siguienteId(db.ordenes, (o) => o.id_orden),
    codigo_unico: datos.codigo_unico,
    tipo_origen: 'lista',
    id_lista: lista.id_lista,
    monto_total: montoTotal,
    fecha_emision: ts.created_at,
    fecha_vencimiento: soloFecha(sumarDias(fecha, 5)),
    estado: 'pendiente',
    ...ts,
  };
  db.ordenes.push(orden);

  const encargado: EncargadoPago = {
    id: siguienteId(db.encargados, (e) => e.id),
    id_lista: lista.id_lista,
    nombres: datos.encargado_pago.nombres_encargado,
    apellidos: datos.encargado_pago.apellidos_encargado,
    ci: datos.encargado_pago.ci_encargado,
    email: datos.encargado_pago.email_encargado,
    ...ts,
  };
  db.encargados.push(encargado);

  return { lista, orden, encargado };
};

/** Nombre del responsable de pago de una orden (OrdenPago::getNombreResponsablePago). */
export const responsableDePago = (orden: OrdenPago): string | null => {
  const encargado = encargadoDeLista(orden.id_lista);
  return encargado ? `${encargado.nombres} ${encargado.apellidos}`.trim() : null;
};

/** Registra un comprobante verificado y marca la orden como pagada. */
export const registrarPago = (orden: OrdenPago, pdfUrl: string | null, fecha: Date = new Date()): ComprobantePago => {
  const ts = marcas(fecha);
  const pagador = responsableDePago(orden) ?? 'Pagador Desconocido';
  const numero = String(4500000 + orden.id_orden * 137);
  const aclaracion = `Inscripción ${orden.codigo_unico}`;
  const comprobante: ComprobantePago = {
    id_comprobante: siguienteId(db.comprobantes, (c) => c.id_comprobante),
    id_orden: orden.id_orden,
    numero_comprobante: numero,
    nombre_pagador: pagador,
    fecha_pago: ts.created_at,
    monto_pagado: orden.monto_total,
    pdf_url: pdfUrl,
    datos_ocr: {
      ocr_text: `RECIBO N° ${numero}\nNOMBRE: ${pagador.toUpperCase()}\nACLARACIÓN: ${aclaracion}\nTOTAL: ${orden.monto_total.toFixed(2)}`,
      numero_recibo: numero,
      fecha_pago: fechaSql(fecha),
      nombre_pagador: pagador.toUpperCase(),
      monto_total: orden.monto_total,
      aclaracion,
      codigo_inscripcion_extraido: orden.codigo_unico,
    },
    estado_verificacion: 'verificado',
    ...ts,
  };
  db.comprobantes.push(comprobante);
  orden.estado = 'pagada';
  orden.updated_at = ts.updated_at;
  return comprobante;
};

// ---------------------------------------------------------------------------
// Datos iniciales
// ---------------------------------------------------------------------------

/** Fecha de hoy a medianoche UTC desplazada `dias` y `horas`. */
const dia = (hoy: Date, dias: number, horas = 0): Date => {
  const base = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()));
  return new Date(sumarDias(base, dias).getTime() + horas * 60 * 60 * 1000);
};

const sembrarCatalogos = (hoy: Date): void => {
  const ts = marcas(dia(hoy, -420, 12));
  db.grados = GRADOS_SEED.map((nombre, i) => ({ id_grado: i + 1, nombre_grado: nombre, orden: i + 1, ...ts }));
  db.areas = AREAS_SEED.map((a, i) => ({
    id_area: i + 1,
    nombre_area: a.nombre,
    descripcion: a.descripcion,
    anexo: null,
    ...ts,
  }));
  db.niveles = NIVELES_SEED.map((nombre, i) => ({ id_nivel: i + 1, nombre_nivel: nombre, ...ts }));
};

const idAreaPorNombre = (nombre: string): number => {
  const area = db.areas.find((a) => a.nombre_area === nombre);
  if (!area) throw new Error(`Área de seed desconocida: ${nombre}`);
  return area.id_area;
};

const idNivelPorNombre = (nombre: string): number => {
  const nivel = db.niveles.find((n) => n.nombre_nivel === nombre);
  if (!nivel) throw new Error(`Nivel de seed desconocido: ${nombre}`);
  return nivel.id_nivel;
};

const sembrarConvocatorias = (hoy: Date): Map<ConvocatoriaSeed['clave'], Convocatoria> => {
  const porClave = new Map<ConvocatoriaSeed['clave'], Convocatoria>();
  const anio = hoy.getUTCFullYear();

  for (const seed of CONVOCATORIAS_SEED) {
    const ts = marcas(dia(hoy, seed.creada, 13));
    const conv: Convocatoria = {
      id_convocatoria: siguienteId(db.convocatorias, (c) => c.id_convocatoria),
      nombre: seed.nombre(anio),
      fecha_inicio_inscripcion: soloFecha(dia(hoy, seed.inicio)),
      fecha_fin_inscripcion: soloFecha(dia(hoy, seed.fin)),
      max_areas_por_estudiante: seed.maxAreas,
      estado: seed.estado,
      ...ts,
      fecha_apertura: seed.apertura === null ? null : isoLaravel(dia(hoy, seed.apertura, 8)),
    };
    db.convocatorias.push(conv);
    porClave.set(seed.clave, conv);

    for (const areaSeed of seed.areas) {
      const ca: ConvocatoriaArea = {
        id_convocatoria_area: siguienteId(db.convocatoriaAreas, (x) => x.id_convocatoria_area),
        id_convocatoria: conv.id_convocatoria,
        id_area: idAreaPorNombre(areaSeed.area),
        costo_inscripcion: areaSeed.costo,
        ...ts,
      };
      db.convocatoriaAreas.push(ca);
      for (const nivelSeed of areaSeed.niveles) {
        db.convocatoriaNiveles.push({
          id_convocatoria_nivel: siguienteId(db.convocatoriaNiveles, (x) => x.id_convocatoria_nivel),
          id_convocatoria_area: ca.id_convocatoria_area,
          id_nivel: idNivelPorNombre(nivelSeed.nivel),
          id_grado_min: nivelSeed.gradoMin,
          id_grado_max: nivelSeed.gradoMax,
          ...ts,
        });
      }
    }
  }

  const actual = porClave.get('actual');
  if (actual) {
    for (const nombreArea of ANEXOS_SEED) {
      const area = buscarArea(idAreaPorNombre(nombreArea));
      if (area) {
        const archivo = nombreArea.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
        area.anexo = `public/anexo/${actual.id_convocatoria}/${area.id_area}/bases-${archivo}.pdf`;
      }
    }
  }

  const planificada = porClave.get('planificada');
  if (planificada) {
    const ts = marcas(dia(hoy, -2, 15));
    for (const req of REQUISITOS_SEED) {
      db.requisitos.push({
        id: siguienteId(db.requisitos, (r) => r.id),
        id_convocatoria: planificada.id_convocatoria,
        entidad: req.entidad,
        campo: req.campo,
        es_obligatorio: true,
        ...ts,
      });
    }
  }
  return porClave;
};

/** Nivel de la convocatoria que corresponde al área y al grado del estudiante. */
const nivelParaGrado = (conv: Convocatoria, nombreArea: string, idGrado: number): number => {
  const idArea = idAreaPorNombre(nombreArea);
  const ca = areasDeConvocatoria(conv.id_convocatoria).find((x) => x.id_area === idArea);
  const cn = db.convocatoriaNiveles.find(
    (x) => x.id_convocatoria_area === ca?.id_convocatoria_area && x.id_grado_min <= idGrado && x.id_grado_max >= idGrado,
  );
  if (!cn) throw new Error(`Sin nivel para ${nombreArea} y grado ${idGrado}`);
  return cn.id_convocatoria_nivel;
};

const sembrarInscripciones = (hoy: Date, convocatorias: Map<ConvocatoriaSeed['clave'], Convocatoria>): void => {
  const secuencias = new Map<number, number>();

  LISTAS_SEED.forEach((listaSeed, indice) => {
    const conv = convocatorias.get(listaSeed.convocatoria);
    if (!conv) return;
    const fecha = dia(hoy, listaSeed.dia, 9 + (indice % 9));
    const anio = Number(conv.fecha_inicio_inscripcion.slice(0, 4));
    const secuencia = (secuencias.get(anio) ?? 0) + 1;
    secuencias.set(anio, secuencia);

    const origen = listaSeed.encargado;
    const encargado =
      'docente' in origen
        ? DOCENTES_SEED.find((d) => d.ci === origen.docente)
        : ESTUDIANTES_SEED.find((e) => e.ci === origen.tutorDe)?.tutor;
    if (!encargado) return;

    const lista: DatosEstudianteInscripcion[] = listaSeed.estudiantes.map((inscrito) => {
      const est = ESTUDIANTES_SEED.find((x) => x.ci === inscrito.ci);
      if (!est) throw new Error(`Estudiante de seed desconocido: ${inscrito.ci}`);
      const unidad = UNIDADES_SEED[est.unidad];
      const niveles = inscrito.areas.map((area) => nivelParaGrado(conv, area, est.grado));
      const docente = DOCENTES_SEED.find((d) => d.ci === inscrito.tutorAcademico);
      const anioNacimiento = anio - 5 - est.grado;
      return {
        nombres: est.nombres,
        apellidos: est.apellidos,
        ci: est.ci,
        genero: est.genero,
        fecha_nacimiento: `${anioNacimiento}-${est.nacimiento}`,
        email: correoFicticio(est.nombres, est.apellidos, 'estudiantes.olimpia.test'),
        id_grado: est.grado,
        telefono: est.telefono,
        unidad_educativa: { nombre: unidad.nombre, departamento: unidad.departamento, provincia: unidad.provincia },
        tutor_legal: {
          ...est.tutor,
          email: correoFicticio(est.tutor.nombres, est.tutor.apellidos, 'familias.olimpia.test'),
          es_el_mismo_estudiante: false,
        },
        areas_seleccionadas: niveles.map((id) => ({ id_convocatoria_nivel: id })),
        tutores_academicos: docente
          ? niveles.map((id) => ({
              id_convocatoria_nivel: id,
              nombres: docente.nombres,
              apellidos: docente.apellidos,
              ci: docente.ci,
              telefono: docente.telefono,
              email: correoFicticio(docente.nombres, docente.apellidos, 'docentes.olimpia.test'),
            }))
          : [],
      };
    });

    const { orden } = registrarInscripcion(
      {
        lista_inscripcion: lista,
        codigo_unico: `OLP-${anio}-${String(secuencia).padStart(5, '0')}`,
        encargado_pago: {
          nombres_encargado: encargado.nombres,
          apellidos_encargado: encargado.apellidos,
          ci_encargado: encargado.ci,
          email_encargado: correoFicticio(encargado.nombres, encargado.apellidos, 'correo.olimpia.test'),
        },
      },
      fecha,
    );

    if (listaSeed.estado === 'pagada') {
      registrarPago(orden, null, sumarMinutos(fecha, 26 * 60 + indice * 7));
    }
  });
};

const sembrarIntentosLogin = (hoy: Date): void => {
  db.intentosLogin = [...INTENTOS_LOGIN_SEED]
    .sort((a, b) => b.minutos - a.minutos)
    .map((intento, i) => ({
      id: i + 1,
      ip_address: intento.ip,
      email: intento.email,
      successful: intento.exitoso,
      user_agent: AGENTES[intento.agente],
      creado: sumarMinutos(hoy, -intento.minutos).getTime(),
    }));
};

/** Carga los datos ficticios. Se ejecuta una vez al iniciar la demo. */
export const sembrar = (hoy: Date = new Date()): void => {
  sembrarCatalogos(hoy);
  const convocatorias = sembrarConvocatorias(hoy);
  sembrarInscripciones(hoy, convocatorias);
  sembrarIntentosLogin(hoy);
};
