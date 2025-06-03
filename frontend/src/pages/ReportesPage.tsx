import { Routes, Route, NavLink } from 'react-router-dom';
import ReporteConvocatoria from './ReporteConvocatoria';
import ReporteAreas from './ReporteAreas';
import ReporteNiveles from './ReporteNiveles';
import ReporteUnidadEducativa from './ReporteUnidadEducativa';
import ReporteDepartamento from './ReporteDepartamento';
import ReporteProvincia from './ReporteProvincia';
import ReporteGenero from './ReporteGenero';

const reportNav = [
  { path: 'convocatoria', label: 'Por Convocatoria' },
  { path: 'areas', label: 'Por Áreas' },
  { path: 'niveles', label: 'Por Niveles/Categoría' },
  { path: 'unidad-educativa', label: 'Por Unidad Educativa' },
  { path: 'departamento', label: 'Por Departamento' },
  { path: 'provincia', label: 'Por Provincia' },
  { path: 'genero', label: 'Por Genero' },
];

export default function ReportesPage() {
  return (
    <div className="min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Reportes</h1>      <nav className="mb-8 flex gap-4">
        {reportNav.map(item => (
          <NavLink
            key={item.path}
            to={`/admin/reportes/${item.path}`}
            className={({ isActive }) =>
              `px-4 py-2 rounded-md font-medium transition-colors ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-blue-100'}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav><Routes>
        <Route index element={<ReporteConvocatoria />} />
        <Route path="convocatoria" element={<ReporteConvocatoria />} />
        <Route path="areas" element={<ReporteAreas />} />
        <Route path="niveles" element={<ReporteNiveles />} />
        <Route path="unidad-educativa" element={<ReporteUnidadEducativa />} />
        <Route path="departamento" element={<ReporteDepartamento />} />
        <Route path="provincia" element={<ReporteProvincia />} />
        <Route path="genero" element={<ReporteGenero />} />
      </Routes>
    </div>
  );
}
