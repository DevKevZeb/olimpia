import React from 'react';
import { X } from 'lucide-react';
import type { RegistrationSummary } from '../../types';

interface StudentDetailsProps {
  registration: RegistrationSummary;
  onClose: () => void;
}

export function StudentDetails({ registration, onClose }: StudentDetailsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center border-b pb-4">
          <h3 className="text-xl font-semibold text-gray-900">Detalles del Estudiante</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mt-6 space-y-6">
          {/* Información del Estudiante */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Información Personal</h4>
            <div className="grid grid-cols-2 gap-4">
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
              <div>
                <p className="text-sm text-gray-500">Fecha de Nacimiento</p>
                <p className="font-medium">{registration.student.birthDate}</p>
              </div>
            </div>
          </div>

          {/* Información del Tutor */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Información del Tutor</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Nombre</p>
                <p className="font-medium">{registration.student.guardian.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{registration.student.guardian.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Teléfono</p>
                <p className="font-medium">{registration.student.guardian.phone}</p>
              </div>
            </div>
          </div>

          {/* Áreas de Competencia */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Áreas de Competencia</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              {registration.areas.map((area) => (
                <div key={area.id} className="flex justify-between items-center py-2">
                  <div>
                    <p className="font-medium">{area.name}</p>
                    <p className="text-sm text-gray-500">{area.level}</p>
                  </div>
                  <p className="font-medium">{formatCurrency(area.cost)}</p>
                </div>
              ))}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <p className="font-semibold">Total</p>
                  <p className="font-semibold">{formatCurrency(registration.totalCost)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Estado de Pago */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Estado de Pago</p>
                <p className={`font-medium ${
                  registration.paymentStatus === 'completed' ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {registration.paymentStatus === 'completed' ? 'Pagado' : 'Pendiente'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Fecha de Registro</p>
                <p className="font-medium">
                  {new Date(registration.registrationDate).toLocaleDateString('es-BO')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}