import React from 'react';
import { ChevronRight, AlertCircle } from 'lucide-react';
import { AreaNivel, AreaSeleccionada, Convocatoria } from '../../types/index';

interface AreasSelectionProps {
  areasNiveles: AreaNivel[];
  areas_seleccionadas: AreaSeleccionada[];
  convocatoria: Convocatoria | null;
  isLoading: boolean;
  costoTotal: number;
  formErrorMessage: string;
  onAreaSelect: (areaNivel: AreaNivel) => void;
  onPrevStep: () => void;
  onNextStep: () => void;
}

const AreasSelection: React.FC<AreasSelectionProps> = ({
  areasNiveles,
  areas_seleccionadas,
  convocatoria,
  isLoading,
  costoTotal,
  formErrorMessage,
  onAreaSelect,
  onPrevStep,
  onNextStep,
}) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Selección de Áreas</h3>
      <p className="text-sm text-gray-600 mb-6">
        Selecciona las áreas y niveles en los que deseas participar
        {convocatoria && ` en ${convocatoria.nombre}`}
      </p>

      {isLoading ? (
        <div className="flex justify-center items-center h-60">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : areasNiveles.length === 0 ? (
        <div className="text-center p-8 border rounded-lg">
          <p className="text-gray-600 mb-2">No hay áreas disponibles para el grado seleccionado</p>
          <p className="text-sm text-gray-500">Por favor, selecciona otro grado o contacta con el administrador.</p>
        </div>
      ) : (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <h4 className="text-base font-semibold">Áreas Disponibles</h4>
              {convocatoria && (
                <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  {areas_seleccionadas.length}/{convocatoria.max_areas}
                </span>
              )}
              <div className="ml-2 text-gray-400 cursor-help" title="Puedes seleccionar hasta el máximo de áreas permitidas">
                <span>ⓘ</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Costo Total</p>
              <p className="font-bold">{costoTotal} Bs.</p>
            </div>
          </div>
          
          {/* Mensaje de error */}
          {formErrorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
              <p className="text-red-700 text-sm">{formErrorMessage}</p>
            </div>
          )}

          {/* Lista de áreas disponibles */}
          {areasNiveles.map((areaNivel) => (
            <div key={areaNivel.id_convocatoria_nivel} className="border rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <h5 className="font-semibold">{areaNivel.area.nombre}</h5>
                <div className="flex items-center">
                  <span className="text-sm mr-2">{areaNivel.costo} Bs.</span>
                  <input 
                    type="checkbox" 
                    className="h-5 w-5 text-blue-600" 
                    checked={areas_seleccionadas.some(area => area.id_convocatoria_nivel === areaNivel.id_convocatoria_nivel)}
                    onChange={() => onAreaSelect(areaNivel)}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">Nivel: <strong>{areaNivel.nivel.nombre}</strong></p>
              </div>
              {areas_seleccionadas.some(area => area.id_convocatoria_nivel === areaNivel.id_convocatoria_nivel) && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-green-600">✓ Área seleccionada. En el siguiente paso deberás ingresar la información del tutor académico.</p>
                </div>
              )}
            </div>
          ))}
          
          {/* Mensaje para seleccionar al menos un área */}
          {areas_seleccionadas.length === 0 && (
            <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-md mt-4">
              <p className="text-yellow-700 text-sm">Debes seleccionar al menos un área para continuar</p>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between mt-6">
        <button
          onClick={onPrevStep}
          className="border border-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-50 flex items-center"
        >
          <span>Atrás</span>
        </button>
        <button
          onClick={onNextStep}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center"
          disabled={areas_seleccionadas.length === 0}
        >
          <span className="mr-2">Continuar</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default AreasSelection;
