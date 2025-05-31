import React from 'react';
import { Plus, X, Check } from 'lucide-react';
import { 
  Convocatoria, 
  EstudianteFormData, 
  Grado, 
  ComprobanteDetails,
  AreaSeleccionada,
  TutorAcademico
} from '../../../types/registration';

interface OrdenInfo {
  orden: {
    id: number;
    codigo_unico: string;
    monto_total: number;
    fecha_emision: string;
    fecha_vencimiento: string;
    estado: string;
    tipo_origen: string;
    [key: string]: unknown;
  };
  estudiante?: {
    nombre_completo: string;
    ci: string;
  };
  unidad_educativa?: string;
  estudiantes_count?: number;
  [key: string]: unknown;
}

interface ResumenInscripcionProps {
  // Data props
  convocatoria: Convocatoria | null;
  estudiantes: EstudianteFormData[];
  grados: Grado[];
  costoTotalGeneral: number;
  
  // Encargado de pago state
  encargadoNombre: string;
  encargadoApellido: string;
  encargadoCorreo: string;
  encargadoCI: string;
  
  // Modal states
  isModalOpen: boolean;
  isBoletaModalOpen: boolean;
  isComprobanteModalOpen: boolean;
  selectedStudentDetails: EstudianteFormData | null;
  codigo_unico: string;
  comprobanteDetails: ComprobanteDetails | null;
  ordenInfo: OrdenInfo | null;
  
  // Handlers
  onEncargadoNombreChange: (value: string) => void;
  onEncargadoApellidoChange: (value: string) => void;
  onEncargadoCorreoChange: (value: string) => void;
  onEncargadoCIChange: (value: string) => void;
  onOpenStudentDetailsModal: (student: EstudianteFormData) => void;
  onCloseModal: () => void;
  onCloseBoletaModal: () => void;
  onSetIsComprobanteModalOpen: (isOpen: boolean) => void;
  onFetchCodigoUnico: () => void;
  onAddNewStudent: () => void;
  onPrevStep: () => void;
}

