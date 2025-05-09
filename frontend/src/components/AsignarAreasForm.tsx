import React from 'react';

interface AsignarAreasFormProps {
  convocatorias: any[];
  areas: any[];
  areasAsignadas: any[];
  areasDisponibles: any[];
  selectedConvocatoria: string;
  selectedAreas: any[];
  isLoading: boolean;
  onConvocatoriaChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onAreaSelect: (areaId: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function AsignarAreasForm({
  convocatorias = [],
  areas = [],
  areasAsignadas = [],
  areasDisponibles = [],
  selectedConvocatoria = '',
  selectedAreas = [],
  isLoading = false,
  onConvocatoriaChange = () => {},
  onAreaSelect = () => {},
  onSubmit = () => {},
}: AsignarAreasFormProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-6">Asignar Áreas a Convocatoria</h2>
      <p className="text-gray-600 mb-6">Selecciona las áreas para una convocatoria existente</p>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">Seleccionar Convocatoria</label>
          <select
            value={selectedConvocatoria}
            onChange={onConvocatoriaChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            required
          >
            <option value="">-- Seleccione una convocatoria --</option>
            {(convocatorias || []).map(convocatoria => (
              <option key={convocatoria.id_convocatoria} value={convocatoria.id_convocatoria}>
                {convocatoria.nombre}
              </option>
            ))}
          </select>
        </div>
        {selectedConvocatoria && areasAsignadas.length > 0 && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Áreas ya asignadas</h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {(areasAsignadas || []).map(area => (
                <div key={`assigned-${area.id_area}`} className="px-3 py-2 bg-blue-100 text-blue-800 rounded-md flex items-center">
                  <span className="text-sm font-medium">{area.nombre_area}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Estas áreas ya están asignadas a la convocatoria y no pueden seleccionarse nuevamente.
            </p>
          </div>
        )}
        {selectedConvocatoria && (
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">
              Áreas disponibles para asignar
              {(areasDisponibles || []).length === 0 && (
                <span className="text-sm font-normal ml-2 text-orange-600">
                  (No hay áreas disponibles para asignar)
                </span>
              )}
            </h3>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (areasDisponibles || []).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(areasDisponibles || []).map((area) => (
                  <div 
                    key={area.id_area} 
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      (selectedAreas || []).some(a => a.id_area === area.id_area) 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'hover:border-gray-400'
                    }`}
                    onClick={() => onAreaSelect(area.id_area)}
                  >
                    <div className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        checked={(selectedAreas || []).some(a => a.id_area === area.id_area)}
                        onChange={() => {}}
                        className="mr-3 h-4 w-4 text-blue-600"
                      />
                      <label className="font-medium text-gray-700">
                        {area.nombre_area}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500">
                  {selectedConvocatoria ? 
                    "Todas las áreas ya han sido asignadas a esta convocatoria." : 
                    "Seleccione una convocatoria para ver las áreas disponibles."
                  }
                </p>
              </div>
            )}
          </div>
        )}
        {(selectedAreas || []).length > 0 && (
          <div className="mb-4">
            <h3 className="text-xl font-bold mb-2">Áreas seleccionadas</h3>
            <div className="flex flex-wrap gap-2">
              {(selectedAreas || []).map(selectedArea => {
                const area = (areas || []).find(a => a.id_area === selectedArea.id_area);
                return (
                  <div key={`tag-${selectedArea.id_area}`} className="bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center">
                    <span>{area?.nombre_area}</span>
                    <button 
                      type="button" 
                      className="ml-2 text-green-600 hover:text-green-800"
                      onClick={() => onAreaSelect(selectedArea.id_area)}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="flex justify-end mt-8">
          <button
            type="submit"
            disabled={isLoading || (selectedAreas || []).length === 0}
            className={`px-6 py-3 rounded-md font-medium transition ${
              isLoading || (selectedAreas || []).length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isLoading ? 'Asignando...' : 'Asignar Áreas'}
          </button>
        </div>
      </form>
    </div>
  );
}
