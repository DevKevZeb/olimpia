import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
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

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r shadow-sm hidden md:flex flex-col">
        <div className="h-20 flex items-center justify-center border-b">
          <span className="text-2xl font-bold text-blue-700">Administrador</span>
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
        
        <nav className="flex-1 py-6">
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
      {/* Main content */}
      <main className="flex-1 p-6 md:p-12">        <Routes>
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