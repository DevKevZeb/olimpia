import { http, HttpResponse } from 'msw';
import {
  areasDeConvocatoria,
  buscarArea,
  buscarConvocatoria,
  buscarConvocatoriaNivel,
  buscarEstudiantePorCi,
  buscarGrado,
  buscarNivel,
  buscarUnidad,
  convocatoriaActiva,
  convocatoriaDeNivel,
  db,
  registrarInscripcion,
  ultimaConvocatoriaAbierta,
  verificarInscripciones,
  type DatosEstudianteInscripcion,
  type DatosInscripcion,
  type DatosTutorAcademico,
  type EstudianteAVerificar,
} from '../db';
import { recursoConvocatoria, recursoGrado, recursoUnidad } from '../serializers';
import { esFechaValida, fechaCast } from '../utils/fechas';
import {
  EMAIL_RE,
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
  type Registro,
} from '../utils/http';

/**
 * Inscripción pública: datos del formulario, búsqueda de unidades educativas,
 * áreas por grado, verificación de duplicados, registro y consultas por CI.
 */

const textoONulo = (valor: unknown): string | null => texto(valor);

const registros = (valor: unknown): Registro[] => (Array.isArray(valor) ? valor.map((v) => (esRegistro(v) ? v : {})) : []);

const nivelesSeleccionados = (fila: Registro) =>
  registros(fila.areas_seleccionadas).map((a) => ({ id_convocatoria_nivel: numero(a.id_convocatoria_nivel) ?? 0 }));

/** CheckEstudiantesInscritosRequest */
const validarVerificacion = (cuerpo: Registro, v: Validador): void => {
  if (!presente(cuerpo.lista_inscripcion)) v.agregar('lista_inscripcion', mensajes.requerido('lista_inscripcion'));
  else if (!Array.isArray(cuerpo.lista_inscripcion)) v.agregar('lista_inscripcion', mensajes.arreglo('lista_inscripcion'));

  registros(cuerpo.lista_inscripcion).forEach((fila, i) => {
    const base = `lista_inscripcion.${i}`;
    for (const campo of ['nombres', 'apellidos', 'ci']) {
      if (!presente(fila[campo])) v.agregar(`${base}.${campo}`, mensajes.requerido(`${base}.${campo}`));
    }
    const idGrado = numero(fila.id_grado);
    if (!presente(fila.id_grado)) v.agregar(`${base}.id_grado`, mensajes.requerido(`${base}.id_grado`));
    else if (idGrado === null || !buscarGrado(idGrado)) v.agregar(`${base}.id_grado`, mensajes.existe(`${base}.id_grado`));

    if (!presente(fila.areas_seleccionadas)) {
      v.agregar(`${base}.areas_seleccionadas`, mensajes.requerido(`${base}.areas_seleccionadas`));
    }
    registros(fila.areas_seleccionadas).forEach((area, j) => {
      const campo = `${base}.areas_seleccionadas.${j}.id_convocatoria_nivel`;
      const id = numero(area.id_convocatoria_nivel);
      if (!presente(area.id_convocatoria_nivel)) v.agregar(campo, mensajes.requerido(campo));
      else if (id === null || !buscarConvocatoriaNivel(id)) v.agregar(campo, mensajes.existe(campo));
    });
  });

  const idConvocatoria = numero(cuerpo.id_convocatoria);
  if (!presente(cuerpo.id_convocatoria)) v.agregar('id_convocatoria', mensajes.requerido('id_convocatoria'));
  else if (idConvocatoria === null || !buscarConvocatoria(idConvocatoria)) {
    v.agregar('id_convocatoria', mensajes.existe('id_convocatoria'));
  }
};

