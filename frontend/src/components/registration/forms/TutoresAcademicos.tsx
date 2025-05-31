import React from 'react';
import { ChevronRight, AlertCircle } from 'lucide-react';
import { AreaSeleccionada, TutorAcademico } from '../../types/index';

interface TutoresAcademicosProps {
  areas_seleccionadas: AreaSeleccionada[];
  tutores_academicos: TutorAcademico[];
  formErrorMessage: string;
  onTutorChange: (index: number, field: keyof TutorAcademico, value: string) => void;
  onPrevStep: () => void;
  onNextStep: () => void;
}

const TutoresAcademicos: React.FC<TutoresAcademicosProps> = ({
  areas_seleccionadas,
  tutores_academicos,
  formErrorMessage,
  onTutorChange,
  onPrevStep,
  onNextStep,
}) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Tutores Académicos</h3>
      <p className="text-sm text-gray-600 mb-6">
        Ingresa la información de tus tutores académicos para cada área seleccionada
      </p>

      {/* Mensaje de error del formulario */}
      {formErrorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
          <p className="text-red-700 text-sm">{formErrorMessage}</p>
        </div>
      )}

      {/* Tutores Académicos Tab */}
      <div className="flex mb-4">
        <button className="flex-1 text-center py-2 border-b-2 border-blue-600 text-blue-600 font-medium">
          Tutores Académicos
        </button>
        <button className="flex-1 text-center py-2 border-b border-gray-200 text-gray-500 bg-gray-50">
          Reutilizar Datos
        </button>
      </div>

      {areas_seleccionadas.length === 0 ? (
        <div className="text-center p-8 border rounded-lg">
          <p className="text-gray-600 mb-2">No has seleccionado áreas en el paso anterior</p>
          <p className="text-sm text-gray-500">Por favor, regresa al paso anterior y selecciona al menos un área.</p>
        </div>
      ) : (
        <>
          {/* Tutores académicos para cada área seleccionada */}
          {areas_seleccionadas.map((area) => {
            // Encontrar el índice del tutor académico correspondiente
            const tutorIndex = tutores_academicos.findIndex(
              tutor => tutor.id_convocatoria_nivel === area.id_convocatoria_nivel
            );

            return (
              <div key={area.id_convocatoria_nivel} className="border rounded-lg p-6 mb-6">
                <h4 className="text-base font-semibold mb-1">Tutor para {area.area_nombre}</h4>
                <p className="text-xs text-gray-500 mb-4">
                  Información del tutor académico para {area.area_nombre} - {area.nivel_nombre} (opcional)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  {/* Cédula de Identidad */}
                  <div>
                    <label htmlFor={`ci_${area.id_convocatoria_nivel}`} className="block text-sm font-medium text-gray-700 mb-1">
                      Cédula de Identidad
                    </label>
                    <input
                      type="text"
                      id={`ci_${area.id_convocatoria_nivel}`}
                      className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ingrese solo números"
                      value={tutorIndex >= 0 && tutores_academicos[tutorIndex].ci ? tutores_academicos[tutorIndex].ci : ''}
                      onChange={(e) => {
                        // Validar que solo se ingresen números
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        onTutorChange(tutorIndex, 'ci', value);
                      }}
                      maxLength={8}
                    />
                  </div>

                  {/* Nombres */}
                  <div>
                    <label htmlFor={`nombres_${area.id_convocatoria_nivel}`} className="block text-sm font-medium text-gray-700 mb-1">
                      Nombres
                    </label>
                    <input
                      type="text"
                      id={`nombres_${area.id_convocatoria_nivel}`}
                      className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nombres del tutor"
                      value={tutorIndex >= 0 ? tutores_academicos[tutorIndex].nombres : ''}
                      onChange={(e) => onTutorChange(tutorIndex, 'nombres', e.target.value)}
                    />
                  </div>

                  {/* Apellidos */}
                  <div>
                    <label htmlFor={`apellidos_${area.id_convocatoria_nivel}`} className="block text-sm font-medium text-gray-700 mb-1">
                      Apellidos
                    </label>
                    <input
                      type="text"
                      id={`apellidos_${area.id_convocatoria_nivel}`}
                      className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Apellidos del tutor"
                      value={tutorIndex >= 0 ? tutores_academicos[tutorIndex].apellidos : ''}
                      onChange={(e) => onTutorChange(tutorIndex, 'apellidos', e.target.value)}
                    />
                  </div>

                  {/* Correo Electrónico */}
                  <div>
                    <label htmlFor={`email_${area.id_convocatoria_nivel}`} className="block text-sm font-medium text-gray-700 mb-1">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      id={`email_${area.id_convocatoria_nivel}`}
                      className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="correo@ejemplo.com"
                      value={tutorIndex >= 0 ? tutores_academicos[tutorIndex].email : ''}
                      onChange={(e) => onTutorChange(tutorIndex, 'email', e.target.value)}
                    />
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label htmlFor={`telefono_${area.id_convocatoria_nivel}`} className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      id={`telefono_${area.id_convocatoria_nivel}`}
                      className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Número de teléfono"
                      value={tutorIndex >= 0 ? tutores_academicos[tutorIndex].telefono : ''}
                      onChange={(e) => {
                        // Validar que solo se ingresen números
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        onTutorChange(tutorIndex, 'telefono', value);
                      }}
                      maxLength={8}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </>
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
        >
          <span className="mr-2">Continuar</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default TutoresAcademicos;
