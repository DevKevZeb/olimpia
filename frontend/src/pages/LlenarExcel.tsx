import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LlenarExcel.css'
import { getGrados, getAreasPorConvocatoria, getNivelesPorConvocatoria, getConvocatoriasActivas } from '../api/adminConvocatoriaApi';

interface Convocatoria {
  id_convocatoria: number;
  nombre: string;
}

interface Grado {
  id_grado: number;
  nombre_grado: string;
}

interface AreaConvocatoria {
  id_convocatoria_area: number;
  id_area: number;
  nombre_area: string;
  costo_inscripcion: string;
}

interface NivelConvocatoria {
  id_convocatoria_nivel: number;
  id_convocatoria_area: number;
  id_area: number;
  nombre_area: string;
  id_nivel: number;
  nombre_nivel: string;
  id_grado_min: number;
  nombre_grado_min: string;
  id_grado_max: number;
  nombre_grado_max: string;
}

const RegistroInscripcionExcel: React.FC = () => {
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
  const [grados, setGrados] = useState<Grado[]>([]);
  const [selectedConvocatoriaId, setSelectedConvocatoriaId] = useState<number | null>(null);
  const [selectedGradoId, setSelectedGradoId] = useState<number | null>(null);
  const [areasNiveles, setAreasNiveles] = useState<{ areas: AreaConvocatoria[]; niveles: NivelConvocatoria[] }>({ areas: [], niveles: [] });
  const navigate = useNavigate();

  useEffect(() => {
    getConvocatoriasActivas().then((data: any) => {
      const convs = (Array.isArray(data) ? data : []).map((c: any) => ({
        id_convocatoria: Number(c.id_convocatoria ?? c.id ?? 0),
        nombre: c.nombre ?? '',
      }));
      setConvocatorias(convs);
    }).catch((error) => {
      console.error('Error al obtener las convocatorias:', error);
      // Opcionalmente, podrías setear un estado de error aquí para mostrar un mensaje al usuario
    });
  }, []);

  useEffect(() => {
    getGrados().then((data: any) => {
      const gradosList = (Array.isArray(data) ? data : []).map((g: any) => ({
        id_grado: Number(g.id_grado ?? g.id ?? 0),
        nombre_grado: g.nombre_grado ?? '',
      }));
      setGrados(gradosList);
    }).catch((error) => {
      console.error('Error al obtener los grados:', error);
      // Opcionalmente, podrías setear un estado de error aquí para mostrar un mensaje al usuario
    });
  }, []);

  useEffect(() => {
  const fetchAreasNiveles = async () => {
    if (selectedConvocatoriaId && selectedGradoId) {
      getAreasPorConvocatoria(selectedConvocatoriaId)
        .then((areasResponse: any) => {
          const areas = Array.isArray(areasResponse) ? areasResponse : (areasResponse?.data || []);
          getNivelesPorConvocatoria(selectedConvocatoriaId)
            .then((nivelesResponse: any) => {
              const niveles = Array.isArray(nivelesResponse) ? nivelesResponse : (nivelesResponse?.data || []);
              const nivelesFiltrados = niveles.filter(
                (nivel: any) => nivel.id_grado_min <= selectedGradoId && nivel.id_grado_max >= selectedGradoId
              );
              setAreasNiveles({ areas, niveles: nivelesFiltrados });
            })
            .catch((error) => {
              console.error('Error al obtener niveles:', error);
              setAreasNiveles({ areas: [], niveles: [] });
            });
        })
        .catch((error) => {
          console.error('Error al obtener áreas:', error);
          setAreasNiveles({ areas: [], niveles: [] });
        });
    } else {
      setAreasNiveles({ areas: [], niveles: [] });
    }
  };

  fetchAreasNiveles();
}, [selectedConvocatoriaId, selectedGradoId]);

  const handleConvocatoriaChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const convocatoriaId = parseInt(event.target.value);
    setSelectedConvocatoriaId(convocatoriaId);
    setSelectedGradoId(null);
    setAreasNiveles({ areas: [], niveles: [] });
  };

  const handleGradoChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const gradoId = parseInt(event.target.value);
    setSelectedGradoId(gradoId);
  };

  const handleVolverRegistroExcel = () => {
    navigate('/registroexcel');
  };

  return (
    <div className="Llenar-excel">
      <h2><strong>Guía para Llenar Excel de Inscripción</strong></h2>

      <div className="form-group"> 
        <label htmlFor="convocatoria">1. Selecciona la Convocatoria:</label>
        <select id="convocatoria" className="form-group select" onChange={handleConvocatoriaChange} value={selectedConvocatoriaId || ''}> {/* Aplica la clase al select */}
          <option value="">-- Selecciona --</option>
          {convocatorias.map((convocatoria) => (
            <option key={convocatoria.id_convocatoria} value={convocatoria.id_convocatoria}>
              {convocatoria.nombre}
            </option>
          ))}
        </select>
      </div>

      {selectedConvocatoriaId !== null && (
        <div className="form-group"> 
          <label htmlFor="grado">2. Selecciona el Grado:</label>
          <select id="grado" className="form-group select" onChange={handleGradoChange} value={selectedGradoId || ''}> {/* Aplica la clase al select */}
            <option value="">-- Selecciona --</option>
            {grados.map((grado) => (
              <option key={grado.id_grado} value={grado.id_grado}>
                {grado.nombre_grado}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedGradoId !== null && areasNiveles.niveles.length > 0 && (
        <div className="areas-niveles-container"> 
          <h3><strong>3. Áreas y Niveles Disponibles para el Grado Seleccionado:</strong></h3>
          <table>
            <thead>
              <tr>
                <th>ÁREA DE COMPETENCIA</th>
                <th>NIVEL DE COMPETENCIA</th>
                <th>Grado</th>
              </tr>
            </thead>
            <tbody>
              {areasNiveles.niveles.map((nivel) => {
                return (
                  <tr key={nivel.id_convocatoria_nivel}>
                    <td>{nivel.nombre_area}</td>
                    <td>{nivel.nombre_nivel}</td>
                    <td>{nivel.nombre_grado_min === nivel.nombre_grado_max ? nivel.nombre_grado_min : `${nivel.nombre_grado_min} - ${nivel.nombre_grado_max}`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="recomendacion">Utilice la siguiente información para llenar su archivo Excel de inscripción.</p>
        </div>
      )}

      {selectedGradoId !== null && areasNiveles.niveles.length === 0 && (
        <p className="no-disponible">No hay áreas o niveles disponibles para el grado seleccionado en esta convocatoria.</p>
      )}
      <div>
        <button  onClick={handleVolverRegistroExcel}>
            Volver a Registro Excel
        </button>
      </div>
    </div>
    
  );
};

export default RegistroInscripcionExcel;