/** StoreInscripcionCompletaRequest (reglas principales y validación de niveles/grados). */
const validarInscripcion = (cuerpo: Registro, v: Validador): void => {
  validarVerificacion(cuerpo, v);

  registros(cuerpo.lista_inscripcion).forEach((fila, i) => {
    const base = `lista_inscripcion.${i}`;
    if (!presente(fila.fecha_nacimiento)) v.agregar(`${base}.fecha_nacimiento`, mensajes.requerido(`${base}.fecha_nacimiento`));
    else if (!esFechaValida(fila.fecha_nacimiento)) v.agregar(`${base}.fecha_nacimiento`, mensajes.fecha(`${base}.fecha_nacimiento`));
    const email = texto(fila.email);
    if (email && !EMAIL_RE.test(email)) v.agregar(`${base}.email`, mensajes.email(`${base}.email`));

    const unidad = esRegistro(fila.unidad_educativa) ? fila.unidad_educativa : null;
    if (!unidad) v.agregar(`${base}.unidad_educativa`, mensajes.requerido(`${base}.unidad_educativa`));
    else {
      const idUnidad = numero(unidad.id_unidad_educativa);
      if (presente(unidad.id_unidad_educativa) && (idUnidad === null || !buscarUnidad(idUnidad))) {
        v.agregar(`${base}.unidad_educativa.id_unidad_educativa`, mensajes.existe(`${base}.unidad_educativa.id_unidad_educativa`));
      }
      if (!presente(unidad.id_unidad_educativa) && !presente(unidad.nombre)) {
        const campo = `${base}.unidad_educativa.nombre`;
        v.agregar(campo, `The ${campo.replace(/_/g, ' ')} field is required when ${`${base}.unidad_educativa.id_unidad_educativa`.replace(/_/g, ' ')} is not present.`);
      }
    }

    const tutor = esRegistro(fila.tutor_legal) ? fila.tutor_legal : null;
    if (!tutor) v.agregar(`${base}.tutor_legal`, mensajes.requerido(`${base}.tutor_legal`));
    else {
      for (const campo of ['nombres', 'apellidos', 'ci']) {
        if (!presente(tutor[campo])) v.agregar(`${base}.tutor_legal.${campo}`, mensajes.requerido(`${base}.tutor_legal.${campo}`));
      }
      const emailTutor = texto(tutor.email);
      if (emailTutor && !EMAIL_RE.test(emailTutor)) v.agregar(`${base}.tutor_legal.email`, mensajes.email(`${base}.tutor_legal.email`));
      if (tutor.es_el_mismo_estudiante === undefined || tutor.es_el_mismo_estudiante === null) {
        v.agregar(`${base}.tutor_legal.es_el_mismo_estudiante`, mensajes.requerido(`${base}.tutor_legal.es_el_mismo_estudiante`));
      }
    }
  });

  const codigo = texto(cuerpo.codigo_unico);
  if (!presente(codigo)) v.agregar('codigo_unico', mensajes.requerido('codigo_unico'));
  else if (db.ordenes.some((o) => o.codigo_unico === codigo)) {
    v.agregar('codigo_unico', 'El código único de pago ya ha sido registrado.');
  }

  const encargado = esRegistro(cuerpo.encargado_pago) ? cuerpo.encargado_pago : null;
  if (!encargado) v.agregar('encargado_pago', mensajes.requerido('encargado_pago'));
  else {
    for (const campo of ['nombres_encargado', 'apellidos_encargado', 'ci_encargado', 'email_encargado']) {
      if (!presente(encargado[campo])) v.agregar(`encargado_pago.${campo}`, mensajes.requerido(`encargado_pago.${campo}`));
    }
    const emailEncargado = texto(encargado.email_encargado);
    if (emailEncargado && !EMAIL_RE.test(emailEncargado)) {
      v.agregar('encargado_pago.email_encargado', mensajes.email('encargado_pago.email_encargado'));
    }
  }

  // withValidator(): cada nivel debe pertenecer a la convocatoria y admitir el grado
  if (v.falla) return;
  const idConvocatoria = numero(cuerpo.id_convocatoria);
  registros(cuerpo.lista_inscripcion).forEach((fila, i) => {
    const grado = buscarGrado(numero(fila.id_grado) ?? 0);
    registros(fila.areas_seleccionadas).forEach((area, j) => {
      const cn = buscarConvocatoriaNivel(numero(area.id_convocatoria_nivel) ?? 0);
      const ca = cn ? convocatoriaDeNivel(cn) : undefined;
      const min = cn ? buscarGrado(cn.id_grado_min) : undefined;
      const max = cn ? buscarGrado(cn.id_grado_max) : undefined;
      const campo = `lista_inscripcion.${i}.areas_seleccionadas.${j}.id_convocatoria_nivel`;
      if (!ca || ca.id_convocatoria !== idConvocatoria) {
        v.agregar(campo, 'El nivel seleccionado no pertenece a esta convocatoria.');
      } else if (grado && min && max && (grado.orden < min.orden || grado.orden > max.orden)) {
        v.agregar(campo, `El grado ${grado.nombre_grado} no corresponde al nivel seleccionado.`);
      }
    });
  });
};

const aVerificar = (cuerpo: Registro): EstudianteAVerificar[] =>
  registros(cuerpo.lista_inscripcion).map((fila) => ({
    ci: texto(fila.ci) ?? '',
    id_grado: numero(fila.id_grado) ?? 0,
    areas_seleccionadas: nivelesSeleccionados(fila),
  }));

