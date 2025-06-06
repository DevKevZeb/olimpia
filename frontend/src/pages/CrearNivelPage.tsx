import React, { useState } from 'react';
import { createNivelCategoria } from '../api/adminConvocatoriaApi';
import FormInput from '../components/FormInput';

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setNuevoNivel(value);
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Crear Nuevo Nivel de Categoría</h1>
      </div>
      <div className="bg-white rounded-lg shadow-lg p-8 mt-8">
        <h2 className="text-2xl font-bold mb-6">Crear Nuevo Nivel de Categoría</h2>
      <form onSubmit={handleCrearNivel}>
        <FormInput
          label="Nombre del Nivel"
          type="text"
          value={nuevoNivel}
          onChange={handleInputChange}
          maxLength={50}
          required
          error={nivelError}
        />
        <div className="flex justify-end mt-8">
          <button
            type="submit"
            disabled={isLoading}
            className={`px-6 py-3 rounded-md font-medium transition ${
              isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isLoading ? 'Creando...' : 'Crear Nivel'}          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
