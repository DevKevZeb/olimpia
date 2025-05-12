import React from 'react';

interface CrearConvocatoriaFormProps {
  formData: any;
  formErrors: any;
  isLoading: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function CrearConvocatoriaForm({ formData, formErrors, isLoading, onChange, onSubmit }: CrearConvocatoriaFormProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-6">Nueva Convocatoria</h2>
      <p className="text-gray-600 mb-6">Crea una nueva convocatoria para olimpiadas científicas</p>
      {formErrors.general && (
        <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {formErrors.general}
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Nombre</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={onChange}
              className={`w-full border rounded-lg px-4 py-2 ${formErrors.nombre ? 'border-red-500' : 'border-gray-300'}`}
              required
              maxLength={50}
            />
            {formErrors.nombre && (
              <p className="mt-1 text-sm text-red-600">{formErrors.nombre}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">Fecha de Inicio</label>
            <input
              type="date"
              name="fecha_inicio_inscripcion"
              value={formData.fecha_inicio_inscripcion}
              onChange={onChange}
              className={`w-full border rounded-lg px-4 py-2 ${formErrors.fecha_inicio_inscripcion ? 'border-red-500' : 'border-gray-300'}`}
              required
            />
            {formErrors.fecha_inicio_inscripcion && (
              <p className="mt-1 text-sm text-red-600">{formErrors.fecha_inicio_inscripcion}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">Fecha de Fin</label>
            <input
              type="date"
              name="fecha_fin_inscripcion"
              value={formData.fecha_fin_inscripcion}
              onChange={onChange}
              className={`w-full border rounded-lg px-4 py-2 ${formErrors.fecha_fin_inscripcion ? 'border-red-500' : 'border-gray-300'}`}
              required
            />
            {formErrors.fecha_fin_inscripcion && (
              <p className="mt-1 text-sm text-red-600">{formErrors.fecha_fin_inscripcion}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">Máximo de Áreas por Estudiante</label>
            <input
              type="number"
              name="max_areas_por_estudiante"
              value={formData.max_areas_por_estudiante}
              onChange={onChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              min="1"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">Estado</label>
            <select
              name="estado"
              value={formData.estado}
              onChange={onChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              required
            >
              <option value="planificada">Planificada</option>
              <option value="abierta">Abierta</option>
              <option value="cerrada">Cerrada</option>
              <option value="finalizada">Finalizada</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end mt-8">
          <button
            type="submit"
            disabled={isLoading}
            className={`px-6 py-3 rounded-md font-medium transition ${
              isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isLoading ? 'Creando...' : 'Crear Convocatoria'}
          </button>
        </div>
      </form>
    </div>
  );
}
