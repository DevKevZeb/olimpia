// filepath: c:\xampp\htdocs\oh-sansi\frontend\src\components\registration\StudentsManager.tsx
import React from 'react';
import { Plus, Trash2, Users } from 'lucide-react';
import { EstudianteFormData } from '../../../types/registration';

interface StudentsManagerProps {
  // Data props
  estudiantes: EstudianteFormData[];
  activeStudentIndex: number;
  costoTotalGeneral: number;
  isCurrentStudentValid: boolean;
  formErrorMessage: string;
  
  // Handlers
  onActiveStudentChange: (index: number) => void;
  onRemoveStudent: (index: number) => void;
  onAddNewStudent: () => void;
}

const StudentsManager: React.FC<StudentsManagerProps> = ({
  estudiantes,
  activeStudentIndex,
  costoTotalGeneral,
  isCurrentStudentValid,
  formErrorMessage,
  onActiveStudentChange,
  onRemoveStudent,
  onAddNewStudent
}) => {
  return (
    <div className="border rounded-lg p-6 mb-8">
      <h2 className="text-xl font-semibold mb-2">Estudiantes para Inscripción</h2>
      <p className="text-sm text-gray-600 mb-4">
        Gestiona los estudiantes que deseas inscribir en esta convocatoria
      </p>
      
      <div className="bg-gray-50 border rounded-lg p-3 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-base font-medium">Estudiantes</h4>
          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-2">Total: {costoTotalGeneral} Bs.</span>
            <button
              onClick={onAddNewStudent}
              className={`${!isCurrentStudentValid ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'} text-white rounded-md p-1.5 flex items-center justify-center transition-colors`}
              title={!isCurrentStudentValid ? "Complete los datos del estudiante actual antes de agregar uno nuevo" : "Añadir nuevo estudiante"}
              disabled={!isCurrentStudentValid}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
        
        <div className="flex flex-nowrap overflow-x-auto space-x-2 pb-2">
          {estudiantes.map((estudiante, index) => (
            <div 
              key={estudiante.id}
              className={`flex-shrink-0 flex items-center space-x-1 px-3 py-2 rounded-md cursor-pointer border ${activeStudentIndex === index 
                ? 'bg-blue-50 border-blue-300 text-blue-800' 
                : 'bg-white border-gray-200 hover:bg-gray-50'}`}
              onClick={() => onActiveStudentChange(index)}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                activeStudentIndex === index ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {index + 1}
              </div>
              <span className="text-sm font-medium truncate max-w-[120px]">
                {estudiante.nombres || estudiante.apellidos 
                  ? `${estudiante.nombres} ${estudiante.apellidos}`.trim() 
                  : `Estudiante ${index + 1}`}
              </span>
              
              {estudiantes.length > 1 && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveStudent(index);
                  }}
                  className="text-gray-400 hover:text-red-500 ml-1"
                  title="Eliminar estudiante"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
        
        <div className="flex justify-between items-center mt-2">
          <div className="flex items-center text-sm text-gray-600">
            <Users size={16} className="mr-1" />
            <span>{estudiantes.length} estudiante(s)</span>
          </div>
        </div>
      </div>
      
      {/* Error message display */}
      {formErrorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <p className="text-sm text-red-600">{formErrorMessage}</p>
        </div>
      )}
    </div>
  );
};

export default StudentsManager;
