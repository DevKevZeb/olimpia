import { http } from 'msw';
import {
  ahoraSql,
  areasDeConvocatoria,
  buscarArea,
  buscarConvocatoria,
  buscarGrado,
  buscarNivel,
  convocatoriaDeNivel,
  db,
  requisitosApertura,
  siguienteId,
  tocar,
  type Convocatoria,
  type ConvocatoriaArea,
  type EstadoConvocatoria,
} from '../db';
import { modeloArea, modeloConvocatoria, modeloConvocatoriaConAreas, modeloGrado, modeloNivel } from '../serializers';
import { requiereAdmin } from '../utils/auth';
import { aFechaYmd, ahoraLaravel, esFechaValida, etiquetaMes, fechaCast, soloFecha, sumarDias } from '../utils/fechas';
import {
  error,
  errorServidor,
  esRegistro,
  leerObjeto,
  mensajes,
  noEncontrado,
  numero,
  ok,
  presente,
  texto,
  Validador,
} from '../utils/http';

/**
 * Panel de administración: dashboard, convocatorias (creación, áreas, niveles,
 * costos, estados), ampliación de fecha y catálogos del panel.
 */

const TRANSICIONES: Record<EstadoConvocatoria, EstadoConvocatoria[]> = {
  planificada: ['abierta'],
  abierta: ['cerrada'],
  cerrada: ['finalizada'],
  finalizada: [],
};

const TRANSICIONES_UI: Record<EstadoConvocatoria, { estado: string; label: string; requiere_validacion: boolean }[]> = {
  planificada: [{ estado: 'abierta', label: 'Abrir Convocatoria', requiere_validacion: true }],
  abierta: [],
  cerrada: [{ estado: 'finalizada', label: 'Finalizar Convocatoria', requiere_validacion: false }],
  finalizada: [],
};

const esEstado = (valor: string): valor is EstadoConvocatoria => valor in TRANSICIONES;

const porEstados = (estados: EstadoConvocatoria[]) => db.convocatorias.filter((c) => estados.includes(c.estado));

/** Convocatoria::transicionarEstado() */
const transicionar = (conv: Convocatoria, nuevo: EstadoConvocatoria) => {
  if (!TRANSICIONES[conv.estado].includes(nuevo)) {
    return { success: false as const, message: `No se puede cambiar de '${conv.estado}' a '${nuevo}'`, faltantes: undefined };
  }
  if (nuevo === 'abierta') {
    const requisitos = requisitosApertura(conv);
    if (requisitos.requisitos_faltantes.length > 0) {
      return {
        success: false as const,
        message: 'No se cumplen los requisitos para abrir la convocatoria',
        faltantes: requisitos.requisitos_faltantes,
      };
    }
    conv.fecha_apertura = ahoraLaravel();
  }
  conv.estado = nuevo;
  tocar(conv);
  return { success: true as const, message: `Estado actualizado a '${nuevo}' exitosamente`, faltantes: undefined };
};

const nivelesAsignados = (idConvocatoria: number, idArea: number | null) =>
  areasDeConvocatoria(idConvocatoria)
    .filter((ca) => idArea === null || ca.id_area === idArea)
    .flatMap((ca) => db.convocatoriaNiveles.filter((cn) => cn.id_convocatoria_area === ca.id_convocatoria_area))
    .sort((a, b) => a.id_convocatoria_nivel - b.id_convocatoria_nivel)
    .map((cn) => {
      const ca = convocatoriaDeNivel(cn);
      return {
        id_convocatoria_nivel: cn.id_convocatoria_nivel,
        id_convocatoria_area: cn.id_convocatoria_area,
        id_area: ca?.id_area ?? null,
        nombre_area: ca ? (buscarArea(ca.id_area)?.nombre_area ?? null) : null,
        id_nivel: cn.id_nivel,
        nombre_nivel: buscarNivel(cn.id_nivel)?.nombre_nivel ?? null,
        id_grado_min: cn.id_grado_min,
        nombre_grado_min: buscarGrado(cn.id_grado_min)?.nombre_grado ?? null,
        id_grado_max: cn.id_grado_max,
        nombre_grado_max: buscarGrado(cn.id_grado_max)?.nombre_grado ?? null,
      };
    });

