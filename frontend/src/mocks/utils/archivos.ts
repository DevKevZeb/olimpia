import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { DEPARTAMENTOS_BOLIVIA } from '../data/catalogos';

/** Genera en el navegador los archivos que el backend sirve como descarga. */

export const MIME_PDF = 'application/pdf';
export const MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** PDF simple de una página con el título y los párrafos indicados. */
export const generarPdf = (titulo: string, parrafos: readonly string[]): ArrayBuffer => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(titulo, 20, 25);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  let y = 38;
  for (const parrafo of parrafos) {
    const lineas: string[] = doc.splitTextToSize(parrafo, 170);
    doc.text(lineas, 20, y);
    y += lineas.length * 6 + 4;
  }
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text('Documento generado por el modo demo de Olimpia · datos ficticios', 20, 285);
  return doc.output('arraybuffer');
};

export type ListasPlantilla = {
  areas: readonly string[];
  grados: readonly string[];
};

/**
 * Plantilla de inscripción con las mismas columnas que ExcelController.
 * SheetJS Community no escribe validaciones de datos, así que las listas
 * desplegables se incluyen como una segunda hoja de referencia.
 */
export const generarPlantillaExcel = ({ areas, grados }: ListasPlantilla): ArrayBuffer => {
  const encabezados = [
    'ÁREA DE COMPETENCIA',
    'NIVEL DE COMPETENCIA',
    '',
    'Nombres del Estudiante',
    'Apellidos del Estudiante',
    'CI del Estudiante',
    'Genero',
    'Fecha de Nacimiento (YYYY-MM-DD)',
    'Email del Estudiante',
    'Telefono del Estudiante',
    'Unidad Educativa',
    'Departamento',
    'Provincia',
    'Grado',
    '',
    'Nombres del Tutor Legal',
    'Apellidos del Tutor Legal',
    'CI del Tutor Legal',
    'Teléfono del Tutor Legal',
    'Email del Tutor Legal',
    'Parentesco del Tutor Legal',
    '',
    'Nombres del Tutor Académico',
    'Apellidos del Tutor Académico',
    'CI del Tutor Académico',
    'Teléfono del Tutor Académico',
    'Email del Tutor Académico',
  ];

  const libro = XLSX.utils.book_new();
  const hoja = XLSX.utils.aoa_to_sheet([encabezados]);
  hoja['!cols'] = encabezados.map((e) => ({ wch: e ? Math.max(14, e.length + 2) : 3 }));
  XLSX.utils.book_append_sheet(libro, hoja, 'Worksheet');

  const filas = Math.max(areas.length, grados.length, DEPARTAMENTOS_BOLIVIA.length, 2);
  const genero = ['Masculino', 'Femenino'];
  const listas = [
    ['ÁREA DE COMPETENCIA', 'Genero', 'Grado', 'Departamento'],
    ...Array.from({ length: filas }, (_, i) => [areas[i] ?? '', genero[i] ?? '', grados[i] ?? '', DEPARTAMENTOS_BOLIVIA[i] ?? '']),
  ];
  XLSX.utils.book_append_sheet(libro, XLSX.utils.aoa_to_sheet(listas), 'Listas');

  const salida: ArrayBuffer = XLSX.write(libro, { bookType: 'xlsx', type: 'array' });
  return salida;
};

/** Nombre aleatorio de 40 caracteres como los que genera `UploadedFile::store()`. */
export const nombreAlmacenado = (extension: string): string => {
  const alfabeto = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(40));
  return `${Array.from(bytes, (n) => alfabeto[n % alfabeto.length]).join('')}.${extension}`;
};

/** Laravel valida `mimes:pdf` por contenido; aquí basta el tipo o la extensión. */
export const esPdf = (archivo: File): boolean =>
  archivo.type === MIME_PDF || archivo.name.toLowerCase().endsWith('.pdf');
