import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import ConvocatoriaWizard from '../components/admin/ConvocatoriaWizard';

export function Admin() {
  const [showWizard, setShowWizard] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {!showWizard ? (
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">
            Panel de Administración
          </h1>
          <button
            onClick={() => setShowWizard(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition shadow-md hover:shadow-lg mx-auto"
          >
            <Plus size={20} />
            Nueva Convocatoria
          </button>
          <p className="mt-4 text-gray-500 max-w-md mx-auto">
            Cree una nueva convocatoria y configure sus áreas, niveles y grados permitidos para la competencia.
          </p>
        </div>
      ) : (
        <ConvocatoriaWizard onClose={() => setShowWizard(false)} />
      )}
    </div>
  );
}