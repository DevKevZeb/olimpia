import { http, HttpResponse } from 'msw';
import {
  areasDeConvocatoria,
  buscarArea,
  buscarConvocatoria,
  buscarGrado,
  buscarNivel,
  buscarUnidad,
  db,
  ordenDeLista,
  type DetalleInscripcion,
  type Estudiante,
  type UnidadEducativa,
} from '../db';
import { requiereAdmin } from '../utils/auth';
import { isoASql } from '../utils/fechas';
import { error, ok } from '../utils/http';

/**
 * Reportes de inscripción calculados sobre la base en memoria.
 * - /v1/reportes/{campo}/{id}: ReportesInscripcion::GetReporte
 * - Rutas fijas: ReporteEstudiantesConvocatoriaController
 */

type Inscripcion = {
  detalle: DetalleInscripcion;
  estudiante: Estudiante;
  unidad: UnidadEducativa | undefined;
  nombreArea: string;
  idArea: number;
  idNivel: number;
};

type EstudianteDeArea = {
  nombres: string;
  apellidos: string;
  ci: string;
  email: string | null;
  fecha_nacimiento: string;
};

type Filtro = (inscripcion: Inscripcion) => boolean;

/**
 * Recorre áreas de la convocatoria -> niveles -> detalles, en el mismo orden
 * que los bucles del controlador.
 */
const inscripcionesDeConvocatoria = (idConvocatoria: number, idArea: number | null = null, idNivel: number | null = null) =>
  areasDeConvocatoria(idConvocatoria)
    .filter((ca) => idArea === null || ca.id_area === idArea)
    .flatMap((ca) =>
      db.convocatoriaNiveles
        .filter((cn) => cn.id_convocatoria_area === ca.id_convocatoria_area && (idNivel === null || cn.id_nivel === idNivel))
        .flatMap((cn) =>
          db.detalles
            .filter((d) => d.id_convocatoria_nivel === cn.id_convocatoria_nivel)
            .map((detalle): Inscripcion | null => {
              const estudiante = db.estudiantes.find((e) => e.id_estudiante === detalle.id_estudiante);
              if (!estudiante) return null;
              return {
                detalle,
                estudiante,
                unidad: buscarUnidad(estudiante.id_unidad_educativa),
                nombreArea: buscarArea(ca.id_area)?.nombre_area ?? '',
                idArea: ca.id_area,
                idNivel: cn.id_nivel,
              };
            })
            .filter((i) => i !== null),
        ),
    );

const filaReporte = ({ detalle, estudiante, unidad, nombreArea }: Inscripcion) => {
  const tutor = db.tutoresLegales.find((t) => t.id_tutor_legal === estudiante.id_tutor_legal);
  return {
    estudiante: {
      nombres: estudiante.nombres,
      apellidos: estudiante.apellidos,
      ci: estudiante.ci,
      grado: buscarGrado(estudiante.id_grado)?.nombre_grado ?? null,
      unidad_educativa: { nombre: unidad?.nombre ?? null, departamento: unidad?.departamento ?? null },
      tutor_legal: { nombre: tutor?.nombres ?? null, apellido: tutor?.apellidos ?? null, ci: tutor?.ci ?? null },
    },
    estado_inscripcion: ordenDeLista(detalle.id_lista)?.estado ?? 'Pendiente',
    areas_inscritas: nombreArea,
    fecha_inscripcion: detalle.fecha_registro,
  };
};

const SIN_AREAS = 'No se encontraron áreas de convocatoria para el ID proporcionado.';
const EXITO = 'Datos de la convocatoria obtenidos exitosamente.';

const reporte = (idConvocatoria: number, filtro: Filtro, idArea: number | null = null, idNivel: number | null = null) => {
  const areas = areasDeConvocatoria(idConvocatoria).filter((ca) => idArea === null || ca.id_area === idArea);
  if (areas.length === 0) return ok([], SIN_AREAS);
  return ok(inscripcionesDeConvocatoria(idConvocatoria, idArea, idNivel).filter(filtro).map(filaReporte), EXITO);
};

/** Agrupación por área de inscritosPorArea / inscritosPorDepartamento. */
const reportePorArea = (idConvocatoria: number) => {
  const grupos = new Map<string, { nombre_area: string; total_inscritos: number; estudiantes: EstudianteDeArea[] }>();
  inscripcionesDeConvocatoria(idConvocatoria)
    .sort(
      (a, b) =>
        a.nombreArea.localeCompare(b.nombreArea) ||
        a.estudiante.apellidos.localeCompare(b.estudiante.apellidos) ||
        a.estudiante.nombres.localeCompare(b.estudiante.nombres),
    )
    .forEach(({ nombreArea, estudiante }) => {
      const grupo = grupos.get(nombreArea) ?? { nombre_area: nombreArea, total_inscritos: 0, estudiantes: [] };
      grupo.total_inscritos += 1;
      grupo.estudiantes.push({
        nombres: estudiante.nombres,
        apellidos: estudiante.apellidos,
        ci: estudiante.ci,
        email: estudiante.email,
        fecha_nacimiento: `${estudiante.fecha_nacimiento} 00:00:00`,
      });
      grupos.set(nombreArea, grupo);
    });
  return [...grupos.values()];
};

