import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Convocatoria {
  id: number;
  nombre: string;
  fecha_fin_inscripcion: string;
}

export default function AmpliarFecha() {
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
  const [seleccionada, setSeleccionada] = useState<Convocatoria | null>(null);
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [error, setError] = useState('');

  const obtenerConvocatorias = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/v1/convocatorias');
      setConvocatorias(response.data.data);
    } catch (err) {
      setError('No se pudo obtener la lista de convocatorias.');
    }
  };

  useEffect(() => {
    obtenerConvocatorias();
  }, []);

  const manejarAmpliacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seleccionada || !nuevaFecha) return;

    <p className="text-sm">
      <strong>Fecha actual de fin de inscripción:</strong>{' '}
      {formatearFecha(seleccionada.fecha_fin_inscripcion)}

    </p>


    setError('');
    try {
      await axios.put(
        `http://localhost:8000/api/convocatorias/${seleccionada.id}/ampliar-fecha`,
        { nueva_fecha: nuevaFecha }
      );

      setSeleccionada({
        ...seleccionada,
        fecha_fin_inscripcion: nuevaFecha,
      });
      
      alert('La fecha de inscripción fue actualizada exitosamente.');
      window.close(); // Cierra si es una ventana emergente
      // Alternativa: window.location.href = '/otra-ruta'; ← si quieres redirigir
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al ampliar la fecha.');
    }
  };

  const formatearFecha = (iso: string) => {
    const [año, mes, dia] = iso.slice(0, 10).split("-");
    return `${dia}-${mes}-${año}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Ampliar Fecha de Inscripción</h1>
      </div>
      <div className="bg-white rounded-lg shadow-lg p-8 mt-8">
        <p className="mb-4 text-sm text-gray-600">Seleccionar convocatoria</p>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="mb-4">
        <label htmlFor="convocatoria" className="block text-sm font-medium mb-1">
          Convocatoria
        </label>
        <select
          id="convocatoria"
          className="w-full border px-3 py-2 rounded-md"
          value={seleccionada?.id || ''}
          onChange={(e) => {
            const id = Number(e.target.value);
            const conv = convocatorias.find((c) => c.id === id) || null;
            setSeleccionada(conv);
            setNuevaFecha('');
            setError('');
          }}
        >
          <option value="">-- Seleccione una convocatoria --</option>
          {convocatorias.map((conv) => (
            <option key={conv.id} value={conv.id}>
              {conv.nombre}
            </option>
          ))}
        </select>
      </div>

      {seleccionada && (
        <form onSubmit={manejarAmpliacion}>
          <div className="mb-4">
            <p className="text-sm">
              <strong>Fecha actual de fin de inscripción:</strong>{' '}
              {formatearFecha(seleccionada.fecha_fin_inscripcion)}

            </p>

          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="nueva-fecha">
              Nueva fecha de inscripción
            </label>
            <input
              type="date"
              id="nueva-fecha"
              className="w-full border px-3 py-2 rounded-md"
              value={nuevaFecha}
              min={seleccionada.fecha_fin_inscripcion.slice(0, 10)}
              onChange={(e) => setNuevaFecha(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Guardar Cambios
          </button>        </form>
      )}
      </div>
    </div>
  );
}