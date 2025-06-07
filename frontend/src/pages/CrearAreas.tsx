import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function CrearArea() {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [areasExistentes, setAreasExistentes] = useState<string[]>([]);
  const [formVisible, setFormVisible] = useState(true);

  const validarNombre = (valor: string) => {
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{1,30}$/;
    return regex.test(valor);
  };

  const validarDescripcion = (valor: string) => valor.length <= 200;

  const obtenerAreas = async () => {
    try {
      const response = await axios.get('https://corvus.tis.cs.umss.edu.bo/api/areas');
      setAreasExistentes(response.data); // Solo array de strings
    } catch (err) {
      console.error('Error al obtener las áreas existentes.');
    }
  };

  useEffect(() => {
    obtenerAreas();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validarNombre(nombre)) {
      setError('El nombre del área debe tener máximo 30 caracteres, sin números ni caracteres especiales.');
      return;
    }

    if (!validarDescripcion(descripcion)) {
      setError('La descripción no debe superar los 200 caracteres.');
      return;
    }

    setError('');
    setExito('');

    try {
      await axios.post('https://corvus.tis.cs.umss.edu.bo/api/areas', {
        nombre_area: nombre,
        descripcion: descripcion
      });

      setNombre('');
      setDescripcion('');
      obtenerAreas(); // Actualiza lista

      alert('Área creada exitosamente.');
      setFormVisible(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear el área.');
    }
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Crear Nueva Área</h1>
      </div>
      <div className="bg-white rounded-lg shadow-lg p-8 mt-8">
        {formVisible && (
          <>
        <h2 className="text-xl font-semibold mb-4">Áreas Existentes</h2>
        <div className="flex flex-wrap gap-2 mb-6 text-sm text-gray-700">
          {areasExistentes.length > 0 ? (
            areasExistentes.map((nombre, index) => (
              <span key={index} className="bg-gray-200 px-3 py-1 rounded-full">
                {nombre}
              </span>
            ))
          ) : (
            <p>No hay áreas registradas.</p>
          )}
        </div>
        <h2 className="text-xl font-semibold mb-4">Crear Nueva Área</h2>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className=
            "block mb-1 text-sm font-medium">Nombre del Área</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value.toUpperCase())}
              className="w-full border px-3 py-2 rounded-md"
              maxLength={30}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium">Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full border px-3 py-2 rounded-md"
              maxLength={200}
            />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Crear Área
          </button>
        </form>
      </>
    )}
  </div>
</div>
  );
}