const ResumenInscripcion: React.FC<ResumenInscripcionProps> = ({
  convocatoria,
  estudiantes,
  grados,
  costoTotalGeneral,
  encargadoNombre,
  encargadoApellido,
  encargadoCorreo,
  encargadoCI,
  isModalOpen,
  isBoletaModalOpen,
  isComprobanteModalOpen,
  selectedStudentDetails,
  codigo_unico,
  comprobanteDetails,
  ordenInfo,
  onEncargadoNombreChange,
  onEncargadoApellidoChange,
  onEncargadoCorreoChange,
  onEncargadoCIChange,
  onOpenStudentDetailsModal,
  onCloseModal,
  onCloseBoletaModal,
  onSetIsComprobanteModalOpen,
  onFetchCodigoUnico,
  onAddNewStudent,
  onPrevStep
}) => {
  return (
    <>
      <div>
        <h3 className="text-lg font-semibold mb-2">Confirmación y Boleta de Pago</h3>
        <p className="text-sm text-gray-600 mb-6">
          Revisa los datos de tu inscripción y descarga tu boleta de pago
        </p>

        {/* Información de la Convocatoria */}
        <div className="border-b pb-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-base font-semibold">Información de la Convocatoria</h4>
            <button className="text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 011.414 0L10 10.586l-3.293-3.293a1 1 011.414-1.414l-4 4a1 1 01-1.414 0l-4-4a1 1 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          {convocatoria && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Nombre</p>
                <p className="font-medium">{convocatoria.nombre}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Período de Inscripción</p>
                <p className="font-medium">
                  {new Date(convocatoria.fecha_inicio).toLocaleDateString()} - {new Date(convocatoria.fecha_fin).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Áreas máximas por estudiante</p>
                <p className="font-medium">{convocatoria.max_areas}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total de estudiantes</p>
                <p className="font-medium">{estudiantes.length}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Resumen de Estudiantes */}
        <div className="border-b pb-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-base font-semibold">Resumen de Estudiantes</h4>
            <div className="flex items-center">
              <span className="text-sm font-medium mr-2">Total: {estudiantes.length} estudiante(s)</span>
              <button className="text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 011.414 0L10 10.586l-3.293-3.293a1 1 011.414-1.414l-4 4a1 1 01-1.414 0l-4-4a1 1 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="space-y-4">            {estudiantes.map((estudiante, index) => {
              // Cálculo del costo por estudiante
              const costoPorEstudiante = estudiante.areas_seleccionadas ? 
                estudiante.areas_seleccionadas.reduce((total: number, area: AreaSeleccionada) => total + (parseFloat(area.costo) || 0), 0) : 0;
                
              // Determinar el color para el acordeón
              const acordeonColor = index % 2 === 0 ? 'bg-gray-50' : 'bg-white';
                
              return (
                <div key={estudiante.id} className={`rounded-lg border ${acordeonColor}`}>
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mr-3 font-medium">
                          {index + 1}
                        </div>
                        <h5 className="font-medium">
                          {estudiante.nombres} {estudiante.apellidos}
                        </h5>
                      </div>
                      <div className="flex items-center">
                        <button 
                          onClick={() => onOpenStudentDetailsModal(estudiante)}
                          className="mr-3 text-blue-600 hover:text-blue-800 flex items-center text-sm"
                          title="Ver detalles completos"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span className="ml-1">Ver detalles</span>
                        </button>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Costo</p>
                          <p className="font-medium">{costoPorEstudiante} Bs.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm mb-3">
                      <div>
                        <span className="text-gray-500">CI:</span> {estudiante.ci}
                      </div>
                      <div>
                        <span className="text-gray-500">Email:</span> {estudiante.email}
                      </div>
                      <div>
                        <span className="text-gray-500">Grado:</span> {
                          grados.find(grado => grado.id.toString() === estudiante.id_grado.toString())?.nombre || ''
                        }
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-2">Áreas seleccionadas:</p>
                      <div className="space-y-1">                        {estudiante.areas_seleccionadas && estudiante.areas_seleccionadas.length > 0 ? 
                          estudiante.areas_seleccionadas.map((area: AreaSeleccionada, i: number) => (
                            <div key={i} className="flex justify-between text-sm border-b pb-1">
                              <span>{area.area_nombre} - {area.nivel_nombre}</span>
                              <span>{area.costo} Bs.</span>
                            </div>
                          )) : 
                          <p className="text-sm text-gray-500">No hay áreas seleccionadas</p>
                        }
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-end mt-4 pt-2">
            <div className="text-right">
              <p className="text-sm text-gray-500">Monto total general</p>
              <p className="text-lg font-bold">{costoTotalGeneral} Bs.</p>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md mb-6">
          <p className="font-medium text-yellow-800 mb-1">Importante: Su inscripción no está completa</p>
          <p className="text-sm text-yellow-700 mb-2">Para completar su inscripción, siga estos pasos:</p>
          <ol className="text-sm text-yellow-700 list-decimal pl-5 space-y-1">
            <li>Descargue la boleta de pago consolidada para todos los estudiantes</li>
            <li>Realice el pago en las cajas de la facultad</li>
            <li>Regrese a la página de inscripción e introduzca su código de inscripción</li>
            <li>Suba el comprobante de pago para finalizar la inscripción de todos los estudiantes</li>
          </ol>
        </div>

        <div className="border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-2">Encargado de Pago</h2>
          <p className="text-sm text-gray-600 mb-4">
            La persona encargada deberá ir a realizar el pago para la inscripción
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            {/* Encargado de pago nombres */}
            <div>
              <label htmlFor="encargadoPago" className="block text-sm font-medium text-gray-700 mb-1">
                Nombres del encargado de pago<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="encargadoPago"
                className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nombres del encargado"
                value={encargadoNombre}
                onChange={(e) => onEncargadoNombreChange(e.target.value)}
                required
              />
            </div>
            {/* Encargado de pago apellidos */}
            <div>
              <label htmlFor="encargadoPago_apellido" className="block text-sm font-medium text-gray-700 mb-1">
                Apellidos del encargado de pago<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="encargadoPago_apellido"
                className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Apellidos del encargado"
                value={encargadoApellido}
                onChange={(e) => onEncargadoApellidoChange(e.target.value)}
                required
              />
            </div>
          </div>
    
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            {/* Correo Electrónico */}
            <div>
              <label htmlFor="emailencargado" className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico<span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="emailencargado"
                className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="ejemplo@email.com"
                value={encargadoCorreo}
                onChange={(e) => onEncargadoCorreoChange(e.target.value)}
                required
              />
            </div>
            {/* Cédula de Identidad */}
            <div>
              <label htmlFor="cedulaencargado" className="block text-sm font-medium text-gray-700 mb-1">
                Cédula de Identidad<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="cedulaencargado"
                className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Número de CI"
                value={encargadoCI}
                onChange={(e) => {
                  // Validar que solo se ingresen números
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  onEncargadoCIChange(value);
                }}
                required
                maxLength={8}
              />
            </div>
          </div>
        </div>
        
        {/* Botones de acción */}
        <div className="flex gap-3 mb-6">
          <button
            className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 flex items-center justify-center"
            onClick={() => {
              console.log(estudiantes);
              onFetchCodigoUnico();
              // Abre el modal con los detalles de la boleta
              // La funcionalidad de descarga se implementará posteriormente
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 011-1h12a1 1 110 2H4a1 1 01-1-1zm3.293-7.707a1 1 011.414 0L9 10.586V3a1 1 112 0v7.586l1.293-1.293a1 1 011.414 1.414l-3 3a1 1 01-1.414 0l-3-3a1 1 010-1.414z" clipRule="evenodd" />
            </svg>
            Terminar Pre-inscripción
          </button>
          <button
            className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 flex items-center justify-center"
            onClick={onAddNewStudent}
            title="Añadir nuevo estudiante"
          >
            <Plus size={20} className="mr-2" />
            Agregar Estudiante
          </button>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onPrevStep}
            className="border border-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-50"
          >
            Atrás
          </button>
        </div>
      </div>

      {/* Modal de detalles del estudiante */}
      {isModalOpen && selectedStudentDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                Detalles de {selectedStudentDetails.nombres} {selectedStudentDetails.apellidos}
              </h3>
              <button 
                onClick={onCloseModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              {/* Datos Personales */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-800 mb-2 border-b pb-1">Datos Personales</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Nombres</p>
                    <p className="font-medium">{selectedStudentDetails.nombres}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Apellidos</p>
                    <p className="font-medium">{selectedStudentDetails.apellidos}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">CI</p>
                    <p className="font-medium">{selectedStudentDetails.ci}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fecha de Nacimiento</p>
                    <p className="font-medium">{selectedStudentDetails.fecha_nacimiento}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{selectedStudentDetails.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Grado</p>
                    <p className="font-medium">
                      {grados.find(g => g.id.toString() === selectedStudentDetails.id_grado.toString())?.nombre || ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Unidad Educativa */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-800 mb-2 border-b pb-1">Unidad Educativa</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Nombre</p>
                    <p className="font-medium">{selectedStudentDetails.unidad_educativa.nombre}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Departamento</p>
                    <p className="font-medium">{selectedStudentDetails.unidad_educativa.departamento}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Provincia</p>
                    <p className="font-medium">{selectedStudentDetails.unidad_educativa.provincia}</p>
                  </div>
                </div>
              </div>

              {/* Tutor Legal */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-800 mb-2 border-b pb-1">Tutor Legal</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Nombres</p>
                    <p className="font-medium">{selectedStudentDetails.tutor_legal.nombres}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Apellidos</p>
                    <p className="font-medium">{selectedStudentDetails.tutor_legal.apellidos}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">CI</p>
                    <p className="font-medium">{selectedStudentDetails.tutor_legal.ci}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Parentesco</p>
                    <p className="font-medium">{selectedStudentDetails.tutor_legal.parentesco}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{selectedStudentDetails.tutor_legal.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Teléfono</p>
                    <p className="font-medium">{selectedStudentDetails.tutor_legal.telefono}</p>
                  </div>
                </div>
              </div>

              {/* Áreas y tutores académicos */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-800 mb-2 border-b pb-1">Áreas seleccionadas</h4>
                {selectedStudentDetails.areas_seleccionadas && selectedStudentDetails.areas_seleccionadas.length > 0 ? (                  <div className="space-y-4">
                    {selectedStudentDetails.areas_seleccionadas.map((area: AreaSeleccionada, index: number) => {
                      // Buscar el tutor académico para esta área
                      const tutorAcademico = selectedStudentDetails.tutores_academicos?.find(
                        (tutor: TutorAcademico) => tutor.id_convocatoria_nivel === area.id_convocatoria_nivel
                      );

                      return (
                        <div key={index} className="border p-3 rounded-md">
                          <div className="flex justify-between mb-2">
                            <h5 className="font-medium">{area.area_nombre} - {area.nivel_nombre}</h5>
                            <span className="text-sm font-medium">{area.costo} Bs.</span>
                          </div>
                          {tutorAcademico && (
                            <div className="mt-2 pt-2 border-t">
                              <p className="text-sm font-medium text-gray-700">Tutor Académico:</p>
                              <div className="grid grid-cols-2 gap-2 text-sm mt-1">
                                {tutorAcademico.nombres && (
                                  <div>
                                    <span className="text-gray-500">Nombres:</span> {tutorAcademico.nombres}
                                  </div>
                                )}
                                {tutorAcademico.apellidos && (
                                  <div>
                                    <span className="text-gray-500">Apellidos:</span> {tutorAcademico.apellidos}
                                  </div>
                                )}
                                {tutorAcademico.ci && (
                                  <div>
                                    <span className="text-gray-500">CI:</span> {tutorAcademico.ci}
                                  </div>
                                )}
                                {tutorAcademico.email && (
                                  <div>
                                    <span className="text-gray-500">Email:</span> {tutorAcademico.email}
                                  </div>
                                )}
                                {tutorAcademico.telefono && (
                                  <div>
                                    <span className="text-gray-500">Teléfono:</span> {tutorAcademico.telefono}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No hay áreas seleccionadas</p>
                )}
              </div>

              <div className="flex justify-end mt-4 pt-2 border-t">
                <button
                  onClick={onCloseModal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de la boleta de pago */}
      {isBoletaModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Boleta de Pago Consolidada</h3>
              <button 
                onClick={onCloseBoletaModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Código de Inscripción</p>
                    <p className="font-medium">{codigo_unico}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Fecha</p>
                    <p className="font-medium">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-500">Tutor Legal Responsable</p>
                  <p className="font-medium">{estudiantes[0]?.tutor_legal.nombres} {estudiantes[0]?.tutor_legal.apellidos}</p>
                  <p className="text-sm text-gray-500">CI: {estudiantes[0]?.tutor_legal.ci}</p>
                </div>
                
                <div className="border rounded-lg p-4 mb-4 bg-gray-50">
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
                        estudiante.areas_seleccionadas.reduce((total: number, area: AreaSeleccionada) => total + (parseFloat(area.costo) || 0), 0) : 0;
                        
                      return (
                        <div key={estudiante.id} className="grid grid-cols-12 gap-2 mb-1 text-sm py-1 border-b border-gray-100">
                          <div className="col-span-1">{index + 1}</div>
                          <div className="col-span-4">{estudiante.nombres} {estudiante.apellidos}</div>
                          <div className="col-span-2">{estudiante.ci}</div>
                          <div className="col-span-3">                            {estudiante.areas_seleccionadas && estudiante.areas_seleccionadas.length > 0 ? (
                              <div className="flex flex-col">
                                {estudiante.areas_seleccionadas.map((area: AreaSeleccionada, i: number) => (
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

                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md mb-6">
                  <p className="font-medium text-yellow-800 mb-1">Instrucciones de pago</p>
                  <ol className="text-sm text-yellow-700 list-decimal pl-5 space-y-1">
                    <li>Presente esta boleta en las cajas de la facultad</li>
                    <li>Realice el pago del monto total indicado</li>
                    <li>Conserve el comprobante que le entregarán</li>
                    <li>Regrese a la página de inscripción e introduzca el código de verificación de esta boleta</li>
                    <li>Suba el comprobante de pago para finalizar la inscripción</li>
                  </ol>
                </div>

                <div className="border-t pt-4 mt-4 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500">Esta boleta es válida hasta:</p>
                    <p className="font-medium text-sm">{new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                  </div>
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                    onClick={() => {
                      // Al hacer clic en "Aceptar", cerramos el modal
                      onCloseBoletaModal();
                    }}
                  >
                    <Check size={18} className="mr-2" />
                    Aceptar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalles del comprobante */}
      {isComprobanteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => onSetIsComprobanteModalOpen(false)}
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-semibold mb-4">Detalles del Comprobante de Pago</h3>
            {comprobanteDetails ? (
              <>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Nombre del pagador:</span> {comprobanteDetails.nombre ? comprobanteDetails.nombre : <span className="text-red-500">No extraído</span>}
                  </div>
                  <div>
                    <span className="font-medium">Número de comprobante:</span> {comprobanteDetails.numero_comprobante ? comprobanteDetails.numero_comprobante : <span className="text-red-500">No extraído</span>}
                  </div>
                  <div>
                    <span className="font-medium">Fecha de pago:</span> {comprobanteDetails.fecha ? comprobanteDetails.fecha : <span className="text-red-500">No extraído</span>}
                  </div>
                  <div>
                    <span className="font-medium">Monto pagado:</span> {comprobanteDetails.monto !== undefined && comprobanteDetails.monto !== null ? comprobanteDetails.monto : (ordenInfo?.orden?.monto_total ?? <span className="text-red-500">No extraído</span>)} Bs.
                  </div>
                </div>
                {(!comprobanteDetails.nombre || !comprobanteDetails.numero_comprobante) && (
                  <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 text-sm rounded">
                    <b>Advertencia:</b> No se pudo extraer correctamente el nombre del pagador o el número de comprobante. Por favor, verifique que el comprobante sea legible y válido.
                  </div>
                )}
                {comprobanteDetails.ocr_text && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-blue-600 underline">Ver texto OCR crudo</summary>
                    <pre className="bg-gray-100 p-2 rounded text-xs mt-1 max-h-40 overflow-auto">{comprobanteDetails.ocr_text}</pre>
                  </details>
                )}
              </>
            ) : (
              <p>No se encontraron detalles del comprobante.</p>
            )}
            <div className="flex justify-end mt-6">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                onClick={() => onSetIsComprobanteModalOpen(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ResumenInscripcion;
