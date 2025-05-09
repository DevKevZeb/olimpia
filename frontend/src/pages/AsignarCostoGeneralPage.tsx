import React, { useState } from 'react';
import { setCostoGeneralConvocatoria, getAreasPorConvocatoria } from '../api/adminConvocatoriaApi';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import { useConvocatorias } from '../hooks/useConvocatorias';

// Reutilizar FormInput, FormSelect y useConvocatorias en más páginas
// Ejemplo: ConvocatoriasPage, CrearNivelPage, etc.
// Puedes replicar el patrón aplicado en AsignarCostoGeneralPage para reducir duplicación y mejorar clean code en todos los formularios y selects de tu dashboard.
// Si quieres que lo aplique en una página específica, indícalo y lo implemento directamente.

export default function AsignarCostoGeneralPage({ onCostoAsignado }) {
  const { convocatorias, loading: loadingConvocatorias } = useConvocatorias();
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
        <FormSelect
          label="Seleccionar Convocatoria"
          value={selectedConvocatoria}
          onChange={handleConvocatoriaChange}
          required
          error={error && !selectedConvocatoria ? error : ''}
          disabled={loadingConvocatorias}
        >
          <option value="">-- Seleccione una convocatoria --</option>
          {(convocatorias || []).map(convocatoria => (
            <option key={convocatoria.id_convocatoria} value={convocatoria.id_convocatoria}>
              {convocatoria.nombre}
            </option>
          ))}
        </FormSelect>
        {mensajeCosto && <div className="mb-2 text-sm text-gray-500">{mensajeCosto}</div>}
        {costoActual !== null && (
          <div className="mb-2 text-sm text-blue-700">Costo actual: <b>{costoActual}</b></div>
        )}
        <FormInput
          label="Costo General"
          type="number"
          value={costoGeneral}
          onChange={e => setCostoGeneral(e.target.value)}
          min="0"
          step="0.01"
          required
          error={error && selectedConvocatoria ? error : ''}
        />
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