const convocatoriaDeConsulta = (request: Request) => {
  const id = new URL(request.url).searchParams.get('convocatoria_id');
  if (!id) return { respuesta: HttpResponse.json({ error: 'convocatoria_id es requerido' }, { status: 422 }) };
  const conv = buscarConvocatoria(Number(id));
  if (!conv) return { respuesta: HttpResponse.json({ error: 'Convocatoria no encontrada' }, { status: 404 }) };
  return { conv };
};

export const reportesHandlers = [
  // Las rutas fijas van antes que la genérica /reportes/{campo}/{id}
  http.get('*/api/v1/reportes/estudiantes-por-convocatoria', ({ request }) => {
    const denegado = requiereAdmin(request);
    if (denegado) return denegado;
    const { conv, respuesta } = convocatoriaDeConsulta(request);
    if (!conv) return respuesta;
    const estudiantes = inscripcionesDeConvocatoria(conv.id_convocatoria)
      .sort((a, b) => a.estudiante.apellidos.localeCompare(b.estudiante.apellidos) || a.estudiante.nombres.localeCompare(b.estudiante.nombres))
      .map(({ detalle, estudiante, unidad, nombreArea, idNivel }) => ({
        nombres: estudiante.nombres,
        apellidos: estudiante.apellidos,
        ci: estudiante.ci,
        email: estudiante.email,
        fecha_nacimiento: `${estudiante.fecha_nacimiento} 00:00:00`,
        nombre_grado: buscarGrado(estudiante.id_grado)?.nombre_grado ?? null,
        unidad_educativa: unidad?.nombre ?? null,
        departamento: unidad?.departamento ?? null,
        provincia: unidad?.provincia ?? null,
        nombre_area: nombreArea,
        nombre_nivel: buscarNivel(idNivel)?.nombre_nivel ?? null,
        fecha_inscripcion: isoASql(detalle.fecha_registro),
        estado: ordenDeLista(detalle.id_lista)?.estado ?? null,
      }));
    return HttpResponse.json({ convocatoria: { id: conv.id_convocatoria, nombre: conv.nombre }, estudiantes });
  }),

  http.get('*/api/v1/reportes/inscritos-por-area', ({ request }) => {
    const denegado = requiereAdmin(request);
    if (denegado) return denegado;
    const { conv, respuesta } = convocatoriaDeConsulta(request);
    if (!conv) return respuesta;
    return HttpResponse.json({ convocatoria: { id: conv.id_convocatoria, nombre: conv.nombre }, reporte: reportePorArea(conv.id_convocatoria) });
  }),

  http.get('*/api/v1/reportes/inscritos-por-departamento', ({ request }) => {
    const denegado = requiereAdmin(request);
    if (denegado) return denegado;
    const { conv, respuesta } = convocatoriaDeConsulta(request);
    if (!conv) return respuesta;
    if (!new URL(request.url).searchParams.get('departamento')) {
      return HttpResponse.json({ error: 'departamento es requerido' }, { status: 422 });
    }
    // El backend real no aplica el filtro por departamento (la condición está comentada)
    return HttpResponse.json({ convocatoria: { id: conv.id_convocatoria, nombre: conv.nombre }, reporte: reportePorArea(conv.id_convocatoria) });
  }),

  http.get<{ campo: string; id: string }>('*/api/v1/reportes/:campo/:id', ({ request, params }) => {
    const denegado = requiereAdmin(request);
    if (denegado) return denegado;

    const id = Number(params.id);
    const q = new URL(request.url).searchParams;
    const numeroONulo = (clave: string) => (q.get(clave) ? Number(q.get(clave)) : -1);

    switch (params.campo) {
      case 'convocatoria':
        return reporte(id, () => true);
      case 'departamento': {
        const departamento = q.get('departamento');
        return reporte(id, (i) => i.unidad?.departamento === departamento);
      }
      case 'genero': {
        const genero = q.get('genero');
        return reporte(id, (i) =>
          genero === 'Otro'
            ? i.estudiante.genero !== 'Femenino' && i.estudiante.genero !== 'Masculino'
            : i.estudiante.genero === genero,
        );
      }
      case 'provincia': {
        const departamento = q.get('departamento');
        const provincia = q.get('provincia');
        return reporte(id, (i) => i.unidad?.departamento === departamento && i.unidad?.provincia === provincia);
      }
      case 'area':
        return reporte(id, () => true, numeroONulo('area_id'));
      case 'nivel':
        return reporte(id, () => true, numeroONulo('area_id'), numeroONulo('nivel_id'));
      case 'unidad_educativa': {
        // str_contains(strtolower(nombre), $valor): el valor buscado no se pasa a minúsculas
        const buscado = q.get('unidad_educativa') ?? '';
        return reporte(id, (i) => (i.unidad?.nombre.toLowerCase() ?? '').includes(buscado));
      }
      default:
        return error('Campo no válido', 400);
    }
  }),
];

