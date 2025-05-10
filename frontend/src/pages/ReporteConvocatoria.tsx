import React, { useEffect, useState } from 'react';
import { getEstudiantesPorConvocatoria } from '../api/reportesApi';
import { getConvocatoriasActivas } from '../api/adminConvocatoriaApi';

interface Convocatoria {
  id: number;
  nombre: string;
}

interface EstudianteInscrito {
  nombres: string;
  apellidos: string;
  ci: string;
  email: string;
  fecha_nacimiento: string;
  nombre_grado: string;
  unidad_educativa: string;
  departamento: string;
  provincia: string;
  nombre_area: string;
  nombre_nivel: string;
  fecha_inscripcion: string;
  estado: string;
}

export default function ReporteConvocatoria() {
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
  const [selectedConvocatoria, setSelectedConvocatoria] = useState<number | null>(null);
  const [estudiantes, setEstudiantes] = useState<EstudianteInscrito[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar convocatorias disponibles (puedes mejorar esto usando tu API real)
  useEffect(() => {
    getConvocatoriasActivas()
      .then((data: unknown) => {
        // Adaptar la estructura para que cada convocatoria tenga 'id' (number) y 'nombre'
        const convs = (Array.isArray(data) ? data : []).map((c) => ({
          id: Number((c as { id_convocatoria?: number; id?: number }).id_convocatoria ?? (c as { id?: number }).id ?? 0),
          nombre: (c as { nombre?: string }).nombre ?? ''
        }));
        setConvocatorias(convs);
      });
  }, []);

  // Cargar estudiantes inscritos al seleccionar convocatoria
  useEffect(() => {
    if (selectedConvocatoria) {
      setLoading(true);
      setError(null);
      getEstudiantesPorConvocatoria(selectedConvocatoria)
        .then(data => setEstudiantes(data.estudiantes || []))
        .catch(() => setError('Error al cargar estudiantes'))
        .finally(() => setLoading(false));
    } else {
      setEstudiantes([]);
    }
  }, [selectedConvocatoria]);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Estudiantes Inscritos por Convocatoria</h2>
      <div className="mb-4">
        <label className="font-medium mr-2">Convocatoria:</label>
        <select
          className="border rounded px-3 py-2"
          value={selectedConvocatoria ?? ''}
          onChange={e => setSelectedConvocatoria(Number(e.target.value) || null)}
        >
          <option value="">Seleccione una convocatoria</option>
          {convocatorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>
      {loading && <div>Cargando...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {estudiantes.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-xs md:text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1">Nombres</th>
                <th className="border px-2 py-1">Apellidos</th>
                <th className="border px-2 py-1">CI</th>
                <th className="border px-2 py-1">Email</th>
                <th className="border px-2 py-1">Fecha Nac.</th>
                <th className="border px-2 py-1">Grado</th>
                <th className="border px-2 py-1">Unidad Educativa</th>
                <th className="border px-2 py-1">Departamento</th>
                <th className="border px-2 py-1">Provincia</th>
                <th className="border px-2 py-1">Área</th>
                <th className="border px-2 py-1">Nivel</th>
                <th className="border px-2 py-1">Fecha Inscripción</th>
                <th className="border px-2 py-1">Estado</th>
              </tr>
            </thead>
            <tbody>
              {estudiantes.map((e, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="border px-2 py-1">{e.nombres}</td>
                  <td className="border px-2 py-1">{e.apellidos}</td>
                  <td className="border px-2 py-1">{e.ci}</td>
                  <td className="border px-2 py-1">{e.email}</td>
                  <td className="border px-2 py-1">{e.fecha_nacimiento}</td>
                  <td className="border px-2 py-1">{e.nombre_grado}</td>
                  <td className="border px-2 py-1">{e.unidad_educativa}</td>
                  <td className="border px-2 py-1">{e.departamento}</td>
                  <td className="border px-2 py-1">{e.provincia}</td>
                  <td className="border px-2 py-1">{e.nombre_area}</td>
                  <td className="border px-2 py-1">{e.nombre_nivel}</td>
                  <td className="border px-2 py-1">{e.fecha_inscripcion}</td>
                  <td className="border px-2 py-1">{e.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {estudiantes.length === 0 && selectedConvocatoria && !loading && (
        <div className="text-gray-500">No hay estudiantes inscritos en esta convocatoria.</div>
      )}
    </div>
  );
}
