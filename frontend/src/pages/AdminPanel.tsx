import React from 'react';
import ConvocatoriasPage from './ConvocatoriasPage';
import AsignarAreasPage from './AsignarAreasPage';
import ConfigurarNivelesPage from './ConfigurarNivelesPage';
import CrearNivelPage from './CrearNivelPage';
import AsignarCostoGeneralPage from './AsignarCostoGeneralPage';

export default function AdminPanel() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <ConvocatoriasPage />
      <AsignarAreasPage />
      <ConfigurarNivelesPage />
      <CrearNivelPage />
      <AsignarCostoGeneralPage />
    </div>
  );
}