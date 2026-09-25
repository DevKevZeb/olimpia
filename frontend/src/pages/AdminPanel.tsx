import { useEffect, useState } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { getDashboardEstadisticas, DashboardEstadisticas } from '../api/adminConvocatoriaApi';
import { useAuth } from '../contexts/AuthContext';
import ConvocatoriasPage from './ConvocatoriasPage';
import AsignarAreasPage from './AsignarAreasPage';
import ConfigurarNivelesPage from './ConfigurarNivelesPage';
import CrearNivelPage from './CrearNivelPage';
import AsignarCostoGeneralPage from './AsignarCostoGeneralPage';
import ReportesPage from './ReportesPage';
import CamposObligatorios from './CamposObligatorios';
import CrearAreas from './CrearAreas';
import AmpliarFecha from './AmpliarFecha';
import AgregarDocumento from './AgregarDocumento';
import SecurityDashboard from './SecurityDashboard';

const dashboardCards = [
  { key: 'total_convocatorias', label: 'Convocatorias', icon: '📋', bg: 'bg-blue-100', text: 'text-blue-700' },
  { key: 'total_areas', label: 'Áreas', icon: '🗂️', bg: 'bg-green-100', text: 'text-green-700' },
  { key: 'total_niveles', label: 'Niveles', icon: '🏷️', bg: 'bg-purple-100', text: 'text-purple-700' },
] as const;

function DashboardHome() {
  const [estadisticas, setEstadisticas] = useState<DashboardEstadisticas | null>(null);

  useEffect(() => {
    getDashboardEstadisticas()
      .then(setEstadisticas)
      .catch(() => setEstadisticas(null));
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
      {dashboardCards.map((card) => (
        <div key={card.key} className={`${card.bg} rounded-lg p-6 shadow flex flex-col items-center`}>
          <span className={`text-3xl font-bold ${card.text}`}>{card.icon}</span>
          <span className="text-lg font-semibold mt-2">{card.label}</span>
          <span className="text-2xl mt-1">{estadisticas ? estadisticas[card.key] : '-'}</span>
        </div>
      ))}
    </div>
  );
}

const navItems = [
  { path: '', label: 'Inicio', icon: '🏠' },
  { path: 'convocatorias', label: 'Convocatorias', icon: '📋' },
  { path: 'ampliar-fecha', label: 'Ampliar Fecha', icon: '📅➕' },
  { path: 'areas', label: 'Asignar Áreas', icon: '🗂️' },
  { path: 'niveles', label: 'Configurar Niveles', icon: '🏷️' },
  { path: 'crear-area', label: 'Crear Area', icon: '➕' },
  { path: 'crear-nivel', label: 'Crear Nivel', icon: '➕' },
  { path: 'costos', label: 'Costo General', icon: '💲' },
  { path: 'camposobligatorios', label: 'Campos Obligatorios', icon: '📝' },
  { path: 'subir-anexos', label: 'Subir Anexos', icon: '📁' },
  { path: 'reportes', label: 'Reportes', icon: '📊' },
  { path: 'seguridad', label: 'Seguridad', icon: '🛡️' },
];

export default function AdminPanel() {
  const { admin, logout } = useAuth();

  // Callback handlers for components that require them
  const handleNivelCreado = () => {
    // This callback is triggered when a new nivel is successfully created
    // You could add additional logic here like refreshing data if needed
    console.log('Nivel creado exitosamente');
  };

  const handleCostoAsignado = () => {
    // This callback is triggered when costs are successfully assigned
    // You could add additional logic here like refreshing data if needed
    console.log('Costo asignado exitosamente');
  };

  const handleLogout = () => {
    logout();
  };

  // En móvil la barra lateral es un panel deslizable que se cierra al navegar
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Barra superior (móvil) */}
      <header className="md:hidden fixed top-0 inset-x-0 z-20 h-14 bg-white border-b shadow-sm flex items-center px-4 gap-3">
        <button
          type="button"
          className="p-2 -ml-2 rounded-md text-gray-700 hover:bg-gray-100"
          aria-label="Abrir menú"
          aria-expanded={menuAbierto}
          onClick={() => setMenuAbierto(true)}
        >
          <Menu className="w-6 h-6" />
        </button>
        <span className="text-lg font-bold text-blue-700">Administrador</span>
      </header>

      {/* Fondo oscuro detrás del menú (móvil) */}
      {menuAbierto && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/40" aria-hidden="true" onClick={() => setMenuAbierto(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`w-64 bg-white border-r shadow-sm flex flex-col fixed left-0 top-0 h-screen z-40 transform transition-transform duration-200 md:translate-x-0 ${
          menuAbierto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 md:h-20 flex items-center justify-between md:justify-center px-6 border-b">
          <span className="text-2xl font-bold text-blue-700">Administrador</span>
          <button
            type="button"
            className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
            aria-label="Cerrar menú"
            onClick={() => setMenuAbierto(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* User info */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">
                {admin?.nombre?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {admin?.nombre || 'Admin'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {admin?.email || ''}
              </p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 py-6 overflow-y-auto">
          <ul className="space-y-2">
            {navItems.map(item => (
              <li key={item.path}>
                <NavLink
                  to={`/admin/${item.path}`}
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
        
        {/* Logout button */}
        <div className="p-6 border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition font-medium gap-3"
          >
            <span className="text-xl">🚪</span>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main content with left margin to account for fixed sidebar */}
      <main className="flex-1 min-w-0 px-4 pt-20 pb-8 sm:px-6 md:p-12 md:ml-64"><Routes>
          <Route path="" element={<DashboardHome />} />
          <Route path="convocatorias" element={<ConvocatoriasPage />} />
          <Route path="ampliar-fecha" element={<AmpliarFecha />} />
          <Route path="areas" element={<AsignarAreasPage />} />
          <Route path="niveles" element={<ConfigurarNivelesPage />} />
          <Route path="crear-nivel" element={<CrearNivelPage onNivelCreado={handleNivelCreado} />} />
          <Route path="crear-area" element={<CrearAreas />} />
          <Route path="costos" element={<AsignarCostoGeneralPage onCostoAsignado={handleCostoAsignado} />} />
          <Route path="camposobligatorios" element={<CamposObligatorios />} />
          <Route path="reportes/*" element={<ReportesPage />} />
          <Route path="seguridad" element={<SecurityDashboard />} />
          <Route path="*" element={<Navigate to="" replace />} />
          <Route path="subir-anexos" element={<AgregarDocumento />} />
        </Routes>
      </main>
    </div>
  );
}