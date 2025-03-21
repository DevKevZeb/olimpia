import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, ArrowLeft, Download, Share2 } from 'lucide-react';
import type { RegistrationSummary } from '../types';

export function PaymentConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const registration = location.state?.registration as RegistrationSummary;

  if (!registration) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Información no disponible</h2>
          <p className="text-gray-600 mb-6">No se encontró información de registro válida.</p>
          <button
            onClick={() => navigate('/registro')}
            className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition w-full"
          >
            <ArrowLeft size={20} />
            <span>Volver al Registro</span>
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-BO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 px-6 py-8 text-center">
            <CheckCircle className="w-16 h-16 text-white mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white">¡Registro Completado!</h2>
            <p className="text-blue-100 mt-2">Tu inscripción ha sido procesada exitosamente</p>
          </div>

          {/* Registration Details */}
          <div className="px-6 py-8">
            <div className="space-y-6">
              {/* Student Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos del Estudiante</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Nombre</p>
                    <p className="font-medium">{registration.student.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">CI</p>
                    <p className="font-medium">{registration.student.ci}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{registration.student.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Teléfono</p>
                    <p className="font-medium">{registration.student.phone}</p>
                  </div>
                </div>
              </div>

              {/* Areas */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Áreas de Competencia</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  {registration.areas.map((area, index) => (
                    <div key={area.id} className={`flex justify-between items-center ${index > 0 ? 'mt-3' : ''}`}>
                      <span className="text-gray-700">{area.name}</span>
                      <span className="font-medium">{formatCurrency(area.cost)}</span>
                    </div>
                  ))}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center font-semibold">
                      <span>Total</span>
                      <span>{formatCurrency(registration.totalCost)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Registration Info */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-blue-600">Fecha de Registro</p>
                    <p className="font-medium">{formatDate(registration.registrationDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-600">Estado</p>
                    <p className="font-medium text-green-600">Confirmado</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 space-y-4">
              <button className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition w-full">
                <Download size={20} />
                <span>Descargar Comprobante</span>
              </button>
              <button className="flex items-center justify-center space-x-2 bg-white text-blue-600 px-6 py-3 rounded-md border border-blue-600 hover:bg-blue-50 transition w-full">
                <Share2 size={20} />
                <span>Compartir Inscripción</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}