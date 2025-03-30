import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Student, CompetitionArea, RegistrationSummary } from '../types';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const initialFormData: Student = {
  name: '',
  ci: '',
  birthDate: '',
  email: '',
  phone: '',
  areas: [],
  guardian: {
    name: '',
    email: '',
    phone: '',
  },
};

export function Registration() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Student>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableAreas, setAvailableAreas] = useState<CompetitionArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar áreas disponibles desde la API
  useEffect(() => {
    const fetchAreas = async () => {
      setLoading(true);
      try {
        // Obtener áreas
        const areasResponse = await axios.get(`${API_BASE_URL}/areas`);
        
        if (areasResponse.data.status === 'success') {
          const areasData = areasResponse.data.data;
          
          // Obtener costos
          const costosResponse = await axios.get(`${API_BASE_URL}/costos`);
          const costosData = costosResponse.data.status === 'success' ? 
                            costosResponse.data.data : [];
          
          // Obtener niveles para mapear los nombres
          const nivelesResponse = await axios.get(`${API_BASE_URL}/niveles`);
          const nivelesData = nivelesResponse.data.status === 'success' ? 
                             nivelesResponse.data.data : [];
          
          // Mapear áreas con sus costos y niveles
          const areasWithCostos: CompetitionArea[] = areasData.map((area: any) => {
            // Encontrar un costo para esta área (podríamos tomar el primero o un costo específico)
            const areaCosto = costosData.find((costo: any) => costo.Id_area === area.Id_area);
            
            // Encontrar el nivel correspondiente
            const nivel = areaCosto ? 
                        nivelesData.find((n: any) => n.Id_nivel === areaCosto.Id_nivel) : null;
            
            return {
              id: area.Id_area.toString(),
              name: area.nombre,
              description: area.descripcion || 'Sin descripción',
              level: nivel ? nivel.nombre : 'No definido',
              cost: areaCosto ? parseFloat(areaCosto.monto) : 0
            };
          });
          
          setAvailableAreas(areasWithCostos);
          setError(null);
        } else {
          throw new Error('No se pudieron cargar las áreas');
        }
      } catch (err) {
        console.error("Error al cargar áreas:", err);
        setError('Hubo un problema al cargar las áreas de competencia. Por favor, intenta nuevamente.');
        
        // Usar áreas por defecto para no bloquear el formulario
        setAvailableAreas([
          { 
            id: 'matematicas',
            name: 'Matemáticas',
            description: 'Resolución de problemas y pensamiento lógico',
            level: 'Intermedio',
            cost: 150
          },
          { 
            id: 'fisica',
            name: 'Física',
            description: 'Experimentación y comprensión del universo',
            level: 'Intermedio',
            cost: 150
          },
          { 
            id: 'informatica',
            name: 'Informática',
            description: 'Programación y desarrollo tecnológico',
            level: 'Intermedio',
            cost: 200
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAreas();
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name) newErrors.name = 'El nombre es requerido';
    if (!formData.ci) newErrors.ci = 'El CI es requerido';
    if (!formData.birthDate) newErrors.birthDate = 'La fecha de nacimiento es requerida';
    if (!formData.email) newErrors.email = 'El correo electrónico es requerido';
    if (!formData.phone) newErrors.phone = 'El teléfono es requerido';
    if (formData.areas.length === 0) newErrors.areas = 'Debe seleccionar al menos un área';
    
    // Validate guardian information
    if (!formData.guardian.name) newErrors['guardian.name'] = 'El nombre del tutor es requerido';
    if (!formData.guardian.email) newErrors['guardian.email'] = 'El correo del tutor es requerido';
    if (!formData.guardian.phone) newErrors['guardian.phone'] = 'El teléfono del tutor es requerido';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const selectedAreas = availableAreas.filter(area => formData.areas.includes(area.id));
        const totalCost = selectedAreas.reduce((sum, area) => sum + area.cost, 0);
        
        // Preparar datos del competidor
        const competidorData = {
          nombre: formData.name.split(' ')[0] || formData.name,
          apellido: formData.name.split(' ').slice(1).join(' ') || '',
          email: formData.email,
          ci: formData.ci,
          fecha_nacimiento: formData.birthDate,
          colegio: 'Por determinar', // Esto debería ser un campo en el formulario
          Id_grado: 1, // Esto debería ser seleccionable
          departamento: 'Por determinar', // Esto debería ser un campo en el formulario
          provincia: 'Por determinar', // Esto debería ser un campo en el formulario
        };
        
        // Crear competidor
        const competidorResponse = await axios.post(`${API_BASE_URL}/competidores`, competidorData);
        
        if (competidorResponse.data.status === 'success') {
          // Preparar datos del tutor
          const tutorData = {
            nombre: formData.guardian.name.split(' ')[0] || formData.guardian.name,
            apellido: formData.guardian.name.split(' ').slice(1).join(' ') || '',
            tipo_tutor: 'Familiar', // Esto debería ser seleccionable
            telefono: formData.guardian.phone,
            email: formData.guardian.email
          };
          
          // Crear tutor
          const tutorResponse = await axios.post(`${API_BASE_URL}/tutores`, tutorData);
          
          if (tutorResponse.data.status === 'success') {
            // Crear inscripciones para cada área seleccionada
            const inscripciones = [];
            
            for (const areaId of formData.areas) {
              const area = availableAreas.find(a => a.id === areaId);
              if (area) {
                // Encontrar el nivel correspondiente al área
                const costosResponse = await axios.get(`${API_BASE_URL}/costos`);
                const costosData = costosResponse.data.status === 'success' ? 
                                  costosResponse.data.data : [];
                
                const areaCosto = costosData.find((costo: any) => 
                  costo.Id_area === parseInt(areaId) && costo.monto === area.cost
                );
                
                if (areaCosto) {
                  const inscripcionData = {
                    Id_competidor: competidorResponse.data.data.Id_competidor,
                    Id_tutor: tutorResponse.data.data.Id_tutor,
                    Id_area: areaId,
                    Id_nivel: areaCosto.Id_nivel,
                    estado: 'Pendiente'
                  };
                  
                  const inscripcionResponse = await axios.post(`${API_BASE_URL}/inscripciones`, inscripcionData);
                  inscripciones.push(inscripcionResponse.data.data);
                }
              }
            }
            
            // Preparar resumen para la página de confirmación
            const registrationSummary: RegistrationSummary = {
              student: formData,
              areas: selectedAreas,
              totalCost,
              paymentStatus: 'pending',
              registrationDate: new Date().toISOString(),
            };
            
            navigate('/confirmacion', { state: { registration: registrationSummary } });
          }
        }
      } catch (error) {
        console.error('Error al procesar la inscripción:', error);
        alert('Hubo un error al procesar tu inscripción. Por favor, intenta nuevamente.');
      }
    }
  };

  const handleAreaChange = (areaId: string) => {
    setFormData(prev => ({
      ...prev,
      areas: prev.areas.includes(areaId)
        ? prev.areas.filter(id => id !== areaId)
        : [...prev.areas, areaId],
    }));
  };

  if (loading) {
    return (
      <div className="py-12 bg-gray-50 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando áreas disponibles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Formulario de Inscripción</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Datos del Estudiante */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Datos del Estudiante</h3>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`mt-1 block w-full rounded-md shadow-sm ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  } focus:border-blue-500 focus:ring-blue-500`}
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="ci" className="block text-sm font-medium text-gray-700">
                  Cédula de Identidad
                </label>
                <input
                  type="text"
                  id="ci"
                  value={formData.ci}
                  onChange={(e) => setFormData({ ...formData, ci: e.target.value })}
                  className={`mt-1 block w-full rounded-md shadow-sm ${
                    errors.ci ? 'border-red-300' : 'border-gray-300'
                  } focus:border-blue-500 focus:ring-blue-500`}
                />
                {errors.ci && <p className="mt-1 text-sm text-red-600">{errors.ci}</p>}
              </div>

              <div>
                <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  id="birthDate"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className={`mt-1 block w-full rounded-md shadow-sm ${
                    errors.birthDate ? 'border-red-300' : 'border-gray-300'
                  } focus:border-blue-500 focus:ring-blue-500`}
                />
                {errors.birthDate && <p className="mt-1 text-sm text-red-600">{errors.birthDate}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`mt-1 block w-full rounded-md shadow-sm ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } focus:border-blue-500 focus:ring-blue-500`}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Teléfono
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`mt-1 block w-full rounded-md shadow-sm ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  } focus:border-blue-500 focus:ring-blue-500`}
                />
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              </div>
            </div>

            {/* Áreas de Competencia */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Áreas de Competencia</h3>
              <div className="space-y-2">
                {availableAreas.map((area) => (
                  <div key={area.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={area.id}
                        checked={formData.areas.includes(area.id)}
                        onChange={() => handleAreaChange(area.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={area.id} className="ml-3">
                        <div className="text-sm font-medium text-gray-700">{area.name}</div>
                        <div className="text-sm text-gray-500">{area.description}</div>
                      </label>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      Bs. {area.cost}
                    </div>
                  </div>
                ))}
                {errors.areas && <p className="mt-1 text-sm text-red-600">{errors.areas}</p>}
              </div>
            </div>

            {/* Datos del Tutor */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Datos del Tutor</h3>
              
              <div>
                <label htmlFor="guardianName" className="block text-sm font-medium text-gray-700">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  id="guardianName"
                  value={formData.guardian.name}
                  onChange={(e) => setFormData({
                    ...formData,
                    guardian: { ...formData.guardian, name: e.target.value }
                  })}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    errors['guardian.name'] ? 'border-red-300' : ''
                  }`}
                />
                {errors['guardian.name'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['guardian.name']}</p>
                )}
              </div>

              <div>
                <label htmlFor="guardianEmail" className="block text-sm font-medium text-gray-700">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  id="guardianEmail"
                  value={formData.guardian.email}
                  onChange={(e) => setFormData({
                    ...formData,
                    guardian: { ...formData.guardian, email: e.target.value }
                  })}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    errors['guardian.email'] ? 'border-red-300' : ''
                  }`}
                />
                {errors['guardian.email'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['guardian.email']}</p>
                )}
              </div>

              <div>
                <label htmlFor="guardianPhone" className="block text-sm font-medium text-gray-700">
                  Teléfono
                </label>
                <input
                  type="tel"
                  id="guardianPhone"
                  value={formData.guardian.phone}
                  onChange={(e) => setFormData({
                    ...formData,
                    guardian: { ...formData.guardian, phone: e.target.value }
                  })}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    errors['guardian.phone'] ? 'border-red-300' : ''
                  }`}
                />
                {errors['guardian.phone'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['guardian.phone']}</p>
                )}
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
              >
                Continuar con el Pago
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}