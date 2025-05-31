import React from 'react';
import { EstudianteFormData} from '../types/index';

interface Props {
  componentRef: any
  encargado: {
    correo: string, 
    ci: string,
    nombre: string
  }
  estudiantes: EstudianteFormData[] , 
  costoTotalGeneral:number, 
}



const BoletaInfo: React.FC<Props> = ({componentRef, estudiantes , costoTotalGeneral, encargado}) => {

  
  return (
    <div ref={componentRef} className="absolute -z-10 border rounded-lg p-4 mb-4 bg-gray-50">
    <h4 className="font-medium text-gray-800 mb-3">encargado a pagar</h4>
    <div  className="flex flex-row">
            <div className="font-medium text-gray-800 ">Nombre: </div> <p> {encargado.nombre}</p>
          </div>
    <div  className="flex flex-row">
            <div className="font-medium text-gray-800 ">CI: </div> <p> {encargado.ci}</p>
          </div>
    
    <h4 className="font-medium text-gray-800 mb-3">Detalle de Estudiantes</h4>
    <div className="border-t border-b py-2">
      <div className="grid grid-cols-12 gap-2 mb-2 text-sm font-medium">
        <div className="col-span-1">#</div>
        <div className="col-span-4">Estudiante</div>
        <div className="col-span-2">CI</div>
        <div className="col-span-3">Áreas</div>
        <div className="col-span-2 text-right">Costo</div>
      </div>
      
      {estudiantes.map((estudiante, index) => {
        const costoPorEstudiante = estudiante.areas_seleccionadas ? 
          estudiante.areas_seleccionadas.reduce((total, area) => total + (parseFloat(area.costo) || 0), 0) : 0;
          
        return (
          <div key={estudiante.id} className="grid grid-cols-12 gap-2 mb-1 text-sm py-1 border-b border-gray-100">
            <div className="col-span-1">{index + 1}</div>
            <div className="col-span-4">{estudiante.nombres} {estudiante.apellidos}</div>
            <div className="col-span-2">{estudiante.ci}</div>
            <div className="col-span-3">
              {estudiante.areas_seleccionadas && estudiante.areas_seleccionadas.length > 0 ? (
                <div className="flex flex-col">
                  {estudiante.areas_seleccionadas.map((area, i) => (
                    <span key={i} className="text-xs">{area.area_nombre} - {area.nivel_nombre}</span>
                  ))}
                </div>
              ) : 'Sin áreas'}
            </div>
            <div className="col-span-2 text-right">{costoPorEstudiante} Bs.</div>
          </div>
        );
      })}
    </div>
    
    <div className="flex justify-between items-center py-2 text-sm">
      <p className="font-medium">Subtotal</p>
      <p className="font-medium">{costoTotalGeneral} Bs.</p>
    </div>
    <div className="flex justify-between items-center py-2 text-sm font-bold">
      <p>TOTAL A PAGAR</p>
      <p>{costoTotalGeneral} Bs.</p>
    </div>
  </div>
  );
};

export default BoletaInfo;
