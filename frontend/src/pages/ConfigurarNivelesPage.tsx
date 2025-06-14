import React, { useState, useEffect } from 'react';
import { getAreasPorConvocatoria, getNivelesPorConvocatoria, getNivelesCategoria, getGrados, asociarNivelesGrados } from '../api/adminConvocatoriaApi';
import FormSelect from '../components/FormSelect';
import { useConvocatoriasPlanificadas } from '../hooks/useConvocatorias';
import Modal from '../components/Modal'; // Debes tener un componente Modal reutilizable

// Tipos explícitos
interface Area {
  id_area: number;
  nombre_area: string;
}
interface Nivel {
  id_nivel: number;
  nombre_nivel: string;
}
interface Grado {
  id_grado: number;
  nombre_grado: string;
}
interface NivelAsignado {
  id_convocatoria_nivel: number;
  id_area: number;
  nombre_nivel: string;
  nombre_grado_min: string;
  nombre_grado_max: string;
}

const GRADOS_PRIMARIA = [3, 4, 5, 6]; // IDs de grados 3P-6P (ajusta según tus datos reales)
const GRADOS_SECUNDARIA = [7, 8, 9, 10, 11, 12]; // IDs de grados 1S-6S (ajusta según tus datos reales)
const NIVELES_PRIMARIA = ['3P-6P'];
const NIVELES_SECUNDARIA = ['1S-6S'];

// Asociación automática 1 a 1 para niveles tipo "3P", "4P", ... "6P", "1S", ... "6S"
const NIVEL_GRADO_AUTOMATICO: { [nivel: string]: string } = {
  '3P': '3ro primaria',
  '4P': '4to primaria',
  '5P': '5to primaria',
  '6P': '6to primaria',
  '1S': '1ro secundaria',
  '2S': '2do secundaria',
  '3S': '3ro secundaria',
  '4S': '4to secundaria',
  '5S': '5to secundaria',
  '6S': '6to secundaria',
};

type NivelGradosMap = { [nivelId: number]: number[] };