/** AdminDashboardService::inscripcionesPorMes() (últimos 6 meses). */
const inscripcionesPorMes = () => {
  const desde = sumarDias(new Date(), -183).toISOString();
  const grupos = new Map<string, number>();
  [...db.detalles]
    .filter((d) => d.fecha_registro >= desde)
    .sort((a, b) => a.fecha_registro.localeCompare(b.fecha_registro))
    .forEach((d) => grupos.set(d.fecha_registro.slice(0, 7), (grupos.get(d.fecha_registro.slice(0, 7)) ?? 0) + 1));
  return [...grupos].map(([mes, total]) => ({
    mes: etiquetaMes(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)) - 1),
    total,
  }));
};

const inscripcionesPorArea = () => {
  const conteo = new Map<string, number>();
  for (const d of db.detalles) {
    const cn = db.convocatoriaNiveles.find((x) => x.id_convocatoria_nivel === d.id_convocatoria_nivel);
    const ca = cn ? convocatoriaDeNivel(cn) : undefined;
    const nombre = ca ? buscarArea(ca.id_area)?.nombre_area : undefined;
    if (nombre) conteo.set(nombre, (conteo.get(nombre) ?? 0) + 1);
  }
  return [...conteo]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([nombre_area, total]) => ({ nombre_area, total }));
};

/** AdminConvocatoriaControllerRefactored::getNivelesPorConvocatoria() */
const respuestaNiveles = (id: string, area: string | null) => {
  const conv = buscarConvocatoria(Number(id));
  if (!conv) return noEncontrado('Convocatoria no encontrada');
  const idArea = area ? Number(area) || null : null;
  return ok(nivelesAsignados(conv.id_convocatoria, idArea), 'Niveles asignados a la convocatoria obtenidos correctamente');
};

const sumaOrdenes = (estado: string) =>
  db.ordenes.filter((o) => o.estado === estado).reduce((total, o) => total + o.monto_total, 0);

