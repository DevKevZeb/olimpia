import { useState, useEffect } from 'react';
import { getConvocatoriasActivas , getConvocatoriasPlanificadas } from '../api/adminConvocatoriaApi';

export function useConvocatorias() {
  const [convocatorias, setConvocatorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    getConvocatoriasActivas()
      .then(data => setConvocatorias(data || []))
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }, []);

  return { convocatorias, loading, error };
}

export function useConvocatoriasPlanificadas() {
  const [convocatorias, setConvocatorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    getConvocatoriasPlanificadas()
      .then(data => setConvocatorias(data || []))
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }, []);

  return { convocatorias, loading, error };
}
