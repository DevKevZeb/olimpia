import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import Home from './pages/Home';
import RegistrationPage from './pages/registration/RegistrationPage';
import CompletarInscripcionPage from './pages/registration/CompletarInscripcionPage';
import DescargarBoletaPage from './pages/registration/DescargarBoletaPage';
import EstadoInscripcionPage from './pages/registration/EstadoInscripcionPage';
import GestionarInscripciones from './pages/GestionarInscripciones';
import AdminPanel from './pages/AdminPanel';
import AdminLogin from './pages/AdminLogin';
import RegistroExcel from './pages/RegistroExcel';
import Reportes from './pages/ReportesConvocatoria';
import LlenarExcel from './pages/LlenarExcel';

function App() {
  return (
    <AuthProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/registration" element={<Layout><RegistrationPage /></Layout>} />
          <Route path="/inscripcion" element={<Layout><RegistrationPage /></Layout>} />
          <Route path="/complete-registration" element={<Layout><CompletarInscripcionPage /></Layout>} />
          <Route path="/download-payment-slip" element={<Layout><DescargarBoletaPage /></Layout>} />
          <Route path="/download-boleta" element={<Layout><DescargarBoletaPage /></Layout>} />
          <Route path="/gestionar-inscripciones" element={<Layout><GestionarInscripciones /></Layout>} />
          <Route path="/estado-inscripcion" element={<Layout><EstadoInscripcionPage /></Layout>} />
          <Route path="/llenarexcel" element={<Layout><LlenarExcel /></Layout>} />
          
          {/* Admin login route (public) */}
          <Route path="/admin/login" element={<AdminLogin />} />
          
          {/* Protected admin routes */}
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            } 
          />
            {/* Public routes that don't need authentication */}
          <Route path="/registroexcel" element={<Layout><RegistroExcel /></Layout>} />
          
          {/* Protected routes - these need authentication */}
          <Route 
            path="/reportes" 
            element={
              <ProtectedRoute>
                <Layout><Reportes /></Layout>
              </ProtectedRoute>
            } 
          />
          
          {/* Catch all - redirect to home instead of admin */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;