import React, { useState } from 'react';
import { createNivelCategoria } from '../api/adminConvocatoriaApi';

export default function CrearNivelPage({ onNivelCreado }) {
  const [nuevoNivel, setNuevoNivel] = useState('');
  const [nivelError, setNivelError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCrearNivel = async (e) => {
    e.preventDefault();
    if (!nuevoNivel.trim()) {
      setNivelError('El nombre del nivel no puede estar vacío');
      return;
    }
    setNivelError('');
    setIsLoading(true);
    try {
      await createNivelCategoria(nuevoNivel.trim());
      setNuevoNivel('');
      if (onNivelCreado) onNivelCreado();
      alert('Nivel creado exitosamente');
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        setNivelError(`Error: ${error.response.data.message}`);
      } else {
        setNivelError('Error al crear el nivel. Por favor, inténtelo de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 mt-8">
      <h2 className="text-2xl font-bold mb-6">Crear Nuevo Nivel de Categoría</h2>
      <form onSubmit={handleCrearNivel}>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Nombre del Nivel</label>
          <input
            type="text"
            value={nuevoNivel}
            onChange={e => setNuevoNivel(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            maxLength={50}
            required
          />
          {nivelError && <p className="mt-1 text-sm text-red-600">{nivelError}</p>}
        </div>
        <div className="flex justify-end mt-8">
          <button
            type="submit"
            disabled={isLoading}
            className={`px-6 py-3 rounded-md font-medium transition ${
              isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isLoading ? 'Creando...' : 'Crear Nivel'}
          </button>
        </div>
      </form>
    </div>
  );
}
