import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Registration } from './pages/Registration';
import { PaymentConfirmation } from './pages/PaymentConfirmation';
import { Admin } from './pages/Admin';
import { Login } from './pages/Login';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/registro" element={<Registration />} />
            <Route path="/confirmacion" element={<PaymentConfirmation />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />
          </Routes>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;