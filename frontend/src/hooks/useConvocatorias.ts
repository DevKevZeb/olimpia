import { useState, useEffect, useCallback } from 'react';
import { getAllConvocatorias, getConvocatoriasPlanificadas } from '../api/adminConvocatoriaApi';

interface Area {
  id_area: number;
  nombre_area: string;
}

interface AreaConvocatoria {
  id_area: number;
  area?: Area;
}

interface Convocatoria {
  id_convocatoria: number;
  nombre: string;
  fecha_inicio_inscripcion: string;
  fecha_fin_inscripcion: string;
  max_areas_por_estudiante: number;
  estado: string;
  areas?: AreaConvocatoria[];
}

export function useConvocatorias() {
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllConvocatorias();
      setConvocatorias(data || []);
      setError(null);
    } catch (err) {
      setError(err as Error);
      setConvocatorias([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { convocatorias, loading, error, refetch };
}

export function useConvocatoriasPlanificadas() {
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    getConvocatoriasPlanificadas()
      .then((data: Convocatoria[]) => setConvocatorias(data || []))
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }, []);

  return { convocatorias, loading, error };
}
