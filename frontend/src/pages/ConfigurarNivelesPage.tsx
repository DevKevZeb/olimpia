import React, { useState, useEffect } from 'react';
import { getAreasPorConvocatoria, getNivelesPorConvocatoria, getNivelesCategoria, getGrados, asociarNivelesGrados } from '../api/adminConvocatoriaApi';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import { useConvocatorias } from '../hooks/useConvocatorias';

export default function ConfigurarNivelesPage() {
  const { convocatorias, loading: loadingConvocatorias } = useConvocatorias();
  const [areasConvocatoria, setAreasConvocatoria] = useState([]);
  const [nivelesAsignados, setNivelesAsignados] = useState([]);
  const [niveles, setNiveles] = useState([]);
  const [grados, setGrados] = useState([]);
  const [selectedConvocatoria, setSelectedConvocatoria] = useState('');
  const [nivelesDisponiblesPorArea, setNivelesDisponiblesPorArea] = useState({});
  const [selectedNiveles, setSelectedNiveles] = useState([]);
  const [nivelGrados, setNivelGrados] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedConvocatoria) {
      setIsLoading(true);
      Promise.all([
        getAreasPorConvocatoria(selectedConvocatoria),
        getNivelesPorConvocatoria(selectedConvocatoria),
        getNivelesCategoria(),
        getGrados()
      ]).then(([areasData, nivelesData, nivelesCat, gradosData]) => {
        setAreasConvocatoria(Array.isArray(areasData) ? areasData : []);
        setNivelesAsignados(Array.isArray(nivelesData) ? nivelesData : []);
        setNiveles(Array.isArray(nivelesCat) ? nivelesCat : []);
        setGrados(Array.isArray(gradosData) ? gradosData : []);
        // Calcular niveles disponibles por área
        const nivelesDisponibles = {};
        (Array.isArray(areasData) ? areasData : []).forEach(area => {
          const areaId = area.id_area;
          const nivelesAsignadosAEstaArea = (Array.isArray(nivelesData) ? nivelesData : []).filter(n => n.id_area === areaId);
          const idsNivelesAsignados = nivelesAsignadosAEstaArea.map(n => n.id_nivel);
          nivelesDisponibles[areaId] = (Array.isArray(nivelesCat) ? nivelesCat : []).filter(nivel => !idsNivelesAsignados.includes(nivel.id_nivel));
        });
        setNivelesDisponiblesPorArea(nivelesDisponibles);
        setIsLoading(false);
      }).catch(() => setIsLoading(false));
    } else {
      setAreasConvocatoria([]);
      setNivelesAsignados([]);
      setNivelesDisponiblesPorArea({});
      setSelectedNiveles([]);
      setNivelGrados({});
    }
  }, [selectedConvocatoria]);

  const handleNivelSelect = (nivelId, areaId) => {
    const isSelected = selectedNiveles.some(n => n.id_nivel === nivelId && n.id_area === areaId);
    if (isSelected) {
      setSelectedNiveles(selectedNiveles.filter(n => !(n.id_nivel === nivelId && n.id_area === areaId)));
      const updatedGrados = { ...nivelGrados };
      delete updatedGrados[`${areaId}-${nivelId}`];
      setNivelGrados(updatedGrados);
    } else {
      setSelectedNiveles(prev => [...prev, { id_nivel: nivelId, id_area: areaId }]);
      setNivelGrados(prev => ({ ...prev, [`${areaId}-${nivelId}`]: [] }));
    }
  };

  const handleGradoSelect = (gradoId, areaId, nivelId) => {
    const key = `${areaId}-${nivelId}`;
    const currentGrados = nivelGrados[key] || [];
    const isSelected = currentGrados.includes(gradoId);
    if (isSelected) {
      setNivelGrados({ ...nivelGrados, [key]: currentGrados.filter(g => g !== gradoId) });
    } else {
      setNivelGrados({ ...nivelGrados, [key]: [...currentGrados, gradoId] });
    }
  };

  const handleConfigurarNiveles = async (e) => {
    e.preventDefault();
    if (!selectedConvocatoria || selectedNiveles.length === 0) return;
    // Validar que todos los niveles tengan al menos un grado seleccionado
    const nivelesValidos = selectedNiveles.every(nivel => {
      const key = `${nivel.id_area}-${nivel.id_nivel}`;
      return nivelGrados[key] && nivelGrados[key].length > 0;
    });
    if (!nivelesValidos) return;
    setIsLoading(true);
    try {
      const nivelesData = selectedNiveles.map(nivel => {
        const key = `${nivel.id_area}-${nivel.id_nivel}`;
        const gradosSeleccionados = nivelGrados[key] || [];
        return {
          id_nivel: nivel.id_nivel,
          id_area: nivel.id_area,
          id_grado_min: Math.min(...gradosSeleccionados),
          id_grado_max: Math.max(...gradosSeleccionados)
        };
      });
      const dataToSubmit = { id_convocatoria: selectedConvocatoria, niveles: nivelesData };
      await asociarNivelesGrados(dataToSubmit);
      setSelectedNiveles([]);
      setNivelGrados({});
      // Refrescar datos
      fetchData();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 mt-8">
      <h2 className="text-2xl font-bold mb-6">Configurar Niveles y Grados</h2>
      <form onSubmit={handleConfigurarNiveles}>
        <FormSelect
          label="Seleccionar Convocatoria"
          value={selectedConvocatoria}
          onChange={e => setSelectedConvocatoria(e.target.value)}
          required
          disabled={loadingConvocatorias}
        >
          <option value="">-- Seleccione una convocatoria --</option>
          {(convocatorias || []).map(convocatoria => (
            <option key={convocatoria.id_convocatoria} value={convocatoria.id_convocatoria}>
              {convocatoria.nombre}
            </option>
          ))}
        </FormSelect>
        {selectedConvocatoria && areasConvocatoria.length > 0 && areasConvocatoria.map(area => (
          <div key={area.id_area} className="mb-8 border-b pb-6">
            <h3 className="text-lg font-semibold mb-2">Área: {area.nombre_area}</h3>
            <div className="mb-2">
              <span className="font-medium text-gray-600">Niveles ya asignados:</span>
              {nivelesAsignados.filter(n => n.id_area === area.id_area).length === 0 ? (
                <span className="ml-2 text-gray-400">Ninguno</span>
              ) : (
                <ul className="ml-4 list-disc">
                  {nivelesAsignados.filter(n => n.id_area === area.id_area).map(nivel => (
                    <li key={nivel.id_convocatoria_nivel}>
                      {nivel.nombre_nivel} (Grados: {nivel.nombre_grado_min} a {nivel.nombre_grado_max})
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mb-2">
              <span className="font-medium text-gray-600">Niveles disponibles:</span>
              {nivelesDisponiblesPorArea[area.id_area] && nivelesDisponiblesPorArea[area.id_area].length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {nivelesDisponiblesPorArea[area.id_area].map(nivel => (
                    <label key={nivel.id_nivel} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedNiveles.some(n => n.id_nivel === nivel.id_nivel && n.id_area === area.id_area)}
                        onChange={() => handleNivelSelect(nivel.id_nivel, area.id_area)}
                      />
                      {nivel.nombre_nivel}
                    </label>
                  ))}
                </div>
              ) : (
                <span className="ml-2 text-gray-400">No hay niveles disponibles</span>
              )}
            </div>
            {selectedNiveles.filter(n => n.id_area === area.id_area).map(nivel => (
              <div key={nivel.id_nivel} className="mt-2">
                <span className="font-medium text-gray-600">Seleccionar grados para {niveles.find(n => n.id_nivel === nivel.id_nivel)?.nombre_nivel}:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {grados.map(grado => (
                    <label key={grado.id_grado} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(nivelGrados[`${area.id_area}-${nivel.id_nivel}`] || []).includes(grado.id_grado)}
                        onChange={() => handleGradoSelect(grado.id_grado, area.id_area, nivel.id_nivel)}
                      />
                      {grado.nombre_grado}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
        <div className="flex justify-end mt-8">
          <button
            type="submit"
            disabled={isLoading || selectedNiveles.length === 0}
            className={`px-6 py-3 rounded-md font-medium transition ${
              isLoading || selectedNiveles.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {isLoading ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </form>
    </div>
  );
}
