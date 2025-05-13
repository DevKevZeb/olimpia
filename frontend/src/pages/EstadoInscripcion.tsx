import React, { useState } from 'react';

export default function EstadoInscripcion() {
  const [ci, setCi] = useState('');
  const [estado, setEstado] = useState('');
  const [fecha, setFecha] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!/^\d+$/.test(ci)) {
      setError('El CI debe contener solo números');
      return;
    }

    setError('');
    setCargando(true);
    setEstado('');
    setFecha('');

    try {
      const response = await fetch(`http://localhost:8000/api/estado-inscripcion/${ci}`);
      const data = await response.json();
      console.log(data);
      if (response.ok) {
        setEstado(data.estado || '');
        setFecha(data.fecha_inscripcion || '');
      } else {
        setError(data.message || 'No se pudo obtener el estado');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md mt-6">
      <h2 className="text-xl font-semibold mb-4">Consultar Estado de Inscripción</h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="ci" className="block text-sm font-medium text-gray-700 mb-1">
            Cédula de Identidad (CI)
          </label>
          <input
            type="text"
            id="ci"
            value={ci}
            onChange={(e) => setCi(e.target.value.replace(/\D/g, ''))}
            className="w-full border px-4 py-2 rounded-md"
            placeholder="Ingrese su CI sin puntos ni guiones"
            required
          />
        </div>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <button
          type="submit"
          disabled={cargando}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          {cargando ? 'Consultando...' : 'Consultar'}
        </button>
      </form>

      {(estado || fecha) && (
        <div className="mt-4 p-4 rounded-md border bg-gray-50">
          <p className="text-sm text-gray-700">Estado actual del postulante:</p>
          <p className="text-lg font-bold capitalize text-blue-700">{estado}</p>
          {fecha && (
            <p className="text-sm text-gray-700 mt-2">
              <span className="font-semibold">Fecha de inscripción:</span>{' '}
              {new Date(fecha).toLocaleDateString('es-BO', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
