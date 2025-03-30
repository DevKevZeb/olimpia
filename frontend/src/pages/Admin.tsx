import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  Download,
  Trash2,
  Edit,
  Plus,
  X,
  AlertCircle,
} from 'lucide-react';
import type { CompetitionArea, RegistrationSummary, Level, Grade, AreaCost } from '../types';
import { StudentList } from '../components/admin/StudentList';
import { StudentDetails } from '../components/admin/StudentDetails';
import { API_BASE_URL } from '../config';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function Admin() {
  // Estados para los modales
  const [showAddLevel, setShowAddLevel] = useState(false);
  const [showAddGrade, setShowAddGrade] = useState(false);
  const [showAddArea, setShowAddArea] = useState(false);
  const [showAddAreaCost, setShowAddAreaCost] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<RegistrationSummary | null>(null);
  
  // Estados para guardar datos de la API
  const [levels, setLevels] = useState<Level[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [areas, setAreas] = useState<CompetitionArea[]>([]);
  const [areaCosts, setAreaCosts] = useState<AreaCost[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationSummary[]>([]);
  const [stats, setStats] = useState<any>({
    totalInscripciones: 0,
    areasActivas: 0,
    ingresosTotales: 0,
    nuevosRegistros: 0,
    inscripcionesPorMes: [],
    distribucionPorArea: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [newLevel, setNewLevel] = useState('');
  const [newGrade, setNewGrade] = useState('');
  const [newArea, setNewArea] = useState({ nombre: '', descripcion: '' });
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [selectedLevelId, setSelectedLevelId] = useState('');
  const [areaCostAmount, setAreaCostAmount] = useState('');

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch niveles
        const niveleRes = await fetch(`${API_BASE_URL}/niveles`);
        const nivelesData = await niveleRes.json();
        if (nivelesData.status === 'success') {
          const formattedLevels = nivelesData.data.map((nivel: any) => ({
            id: nivel.Id_nivel.toString(),
            name: nivel.nombre
          }));
          setLevels(formattedLevels);
        }
        
        // Fetch grados
        const gradosRes = await fetch(`${API_BASE_URL}/grados`);
        const gradosData = await gradosRes.json();
        if (gradosData.status === 'success') {
          const formattedGrades = gradosData.data.map((grado: any) => ({
            id: grado.Id_grado.toString(),
            name: grado.nombre
          }));
          setGrades(formattedGrades);
        }
        
        // Fetch áreas
        const areasRes = await fetch(`${API_BASE_URL}/areas`);
        const areasData = await areasRes.json();
        if (areasData.status === 'success') {
          const formattedAreas = areasData.data.map((area: any) => ({
            id: area.Id_area.toString(),
            name: area.nombre,
            description: area.descripcion || '',
            level: '', // Se llenará más tarde con datos de costos
            cost: 0 // Se llenará más tarde con datos de costos
          }));
          setAreas(formattedAreas);
        }
        
        // Fetch costos
        const costosRes = await fetch(`${API_BASE_URL}/costos`);
        const costosData = await costosRes.json();
        if (costosData.status === 'success') {
          const formattedCosts = costosData.data.map((costo: any) => ({
            id: costo.Id_costo.toString(),
            areaId: costo.Id_area.toString(),
            levelId: costo.Id_nivel.toString(),
            cost: costo.monto
          }));
          setAreaCosts(formattedCosts);
        }
        
        // Fetch inscripciones
        const inscripcionesRes = await fetch(`${API_BASE_URL}/inscripciones`);
        const inscripcionesData = await inscripcionesRes.json();
        if (inscripcionesData.status === 'success') {
          // Transformar los datos a formato RegistrationSummary
          const formattedRegistrations = inscripcionesData.data.map((inscripcion: any) => {
            const areaInfo = inscripcion.area ? {
              id: inscripcion.area.Id_area.toString(),
              name: inscripcion.area.nombre,
              description: inscripcion.area.descripcion || '',
              level: inscripcion.nivel ? inscripcion.nivel.nombre : '',
              cost: 0 // Se busca después
            } : null;
            
            const areasArray = areaInfo ? [areaInfo] : [];
            
            return {
              id: inscripcion.Id_inscripcion.toString(),
              student: {
                name: `${inscripcion.competidor?.nombre} ${inscripcion.competidor?.apellido}` || 'Sin nombre',
                ci: inscripcion.competidor?.ci || '',
                birthDate: inscripcion.competidor?.fecha_nacimiento || '',
                email: inscripcion.competidor?.email || '',
                phone: '', // No está en el modelo
                areas: [inscripcion.Id_area.toString()],
                guardian: {
                  name: inscripcion.tutor?.nombre || '',
                  email: inscripcion.tutor?.email || '',
                  phone: inscripcion.tutor?.telefono || ''
                }
              },
              areas: areasArray,
              totalCost: 0, // Se calcula más tarde
              paymentStatus: inscripcion.estado.toLowerCase() === 'pagado' ? 'completed' : 'pending',
              registrationDate: inscripcion.fecha || new Date().toISOString()
            };
          });
          
          setRegistrations(formattedRegistrations);
        }
        
        // Fetch estadísticas del dashboard
        try {
          const statsRes = await fetch(`${API_BASE_URL}/dashboard/stats`);
          const statsData = await statsRes.json();
          
          if (statsData.status === 'success') {
            // Formatear datos para las gráficas
            const monthlyRegistrations = [
              { month: 'Enero', count: Math.floor(Math.random() * 30) },
              { month: 'Febrero', count: Math.floor(Math.random() * 30) },
              { month: 'Marzo', count: statsData.data.total_inscripciones || 0 }
            ];
            
            const areaDistribution = statsData.data.inscripciones_por_area || [];
            const formattedAreaDistribution = areaDistribution.map((item: any) => ({
              name: item.nombre,
              value: parseInt(item.total)
            }));
            
            setStats({
              totalInscripciones: statsData.data.total_inscripciones || 0,
              areasActivas: areas.length,
              ingresosTotales: "Calculando...",
              nuevosRegistros: statsData.data.total_inscripciones || 0,
              inscripcionesPorMes: monthlyRegistrations,
              distribucionPorArea: formattedAreaDistribution.length > 0 ? 
                formattedAreaDistribution : 
                [{ name: 'Sin datos', value: 1 }]
            });
          }
        } catch (statsError) {
          console.error('Error fetching stats:', statsError);
          // Continuar con stats por defecto
        }
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Hubo un error al cargar los datos. Por favor, recarga la página.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Handlers para los formularios
  const handleAddLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_BASE_URL}/niveles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ nombre: newLevel })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Actualizar la lista de niveles
        setLevels([...levels, { id: data.data.Id_nivel.toString(), name: data.data.nombre }]);
        setNewLevel('');
        setShowAddLevel(false);
      } else {
        alert(`Error: ${data.message || 'No se pudo crear el nivel'}`);
      }
    } catch (error) {
      console.error('Error creating level:', error);
      alert('Hubo un error al crear el nivel');
    }
  };

  const handleAddGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_BASE_URL}/grados`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ nombre: newGrade })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Actualizar la lista de grados
        setGrades([...grades, { id: data.data.Id_grado.toString(), name: data.data.nombre }]);
        setNewGrade('');
        setShowAddGrade(false);
      } else {
        alert(`Error: ${data.message || 'No se pudo crear el grado'}`);
      }
    } catch (error) {
      console.error('Error creating grade:', error);
      alert('Hubo un error al crear el grado');
    }
  };

  const handleAddArea = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_BASE_URL}/areas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          nombre: newArea.nombre, 
          descripcion: newArea.descripcion 
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Actualizar la lista de áreas
        setAreas([...areas, { 
          id: data.data.Id_area.toString(), 
          name: data.data.nombre,
          description: data.data.descripcion || '',
          level: '',
          cost: 0
        }]);
        setNewArea({ nombre: '', descripcion: '' });
        setShowAddArea(false);
      } else {
        alert(`Error: ${data.message || 'No se pudo crear el área'}`);
      }
    } catch (error) {
      console.error('Error creating area:', error);
      alert('Hubo un error al crear el área');
    }
  };

  const handleAddAreaCost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_BASE_URL}/costos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          Id_area: selectedAreaId, 
          Id_nivel: selectedLevelId,
          monto: parseFloat(areaCostAmount)
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Actualizar la lista de costos
        setAreaCosts([...areaCosts, { 
          id: data.data.Id_costo.toString(), 
          areaId: data.data.Id_area.toString(),
          levelId: data.data.Id_nivel.toString(),
          cost: data.data.monto
        }]);
        setSelectedAreaId('');
        setSelectedLevelId('');
        setAreaCostAmount('');
        setShowAddAreaCost(false);
      } else {
        alert(`Error: ${data.message || 'No se pudo crear el costo'}`);
      }
    } catch (error) {
      console.error('Error creating cost:', error);
      alert('Hubo un error al crear el costo');
    }
  };

  const handleDeleteLevel = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este nivel?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/niveles/${id}`, {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (response.ok) {
          // Actualizar la lista de niveles
          setLevels(levels.filter(level => level.id !== id));
          alert('Nivel eliminado con éxito');
        } else {
          alert(`Error: ${data.message || 'No se pudo eliminar el nivel'}`);
        }
      } catch (error) {
        console.error('Error deleting level:', error);
        alert('Hubo un error al eliminar el nivel');
      }
    }
  };

  const handleDeleteGrade = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este grado?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/grados/${id}`, {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (response.ok) {
          // Actualizar la lista de grados
          setGrades(grades.filter(grade => grade.id !== id));
          alert('Grado eliminado con éxito');
        } else {
          alert(`Error: ${data.message || 'No se pudo eliminar el grado'}`);
        }
      } catch (error) {
        console.error('Error deleting grade:', error);
        alert('Hubo un error al eliminar el grado');
      }
    }
  };

  const handleDeleteAreaCost = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este costo?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/costos/${id}`, {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          // Actualizar la lista de costos
          setAreaCosts(areaCosts.filter(cost => cost.id !== id));
        } else {
          const data = await response.json();
          alert(`Error: ${data.message || 'No se pudo eliminar el costo'}`);
        }
      } catch (error) {
        console.error('Error deleting cost:', error);
        alert('Hubo un error al eliminar el costo');
      }
    }
  };

  const StatCard = ({ icon: Icon, title, value, trend }: any) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {trend && (
            <p className="text-green-500 text-sm mt-1 flex items-center">
              <TrendingUp size={16} className="mr-1" />
              {trend}
            </p>
          )}
        </div>
        <div className="bg-blue-50 p-3 rounded-full">
          <Icon size={24} className="text-blue-600" />
        </div>
      </div>
    </div>
  );

  const Modal = ({ 
    title, 
    isOpen, 
    onClose, 
    children 
  }: { 
    title: string; 
    isOpen: boolean; 
    onClose: () => void; 
    children: React.ReactNode;
  }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>
          {children}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => setShowAddLevel(true)}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              <Plus size={20} />
              <span>Nuevo Nivel</span>
            </button>
            <button
              onClick={() => setShowAddGrade(true)}
              className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
            >
              <Plus size={20} />
              <span>Nuevo Grado</span>
            </button>
            <button
              onClick={() => setShowAddArea(true)}
              className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              <Plus size={20} />
              <span>Nueva Área</span>
            </button>
            <button
              onClick={() => setShowAddAreaCost(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              <Plus size={20} />
              <span>Nuevo Costo</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Users}
            title="Total Inscritos"
            value={stats.totalInscripciones}
            trend="+12.5% este mes"
          />
          <StatCard
            icon={BookOpen}
            title="Áreas Activas"
            value={areas.length}
          />
          <StatCard
            icon={DollarSign}
            title="Ingresos Totales"
            value="Bs. 23,400"
            trend="+8.2% este mes"
          />
          <StatCard
            icon={Users}
            title="Nuevos Registros"
            value={stats.nuevosRegistros}
            trend="+4.75% esta semana"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">Inscripciones por Mes</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.inscripcionesPorMes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#3B82F6" name="Inscripciones" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">Distribución por Área</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.distribucionPorArea}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.distribucionPorArea.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Management Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Levels Section */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Niveles</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {levels.length > 0 ? (
                  levels.map((level) => (
                    <div key={level.id} className="flex justify-between items-center">
                      <span>{level.name}</span>
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800">
                          <Edit size={18} />
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-800"
                          onClick={() => handleDeleteLevel(level.id)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center">No hay niveles disponibles</p>
                )}
              </div>
            </div>
          </div>

          {/* Grades Section */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Grados</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {grades.length > 0 ? (
                  grades.map((grade) => (
                    <div key={grade.id} className="flex justify-between items-center">
                      <span>{grade.name}</span>
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800">
                          <Edit size={18} />
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-800"
                          onClick={() => handleDeleteGrade(grade.id)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center">No hay grados disponibles</p>
                )}
              </div>
            </div>
          </div>

          {/* Area Costs Section */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Costos por Área y Nivel</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {areaCosts.length > 0 ? (
                  areaCosts.map((areaCost) => {
                    const area = areas.find(a => a.id === areaCost.areaId);
                    const level = levels.find(l => l.id === areaCost.levelId);
                    return (
                      <div key={areaCost.id} className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">{area?.name || 'Área desconocida'}</span>
                          <span className="text-gray-500 text-sm ml-2">({level?.name || 'Nivel desconocido'})</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="font-medium">Bs. {areaCost.cost}</span>
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-800">
                              <Edit size={18} />
                            </button>
                            <button 
                              className="text-red-600 hover:text-red-800"
                              onClick={() => handleDeleteAreaCost(areaCost.id)}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500 text-center">No hay costos disponibles</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Student List */}
        <div className="mb-8">
          <StudentList
            registrations={registrations}
            onViewDetails={setSelectedRegistration}
          />
        </div>

        {/* Modals */}
        <Modal
          title="Agregar Nuevo Nivel"
          isOpen={showAddLevel}
          onClose={() => setShowAddLevel(false)}
        >
          <form onSubmit={handleAddLevel} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre del Nivel</label>
              <input
                type="text"
                value={newLevel}
                onChange={(e) => setNewLevel(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Ej: Básico"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddLevel(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </form>
        </Modal>

        <Modal
          title="Agregar Nuevo Grado"
          isOpen={showAddGrade}
          onClose={() => setShowAddGrade(false)}
        >
          <form onSubmit={handleAddGrade} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre del Grado</label>
              <input
                type="text"
                value={newGrade}
                onChange={(e) => setNewGrade(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Ej: Primero"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddGrade(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </form>
        </Modal>

        <Modal
          title="Agregar Nueva Área"
          isOpen={showAddArea}
          onClose={() => setShowAddArea(false)}
        >
          <form onSubmit={handleAddArea} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre del Área</label>
              <input
                type="text"
                value={newArea.nombre}
                onChange={(e) => setNewArea({ ...newArea, nombre: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Ej: Química"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Descripción</label>
              <textarea
                value={newArea.descripcion}
                onChange={(e) => setNewArea({ ...newArea, descripcion: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={3}
                placeholder="Descripción del área..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddArea(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </form>
        </Modal>

        <Modal
          title="Agregar Costo de Área"
          isOpen={showAddAreaCost}
          onClose={() => setShowAddAreaCost(false)}
        >
          <form onSubmit={handleAddAreaCost} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Área</label>
              <select
                value={selectedAreaId}
                onChange={(e) => setSelectedAreaId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Seleccionar área</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>{area.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nivel</label>
              <select
                value={selectedLevelId}
                onChange={(e) => setSelectedLevelId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Seleccionar nivel</option>
                {levels.map((level) => (
                  <option key={level.id} value={level.id}>{level.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Costo (Bs.)</label>
              <input
                type="number"
                value={areaCostAmount}
                onChange={(e) => setAreaCostAmount(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Ej: 150"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddAreaCost(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </form>
        </Modal>

        {selectedRegistration && (
          <StudentDetails
            registration={selectedRegistration}
            onClose={() => setSelectedRegistration(null)}
          />
        )}
      </div>
    </div>
  );
}