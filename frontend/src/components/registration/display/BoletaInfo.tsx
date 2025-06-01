import React from 'react';
import { EstudianteFormData, AreaSeleccionada } from '../../../types/registration';

interface Props {
  componentRef?: React.RefObject<HTMLDivElement>;
  encargado: {
    nombre: string;
    ci: string;
    email?: string;
  };
  estudiantes: EstudianteFormData[];
  costoTotalGeneral: number;
  codigoBoleta?: string;
}



const BoletaInfo: React.FC<Props> = ({ componentRef, estudiantes, costoTotalGeneral, encargado, codigoBoleta }) => {

    return (
    <div ref={componentRef} className="border rounded-lg p-6 lg:p-8 mb-4 bg-white max-w-none">
      {/* Header con código */}
      {codigoBoleta && (
        <div className="text-center mb-6">
          <h3 className="text-xl lg:text-2xl font-bold text-gray-800">BOLETA DE PAGO</h3>
          <p className="text-sm lg:text-base text-gray-600 font-medium">Código: {codigoBoleta}</p>
        </div>
      )}
      
      {/* Información del encargado en layout más amplio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <h4 className="font-semibold text-gray-800 mb-3 text-lg">Encargado de Pago</h4>
          <div className="space-y-2">
            <div className="flex flex-row">
              <div className="font-medium text-gray-700 min-w-20">Nombre:</div> 
              <p className="ml-2 text-gray-900">{encargado.nombre}</p>
            </div>
            <div className="flex flex-row">
              <div className="font-medium text-gray-700 min-w-20">CI:</div> 
              <p className="ml-2 text-gray-900">{encargado.ci}</p>
            </div>
          </div>
        </div>
        <div className="flex items-end justify-end">
          <div className="text-right">
            <p className="text-sm text-gray-500">Fecha de emisión</p>
            <p className="font-medium">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>    
    <h4 className="font-semibold text-gray-800 mb-4 text-lg">Detalle de Estudiantes</h4>
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-3">
        <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-700">
          <div className="col-span-1">#</div>
          <div className="col-span-4">Estudiante</div>
          <div className="col-span-2">CI</div>
          <div className="col-span-3">Áreas Seleccionadas</div>
          <div className="col-span-2 text-right">Costo</div>
        </div>
      </div>
      
      <div className="divide-y divide-gray-100">
        {estudiantes.map((estudiante, index) => {
          const costoPorEstudiante = estudiante.areas_seleccionadas ?
            estudiante.areas_seleccionadas.reduce((total: number, area: AreaSeleccionada) => total + (parseFloat(area.costo) || 0), 0) : 0;
            
          return (
            <div key={estudiante.id} className="grid grid-cols-12 gap-4 px-4 py-3 text-sm hover:bg-gray-50">
              <div className="col-span-1 font-medium text-gray-900">{index + 1}</div>
              <div className="col-span-4 font-medium text-gray-900">{estudiante.nombres} {estudiante.apellidos}</div>
              <div className="col-span-2 text-gray-700">{estudiante.ci}</div>
              <div className="col-span-3">
                {estudiante.areas_seleccionadas && estudiante.areas_seleccionadas.length > 0 ? (
                  <div className="space-y-1">
                    {estudiante.areas_seleccionadas.map((area: AreaSeleccionada, i: number) => (
                      <div key={i} className="text-xs bg-blue-50 text-blue-800 px-2 py-1 rounded">
                        {area.area_nombre} - {area.nivel_nombre}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400 italic">Sin áreas</span>
                )}
              </div>
              <div className="col-span-2 text-right font-semibold text-gray-900">{costoPorEstudiante} Bs.</div>
            </div>
          );
        })}
      </div>
    </div>    
    {/* Totales mejorados */}
    <div className="mt-6 border-t pt-4">
      <div className="flex justify-between items-center py-2 text-base text-gray-700">
        <p className="font-medium">Subtotal:</p>
        <p className="font-medium">{costoTotalGeneral} Bs.</p>
      </div>
      <div className="flex justify-between items-center py-3 text-lg font-bold text-gray-900 border-t">
        <p>TOTAL A PAGAR:</p>
        <p className="text-xl text-blue-600">{costoTotalGeneral} Bs.</p>
      </div>
    </div>
  </div>
  );
};

export default BoletaInfo;
