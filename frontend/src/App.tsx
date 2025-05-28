import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import RegistrationPage from './pages/RegistrationPage';
import CompletarInscripcionPage from './pages/CompletarInscripcionPage';
import DescargarBoletaPage from './pages/DescargarBoletaPage';
import AdminPanel from './pages/AdminPanel';
import CamposObligatorios from './pages/CamposObligatorios';
import RegistroExcel from './pages/RegistroExcel';
import Reportes from './pages/ReportesConvocatoria';
import EstadoInscripcion from './pages/EstadoInscripcion';
import AgregarDocumento from './pages/AgregarDocumento';
import LlenarExcel from './pages/LlenarExcel';

function App() {
  return (
    <Router>
      <Layout>        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/registration" element={<RegistrationPage />} />
          <Route path="/inscripcion" element={<RegistrationPage />} />
          <Route path="/complete-registration" element={<CompletarInscripcionPage />} />
          <Route path="/download-payment-slip" element={<DescargarBoletaPage />} />
          <Route path="/admin/*" element={<AdminPanel />} />
          <Route path="/camposobligatorios" element={<CamposObligatorios />} />
          <Route path="/registroexcel" element={<RegistroExcel />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/estado-inscripcion" element={<EstadoInscripcion />} />
          <Route path="*" element={<Navigate to="/admin/convocatorias" replace />} />
          <Route path="/agregarDoc" element={<AgregarDocumento />} />
          <Route path="/llenarexcel" element={<LlenarExcel />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;