import React, { useState, useEffect } from 'react';
import { getAreasCompetencia, getAreasPorConvocatoria, asociarAreas } from '../api/adminConvocatoriaApi';
import AsignarAreasForm from '../components/AsignarAreasForm';
import { useConvocatorias } from '../hooks/useConvocatorias';

export default function AsignarAreasPage() {
  const { convocatorias, loading: loadingConvocatorias } = useConvocatorias();
  const [areas, setAreas] = useState([]);
  const [selectedConvocatoria, setSelectedConvocatoria] = useState('');
  const [areasAsignadas, setAreasAsignadas] = useState([]);
  const [areasDisponibles, setAreasDisponibles] = useState([]);
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedConvocatoria) {
      setIsLoading(true);
      getAreasPorConvocatoria(selectedConvocatoria)
        .then(areasAsignadas => {
          setAreasAsignadas(areasAsignadas);
          const idsAreasAsignadas = areasAsignadas.map(area => area.id_area);
          setAreasDisponibles(areas.filter(area => !idsAreasAsignadas.includes(area.id_area)));
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    } else {
      setAreasAsignadas([]);
      setAreasDisponibles(areas);
    }
  }, [selectedConvocatoria, areas]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const areasResponse = await getAreasCompetencia();
      setAreas(Array.isArray(areasResponse) ? areasResponse : []);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAreaSelect = (areaId) => {
    const isSelected = selectedAreas.some((area) => area.id_area === areaId);
    if (isSelected) {
      setSelectedAreas(selectedAreas.filter((area) => area.id_area !== areaId));
    } else {
      setSelectedAreas([...selectedAreas, { id_area: areaId }]);
    }
  };

  const handleAsignarAreas = async (e) => {
    e.preventDefault();
    if (!selectedConvocatoria || selectedAreas.length === 0) return;
    setIsLoading(true);
    try {
      // Enviar costo_inscripcion: 0 por defecto para cada área
      const areasData = selectedAreas.map(area => ({ id_area: area.id_area, costo_inscripcion: 0 }));
      const dataToSubmit = { id_convocatoria: selectedConvocatoria, areas: areasData };
      await asociarAreas(dataToSubmit);
      setSelectedAreas([]);
      // Refresca las áreas asignadas y disponibles
      getAreasPorConvocatoria(selectedConvocatoria).then(setAreasAsignadas);
      fetchData();
    } catch (error) {
      alert('Error al asignar áreas. Por favor, inténtelo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AsignarAreasForm
      convocatorias={convocatorias || []}
      areas={areas || []}
      areasAsignadas={areasAsignadas || []}
      areasDisponibles={areasDisponibles || []}
      selectedConvocatoria={selectedConvocatoria}
      selectedAreas={selectedAreas || []}
      isLoading={isLoading}
      onConvocatoriaChange={e => {
        setSelectedConvocatoria(e.target.value);
        setSelectedAreas([]);
      }}
      onAreaSelect={handleAreaSelect}
      onSubmit={handleAsignarAreas}
    />
  );
}
