import React, { useState } from 'react';
import { setCostoGeneralConvocatoria, getAreasPorConvocatoria } from '../api/adminConvocatoriaApi';

export default function AsignarCostoGeneralPage({ convocatorias, onCostoAsignado }) {
  const [selectedConvocatoria, setSelectedConvocatoria] = useState('');
  const [costoGeneral, setCostoGeneral] = useState('');
  const [costoActual, setCostoActual] = useState(null);
  const [mensajeCosto, setMensajeCosto] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleConvocatoriaChange = async (e) => {
    const id = e.target.value;
    setSelectedConvocatoria(id);
    setCostoActual(null);
    setMensajeCosto('');
    setCostoGeneral('');
    if (id) {
      try {
        const areas = await getAreasPorConvocatoria(id);
        if (!areas || areas.length === 0) {
          setMensajeCosto('Esta convocatoria no tiene áreas asignadas.');
          return;
        }
        const costos = areas.map(a => a.costo_inscripcion);
        const todosNull = costos.every(c => c === null || c === undefined);
        const unicos = Array.from(new Set(costos.filter(c => c !== null && c !== undefined)));
        if (todosNull) {
          setMensajeCosto('Esta convocatoria no tiene un costo asignado.');
        } else if (unicos.length === 1) {
          setCostoActual(unicos[0]);
          setCostoGeneral(unicos[0]);
        } else {
          setMensajeCosto('Esta convocatoria tiene costos diferentes por área. Puede definir un costo general para unificarlos.');
        }
      } catch {
        setMensajeCosto('No se pudo obtener el costo actual.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!selectedConvocatoria) {
      setError('Debe seleccionar una convocatoria');
      return;
    }
    if (!costoGeneral || isNaN(Number(costoGeneral)) || Number(costoGeneral) <= 0) {
      setError('Ingrese un costo válido (> 0)');
      return;
    }
    setIsLoading(true);
    try {
      await setCostoGeneralConvocatoria(selectedConvocatoria, Number(costoGeneral));
      setCostoGeneral('');
      setSelectedConvocatoria('');
      setCostoActual(null);
      setMensajeCosto('');
      if (onCostoAsignado) onCostoAsignado();
      alert('Costo general asignado correctamente');
    } catch {
      setError('Error al asignar el costo general.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 mt-8">
      <h2 className="text-2xl font-bold mb-6">Asignar Costo General a Áreas</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Seleccionar Convocatoria</label>
          <select
            value={selectedConvocatoria}
            onChange={handleConvocatoriaChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            required
          >
            <option value="">-- Seleccione una convocatoria --</option>
            {(convocatorias || []).map(convocatoria => (
              <option key={convocatoria.id_convocatoria} value={convocatoria.id_convocatoria}>
                {convocatoria.nombre}
              </option>
            ))}
          </select>
        </div>
        {mensajeCosto && <div className="mb-2 text-sm text-gray-500">{mensajeCosto}</div>}
        {costoActual !== null && (
          <div className="mb-2 text-sm text-blue-700">Costo actual: <b>{costoActual}</b></div>
        )}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Costo General</label>
          <input
            type="number"
            value={costoGeneral}
            onChange={e => setCostoGeneral(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            min="0"
            step="0.01"
            required
          />
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        <div className="flex justify-end mt-8">
          <button
            type="submit"
            disabled={isLoading}
            className={`px-6 py-3 rounded-md font-medium transition ${
              isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-pink-600 hover:bg-pink-700 text-white'
            }`}
          >
            {isLoading ? 'Asignando...' : 'Asignar Costo General'}
          </button>
        </div>
      </form>
    </div>
  );
}