export const adminHandlers = [
  // --- Catálogos del panel (públicos, los usa también la inscripción por Excel) ---
  http.get('*/api/v1/admin/convocatorias-activas', () =>
    ok(porEstados(['planificada', 'abierta']).map(modeloConvocatoriaConAreas), 'Convocatorias activas obtenidas correctamente'),
  ),

  http.get('*/api/v1/admin/grados', () =>
    ok([...db.grados].sort((a, b) => a.orden - b.orden).map(modeloGrado), 'Grados obtenidos correctamente'),
  ),

  http.get<{ id: string }>('*/api/v1/admin/convocatorias/:id/areas', ({ params }) => {
    const conv = buscarConvocatoria(Number(params.id));
    if (!conv) return noEncontrado('Convocatoria no encontrada');
    const areas = areasDeConvocatoria(conv.id_convocatoria).map((ca) => ({
      id_convocatoria_area: ca.id_convocatoria_area,
      id_area: ca.id_area,
      nombre_area: buscarArea(ca.id_area)?.nombre_area ?? null,
      costo_inscripcion: ca.costo_inscripcion,
    }));
    return ok(areas, 'Áreas de la convocatoria obtenidas correctamente');
  }),

  http.get<{ id: string }>('*/api/v1/admin/convocatorias/:id/niveles', ({ params }) => respuestaNiveles(params.id, null)),

  http.get<{ id: string; area: string }>('*/api/v1/admin/convocatorias/:id/niveles/:area', ({ params }) =>
    respuestaNiveles(params.id, params.area),
  ),

  // --- Rutas protegidas ---
  http.get('*/api/v1/admin/dashboard-data', ({ request }) => {
    const denegado = requiereAdmin(request);
    if (denegado) return denegado;
    return ok(
      {
        estadisticas: {
          total_convocatorias: db.convocatorias.length,
          total_areas: db.areas.length,
          total_niveles: db.niveles.length,
          total_estudiantes: db.estudiantes.length,
          total_inscripciones: db.detalles.length,
          ingresos_pendientes: sumaOrdenes('pendiente'),
          ingresos_pagados: sumaOrdenes('pagada'),
        },
        convocatorias_activas: porEstados(['abierta', 'planificada'])
          .sort((a, b) => a.id_convocatoria - b.id_convocatoria)
          .map(modeloConvocatoriaConAreas),
        inscripciones_por_area: inscripcionesPorArea(),
        inscripciones_por_mes: inscripcionesPorMes(),
      },
      'Datos del dashboard obtenidos correctamente',
    );
  }),

  http.get('*/api/v1/admin/convocatorias', ({ request }) => {
    const denegado = requiereAdmin(request);
    if (denegado) return denegado;
    const todas = [...db.convocatorias].sort(
      (a, b) => b.created_at.localeCompare(a.created_at) || b.id_convocatoria - a.id_convocatoria,
    );
    return ok(todas.map(modeloConvocatoriaConAreas), 'Todas las convocatorias obtenidas correctamente');
  }),

  http.get('*/api/v1/admin/convocatorias-planificadas', ({ request }) => {
    const denegado = requiereAdmin(request);
    if (denegado) return denegado;
    return ok(porEstados(['planificada']).map(modeloConvocatoriaConAreas), 'Convocatorias planificadas obtenidas correctamente');
  }),

  http.get('*/api/v1/admin/areas-competencia', ({ request }) => {
    const denegado = requiereAdmin(request);
    if (denegado) return denegado;
    return ok(db.areas.map(modeloArea), 'Áreas de competencia obtenidas correctamente');
  }),

  http.get('*/api/v1/admin/niveles-categoria', ({ request }) => {
    const denegado = requiereAdmin(request);
    if (denegado) return denegado;
    return ok(db.niveles.map(modeloNivel), 'Niveles de categoría obtenidos correctamente');
  }),

  http.post('*/api/v1/admin/convocatorias', async ({ request }) => {
    const denegado = requiereAdmin(request);
    if (denegado) return denegado;

    const cuerpo = await leerObjeto(request);
    const nombre = texto(cuerpo.nombre);
    const inicio = cuerpo.fecha_inicio_inscripcion;
    const fin = cuerpo.fecha_fin_inscripcion;
    const maxAreas = numero(cuerpo.max_areas_por_estudiante);

    const v = new Validador();
    if (!presente(nombre) || nombre === null) v.agregar('nombre', 'El nombre de la convocatoria es obligatorio.');
    else if (nombre.length > 100) v.agregar('nombre', 'El nombre no puede exceder 100 caracteres.');
    if (!presente(inicio)) v.agregar('fecha_inicio_inscripcion', 'La fecha de inicio de inscripción es obligatoria.');
    else if (!esFechaValida(inicio)) v.agregar('fecha_inicio_inscripcion', 'La fecha de inicio debe ser una fecha válida.');
    if (!presente(fin)) v.agregar('fecha_fin_inscripcion', 'La fecha de fin de inscripción es obligatoria.');
    else if (!esFechaValida(fin)) v.agregar('fecha_fin_inscripcion', 'La fecha de fin debe ser una fecha válida.');
    else if (esFechaValida(inicio) && aFechaYmd(fin) < aFechaYmd(inicio)) {
      v.agregar('fecha_fin_inscripcion', 'La fecha de fin debe ser igual o posterior a la fecha de inicio.');
    }
    if (!presente(cuerpo.max_areas_por_estudiante)) {
      v.agregar('max_areas_por_estudiante', 'El máximo de áreas por estudiante es obligatorio.');
    } else if (maxAreas === null || !Number.isInteger(maxAreas)) {
      v.agregar('max_areas_por_estudiante', 'El máximo de áreas debe ser un número entero.');
    } else if (maxAreas < 1) {
      v.agregar('max_areas_por_estudiante', 'El máximo de áreas debe ser al menos 1.');
    }
    if (v.falla || nombre === null || !esFechaValida(inicio) || !esFechaValida(fin) || maxAreas === null) {
      return v.respuesta();
    }

    const ahora = ahoraLaravel();
    const conv: Convocatoria = {
      id_convocatoria: siguienteId(db.convocatorias, (c) => c.id_convocatoria),
      nombre,
      fecha_inicio_inscripcion: aFechaYmd(inicio),
      fecha_fin_inscripcion: aFechaYmd(fin),
      max_areas_por_estudiante: maxAreas,
      estado: 'planificada',
      created_at: ahora,
      updated_at: ahora,
      fecha_apertura: null,
    };
    db.convocatorias.push(conv);
    return ok(
      {
        id_convocatoria: conv.id_convocatoria,
        nombre: conv.nombre,
        estado: conv.estado,
        fecha_inicio_inscripcion: fechaCast(conv.fecha_inicio_inscripcion),
        fecha_fin_inscripcion: fechaCast(conv.fecha_fin_inscripcion),
      },
      'Convocatoria creada correctamente',
      201,
    );
  }),

  http.post('*/api/v1/admin/convocatorias/asociar-areas', async ({ request }) => {
    const denegado = requiereAdmin(request);
    if (denegado) return denegado;

    const cuerpo = await leerObjeto(request);
    const idConvocatoria = numero(cuerpo.id_convocatoria);
    const areas = Array.isArray(cuerpo.areas) ? cuerpo.areas : null;
    const v = new Validador();
    if (!presente(cuerpo.id_convocatoria)) v.agregar('id_convocatoria', 'El ID de la convocatoria es obligatorio.');
    else if (idConvocatoria === null || !buscarConvocatoria(idConvocatoria)) {
      v.agregar('id_convocatoria', 'La convocatoria especificada no existe.');
    }
    if (!presente(cuerpo.areas)) v.agregar('areas', 'Debe proporcionar al menos un área.');
    else if (!areas) v.agregar('areas', 'Las áreas deben ser un arreglo.');
    const filas = (areas ?? []).map((item) => (esRegistro(item) ? item : {}));
    filas.forEach((fila, i) => {
      const idArea = numero(fila.id_area);
      if (!presente(fila.id_area)) v.agregar(`areas.${i}.id_area`, 'El ID del área es obligatorio.');
      else if (idArea === null || !buscarArea(idArea)) v.agregar(`areas.${i}.id_area`, 'Una de las áreas especificadas no existe.');
      if (presente(fila.costo_inscripcion)) {
        const costo = numero(fila.costo_inscripcion);
        if (costo === null) v.agregar(`areas.${i}.costo_inscripcion`, 'El costo de inscripción debe ser un número.');
        else if (costo < 0) v.agregar(`areas.${i}.costo_inscripcion`, 'El costo de inscripción no puede ser negativo.');
      }
    });
    const conv = idConvocatoria === null ? undefined : buscarConvocatoria(idConvocatoria);
    if (v.falla || !conv) return v.respuesta();

    const ahora = ahoraLaravel();
    for (const fila of filas) {
      const idArea = numero(fila.id_area) ?? 0;
      const costo = numero(fila.costo_inscripcion) ?? 0;
      const existente = db.convocatoriaAreas.find((ca) => ca.id_convocatoria === conv.id_convocatoria && ca.id_area === idArea);
      if (existente) {
        existente.costo_inscripcion = costo;
        existente.updated_at = ahora;
      } else {
        db.convocatoriaAreas.push({
          id_convocatoria_area: siguienteId(db.convocatoriaAreas, (ca) => ca.id_convocatoria_area),
          id_convocatoria: conv.id_convocatoria,
          id_area: idArea,
          costo_inscripcion: costo,
          created_at: ahora,
          updated_at: ahora,
        });
      }
    }
    return ok(modeloConvocatoriaConAreas(conv), 'Áreas asociadas correctamente');
  }),

  http.post('*/api/v1/admin/convocatorias/asociar-niveles-grados', async ({ request }) => {
    const denegado = requiereAdmin(request);
    if (denegado) return denegado;

    const cuerpo = await leerObjeto(request);
    const idConvocatoria = numero(cuerpo.id_convocatoria);
    const niveles = Array.isArray(cuerpo.niveles) ? cuerpo.niveles : null;
    const v = new Validador();
    if (!presente(cuerpo.id_convocatoria)) v.agregar('id_convocatoria', 'El ID de la convocatoria es obligatorio.');
    else if (idConvocatoria === null || !buscarConvocatoria(idConvocatoria)) {
      v.agregar('id_convocatoria', 'La convocatoria especificada no existe.');
    }
    if (!presente(cuerpo.niveles)) v.agregar('niveles', 'Debe proporcionar al menos un nivel.');
    else if (!niveles) v.agregar('niveles', 'Los niveles deben ser un arreglo.');

    const filas = (niveles ?? []).map((item) => (esRegistro(item) ? item : {}));
    filas.forEach((fila, i) => {
      const reglas: [campo: string, existe: (id: number) => boolean][] = [
        ['id_nivel', (id) => Boolean(buscarNivel(id))],
        ['id_area', (id) => Boolean(buscarArea(id))],
        ['id_grado_min', (id) => Boolean(buscarGrado(id))],
        ['id_grado_max', (id) => Boolean(buscarGrado(id))],
      ];
      const requeridos: Record<string, string> = {
        id_nivel: 'El ID del nivel es obligatorio.',
        id_area: 'El ID del área es obligatorio.',
        id_grado_min: 'El grado mínimo es obligatorio.',
        id_grado_max: 'El grado máximo es obligatorio.',
      };
      const inexistentes: Record<string, string> = {
        id_nivel: 'Uno de los niveles especificados no existe.',
        id_area: 'Una de las áreas especificadas no existe.',
        id_grado_min: 'Uno de los grados mínimos especificados no existe.',
        id_grado_max: 'Uno de los grados máximos especificados no existe.',
      };
      for (const [campo, existe] of reglas) {
        const id = numero(fila[campo]);
        if (!presente(fila[campo])) v.agregar(`niveles.${i}.${campo}`, requeridos[campo]);
        else if (id === null || !existe(id)) v.agregar(`niveles.${i}.${campo}`, inexistentes[campo]);
      }
    });
    const conv = idConvocatoria === null ? undefined : buscarConvocatoria(idConvocatoria);
    if (v.falla || !conv) return v.respuesta();

    // Se valida todo antes de aplicar para imitar la transacción del servicio
    const planes: { ca: ConvocatoriaArea; idNivel: number; min: number; max: number }[] = [];
    for (const fila of filas) {
      const idArea = numero(fila.id_area) ?? 0;
      const idNivel = numero(fila.id_nivel) ?? 0;
      const min = numero(fila.id_grado_min) ?? 0;
      const max = numero(fila.id_grado_max) ?? 0;
      const ca = db.convocatoriaAreas.find((x) => x.id_convocatoria === conv.id_convocatoria && x.id_area === idArea);
      if (!ca) {
        return errorServidor('Error al configurar niveles y grados', `El área con ID ${idArea} no está asociada a esta convocatoria`);
      }
      if (min > max) {
        return errorServidor('Error al configurar niveles y grados', 'El grado mínimo no puede ser mayor que el grado máximo');
      }
      planes.push({ ca, idNivel, min, max });
    }

    const ahora = ahoraLaravel();
    for (const { ca, idNivel, min, max } of planes) {
      const existente = db.convocatoriaNiveles.find(
        (cn) => cn.id_convocatoria_area === ca.id_convocatoria_area && cn.id_nivel === idNivel,
      );
      if (existente) {
        existente.id_grado_min = min;
        existente.id_grado_max = max;
        existente.updated_at = ahora;
      } else {
        db.convocatoriaNiveles.push({
          id_convocatoria_nivel: siguienteId(db.convocatoriaNiveles, (cn) => cn.id_convocatoria_nivel),
          id_convocatoria_area: ca.id_convocatoria_area,
          id_nivel: idNivel,
          id_grado_min: min,
          id_grado_max: max,
          created_at: ahora,
          updated_at: ahora,
        });
      }
    }
    return ok([], 'Niveles y grados configurados correctamente');
  }),

  http.post('*/api/v1/admin/convocatorias/cerrar-expiradas', ({ request }) => {
    const denegado = requiereAdmin(request);
    if (denegado) return denegado;
    const ahora = ahoraSql();
    const expiradas = db.convocatorias.filter((c) => c.estado === 'abierta' && c.fecha_fin_inscripcion < ahora);
    const cerradas = expiradas.filter((c) => transicionar(c, 'cerrada').success).length;
    return ok(
      { convocatorias_cerradas: cerradas, total_verificadas: expiradas.length, errores: [] },
      `Se cerraron ${cerradas} convocatorias expiradas`,
    );
  }),

  http.post<{ id: string }>('*/api/v1/admin/convocatorias/:id/set-costo-general', async ({ request, params }) => {
    const denegado = requiereAdmin(request);
    if (denegado) return denegado;
    const cuerpo = await leerObjeto(request);
    const costo = numero(cuerpo.costo_inscripcion);
    const v = new Validador();
    if (!presente(cuerpo.costo_inscripcion)) v.agregar('costo_inscripcion', mensajes.requerido('costo_inscripcion'));
    else if (costo === null) v.agregar('costo_inscripcion', mensajes.numerico('costo_inscripcion'));
    else if (costo < 0) v.agregar('costo_inscripcion', mensajes.minNumero('costo_inscripcion', 0));
    if (v.falla || costo === null) return v.respuestaSoloMensaje();

    const ahora = ahoraLaravel();
    areasDeConvocatoria(Number(params.id)).forEach((ca) => {
      ca.costo_inscripcion = costo;
      ca.updated_at = ahora;
    });
    return ok(null, 'Costo general actualizado correctamente');
  }),

  http.get<{ id: string }>('*/api/v1/admin/convocatorias/:id/estado', ({ request, params }) => {
    const denegado = requiereAdmin(request);
    if (denegado) return denegado;
    const conv = buscarConvocatoria(Number(params.id));
    if (!conv) return noEncontrado('Convocatoria no encontrada');
    const requisitos = requisitosApertura(conv);
    return ok(
      {
        estado_actual: conv.estado,
        puede_abrir: requisitos.requisitos_faltantes.length === 0,
        debe_cerrar: conv.estado === 'abierta' && ahoraSql() > conv.fecha_fin_inscripcion,
        fecha_apertura: conv.fecha_apertura,
        requisitos,
        transiciones_validas: TRANSICIONES_UI[conv.estado],
      },
      'Estado de convocatoria obtenido correctamente',
    );
  }),

  http.put<{ id: string }>('*/api/v1/admin/convocatorias/:id/estado', async ({ request, params }) => {
    const denegado = requiereAdmin(request);
    if (denegado) return denegado;
    const cuerpo = await leerObjeto(request);
    const nuevo = texto(cuerpo.nuevo_estado);
    const v = new Validador();
    if (!presente(nuevo)) v.agregar('nuevo_estado', 'El nuevo estado es obligatorio.');
    else if (!nuevo || !esEstado(nuevo)) {
      v.agregar('nuevo_estado', 'El estado especificado no es válido. Debe ser: planificada, abierta, cerrada o finalizada.');
    }
    if (v.falla || !nuevo || !esEstado(nuevo)) return v.respuesta();

    const conv = buscarConvocatoria(Number(params.id));
    if (!conv) return noEncontrado('Convocatoria no encontrada');
    const resultado = transicionar(conv, nuevo);
    if (!resultado.success) return error(resultado.message, 422, resultado.faltantes);
    return ok({ id_convocatoria: conv.id_convocatoria, estado_nuevo: conv.estado }, resultado.message);
  }),

  // AmpliarFechaController (fuera del prefijo v1)
  http.put<{ id: string }>('*/api/convocatorias/:id/ampliar-fecha', async ({ request, params }) => {
    const denegado = requiereAdmin(request);
    if (denegado) return denegado;
    const cuerpo = await leerObjeto(request);
    const nuevaFecha = cuerpo.nueva_fecha;
    // La regla real es "after:<ayer>": el parámetro de ruta es {id} y no {convocatoria}
    const ayer = soloFecha(sumarDias(new Date(), -1));
    const v = new Validador();
    if (!presente(nuevaFecha)) v.agregar('nueva_fecha', 'La nueva fecha es obligatoria.');
    else if (!esFechaValida(nuevaFecha)) v.agregar('nueva_fecha', 'La nueva fecha debe ser una fecha válida.');
    else if (aFechaYmd(nuevaFecha) <= ayer) {
      v.agregar('nueva_fecha', 'La nueva fecha debe ser posterior a la fecha de fin de inscripción actual.');
    }
    if (v.falla || !esFechaValida(nuevaFecha)) return v.respuesta();

    const conv = buscarConvocatoria(Number(params.id));
    if (!conv) return noEncontrado('Convocatoria no encontrada');
    conv.fecha_fin_inscripcion = aFechaYmd(nuevaFecha);
    tocar(conv);
    return ok(modeloConvocatoria(conv), 'Fecha de inscripción ampliada correctamente');
  }),
];