/** Convierte el cuerpo ya validado a los datos tipados que usa el servicio de inscripción. */
const aDatosInscripcion = (cuerpo: Registro): DatosInscripcion => {
  const encargado = esRegistro(cuerpo.encargado_pago) ? cuerpo.encargado_pago : {};
  return {
    codigo_unico: texto(cuerpo.codigo_unico) ?? '',
    encargado_pago: {
      nombres_encargado: texto(encargado.nombres_encargado) ?? '',
      apellidos_encargado: texto(encargado.apellidos_encargado) ?? '',
      ci_encargado: texto(encargado.ci_encargado) ?? '',
      email_encargado: texto(encargado.email_encargado) ?? '',
    },
    lista_inscripcion: registros(cuerpo.lista_inscripcion).map((fila): DatosEstudianteInscripcion => {
      const unidad = esRegistro(fila.unidad_educativa) ? fila.unidad_educativa : {};
      const tutor = esRegistro(fila.tutor_legal) ? fila.tutor_legal : {};
      return {
        nombres: texto(fila.nombres) ?? '',
        apellidos: texto(fila.apellidos) ?? '',
        ci: texto(fila.ci) ?? '',
        genero: textoONulo(fila.genero),
        fecha_nacimiento: texto(fila.fecha_nacimiento) ?? '',
        email: textoONulo(fila.email),
        id_grado: numero(fila.id_grado) ?? 0,
        telefono: textoONulo(fila.telefono),
        unidad_educativa: {
          id_unidad_educativa: numero(unidad.id_unidad_educativa),
          nombre: textoONulo(unidad.nombre),
          departamento: textoONulo(unidad.departamento),
          provincia: textoONulo(unidad.provincia),
        },
        tutor_legal: {
          nombres: texto(tutor.nombres) ?? '',
          apellidos: texto(tutor.apellidos) ?? '',
          ci: texto(tutor.ci) ?? '',
          telefono: textoONulo(tutor.telefono),
          email: textoONulo(tutor.email),
          parentesco: textoONulo(tutor.parentesco),
          es_el_mismo_estudiante: tutor.es_el_mismo_estudiante === true || tutor.es_el_mismo_estudiante === 1,
        },
        areas_seleccionadas: nivelesSeleccionados(fila),
        tutores_academicos: registros(fila.tutores_academicos).map(
          (t): DatosTutorAcademico => ({
            id_convocatoria_nivel: numero(t.id_convocatoria_nivel),
            nombres: textoONulo(t.nombres),
            apellidos: textoONulo(t.apellidos),
            ci: textoONulo(t.ci),
            telefono: textoONulo(t.telefono),
            email: textoONulo(t.email),
          }),
        ),
      };
    }),
  };
};

