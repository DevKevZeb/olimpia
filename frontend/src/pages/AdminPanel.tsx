import React from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import ConvocatoriasPage from './ConvocatoriasPage';
import AsignarAreasPage from './AsignarAreasPage';
import ConfigurarNivelesPage from './ConfigurarNivelesPage';
import CrearNivelPage from './CrearNivelPage';
import AsignarCostoGeneralPage from './AsignarCostoGeneralPage';
import ReportesPage from './ReportesPage';

function DashboardHome() {
  // Aquí podrías traer métricas/resúmenes del backend
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-blue-100 rounded-lg p-6 shadow flex flex-col items-center">
        <span className="text-3xl font-bold text-blue-700">📋</span>
        <span className="text-lg font-semibold mt-2">Convocatorias</span>
        {/* Aquí podrías mostrar el total dinámico */}
        <span className="text-2xl mt-1">-</span>
      </div>
      <div className="bg-green-100 rounded-lg p-6 shadow flex flex-col items-center">
        <span className="text-3xl font-bold text-green-700">🗂️</span>
        <span className="text-lg font-semibold mt-2">Áreas</span>
        <span className="text-2xl mt-1">-</span>
      </div>
      <div className="bg-purple-100 rounded-lg p-6 shadow flex flex-col items-center">
        <span className="text-3xl font-bold text-purple-700">🏷️</span>
        <span className="text-lg font-semibold mt-2">Niveles</span>
        <span className="text-2xl mt-1">-</span>
      </div>
    </div>
  );
}

const navItems = [
  { path: '', label: 'Inicio', icon: '🏠' },
  { path: 'convocatorias', label: 'Convocatorias', icon: '📋' },
  { path: 'areas', label: 'Asignar Áreas', icon: '🗂️' },
  { path: 'niveles', label: 'Configurar Niveles', icon: '🏷️' },
  { path: 'crear-nivel', label: 'Crear Nivel', icon: '➕' },
  { path: 'costos', label: 'Costo General', icon: '💲' },
  { path: 'reportes', label: 'Reportes', icon: '📊' },
];

export default function AdminPanel() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r shadow-sm hidden md:flex flex-col">
        <div className="h-20 flex items-center justify-center border-b">
          <span className="text-2xl font-bold text-blue-700">Administrador</span>
        </div>
        <nav className="flex-1 py-6">
          <ul className="space-y-2">
            {navItems.map(item => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === ''}
                  className={({ isActive }) =>
                    `flex items-center px-6 py-3 rounded-lg transition font-medium gap-3 ${
                      isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <span className="text-xl">{item.icon}</span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      {/* Main content */}
      <main className="flex-1 p-6 md:p-12">
        <Routes>
          <Route path="" element={<DashboardHome />} />
          <Route path="convocatorias" element={<ConvocatoriasPage />} />
          <Route path="areas" element={<AsignarAreasPage />} />
          <Route path="niveles" element={<ConfigurarNivelesPage />} />
          <Route path="crear-nivel" element={<CrearNivelPage />} />
          <Route path="costos" element={<AsignarCostoGeneralPage />} />
          <Route path="reportes/*" element={<ReportesPage />} />
          <Route path="*" element={<Navigate to="" replace />} />
        </Routes>
      </main>
    </div>
  );
}