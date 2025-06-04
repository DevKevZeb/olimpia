import React from 'react';
import { Calendar, ChevronRight, AlertCircle } from 'lucide-react';
import { EstudianteFormData, FormErrors, Grado } from '../../../types/registration';
import { getDatosEstudiante } from '../../../api/registration/inscripcionCompletaApi';

interface StudentFormProps {
  formData: EstudianteFormData;
  formErrors: FormErrors;
  formErrorMessage: string;
  grados: Grado[];
  isLoading: boolean;
  onFormChange: (field: string, value: string) => void;
  onNestedChange: (parentField: string, field: string, value: string) => void;
  onNextStep: () => void;
  onStudentInfoLoaded: (ci: string) => void;
  onTutorLoaded: (ci: string) => void;
}

const StudentForm: React.FC<StudentFormProps> = ({
  formData,
  formErrors,
  formErrorMessage,
  grados,
  isLoading,
  onFormChange,
  onNestedChange,
  onNextStep,
  onStudentInfoLoaded,
  onTutorLoaded,
}) => {

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Datos Personales</h3>
      <p className="text-sm text-gray-600 mb-3">Ingrese sus datos personales para la inscripción</p>
      
      {/* Mensaje de error del formulario */}
      {formErrorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
          <p className="text-red-700 text-sm">{formErrorMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Cédula de Identidad */}
        <div>
          <label htmlFor="cedula" className="block text-sm font-medium text-gray-700 mb-1">
            Cédula de Identidad<span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="cedula"
            className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Número de CI"
            value={formData.ci}            onChange={(e) => {
              onFormChange('ci', e.target.value);
              onStudentInfoLoaded(e.target.value);
            }}
            onKeyPress={(event: React.KeyboardEvent<HTMLInputElement>) => {
              if ((event.target as HTMLInputElement).value.length >= 8 && event.key !== 'Backspace' && event.key !== 'Delete' && !(event.ctrlKey && (event.key === 'c' || event.key === 'v'))) {
                event.preventDefault();
              }
            }}
            required
            min="0" 
            step="1"
            maxLength={8}
          />
          {formErrors.ci && <p className="text-red-500 text-xs mt-1">{formErrors.ci}</p>}
        </div>

        {/* Nombres */}
        <div>
          <label htmlFor="nombres" className="block text-sm font-medium text-gray-700 mb-1">
            Nombres<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="nombres"
            className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ingrese sus nombres"
            value={formData.nombres}
            onChange={(e) => onFormChange('nombres', e.target.value)}
            maxLength={50}
            required
          />
          {formErrors.nombres && <p className="text-red-500 text-xs mt-1">{formErrors.nombres}</p>}
        </div>

        {/* Apellidos */}
        <div>
          <label htmlFor="apellidos" className="block text-sm font-medium text-gray-700 mb-1">
            Apellidos<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="apellidos"
            className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ingrese sus apellidos"
            value={formData.apellidos}
            onChange={(e) => onFormChange('apellidos', e.target.value)}
            maxLength={50}
            required
          />
          {formErrors.apellidos && <p className="text-red-500 text-xs mt-1">{formErrors.apellidos}</p>}
        </div>

        {/* Fecha de Nacimiento */}
        <div>
          <label htmlFor="fechaNacimiento" className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de Nacimiento<span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              id="fechaNacimiento"
              className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Seleccione una fecha"
              value={formData.fecha_nacimiento}
              onChange={(e) => onFormChange('fecha_nacimiento', e.target.value)}
              required
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <Calendar size={18} className="text-gray-400" />
            </div>
          </div>
          {formErrors.fecha_nacimiento && <p className="text-red-500 text-xs mt-1">{formErrors.fecha_nacimiento}</p>}
        </div>

        {/* Correo Electrónico */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Correo Electrónico<span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="ejemplo@email.com"
            value={formData.email}
            onChange={(e) => onFormChange('email', e.target.value)}
            required
          />
        </div>        {/* Genero */}
        <div>
            <label htmlFor="genero" className="block text-sm font-medium text-gray-700 mb-1">
              Genero<span className="text-red-500">*</span>
            </label>
            <select
              id="genero"
              className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
              value={formData.genero}
              onChange={(e) => onFormChange('genero', e.target.value)}
              required
            >
              <option value="">Seleccione su genero</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
            </select>
            {formErrors.genero && <p className="text-red-500 text-xs mt-1">{formErrors.genero}</p>}
          </div>

        {/* Teléfono */}
        <div>
          <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono
          </label>
          <input
            type="number"
            id="telefono"
            className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${formErrors.telefono ? 'border-red-500' : ''}`}
            placeholder="Número de teléfono"            value={formData.telefono || ''}
            onChange={(e) => onFormChange('telefono', e.target.value)}
            onKeyPress={(event: React.KeyboardEvent<HTMLInputElement>) => {
              if ((event.target as HTMLInputElement).value.length >= 8 && event.key !== 'Backspace' && event.key !== 'Delete' && !(event.ctrlKey && (event.key === 'c' || event.key === 'v'))) {
                event.preventDefault();
              }
            }}
            min="0" 
            step="1"
            maxLength={8}
          />
          {formErrors.telefono && <p className="text-red-500 text-xs mt-1">{formErrors.telefono}</p>}
        </div>

        {/* Unidad Educativa */}
        <div>
          <label htmlFor="unidadEducativa" className="block text-sm font-medium text-gray-700 mb-1">
            Unidad Educativa<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="unidadEducativa"
            className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ingrese su unidad educativa"
            value={formData.unidad_educativa.nombre}
            onChange={(e) => onNestedChange('unidad_educativa', 'nombre', e.target.value)}
            maxLength={50}
            required
          />
          {formErrors.unidad_educativa?.nombre && (
            <p className="text-red-500 text-xs mt-1">{formErrors.unidad_educativa.nombre}</p>
          )}
        </div>

        {/* Grado */}
        <div>
          <label htmlFor="id_grado" className="block text-sm font-medium text-gray-700 mb-1">
            Grado<span className="text-red-500">*</span>
          </label>
          <select
            id="id_grado"
            name="id_grado"
            className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
            value={formData.id_grado}
            onChange={(e) => {
              console.log("Grado seleccionado:", e.target.value);
              onFormChange('id_grado', e.target.value);
            }}
            required
          >
            <option value="" className="text-gray-800">Seleccione su grado</option>
            {isLoading ? (
              <option disabled className="text-gray-800">Cargando grados...</option>
            ) : (
              grados.map((grado) => (
                <option key={grado.id} value={grado.id} className="text-gray-800">
                  {grado.nombre || grado.nombre_grado}
                </option>
              ))
            )}
          </select>
          {formData.id_grado && (
            <p className="text-xs text-green-600 mt-1">
              Los grados determinan las áreas y niveles disponibles en la siguiente sección.
            </p>
          )}
        </div>

        {/* Departamento */}
        <div>
          <label htmlFor="departamento" className="block text-sm font-medium text-gray-700 mb-1">
            Departamento<span className="text-red-500">*</span>
          </label>
          <select
            id="departamento"
            className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
            value={formData.unidad_educativa.departamento}
            onChange={(e) => onNestedChange('unidad_educativa', 'departamento', e.target.value)}
            required
          >
            <option value="">Seleccione su departamento</option>
            <option value="La Paz">La Paz</option>
            <option value="Santa Cruz">Santa Cruz</option>
            <option value="Cochabamba">Cochabamba</option>
            <option value="Oruro">Oruro</option>
            <option value="Potosí">Potosí</option>
            <option value="Tarija">Tarija</option>
            <option value="Beni">Beni</option>
            <option value="Pando">Pando</option>
            <option value="Chuquisaca">Chuquisaca</option>
          </select>
        </div>
        
        {/* Provincia */}
        <div>
          <label htmlFor="provincia" className="block text-sm font-medium text-gray-700 mb-1">
            Provincia<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="provincia"
            className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ingrese su provincia"
            value={formData.unidad_educativa.provincia}
            onChange={(e) => onNestedChange('unidad_educativa', 'provincia', e.target.value)}
            maxLength={50}
            required
          />
          {formErrors.unidad_educativa?.provincia && (
            <p className="text-red-500 text-xs mt-1">{formErrors.unidad_educativa.provincia}</p>
          )}
        </div>
      </div>

      {/* Tutor Legal Section */}
      <div className="border rounded-lg p-6 mb-6 mt-6">
        <h4 className="text-base font-semibold mb-1">Tutor Legal</h4>
        <p className="text-xs text-gray-500 mb-4">Información del tutor legal (obligatorio)</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          {/* Cédula de Identidad del Tutor */}
          <div>
            <label htmlFor="cedulaTutorLegal" className="block text-sm font-medium text-gray-700 mb-1">
              Cédula de Identidad<span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="cedulaTutorLegal"
              className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Número de CI"
              value={formData.tutor_legal.ci}
              onChange={(e) => {
                // Validar que solo se ingresen números
                const value = e.target.value.replace(/[^0-9]/g, '');
                onNestedChange('tutor_legal', 'ci', value);
                onTutorLoaded(value);
              }}
              required
              maxLength={8}
            />
          </div>

          {/* Nombres del Tutor */}
          <div>
            <label htmlFor="nombresTutorLegal" className="block text-sm font-medium text-gray-700 mb-1">
              Nombres<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="nombresTutorLegal"
              className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nombres del tutor"
              value={formData.tutor_legal.nombres}
              onChange={(e) => onNestedChange('tutor_legal', 'nombres', e.target.value)}
              required
            />
          </div>

          {/* Apellidos del Tutor */}
          <div>
            <label htmlFor="apellidosTutorLegal" className="block text-sm font-medium text-gray-700 mb-1">
              Apellidos<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="apellidosTutorLegal"
              className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Apellidos del tutor"
              value={formData.tutor_legal.apellidos}
              onChange={(e) => onNestedChange('tutor_legal', 'apellidos', e.target.value)}
              required
            />
          </div>

          {/* Parentesco */}
          <div>
            <label htmlFor="parentesco" className="block text-sm font-medium text-gray-700 mb-1">
              Parentesco<span className="text-red-500">*</span>
            </label>
            <select
              id="parentesco"
              className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
              value={formData.tutor_legal.parentesco}
              onChange={(e) => onNestedChange('tutor_legal', 'parentesco', e.target.value)}
              required
            >
              <option value="">Selecciona el parentesco</option>
              <option value="Padre">Padre</option>
              <option value="Madre">Madre</option>
              <option value="Abuelo/a">Abuelo/a</option>
              <option value="Tío/a">Tío/a</option>
              <option value="Hermano/a">Hermano/a</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          {/* Correo Electrónico del Tutor */}
          <div>
            <label htmlFor="emailTutorLegal" className="block text-sm font-medium text-gray-700 mb-1">
              Correo Electrónico<span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="emailTutorLegal"
              className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="correo@ejemplo.com"
              value={formData.tutor_legal.email}
              onChange={(e) => onNestedChange('tutor_legal', 'email', e.target.value)}
              required
            />
          </div>

          {/* Teléfono del Tutor */}
          <div>
            <label htmlFor="telefonoTutorLegal" className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono<span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="telefonoTutorLegal"
              className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Número de teléfono"
              value={formData.tutor_legal.telefono}
              onChange={(e) => {
                // Validar que solo se ingresen números
                const value = e.target.value.replace(/[^0-9]/g, '');
                onNestedChange('tutor_legal', 'telefono', value);
              }}
              required
              maxLength={8}
            />
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <div className="flex justify-end">
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

export default StudentForm;
