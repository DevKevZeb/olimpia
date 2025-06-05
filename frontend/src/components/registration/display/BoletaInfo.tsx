import React from 'react';
import { EstudianteFormData } from '../../../types/registration';

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
  numeroOrden?: string; // Nueva prop opcional para número de orden específico
}



const BoletaInfo: React.FC<Props> = ({ componentRef, estudiantes, costoTotalGeneral, encargado, codigoBoleta, numeroOrden }) => {
  
  // Generar número de orden formateado - usar prop si existe, sino extraer del código
  const numeroOrdenFinal = numeroOrden || (codigoBoleta ? codigoBoleta.split('-').pop()?.padStart(6, '0') : '000000');
  
  // Convertir costo total a número de manera segura
  const total = Number(costoTotalGeneral || 0);

  // Función para contar áreas cuando hay muchos estudiantes
  const contarAreas = () => {
    const areaCounter: Record<string, number> = {};
    estudiantes.forEach(est => {
      est.areas_seleccionadas?.forEach(area => {
        const nombreArea = area.area_nombre;
        areaCounter[nombreArea] = (areaCounter[nombreArea] || 0) + 1;
      });
    });
    return areaCounter;
  };

  return (
    <div ref={componentRef} className="p-6 bg-white border border-black w-[800px] mx-auto text-[14px]">
      {/* Encabezado institucional oficial */}
      <div className="flex justify-between items-start mb-2">
        <div className="text-left leading-tight">
          <p className="font-bold">UNIVERSIDAD MAYOR DE SAN SIMÓN</p>
          <p className="font-semibold">FACULTAD DE CIENCIAS Y TECNOLOGÍA</p>
          <p className="font-semibold">SECRETARÍA ADMINISTRATIVA</p>
        </div>
      </div>

      {/* Orden de pago + número */}
      <div className="flex flex-col items-center flex-1">
        <div className="text-xl font-bold">ORDEN DE PAGO</div>        <div className="w-full flex justify-between mt-2">
          <div className="text-sm">Código de inscripción: <span className="font-semibold">{codigoBoleta}</span></div>
          <div className="text-red-600 font-bold">N° {numeroOrdenFinal}</div>
        </div>
      </div>

      {/* Señor(es): */}
      <div className="mb-4 flex justify-between mt-2">
        <div>Señor(es): {encargado.nombre}</div>
        <div>CI: {encargado.ci}</div>
      </div>      {/* Mostrar lista detallada o resumen según cantidad de estudiantes */}
      {estudiantes.length <= 5 ? (
        <>
          <h4 className="font-medium text-gray-800 mb-2">Detalle de Estudiantes</h4>
          <div className="border-t border-b py-2">
            <div className="grid grid-cols-12 gap-2 mb-2 text-sm font-medium">
              <div className="col-span-1">#</div>
              <div className="col-span-4">Estudiante</div>
              <div className="col-span-2">CI</div>
              <div className="col-span-3">Áreas</div>
              <div className="col-span-2 text-right">Costo</div>
            </div>            {estudiantes.map((estudiante, index) => {
              const costoPorEstudiante = estudiante.areas_seleccionadas
                ? estudiante.areas_seleccionadas.reduce((total, area) => total + (Number(area.costo) || 0), 0)
                : 0;

              return (
                <div key={estudiante.id} className="grid grid-cols-12 gap-2 mb-1 text-sm py-1 border-b border-gray-100">
                  <div className="col-span-1">{index + 1}</div>
                  <div className="col-span-4">{estudiante.nombres} {estudiante.apellidos}</div>
                  <div className="col-span-2">{estudiante.ci}</div>
                  <div className="col-span-3">
                    {estudiante.areas_seleccionadas?.length ? (
                      <div className="flex flex-col">
                        {estudiante.areas_seleccionadas.map((area, i) => (
                          <span key={i} className="text-xs">{area.area_nombre} - {area.nivel_nombre}</span>
                        ))}
                      </div>
                    ) : 'Sin áreas'}
                  </div>
                  <div className="col-span-2 text-right">{costoPorEstudiante.toFixed(2)} Bs.</div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="my-4">
            <p className="mb-1">Total de estudiantes inscritos: <strong>{estudiantes.length}</strong></p>
            <p className="mb-2 font-medium">Resumen de áreas inscritas:</p>
            <ul className="list-disc list-inside text-sm">
              {Object.entries(contarAreas()).map(([area, cantidad], index) => (
                <li key={index}>{cantidad} {area}</li>
              ))}
            </ul>
          </div>
        </>
      )}      {/* Totales */}
      <div className="flex justify-between items-center py-2 text-sm">
        <p className="font-medium">Subtotal</p>
        <p className="font-medium">{total.toFixed(2)} Bs.</p>
      </div>
      <div className="flex justify-between items-center py-2 text-sm font-bold">
        <p>TOTAL A PAGAR</p>
        <p>{total.toFixed(2)} Bs.</p>
      </div>
    </div>
  );
};

export default BoletaInfo;
