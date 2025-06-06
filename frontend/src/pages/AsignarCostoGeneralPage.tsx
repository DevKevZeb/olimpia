import React, { useState } from 'react';
import { setCostoGeneralConvocatoria, getAreasPorConvocatoria } from '../api/adminConvocatoriaApi';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import { useConvocatoriasPlanificadas } from '../hooks/useConvocatorias';

// Reutilizar FormInput, FormSelect y useConvocatorias en más páginas
// Ejemplo: ConvocatoriasPage, CrearNivelPage, etc.
// Puedes replicar el patrón aplicado en AsignarCostoGeneralPage para reducir duplicación y mejorar clean code en todos los formularios y selects de tu dashboard.
// Si quieres que lo aplique en una página específica, indícalo y lo implemento directamente.

export default function AsignarCostoGeneralPage({ onCostoAsignado }) {
  const { convocatorias, loading: loadingConvocatorias } = useConvocatoriasPlanificadas();
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
        // Nueva lógica: si todos los costos son 0 (numérico o string)
        const todosCero = costos.length > 0 && costos.every(c => c === 0 || c === '0' || c === 0.0 || c === '0.00');
        const unicos = Array.from(new Set(costos.filter(c => c !== null && c !== undefined)));
        if (todosNull || todosCero) {
          setMensajeCosto('Esta convocatoria no tiene un costo asignado.');
        } else if (unicos.length === 1) {
          setCostoActual(unicos[0]);
          // Asegurar que el valor sea string y entero
          const val = unicos[0];
          setCostoGeneral(Number.parseInt(String(val), 10).toString());
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
    if (!costoGeneral || isNaN(Number(costoGeneral)) || Number(costoGeneral) <= 0 || !Number.isInteger(Number(costoGeneral))) {
      setError('Ingrese un costo válido (entero positivo > 0)');
      return;
    }
    // Validar si el costo ingresado es igual al actual
    if (costoActual !== null && Number(costoGeneral) === Number(costoActual)) {
      setError('Ese costo ya está asignado a todas las áreas.');
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Asignar Costo General a Áreas</h1>
      </div>
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
          <div className="mb-2 text-sm text-blue-700">Costo actual: <b>{parseInt(costoActual, 10)}</b></div>
        )}
        <FormInput
          label="Costo General"
          type="number"
          value={costoGeneral}
          onChange={e => {
            // Solo permitir números enteros positivos
            const val = e.target.value;
            if (/^\d*$/.test(val)) {
              setCostoGeneral(val);
            }
          }}
          min="1"
          step="1"
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
            {isLoading ? 'Asignando...' : 'Asignar Costo General'}          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
