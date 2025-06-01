import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import RegistrationPage from './pages/registration/RegistrationPage';
import CompletarInscripcionPage from './pages/registration/CompletarInscripcionPage';
import DescargarBoletaPage from './pages/registration/DescargarBoletaPage';
import EstadoInscripcionPage from './pages/registration/EstadoInscripcionPage';
import GestionarInscripciones from './pages/GestionarInscripciones';
import AdminPanel from './pages/AdminPanel';
import RegistroExcel from './pages/RegistroExcel';
import Reportes from './pages/ReportesConvocatoria';
import LlenarExcel from './pages/LlenarExcel';

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Layout>        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/registration" element={<RegistrationPage />} />
          <Route path="/inscripcion" element={<RegistrationPage />} />
          <Route path="/complete-registration" element={<CompletarInscripcionPage />} />
          <Route path="/download-payment-slip" element={<DescargarBoletaPage />} />
          <Route path="/download-boleta" element={<DescargarBoletaPage />} />
          <Route path="/gestionar-inscripciones" element={<GestionarInscripciones />} />
          <Route path="/admin/*" element={<AdminPanel />} />
          <Route path="/registroexcel" element={<RegistroExcel />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/estado-inscripcion" element={<EstadoInscripcionPage />} />
          <Route path="/llenarexcel" element={<LlenarExcel />} />
          <Route path="*" element={<Navigate to="/admin/convocatorias" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;