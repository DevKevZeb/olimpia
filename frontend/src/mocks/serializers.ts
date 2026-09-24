/**
 * Serialización de filas con la misma forma que el backend: `toArray()` de los
 * modelos Eloquent (con casts de fecha) y los API Resources de app/Http/Resources.
 */
import {
  buscarArea,
  type Area,
  type ComprobantePago,
  type Convocatoria,
  type ConvocatoriaArea,
  type Grado,
  type Nivel,
  type OrdenPago,
  type Requisito,
  type UnidadEducativa,
  areasDeConvocatoria,
} from './db';
import { fechaCast } from './utils/fechas';

// --- Modelos (toArray) ---

export const modeloArea = (a: Area) => ({
  id_area: a.id_area,
  nombre_area: a.nombre_area,
  descripcion: a.descripcion,
  anexo: a.anexo,
  created_at: a.created_at,
  updated_at: a.updated_at,
});

export const modeloNivel = (n: Nivel) => ({ ...n });

export const modeloGrado = (g: Grado) => ({ ...g });

export const modeloConvocatoria = (c: Convocatoria) => ({
  id_convocatoria: c.id_convocatoria,
  nombre: c.nombre,
  fecha_inicio_inscripcion: fechaCast(c.fecha_inicio_inscripcion),
  fecha_fin_inscripcion: fechaCast(c.fecha_fin_inscripcion),
  max_areas_por_estudiante: c.max_areas_por_estudiante,
  estado: c.estado,
  created_at: c.created_at,
  updated_at: c.updated_at,
  fecha_apertura: c.fecha_apertura,
});

/** ConvocatoriaArea con la relación `area` cargada. */
export const modeloConvocatoriaArea = (ca: ConvocatoriaArea) => {
  const area = buscarArea(ca.id_area);
  return {
    id_convocatoria_area: ca.id_convocatoria_area,
    id_convocatoria: ca.id_convocatoria,
    id_area: ca.id_area,
    costo_inscripcion: ca.costo_inscripcion,
    created_at: ca.created_at,
    updated_at: ca.updated_at,
    area: area ? modeloArea(area) : null,
  };
};

/** Convocatoria::with(['areas.area']) */
export const modeloConvocatoriaConAreas = (c: Convocatoria) => ({
  ...modeloConvocatoria(c),
  areas: areasDeConvocatoria(c.id_convocatoria).map(modeloConvocatoriaArea),
});

// --- API Resources ---

export const recursoConvocatoria = (c: Convocatoria) => ({
  id: c.id_convocatoria,
  nombre: c.nombre,
  fecha_inicio_inscripcion: fechaCast(c.fecha_inicio_inscripcion),
  fecha_fin_inscripcion: fechaCast(c.fecha_fin_inscripcion),
  max_areas_por_estudiante: c.max_areas_por_estudiante,
  estado: c.estado,
  created_at: c.created_at,
  updated_at: c.updated_at,
});

export const recursoGrado = (g: Grado) => ({
  id: g.id_grado,
  nombre_grado: g.nombre_grado,
  orden: g.orden,
  created_at: g.created_at,
  updated_at: g.updated_at,
});

export const recursoArea = (a: Area) => ({
  id: a.id_area,
  nombre: a.nombre_area,
  descripcion: a.descripcion,
  created_at: a.created_at,
  updated_at: a.updated_at,
});

export const recursoNivel = (n: Nivel) => ({
  id: n.id_nivel,
  nombre_nivel: n.nombre_nivel,
  created_at: n.created_at,
  updated_at: n.updated_at,
});

export const recursoUnidad = (u: UnidadEducativa) => ({
  id: u.id_unidad_educativa,
  nombre: u.nombre,
  departamento: u.departamento,
  provincia: u.provincia,
  created_at: u.created_at,
  updated_at: u.updated_at,
});

/** RequisitoConvocatoriaResource lee `id_requisito`, que no existe en la tabla: el id sale null. */
export const recursoRequisito = (r: Requisito) => ({
  id: null,
  id_convocatoria: r.id_convocatoria,
  entidad: r.entidad,
  campo: r.campo,
  es_obligatorio: r.es_obligatorio,
});

export const recursoOrden = (o: OrdenPago) => ({
  id: o.id_orden,
  codigo_unico: o.codigo_unico,
  tipo_origen: o.tipo_origen,
  id_lista: o.id_lista,
  monto_total: o.monto_total,
  fecha_emision: o.fecha_emision,
  fecha_vencimiento: fechaCast(o.fecha_vencimiento),
  estado: o.estado,
  created_at: o.created_at,
  updated_at: o.updated_at,
});

/** ComprobantePagoResource con la relación `orden` cargada. */
export const recursoComprobante = (c: ComprobantePago, orden: OrdenPago) => ({
  id: c.id_comprobante,
  id_orden: c.id_orden,
  numero_comprobante: c.numero_comprobante,
  nombre_pagador: c.nombre_pagador,
  fecha_pago: c.fecha_pago,
  // cast decimal:2
  monto_pagado: c.monto_pagado.toFixed(2),
  pdf_url: c.pdf_url,
  datos_ocr: c.datos_ocr,
  estado_verificacion: c.estado_verificacion,
  orden: recursoOrden(orden),
  created_at: c.created_at,
  updated_at: c.updated_at,
});
