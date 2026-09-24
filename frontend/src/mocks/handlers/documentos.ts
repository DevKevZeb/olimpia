import { http, HttpResponse } from 'msw';
import { areasDeConvocatoria, buscarArea, buscarConvocatoria, db, tocar } from '../db';
import { modeloConvocatoriaArea } from '../serializers';
import { generarPdf, generarPlantillaExcel, MIME_PDF, MIME_XLSX, esPdf, nombreAlmacenado } from '../utils/archivos';
import { requiereAdmin } from '../utils/auth';
import { fechaCast } from '../utils/fechas';
import { mensajes, noEncontrado, ok, urlNoExiste, Validador } from '../utils/http';

/** Anexos por área (DocumentoController) y plantilla de inscripción por Excel (ExcelController). */

const MAX_ANEXO_BYTES = 10240 * 1024;

const nombreArchivo = (ruta: string): string => ruta.split('/').pop() ?? 'documento.pdf';

/** Contenido del anexo: el archivo subido en la sesión o unas bases generadas. */
const contenidoAnexo = async (idArea: number, nombreArea: string): Promise<ArrayBuffer> => {
  const subido = db.anexos.get(idArea);
  if (subido) return subido.arrayBuffer();
  const conv = db.convocatorias.find(
    (c) => c.estado === 'abierta' && areasDeConvocatoria(c.id_convocatoria).some((ca) => ca.id_area === idArea),
  );
  return generarPdf(`Bases del área de ${nombreArea}`, [
    `Convocatoria: ${conv?.nombre ?? 'Olimpiada Científica Estudiantil'}.`,
    conv
      ? `Periodo de inscripción: del ${fechaCast(conv.fecha_inicio_inscripcion).slice(0, 10)} al ${fechaCast(conv.fecha_fin_inscripcion).slice(0, 10)}.`
      : 'Periodo de inscripción: por definir.',
    'Participan estudiantes de unidades educativas fiscales, de convenio y particulares de los nueve departamentos de Bolivia, según los niveles y grados habilitados para el área.',
    'La inscripción se completa con el pago de la boleta generada por el sistema y la subida del comprobante de pago.',
    'Este documento es ficticio y forma parte del modo demo del sistema.',
  ]);
};

export const documentosHandlers = [
  // Rutas fuera del prefijo v1
  http.get<{ id: string }>('*/api/convocatorias/:id/areas', ({ request, params }) => {
    const denegado = requiereAdmin(request);
    if (denegado) return denegado;
    const conv = buscarConvocatoria(Number(params.id));
    if (!conv) return noEncontrado('Convocatoria no encontrada');
    return ok(areasDeConvocatoria(conv.id_convocatoria).map(modeloConvocatoriaArea), 'Áreas obtenidas correctamente');
  }),

  http.post('*/api/documentos/subir', async ({ request }) => {
    const denegado = requiereAdmin(request);
    if (denegado) return denegado;

    const formulario = await request.formData().catch(() => new FormData());
    const idConvocatoria = Number(formulario.get('id_convocatoria'));
    const idArea = Number(formulario.get('id_area'));
    const archivo = formulario.get('file');

    const v = new Validador();
    if (!formulario.get('id_convocatoria')) v.agregar('id_convocatoria', mensajes.requerido('id_convocatoria'));
    else if (!Number.isInteger(idConvocatoria)) v.agregar('id_convocatoria', mensajes.entero('id_convocatoria'));
    else if (!buscarConvocatoria(idConvocatoria)) v.agregar('id_convocatoria', mensajes.existe('id_convocatoria'));
    if (!formulario.get('id_area')) v.agregar('id_area', mensajes.requerido('id_area'));
    else if (!Number.isInteger(idArea)) v.agregar('id_area', mensajes.entero('id_area'));
    else if (!buscarArea(idArea)) v.agregar('id_area', mensajes.existe('id_area'));
    if (!(archivo instanceof File)) v.agregar('file', mensajes.requerido('file'));
    else if (!esPdf(archivo)) v.agregar('file', 'The file must be a file of type: pdf.');
    else if (archivo.size > MAX_ANEXO_BYTES) v.agregar('file', 'The file must not be greater than 10240 kilobytes.');

    const area = buscarArea(idArea);
    if (v.falla || !area || !(archivo instanceof File)) return v.respuesta();

    const ruta = `public/anexo/${idConvocatoria}/${area.id_area}/${nombreAlmacenado('pdf')}`;
    area.anexo = ruta;
    tocar(area);
    db.anexos.set(area.id_area, archivo);
    return ok({ anexo: ruta }, 'Documento subido correctamente');
  }),

  http.get<{ idArea: string }>('*/api/documentos/descargar/:idArea', async ({ params }) => {
    const area = buscarArea(Number(params.idArea));
    if (!area || !area.anexo) return noEncontrado('Documento no encontrado');
    const contenido = await contenidoAnexo(area.id_area, area.nombre_area);
    return new HttpResponse(contenido, {
      headers: {
        'Content-Type': MIME_PDF,
        'Content-Disposition': `attachment; filename=${nombreArchivo(area.anexo)}`,
      },
    });
  }),

  // ExcelController@downloadTemplate (findOrFail -> 404 genérico)
  http.get<{ id: string }>('*/api/v1/excel/plantilla/:id', ({ params }) => {
    const conv = buscarConvocatoria(Number(params.id));
    if (!conv) return urlNoExiste();
    const areas = areasDeConvocatoria(conv.id_convocatoria)
      .map((ca) => buscarArea(ca.id_area)?.nombre_area)
      .filter((nombre) => nombre !== undefined);
    const grados = [...db.grados].sort((a, b) => a.orden - b.orden).map((g) => g.nombre_grado);
    const nombre = `plantilla_inscripcion_${conv.id_convocatoria}_${conv.nombre.replace(/ /g, '_')}.xlsx`;
    return new HttpResponse(generarPlantillaExcel({ areas, grados }), {
      headers: {
        'Content-Type': MIME_XLSX,
        'Content-Disposition': `attachment;filename="${encodeURIComponent(nombre)}"`,
        'Cache-Control': 'max-age=0',
      },
    });
  }),
];
