import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { getConvocatoriasActivas } from '../api/adminConvocatoriaApi';
import { getInscritosPorArea } from '../api/reportesApi';

interface Convocatoria { id: number; nombre: string; }
interface AreaReporte {
  nombre_area: string;
  total_inscritos: number;
  estudiantes?: {
    nombres: string;
    apellidos: string;
    ci: string;
    email: string;
    fecha_nacimiento: string;
  }[];
}

export default function ReporteAreas() {
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
  const [selectedConvocatoria, setSelectedConvocatoria] = useState<number | null>(null);
  const [data, setData] = useState<AreaReporte[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getConvocatoriasActivas().then((data: any) => {
      const convs = (Array.isArray(data) ? data : []).map((c) => ({
        id: Number((c.id_convocatoria ?? c.id ?? 0)),
        nombre: c.nombre ?? ''
      }));
      setConvocatorias(convs);
    });
  }, []);

  useEffect(() => {
    if (selectedConvocatoria) {
      setLoading(true);
      setError(null);
      getInscritosPorArea(selectedConvocatoria)
        .then(res => setData(res.reporte || []))
        .catch(() => setError('Error al cargar el reporte'))
        .finally(() => setLoading(false));
    } else {
      setData([]);
    }
  }, [selectedConvocatoria]);

  const handleExportPDF = async () => {
    const table = document.getElementById('tabla-areas');
    if (!table) return;
    const canvas = await html2canvas(table);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pageWidth - 40;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 20, 20, pdfWidth, pdfHeight);
    pdf.save('reporte_areas.pdf');
  };

  const handleExportExcel = () => {
    if (data.length === 0) return;
    // Aplanar los datos para Excel: una fila por estudiante, con el nombre del área
    const excelRows: any[] = [];
    data.forEach(area => {
      if (area.estudiantes && area.estudiantes.length > 0) {
        area.estudiantes.forEach(est => {
          excelRows.push({
            area: area.nombre_area,
            ...est
          });
        });
      } else {
        excelRows.push({ area: area.nombre_area, ...{ nombres: '', apellidos: '', ci: '', email: '', fecha_nacimiento: '' } });
      }
    });
    const ws = XLSX.utils.json_to_sheet(excelRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Áreas');
    XLSX.writeFile(wb, 'reporte_areas.xlsx');
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Reporte por Áreas</h2>
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <label className="font-medium mr-2">Convocatoria:</label>
        <select
          className="border rounded px-3 py-2"
          value={selectedConvocatoria ?? ''}
          onChange={e => setSelectedConvocatoria(Number(e.target.value) || null)}
        >
          <option value="">Seleccione una convocatoria</option>
          {convocatorias.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
        {data.length > 0 && (
          <>
            <button
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={handleExportPDF}
              type="button"
            >
              Exportar PDF
            </button>
            <button
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              onClick={handleExportExcel}
              type="button"
            >
              Exportar Excel
            </button>
          </>
        )}
      </div>
      {loading && <div>Cargando...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {data.length > 0 && (
        <div className="overflow-x-auto">
          <table id="tabla-areas" className="min-w-full border text-xs md:text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1">Área</th>
                <th className="border px-2 py-1">Total Inscritos</th>
                <th className="border px-2 py-1">Nombres</th>
                <th className="border px-2 py-1">Apellidos</th>
                <th className="border px-2 py-1">CI</th>
                <th className="border px-2 py-1">Email</th>
                <th className="border px-2 py-1">Fecha Nac.</th>
              </tr>
            </thead>
            <tbody>
              {data.map((area, i) => (
                area.estudiantes && area.estudiantes.length > 0 ? (
                  area.estudiantes.map((est, idx) => (
                    <tr key={area.nombre_area + '-' + idx} className={idx === 0 ? 'border-t-2 border-blue-400' : ''}>
                      {idx === 0 && (
                        <>
                          <td className="border px-2 py-1 font-semibold bg-blue-50" rowSpan={area.estudiantes.length}>{area.nombre_area}</td>
                          <td className="border px-2 py-1 font-semibold bg-blue-50" rowSpan={area.estudiantes.length}>{area.total_inscritos}</td>
                        </>
                      )}
                      {/* Si no es la primera fila, no se repite el nombre del área ni el total */}
                      {idx !== 0 && null}
                      <td className="border px-2 py-1">{est.nombres}</td>
                      <td className="border px-2 py-1">{est.apellidos}</td>
                      <td className="border px-2 py-1">{est.ci}</td>
                      <td className="border px-2 py-1">{est.email}</td>
                      <td className="border px-2 py-1">{est.fecha_nacimiento}</td>
                    </tr>
                  ))
                ) : (
                  <tr key={area.nombre_area + '-empty'} className="border-t-2 border-blue-400">
                    <td className="border px-2 py-1 font-semibold bg-blue-50">{area.nombre_area}</td>
                    <td className="border px-2 py-1 font-semibold bg-blue-50">{area.total_inscritos}</td>
                    <td className="border px-2 py-1 text-gray-400" colSpan={5}>Sin estudiantes inscritos</td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data.length === 0 && selectedConvocatoria && !loading && (
        <div className="text-gray-500">No hay datos para mostrar.</div>
      )}
    </div>
  );
}
