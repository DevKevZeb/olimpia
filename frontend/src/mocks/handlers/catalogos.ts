import { http } from 'msw';
import {
  areasDeConvocatoria,
  buscarArea,
  buscarConvocatoria,
  buscarGrado,
  buscarNivel,
  db,
  siguienteId,
  tocar,
  type Requisito,
} from '../db';
import {
  recursoArea,
  recursoConvocatoria,
  recursoGrado,
  recursoNivel,
  recursoRequisito,
} from '../serializers';
import { requiereAdmin } from '../utils/auth';
import { ahoraLaravel } from '../utils/fechas';
import {
  error,
  esBooleano,
  esRegistro,
  leerJson,
  leerObjeto,
  mensajes,
  noEncontrado,
  ok,
  presente,
  texto,
  urlNoExiste,
  Validador,
} from '../utils/http';

/**
 * Catálogos: áreas, niveles, grados, convocatorias (público), requisitos y
 * configuración de niveles usada por la inscripción por Excel.
 */

const gradosOrdenados = () => [...db.grados].sort((a, b) => a.orden - b.orden);

export const catalogosHandlers = [
  // AreasCompetenciaController
  http.get('*/api/v1/areas', () =>
    ok(db.areas.map(recursoArea), 'Áreas de competencia obtenidas correctamente'),
  ),

  http.post('*/api/v1/areas', async ({ request }) => {
    const denegado = requiereAdmin(request);
    if (denegado) return denegado;

    const cuerpo = await leerObjeto(request);
    const nombre = texto(cuerpo.nombre_area);
    const descripcion = texto(cuerpo.descripcion);
    const v = new Validador();
    if (!presente(nombre) || nombre === null) v.agregar('nombre_area', mensajes.requerido('nombre_area'));
    else if (nombre.length > 100) v.agregar('nombre_area', mensajes.maxTexto('nombre_area', 100));
    else if (db.areas.some((a) => a.nombre_area === nombre)) v.agregar('nombre_area', mensajes.unico('nombre_area'));
    if (descripcion && descripcion.length > 200) v.agregar('descripcion', mensajes.maxTexto('descripcion', 200));
    if (v.falla || nombre === null) return v.respuestaSoloMensaje();

    const ahora = ahoraLaravel();
    const area = {
      id_area: siguienteId(db.areas, (a) => a.id_area),
      nombre_area: nombre,
      descripcion: descripcion || null,
      anexo: null,
      created_at: ahora,
      updated_at: ahora,
    };
    db.areas.push(area);
    return ok(recursoArea(area), 'Área de competencia creada correctamente', 201);
  }),

  // NivelCategoriaController
  http.get('*/api/v1/niveles', () => ok(db.niveles.map(recursoNivel), 'Niveles obtenidos correctamente')),

  http.post('*/api/v1/niveles', async ({ request }) => {
    const denegado = requiereAdmin(request);
    if (denegado) return denegado;

    const cuerpo = await leerObjeto(request);
    const nombre = texto(cuerpo.nombre_nivel);
    const v = new Validador();
    if (!presente(nombre) || nombre === null) v.agregar('nombre_nivel', mensajes.requerido('nombre_nivel'));
    else if (nombre.length > 100) v.agregar('nombre_nivel', mensajes.maxTexto('nombre_nivel', 100));
    if (v.falla || nombre === null) return v.respuestaSoloMensaje();

    if (db.niveles.some((n) => n.nombre_nivel === nombre)) return error('Ya existe un nivel con ese nombre', 422);

    const ahora = ahoraLaravel();
    const nivel = { id_nivel: siguienteId(db.niveles, (n) => n.id_nivel), nombre_nivel: nombre, created_at: ahora, updated_at: ahora };
    db.niveles.push(nivel);
    return ok(recursoNivel(nivel), 'Nivel creado correctamente', 201);
  }),

  // GradoController (la ruta por nombre va antes que la de recurso)
  http.get<{ nombre: string }>('*/api/v1/grados/por-nombre/:nombre', ({ params }) => {
    const grado = db.grados.find((g) => g.nombre_grado === params.nombre);
    return grado ? ok(recursoGrado(grado), 'Grado obtenido correctamente') : noEncontrado('Grado no encontrado');
  }),

  http.get('*/api/v1/grados', () => ok(gradosOrdenados().map(recursoGrado), 'Grados obtenidos correctamente')),

  // ConvocatoriaController@index (ConvocatoriaCollection)
  http.get('*/api/v1/convocatorias', () =>
    ok(db.convocatorias.map(recursoConvocatoria), 'Convocatorias obtenidas correctamente'),
  ),

  // RequisitoConvocatoriaController (route model binding: 404 genérico si no existe)
  http.get<{ id: string }>('*/api/v1/convocatorias/:id/requisitos', ({ params }) => {
    const conv = buscarConvocatoria(Number(params.id));
    if (!conv) return urlNoExiste();
    const requisitos = db.requisitos.filter((r) => r.id_convocatoria === conv.id_convocatoria);
    return ok(requisitos.map(recursoRequisito), 'Requisitos obtenidos correctamente');
  }),

  http.post<{ id: string }>('*/api/v1/convocatorias/:id/requisitos', async ({ request, params }) => {
    const denegado = requiereAdmin(request);
    if (denegado) return denegado;
    const conv = buscarConvocatoria(Number(params.id));
    if (!conv) return urlNoExiste();

    const cuerpo = await leerJson(request);
    const items = Array.isArray(cuerpo) ? cuerpo : [];
    const v = new Validador();
    items.forEach((item, i) => {
      const fila = esRegistro(item) ? item : {};
      if (!presente(fila.entidad)) v.agregar(`${i}.entidad`, 'La entidad del requisito es obligatoria.');
      if (!presente(fila.campo)) v.agregar(`${i}.campo`, mensajes.requerido(`${i}.campo`));
      if (!presente(fila.es_obligatorio)) v.agregar(`${i}.es_obligatorio`, mensajes.requerido(`${i}.es_obligatorio`));
      else if (!esBooleano(fila.es_obligatorio)) v.agregar(`${i}.es_obligatorio`, mensajes.booleano(`${i}.es_obligatorio`));
    });
    if (v.falla) return v.respuesta();

    // Se reemplazan todos los requisitos de la convocatoria
    db.requisitos = db.requisitos.filter((r) => r.id_convocatoria !== conv.id_convocatoria);
    const ahora = ahoraLaravel();
    const creados: Requisito[] = items.filter(esRegistro).map((fila) => {
      const requisito: Requisito = {
        id: siguienteId(db.requisitos, (r) => r.id),
        id_convocatoria: conv.id_convocatoria,
        entidad: texto(fila.entidad) ?? '',
        campo: texto(fila.campo) ?? '',
        es_obligatorio: fila.es_obligatorio === true || fila.es_obligatorio === 1 || fila.es_obligatorio === '1',
        created_at: ahora,
        updated_at: ahora,
      };
      db.requisitos.push(requisito);
      return requisito;
    });
    tocar(conv);
    return ok(creados.map(recursoRequisito), 'Requisitos configurados exitosamente', 201);
  }),

  // ConvocatoriaConfigController (inscripción por Excel)
  http.get<{ id: string }>('*/api/v1/convocatorianiveles/:id', ({ params }) => {
    const idConvocatoria = Number(params.id);
    const filas = areasDeConvocatoria(idConvocatoria).flatMap((ca) =>
      db.convocatoriaNiveles
        .filter((cn) => cn.id_convocatoria_area === ca.id_convocatoria_area)
        .map((cn) => ({
          id_convocatoria_nivel: cn.id_convocatoria_nivel,
          nombre_area: buscarArea(ca.id_area)?.nombre_area ?? null,
          nombre_nivel: buscarNivel(cn.id_nivel)?.nombre_nivel ?? null,
          nombre_grado_min: buscarGrado(cn.id_grado_min)?.nombre_grado ?? null,
          nombre_grado_max: buscarGrado(cn.id_grado_max)?.nombre_grado ?? null,
          id_area: ca.id_area,
          id_nivel: cn.id_nivel,
          id_grado_min: cn.id_grado_min,
          id_grado_max: cn.id_grado_max,
        })),
    );
    if (filas.length === 0) {
      return noEncontrado('No se encontraron configuraciones de nivel para la convocatoria proporcionada.');
    }
    return ok(filas, 'Configuraciones de convocatoria nivel obtenidas correctamente.');
  }),
];
