import { http } from 'msw';
import {
  buscarArea,
  buscarConvocatoriaNivel,
  buscarNivel,
  buscarOrdenPorCodigo,
  buscarUnidad,
  convocatoriaDeNivel,
  db,
  detallesDeLista,
  encargadoDeLista,
  registrarPago,
} from '../db';
import { recursoComprobante } from '../serializers';
import { esPdf } from '../utils/archivos';
import { fechaCast } from '../utils/fechas';
import { error, leerObjeto, noEncontrado, ok, presente, texto, Validador } from '../utils/http';

/**
 * Boleta y comprobante de pago. El backend real lee el recibo PDF (OCR); en la
 * demo cualquier PDF se acepta como recibo válido del responsable de pago.
 */

const MAX_PDF_BYTES = 2048 * 1024;

export const pagosHandlers = [
  // ComprobantePagoController@verificarCodigoOrden
  http.post('*/api/v1/comprobantes-pago/verificar-codigo', async ({ request }) => {
    const cuerpo = await leerObjeto(request);
    const codigo = texto(cuerpo.codigo_orden);
    const v = new Validador();
    if (!presente(codigo) || codigo === null) v.agregar('codigo_orden', 'The codigo orden field is required.');
    else if (!buscarOrdenPorCodigo(codigo)) v.agregar('codigo_orden', 'No se encontró una orden de pago con ese código.');
    const orden = codigo ? buscarOrdenPorCodigo(codigo) : undefined;
    if (v.falla || !orden) return v.respuesta();

    const detalles = detallesDeLista(orden.id_lista);
    const primerEstudiante = detalles[0] ? db.estudiantes.find((e) => e.id_estudiante === detalles[0].id_estudiante) : undefined;
    const unidad = primerEstudiante ? buscarUnidad(primerEstudiante.id_unidad_educativa) : undefined;

    return ok(
      {
        orden: {
          // getVerificationDetails() usa $this->id, que no existe en el modelo (PK id_orden)
          id: null,
          codigo_unico: orden.codigo_unico,
          monto_total: orden.monto_total,
          fecha_emision: orden.fecha_emision,
          fecha_vencimiento: fechaCast(orden.fecha_vencimiento),
          estado: orden.estado,
          tipo_origen: orden.tipo_origen,
          tiene_comprobante: db.comprobantes.some((c) => c.id_orden === orden.id_orden),
        },
        estudiantes_count: detalles.length,
        ...(unidad ? { unidad_educativa: unidad.nombre } : {}),
      },
      'Orden de pago encontrada',
    );
  }),

  // ComprobantePagoController@storeByCodigoOrden (multipart)
  http.post('*/api/v1/comprobantes-pago/por-codigo', async ({ request }) => {
    const formulario = await request.formData().catch(() => new FormData());
    const codigo = formulario.get('codigo_orden');
    const archivo = formulario.get('pdf_comprobante');

    const v = new Validador();
    if (typeof codigo !== 'string' || codigo.trim() === '') {
      v.agregar('codigo_orden', 'El código de la orden es obligatorio.');
    } else if (!buscarOrdenPorCodigo(codigo)) {
      v.agregar('codigo_orden', 'No se encontró ninguna orden de pago con el código proporcionado.');
    }
    if (archivo === null || archivo === '') v.agregar('pdf_comprobante', 'El archivo PDF del comprobante es obligatorio.');
    else if (!(archivo instanceof File)) v.agregar('pdf_comprobante', 'El campo de comprobante debe ser un archivo.');
    else if (!esPdf(archivo)) v.agregar('pdf_comprobante', 'El comprobante debe ser un archivo PDF.');
    else if (archivo.size > MAX_PDF_BYTES) v.agregar('pdf_comprobante', 'El tamaño del archivo PDF no debe exceder los 2 MB.');

    const orden = typeof codigo === 'string' ? buscarOrdenPorCodigo(codigo) : undefined;
    if (v.falla || !orden || !(archivo instanceof File)) return v.respuesta();

    if (orden.estado === 'pagada') return error('Esta orden de pago ya ha sido pagada.', 422);
    if (orden.estado === 'vencida') return error('Esta orden de pago está vencida.', 422);

    const comprobante = registrarPago(orden, URL.createObjectURL(archivo));
    return ok(recursoComprobante(comprobante, orden), 'Comprobante de pago registrado correctamente', 201);
  }),

  // OrdenPagoController@getByCode
  http.get<{ codigo: string }>('*/api/v1/ordenes-pago/descargar/:codigo', ({ params }) => {
    const orden = buscarOrdenPorCodigo(params.codigo);
    const encargado = orden ? encargadoDeLista(orden.id_lista) : undefined;
    if (!orden || !encargado) return noEncontrado('El codigo que usted a ingresado no existe');

    const filas = detallesDeLista(orden.id_lista)
      .map((d) => {
        const estudiante = db.estudiantes.find((e) => e.id_estudiante === d.id_estudiante);
        const cn = buscarConvocatoriaNivel(d.id_convocatoria_nivel);
        const ca = cn ? convocatoriaDeNivel(cn) : undefined;
        if (!estudiante || !cn || !ca) return null;
        return {
          ci: estudiante.ci,
          nombres: estudiante.nombres,
          apellidos: estudiante.apellidos,
          nombre_area: buscarArea(ca.id_area)?.nombre_area ?? null,
          nombre_nivel: buscarNivel(cn.id_nivel)?.nombre_nivel ?? null,
          costo_inscripcion: ca.costo_inscripcion,
        };
      })
      .filter((fila) => fila !== null)
      // ORDER BY ci, nombres, apellidos
      .sort((a, b) => a.ci.localeCompare(b.ci) || a.nombres.localeCompare(b.nombres) || a.apellidos.localeCompare(b.apellidos));

    if (filas.length === 0) return noEncontrado('Orden de pago no encontrada');

    return ok(
      {
        orden: filas,
        monto_total: orden.monto_total,
        encargado: { nombre: `${encargado.nombres} ${encargado.apellidos}`, ci: encargado.ci, email: encargado.email },
      },
      'Orden de pago obtenida correctamente',
    );
  }),
];