export default function ConfigurarNivelesPage() {
  const { convocatorias, loading: loadingConvocatorias } = useConvocatoriasPlanificadas();
  const [areasConvocatoria, setAreasConvocatoria] = useState<Area[]>([]);
  const [nivelesAsignados, setNivelesAsignados] = useState<NivelAsignado[]>([]);
  const [nivelesDisponibles, setNivelesDisponibles] = useState<Nivel[]>([]);
  const [grados, setGrados] = useState<Grado[]>([]);
  const [selectedConvocatoria, setSelectedConvocatoria] = useState<string>('');
  const [selectedAreas, setSelectedAreas] = useState<number[]>([]);
  const [selectedNiveles, setSelectedNiveles] = useState<Nivel[]>([]);
  const [nivelGrados, setNivelGrados] = useState<NivelGradosMap>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showAsignados, setShowAsignados] = useState(false);
  const [gradoModalNivel, setGradoModalNivel] = useState<Nivel | null>(null);

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
        setNivelesDisponibles(Array.isArray(nivelesCat) ? nivelesCat : []);
        setGrados(Array.isArray(gradosData) ? gradosData : []);
        setSelectedAreas([]);
        setSelectedNiveles([]);
        setNivelGrados({});
        setSuccessMsg('');
        setErrorMsg('');
        setIsLoading(false);
      }).catch(() => setIsLoading(false));
    } else {
      setAreasConvocatoria([]);
      setNivelesAsignados([]);
      setNivelesDisponibles([]);
      setSelectedAreas([]);
      setSelectedNiveles([]);
      setNivelGrados({});
    }
  }, [selectedConvocatoria]);

  const handleAreaSelect = (areaId: number) => {
    setSelectedAreas(prev =>
      prev.includes(areaId) ? prev.filter(id => id !== areaId) : [...prev, areaId]
    );
    setSelectedNiveles([]);
    setNivelGrados({});
  };

  const handleNivelSelect = (nivel: Nivel) => {
    const isSelected = selectedNiveles.some(n => n.id_nivel === nivel.id_nivel);
    let nuevosNiveles: Nivel[];
    if (isSelected) {
      nuevosNiveles = selectedNiveles.filter(n => n.id_nivel !== nivel.id_nivel);
    } else {
      nuevosNiveles = [...selectedNiveles, nivel];
    }
    setSelectedNiveles(nuevosNiveles);
    // Asociación automática de grados
    const nuevosNivelGrados: NivelGradosMap = { ...nivelGrados };
    if (!isSelected) {
      if (NIVEL_GRADO_AUTOMATICO[nivel.nombre_nivel]) {
        // Buscar el grado exacto por nombre (ignorando mayúsculas/minúsculas y espacios)
        const nombreBuscado = NIVEL_GRADO_AUTOMATICO[nivel.nombre_nivel].replace(/\s+/g, '').toLowerCase();
        const grado = grados.find(g => g.nombre_grado.replace(/\s+/g, '').toLowerCase() === nombreBuscado);
        nuevosNivelGrados[nivel.id_nivel] = grado ? [grado.id_grado] : [];
      } else if (NIVELES_PRIMARIA.includes(nivel.nombre_nivel)) {
        nuevosNivelGrados[nivel.id_nivel] = grados.filter(g => GRADOS_PRIMARIA.includes(g.id_grado)).map(g => g.id_grado);
      } else if (NIVELES_SECUNDARIA.includes(nivel.nombre_nivel)) {
        nuevosNivelGrados[nivel.id_nivel] = grados.filter(g => GRADOS_SECUNDARIA.includes(g.id_grado)).map(g => g.id_grado);
      } else {
        nuevosNivelGrados[nivel.id_nivel] = [];
      }
    } else {
      delete nuevosNivelGrados[nivel.id_nivel];
    }
    setNivelGrados(nuevosNivelGrados);
  };

  const handleGradoSelect = (gradoId: number, nivelId: number) => {
    const currentGrados = nivelGrados[nivelId] || [];
    const isSelected = currentGrados.includes(gradoId);
    let nuevos: number[];
    if (isSelected) {
      nuevos = currentGrados.filter((g: number) => g !== gradoId);
    } else {
      nuevos = [...currentGrados, gradoId];
    }
    setNivelGrados({ ...nivelGrados, [nivelId]: nuevos });
  };

  const handleConfigurarNiveles = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    // DEBUG: Log para ver el estado antes de guardar
    console.log('nivelGrados:', nivelGrados);
    console.log('selectedNiveles:', selectedNiveles);
    console.log('grados:', grados);
    if (!selectedConvocatoria || selectedAreas.length === 0 || selectedNiveles.length === 0) {
      setErrorMsg('Seleccione al menos un área y un nivel.');
      return;
    }
    // Filtrar niveles seleccionados que ya están asignados a las áreas seleccionadas
    const nivelesNoAsignados = selectedNiveles.filter(nivel =>
      !nivelesAsignados.some(
        n => n.id_nivel === nivel.id_nivel && selectedAreas.includes(n.id_area)
      )
    );
    if (nivelesNoAsignados.length !== selectedNiveles.length) {
      setErrorMsg('Algunos niveles seleccionados ya están asignados a las áreas. Actualice la selección.');
      return;
    }
    const nivelesValidos = selectedNiveles.every(nivel => nivelGrados[nivel.id_nivel] && nivelGrados[nivel.id_nivel].length > 0);
    if (!nivelesValidos) {
      setErrorMsg('Todos los niveles deben tener al menos un grado asociado.');
      return;
    }
    setIsLoading(true);
    try {
      const nivelesData: { id_nivel: number; id_area: number; id_grado_min: number; id_grado_max: number }[] = [];
      selectedAreas.forEach(areaId => {
        selectedNiveles.forEach(nivel => {
          const gradosSeleccionados = nivelGrados[nivel.id_nivel] || [];
          nivelesData.push({
            id_nivel: nivel.id_nivel,
            id_area: areaId,
            id_grado_min: Math.min(...gradosSeleccionados),
            id_grado_max: Math.max(...gradosSeleccionados)
          });
        });
      });
      const dataToSubmit = { id_convocatoria: selectedConvocatoria, niveles: nivelesData };
      console.log('dataToSubmit:', dataToSubmit);
      await asociarNivelesGrados(dataToSubmit);
      setSelectedAreas([]);
      setSelectedNiveles([]);
      setNivelGrados({});
      setSuccessMsg('Configuración guardada correctamente.');
      setIsLoading(false);
      const [areasData, nivelesDataResp] = await Promise.all([
        getAreasPorConvocatoria(selectedConvocatoria),
        getNivelesPorConvocatoria(selectedConvocatoria)
      ]);
      setAreasConvocatoria(Array.isArray(areasData) ? areasData : []);
      setNivelesAsignados(Array.isArray(nivelesDataResp) ? nivelesDataResp : []);
    } catch {
      setErrorMsg('Ocurrió un error al guardar.');
      setIsLoading(false);
    }
  };

  // Modal para editar grados
  const openGradoModal = (nivel: Nivel) => setGradoModalNivel(nivel);
  const closeGradoModal = () => setGradoModalNivel(null);

  // Niveles ya asignados por área (para validación)
  const nivelesAsignadosIds = new Set(
    nivelesAsignados.map(n => n.id_nivel)
  );
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Configurar Niveles y Grados</h1>
      </div>
      <div className="bg-white rounded-lg shadow-lg p-8 mt-8">
      {/* Panel SIEMPRE visible para niveles ya asignados */}
      <div className="mb-6">
        <div className="bg-gray-50 rounded p-3 border">
          <h3 className="text-base font-semibold mb-2">Niveles ya asignados por área</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {areasConvocatoria.map(area => (
              <div key={area.id_area}>
                <div className="font-semibold text-xs mb-1">{area.nombre_area}</div>
                {nivelesAsignados.filter(n => n.id_area === area.id_area).length === 0 ? (
                  <span className="text-gray-400 text-xs">Ninguno</span>
                ) : (
                  <ul className="ml-2 list-disc text-xs">
                    {nivelesAsignados.filter(n => n.id_area === area.id_area).map(nivel => (
                      <li key={nivel.id_convocatoria_nivel}>
                        {nivel.nombre_nivel} (Grados: {nivel.nombre_grado_min} a {nivel.nombre_grado_max})
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <form onSubmit={handleConfigurarNiveles}>
        <FormSelect
          label="Seleccionar Convocatoria"
          value={selectedConvocatoria}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedConvocatoria(e.target.value)}
          required
          disabled={loadingConvocatorias}
          error={false}
        >
          <option value="">-- Seleccione una convocatoria --</option>
          {(convocatorias || []).map((convocatoria: { id_convocatoria: number; nombre: string }) => (
            <option key={convocatoria.id_convocatoria} value={convocatoria.id_convocatoria}>
              {convocatoria.nombre}
            </option>
          ))}
        </FormSelect>
        {selectedConvocatoria && areasConvocatoria.length > 0 && (
          <div className="mb-6">
            <div className="font-medium mb-2">Seleccione una o más áreas:</div>
            <div className="flex flex-wrap gap-3">
              {areasConvocatoria.map(area => (
                <label key={area.id_area} className={`px-4 py-2 rounded border cursor-pointer flex items-center gap-2 ${selectedAreas.includes(area.id_area) ? 'bg-purple-100 border-purple-500' : 'bg-gray-50 border-gray-300'}`}>
                  <input
                    type="checkbox"
                    checked={selectedAreas.includes(area.id_area)}
                    onChange={() => handleAreaSelect(area.id_area)}
                  />
                  {area.nombre_area}
                </label>
              ))}
            </div>
          </div>
        )}
        {selectedAreas.length > 0 && (
          <div className="mb-6">
            <div className="font-medium mb-2">Seleccione uno o más niveles para las áreas seleccionadas:</div>
            <div className="flex flex-wrap gap-3">
              {nivelesDisponibles.map(nivel => {
                // Deshabilitar si el nivel ya está asignado a alguna de las áreas seleccionadas
                const nivelYaAsignado = nivelesAsignados.some(
                  n => n.id_nivel === nivel.id_nivel && selectedAreas.includes(n.id_area)
                );
                return (
                  <label
                    key={nivel.id_nivel}
                    className={`px-4 py-2 rounded border cursor-pointer flex items-center gap-2 ${selectedNiveles.some(n => n.id_nivel === nivel.id_nivel) ? 'bg-green-100 border-green-500' : 'bg-gray-50 border-gray-300'} ${nivelYaAsignado ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedNiveles.some(n => n.id_nivel === nivel.id_nivel)}
                      onChange={() => !nivelYaAsignado && handleNivelSelect(nivel)}
                      disabled={nivelYaAsignado}
                    />
                    {nivel.nombre_nivel}
                    {nivelYaAsignado && <span className="text-xs text-gray-500 ml-1">(ya asignado)</span>}
                  </label>
                );
              })}
            </div>
          </div>
        )}
        {selectedNiveles.length > 0 && (
          <div className="mb-4">
            <div className="font-medium mb-2">Grados asociados a los niveles seleccionados:</div>
            <div className="flex flex-wrap gap-3">
              {selectedNiveles.map(nivel => {
                const gradoAuto = NIVEL_GRADO_AUTOMATICO[nivel.nombre_nivel];
                const gradosSeleccionados = (nivelGrados[nivel.id_nivel] || []).map((id: number) => grados.find(g => g.id_grado === id)?.nombre_grado).filter(Boolean);
                // Si es nivel automático, mostrar como antes
                if (gradoAuto) {
                  return (
                    <div key={nivel.id_nivel} className="bg-gray-50 rounded p-2 border flex flex-col gap-1 min-w-[180px] max-w-xs">
                      <div className="font-semibold text-sm mb-1">{nivel.nombre_nivel}</div>
                      <div className="text-xs">Grado: <span className="font-bold">{gradoAuto}</span></div>
                    </div>
                  );
                }
                // Si es nivel de rango (primaria/secundaria), mostrar todos los grados para seleccionar
                const esRango = NIVELES_PRIMARIA.includes(nivel.nombre_nivel) || NIVELES_SECUNDARIA.includes(nivel.nombre_nivel);
                // Para niveles manuales o de rango, mostrar todos los grados como chips seleccionables
                return (
                  <div key={nivel.id_nivel} className="bg-gray-50 rounded p-2 border flex flex-col gap-1 min-w-[180px] max-w-xs">
                    <div className="font-semibold text-sm mb-1">{nivel.nombre_nivel}</div>
                    <div className="flex flex-wrap gap-1">
                      {grados.map(grado => (
                        <label key={grado.id_grado} className={`px-2 py-0.5 rounded-full text-xs cursor-pointer border flex items-center gap-1 ${
                          (nivelGrados[nivel.id_nivel] || []).includes(grado.id_grado)
                            ? 'bg-purple-100 text-purple-800 border-purple-400 font-semibold'
                            : 'bg-gray-100 text-gray-700 border-gray-300'
                        }`}>
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={(nivelGrados[nivel.id_nivel] || []).includes(grado.id_grado)}
                            onChange={() => handleGradoSelect(grado.id_grado, nivel.id_nivel)}
                          />
                          {grado.nombre_grado}
                        </label>
                      ))}
                    </div>
                    {gradosSeleccionados.length === 0 && (
                      <span className="text-gray-400 text-xs mt-1">Ningún grado seleccionado</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {successMsg && <div className="mb-4 text-green-700 bg-green-100 rounded px-4 py-2">{successMsg}</div>}
        {errorMsg && <div className="mb-4 text-red-700 bg-red-100 rounded px-4 py-2">{errorMsg}</div>}
        <div className="flex justify-end mt-8">
          <button
            type="submit"
            disabled={isLoading || selectedAreas.length === 0 || selectedNiveles.length === 0}
            className={`px-6 py-3 rounded-md font-medium transition ${
              isLoading || selectedAreas.length === 0 || selectedNiveles.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {isLoading ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </form>
      {/* Modal para editar grados */}
      {gradoModalNivel && (
        <Modal onClose={closeGradoModal} title={`Editar grados para ${gradoModalNivel.nombre_nivel}`}>
          <div className="flex flex-wrap gap-2 mb-4">
            {grados.map(grado => (
              <label key={grado.id_grado} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(nivelGrados[gradoModalNivel.id_nivel] || []).includes(grado.id_grado)}
                  onChange={() => handleGradoSelect(grado.id_grado, gradoModalNivel.id_nivel)}
                />
                {grado.nombre_grado}
              </label>
            ))}
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              onClick={closeGradoModal}
            >Cerrar</button>
          </div>        </Modal>
      )}
    </div>
    </div>
  );
}