export const inscripcionHandlers = [
  // HomeController (fuera del prefijo v1)
  http.get('*/api/areas-de-convocatoria', () => {
    const conv = ultimaConvocatoriaAbierta();
    if (!conv) {
      return HttpResponse.json({ status: 'Error', message: 'No hay convocatoria activa.', data: null }, { status: 404 });
    }
    const areas = areasDeConvocatoria(conv.id_convocatoria)
      .map((ca) => buscarArea(ca.id_area))
      .filter((a) => a !== undefined)
      .map((a) => ({ id_area: a.id_area, nombre_area: a.nombre_area, descripcion: a.descripcion }));
    return HttpResponse.json({
      status: 'OK',
      message: 'Áreas obtenidas correctamente',
      data: { convocatoria: { id_convocatoria: conv.id_convocatoria, titulo: conv.nombre }, areas },
    });
  }),

  http.get('*/api/v1/public/datos-inscripcion', () => {
    const conv = convocatoriaActiva();
    if (!conv) return noEncontrado('No hay convocatorias abiertas actualmente');
    const grados = [...db.grados].sort((a, b) => a.orden - b.orden);
    return ok(
      { convocatoria: recursoConvocatoria(conv), grados: grados.map(recursoGrado) },
      'Datos para inscripción obtenidos correctamente',
    );
  }),

  http.get('*/api/v1/public/unidades-educativas/buscar', ({ request }) => {
    const consulta = new URL(request.url).searchParams.get('query');
    const v = new Validador();
    if (!presente(consulta) || consulta === null) v.agregar('query', mensajes.requerido('query'));
    else if (consulta.length < 3) v.agregar('query', mensajes.minTexto('query', 3));
    if (v.falla || consulta === null) return v.respuesta();

    const buscada = consulta.toLowerCase();
    const unidades = db.unidades.filter((u) => u.nombre.toLowerCase().includes(buscada)).slice(0, 10);
    return ok(unidades.map(recursoUnidad), 'Unidades educativas encontradas');
  }),

  http.post('*/api/v1/public/areas-por-grado', async ({ request }) => {
    const cuerpo = await leerObjeto(request);
    const conv = buscarConvocatoria(numero(cuerpo.id_convocatoria) ?? 0);
    if (!conv) return noEncontrado('Convocatoria no encontrada');
    if (conv.estado !== 'abierta') return error('La convocatoria no está abierta para inscripciones', 422);

    const idGrado = numero(cuerpo.id_grado) ?? 0;
    const idsAreas = new Set(areasDeConvocatoria(conv.id_convocatoria).map((ca) => ca.id_convocatoria_area));
    const areasNiveles = db.convocatoriaNiveles
      .filter((cn) => idsAreas.has(cn.id_convocatoria_area) && cn.id_grado_min <= idGrado && cn.id_grado_max >= idGrado)
      .map((cn) => {
        const ca = convocatoriaDeNivel(cn);
        const area = ca ? buscarArea(ca.id_area) : undefined;
        return {
          id_convocatoria_nivel: cn.id_convocatoria_nivel,
          area: { id: area?.id_area ?? null, nombre: area?.nombre_area ?? null },
          nivel: { id: cn.id_nivel, nombre: buscarNivel(cn.id_nivel)?.nombre_nivel ?? null },
          costo: ca?.costo_inscripcion ?? null,
        };
      });
    return ok(
      { areas_niveles: areasNiveles, max_areas_permitidas: conv.max_areas_por_estudiante },
      'Áreas y niveles obtenidos correctamente',
    );
  }),

  http.post('*/api/v1/public/estudiante-esta-inscrito', async ({ request }) => {
    const cuerpo = await leerObjeto(request);
    const v = new Validador();
    validarVerificacion(cuerpo, v);
    if (v.falla) return v.respuesta();

    const conv = buscarConvocatoria(numero(cuerpo.id_convocatoria) ?? 0);
    if (!conv || conv.estado !== 'abierta') return error('La convocatoria no está abierta para inscripciones', 422);

    const errores = verificarInscripciones(aVerificar(cuerpo), conv);
    if (Object.keys(errores).length > 0) {
      return error('No se pudieron inscribir algunos estudiantes debido a los siguientes errores:', 422, errores);
    }
    return ok(null, 'Todos los estudiantes pueden ser inscritos sin problemas de duplicidad o límites de áreas.');
  }),

  http.post('*/api/v1/public/inscripcion-completa', async ({ request }) => {
    const cuerpo = await leerObjeto(request);
    const v = new Validador();
    validarInscripcion(cuerpo, v);
    if (v.falla) return v.respuesta();

    const conv = buscarConvocatoria(numero(cuerpo.id_convocatoria) ?? 0);
    if (!conv || conv.estado !== 'abierta') return error('La convocatoria no está abierta para inscripciones', 422);

    const errores = verificarInscripciones(aVerificar(cuerpo), conv);
    if (Object.keys(errores).length > 0) {
      return errorServidor('Error al procesar la inscripción', `Errores de verificación previa: ${JSON.stringify(errores)}`);
    }

    const { lista, orden } = registrarInscripcion(aDatosInscripcion(cuerpo));
    return ok(
      {
        inscripciones: {
          fecha_creacion: lista.fecha_creacion,
          updated_at: lista.updated_at,
          created_at: lista.created_at,
          id_lista: lista.id_lista,
        },
        orden_pago: {
          codigo_unico: orden.codigo_unico,
          tipo_origen: orden.tipo_origen,
          id_lista: orden.id_lista,
          monto_total: orden.monto_total,
          fecha_emision: orden.fecha_emision,
          fecha_vencimiento: fechaCast(orden.fecha_vencimiento),
          estado: orden.estado,
          updated_at: orden.updated_at,
          created_at: orden.created_at,
          id_orden: orden.id_orden,
        },
      },
      'Inscripción completada correctamente',
      201,
    );
  }),

  // SearchController
  http.get('*/api/v1/search-by-ci', ({ request }) => {
    const params = new URL(request.url).searchParams;
    const ci = params.get('ci');
    const tipo = params.get('type');
    const v = new Validador();
    if (!presente(ci) || ci === null) v.agregar('ci', 'El CI es obligatorio para la búsqueda.');
    else if (ci.length < 4) v.agregar('ci', mensajes.minTexto('ci', 4));
    else if (ci.length > 20) v.agregar('ci', mensajes.maxTexto('ci', 20));
    if (!presente(tipo)) v.agregar('type', 'El tipo de usuario es obligatorio.');
    else if (tipo !== 'estudiantes' && tipo !== 'tutores_legales') {
      v.agregar('type', 'El tipo de usuario no es válido. Solo se permiten "estudiantes" o "tutores_legales".');
    }
    if (v.falla || ci === null) return v.respuesta();

    const masReciente = <T extends { ci: string; created_at: string }>(filas: T[]) =>
      filas.filter((f) => f.ci === ci).sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

    let usuario = null;
    if (tipo === 'estudiantes') {
      const e = masReciente(db.estudiantes);
      if (e) usuario = { nombres: e.nombres, apellidos: e.apellidos, ci: e.ci, email: e.email, created_at: e.created_at };
    } else {
      const t = masReciente(db.tutoresLegales);
      if (t) {
        usuario = { nombres: t.nombres, apellidos: t.apellidos, ci: t.ci, email: t.email, telefono: t.telefono, created_at: t.created_at };
      }
    }
    if (!usuario) return noEncontrado('Usuario no encontrado');
    return ok({ usuario }, 'Resultados de búsqueda obtenidos correctamente');
  }),

  // EstudianteController@showWithJoins
  http.get<{ ci: string }>('*/api/v1/show/:ci', ({ params }) => {
    const e = buscarEstudiantePorCi(params.ci);
    if (!e) return noEncontrado('Estudiante no encontrado');
    const unidad = buscarUnidad(e.id_unidad_educativa);
    const tutor = db.tutoresLegales.find((t) => t.id_tutor_legal === e.id_tutor_legal);
    return HttpResponse.json({
      message: 'Estudiante obtenido correctamente',
      data: {
        nombres: e.nombres,
        apellidos: e.apellidos,
        fecha_nacimiento: fechaCast(e.fecha_nacimiento),
        genero: e.genero,
        email: e.email,
        unidad_educativa: {
          nombre: unidad?.nombre ?? null,
          departamento: unidad?.departamento ?? null,
          provincia: unidad?.provincia ?? null,
        },
        grado: { nombre: buscarGrado(e.id_grado)?.nombre_grado ?? null },
        tutor_legal: {
          nombres: tutor?.nombres ?? null,
          apellidos: tutor?.apellidos ?? null,
          email: tutor?.email ?? null,
          parentesco: tutor?.parentesco ?? null,
          telefono: tutor?.telefono ?? null,
        },
      },
    });
  }),

  // EstadoInscripcionController (fuera del prefijo v1)
  http.get<{ ci: string }>('*/api/estado-inscripcion/:ci', ({ params }) => {
    const { ci } = params;
    if (!/^\d+$/.test(ci)) return HttpResponse.json({ message: 'El CI debe contener solo números.' }, { status: 400 });

    const estudiante = buscarEstudiantePorCi(ci);
    if (!estudiante) return HttpResponse.json({ estado: 'No inscrito' });

    const conv = ultimaConvocatoriaAbierta();
    if (!conv) return HttpResponse.json({ message: 'No hay convocatorias activas.' }, { status: 404 });

    const idsAreas = new Set(areasDeConvocatoria(conv.id_convocatoria).map((ca) => ca.id_convocatoria_area));
    const detalle = db.detalles.find((d) => {
      const cn = buscarConvocatoriaNivel(d.id_convocatoria_nivel);
      return d.id_estudiante === estudiante.id_estudiante && cn !== undefined && idsAreas.has(cn.id_convocatoria_area);
    });
    if (!detalle) return HttpResponse.json({ estado: 'No inscrito' });

    const fechaInscripcion = detalle.fecha_registro.slice(0, 10);
    const orden = [...db.ordenes].filter((o) => o.id_lista === detalle.id_lista).sort((a, b) => b.id_orden - a.id_orden)[0];
    if (!orden) return HttpResponse.json({ estado: 'Inscripción pendiente', fecha_inscripcion: fechaInscripcion });

    const estados: Record<string, string> = { pagada: 'Inscripción finalizada', pendiente: 'Inscripción pendiente' };
    return HttpResponse.json({ estado: estados[orden.estado] ?? 'No inscrito', fecha_inscripcion: fechaInscripcion });
  }),
];

