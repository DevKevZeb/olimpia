import React, { useState, useEffect } from 'react';
import '../styles/CamposObligatorios.css';
import { RequisitoConvocatoria } from '../types/RequisitoConvocatoria'; 
import { fetchConvocatorias, fetchRequisitosConvocatoria, saveRequisitosConvocatoria } from '../api/requisitoConvocatoria';

interface Props {
  // Puedes pasar un ID de convocatoria inicial si es necesario
  initialConvocatoriaId?: number;
}

const RegistroRequisitos: React.FC<Props> = ({ initialConvocatoriaId }) => {
  const [convocatorias, setConvocatorias] = useState<{ id_convocatoria: number; estado: String; nombre: string }[]>([]);
  const [selectedConvocatoriaId, setSelectedConvocatoriaId] = useState<number | undefined>(initialConvocatoriaId);
  const [requisitosGuardados, setRequisitosGuardados] = useState<Record<string, boolean>>({});
  const [loadingConvocatorias, setLoadingConvocatorias] = useState(true);
  const [loadingRequisitos, setLoadingRequisitos] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const camposTutorLegalObligatorios = ['ci', 'nombres', 'apellidos', 'email'];
  const camposTutorLegalOpcionales = ['telefono', 'parentesco'];
  const camposPostulanteObligatorios = ['ci', 'nombres', 'apellidos', 'email', 'id_grado'];
  const camposPostulanteOpcionales = ['fecha_nacimiento', 'genero', 'telefono', 'id_unidad_educativa', 'departamento', 'provincia'];
  //profesor 
  const camposProfesorObligatorios = ['ci', 'nombres', 'apellidos', 'email'];
  const camposProfesorOpcionales = ['telefono'];
  const [profesorRequisitosMode, setProfesorRequisitosMode] = useState<'obligatorio' | 'opcional'>('obligatorio');

  useEffect(() => {
    const loadConvocatorias = async () => {
      try {
        const data = await fetchConvocatorias();
        const openConvocatorias = data.filter(c => c.estado === 'planificada');
        setConvocatorias(openConvocatorias);
        setLoadingConvocatorias(false);
        if (initialConvocatoriaId) {
          setSelectedConvocatoriaId(initialConvocatoriaId);
        }
      } catch (error: any) {
        setError('Error al cargar las convocatorias: ' + error.message);
        setLoadingConvocatorias(false);
      }
    };

    loadConvocatorias();
  }, [initialConvocatoriaId]);

  useEffect(() => {
    const loadRequisitos = async () => {
      if (selectedConvocatoriaId) {
        setLoadingRequisitos(true);
        try {
          const data = await fetchRequisitosConvocatoria(selectedConvocatoriaId);
          const initialRequisitosGuardados: Record<string, boolean> = {};
          data.forEach((requisito) => {
            initialRequisitosGuardados[`${requisito.entidad}.${requisito.campo}`] = true;
          });
          setRequisitosGuardados(initialRequisitosGuardados);
          setLoadingRequisitos(false);
        } catch (error: any) {
          setError('Error al cargar los requisitos: ' + error.message);
          setLoadingRequisitos(false);
          setRequisitosGuardados({});
        }
      } else {
        setRequisitosGuardados({});
      }
    };

    loadRequisitos();
  }, [selectedConvocatoriaId]);

  const handleConvocatoriaChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(event.target.value, 10);
    setSelectedConvocatoriaId(isNaN(id) ? undefined : id);
  };

  const handleCheckboxChange = (entidad: string, campo: string, checked: boolean) => {
    if ((entidad === 'postulante' && camposPostulanteObligatorios.includes(campo)) ||
        (entidad === 'tutorLegal' && camposTutorLegalObligatorios.includes(campo)) ||
        (entidad === 'profesor' && camposProfesorObligatorios.includes(campo))) {
      return; // No permitir desmarcar campos obligatorios
    }
    setRequisitosGuardados((prev) => ({
      ...prev,
      [`${entidad}.${campo}`]: checked,
    }));
  };

  const handleSelectAll = (entidad: 'postulante' | 'tutorLegal' | 'profesor') => {
    setRequisitosGuardados((prev) => {
      const newState = { ...prev };
      let camposToUpdate: string[] = [];

      if (entidad === 'postulante') {
        camposToUpdate = [...camposPostulanteObligatorios, ...camposPostulanteOpcionales];
      } else if (entidad === 'tutorLegal') {
        camposToUpdate = [...camposTutorLegalObligatorios, ...camposTutorLegalOpcionales];
      } else if (entidad === 'profesor') {
        camposToUpdate = [...camposProfesorObligatorios, ...camposProfesorOpcionales];
      }

      camposToUpdate.forEach((campo) => {
        if (!(entidad === 'postulante' && camposPostulanteObligatorios.includes(campo)) &&
            !(entidad === 'tutorLegal' && camposTutorLegalObligatorios.includes(campo)) &&
            !(entidad === 'profesor' && camposProfesorObligatorios.includes(campo))) {
          newState[`${entidad}.${campo}`] = true;
        }
      });
      return newState;
    });
  };

  const handleDeselectAll = (entidad: 'postulante' | 'tutorLegal' | 'profesor') => {
    setRequisitosGuardados((prev) => {
      const newState = { ...prev };
      let camposToUpdate: string[] = [];

      if (entidad === 'postulante') {
        camposToUpdate = camposPostulanteOpcionales;
      } else if (entidad === 'tutorLegal') {
        camposToUpdate = camposTutorLegalOpcionales;
      } else if (entidad === 'profesor') {
        camposToUpdate = camposProfesorOpcionales;
      }

      camposToUpdate.forEach((campo) => {
        newState[`${entidad}.${campo}`] = false;
      });
      return newState;
    });
  };

  const handleGuardarRequisitos = async () => {
    if (!selectedConvocatoriaId) {
      setError('Por favor, seleccione una convocatoria.');
      setTimeout(() => setError(null), 3000);
      return;
    }

    const requisitosParaGuardar: Omit<RequisitoConvocatoria, 'id' | 'created_at' | 'updated_at'>[] = [];
    for (const key in requisitosGuardados) {
      if (requisitosGuardados[key]) {
        const [entidad, campo] = key.split('.');
        requisitosParaGuardar.push({
          id_convocatoria: selectedConvocatoriaId,
          entidad: entidad,
          campo: campo,
          es_obligatorio: true, // Por defecto al tiquear se considera obligatorio
        });
      }
    }

    try {
      await saveRequisitosConvocatoria(selectedConvocatoriaId, requisitosParaGuardar);
      alert('Configuración de requisitos guardada exitosamente.');
      // Recargar los requisitos guardados después de guardar
      const data = await fetchRequisitosConvocatoria(selectedConvocatoriaId);
      const updatedRequisitosGuardados: Record<string, boolean> = {};
      data.forEach((requisito) => {
        updatedRequisitosGuardados[`${requisito.entidad}.${requisito.campo}`] = true;
      });
      setRequisitosGuardados(updatedRequisitosGuardados);
    } catch (error: any) {
      setError('Error al guardar la configuración de requisitos: ' + error.message);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleProfesorModeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const mode = event.target.value as 'obligatorio' | 'opcional';
    setProfesorRequisitosMode(mode);
    if (mode === 'opcional') {
      const newState = { ...requisitosGuardados };
      [...camposProfesorObligatorios, ...camposProfesorOpcionales].forEach((campo) => {
        newState[`profesor.${campo}`] = false;
      });
      setRequisitosGuardados(newState);
    }
  };

  if (loadingConvocatorias) {
    return <div>Cargando convocatorias...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Configuración de Campos Obligatorios</h1>
      </div>
      <div className="bg-white rounded-lg shadow-lg p-8 mt-8">
        <h2 className="text-2xl font-bold mb-6">Configuración de Campos Obligatorios</h2>

      <div className="select-container">
        <label htmlFor="convocatoria">Seleccionar Convocatoria:</label>
        <select
          id="convocatoria"
          value={selectedConvocatoriaId || ''}
          onChange={handleConvocatoriaChange}
        >
          <option value="">-- Seleccionar --</option>
          {convocatorias.map((convocatoria) => (
            <option key={convocatoria.id_convocatoria} value={convocatoria.id_convocatoria}>
              {convocatoria.nombre}
            </option>
          ))}
        </select>
      </div>

      {selectedConvocatoriaId && (
        <div className="seccion-requisitos">
          <h3>Configurar Campos para la Convocatoria ID: {selectedConvocatoriaId}</h3>

          {loadingRequisitos ? (
            <div>Cargando requisitos existentes...</div>
          ) : (
            <div>
              <h4>Del Postulante:</h4>
              <div className="seccion-acciones">
                <button type="button" onClick={() => handleSelectAll('postulante')}>Seleccionar Todos</button>
                <button type="button" onClick={() => handleDeselectAll('postulante')}>Deseleccionar Opcionales</button>
              </div>
              {camposPostulanteObligatorios.map((campo) => (
                <div className="requisito-checkbox obligatorio" key={`postulante.${campo}`}>
                  <label>
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                    />
                    {campo} <span className="obligatorio-tag">(Obligatorio)</span>
                  </label>
                </div>
              ))}
              {camposPostulanteOpcionales.map((campo) => (
                <div className="requisito-checkbox" key={`postulante.${campo}`}>
                  <label>
                    <input
                      type="checkbox"
                      checked={requisitosGuardados[`postulante.${campo}`] || false}
                      onChange={(e) => handleCheckboxChange('postulante', campo, e.target.checked)}
                    />
                    {campo}
                  </label>
                </div>
              ))}

              <h4>Del Tutor Legal:</h4>
              <div className="seccion-acciones">
                <button type="button" onClick={() => handleSelectAll('tutorLegal')}>Seleccionar Todos</button>
                <button type="button" onClick={() => handleDeselectAll('tutorLegal')}>Deseleccionar Opcionales</button>
              </div>
              {camposTutorLegalObligatorios.map((campo) => (
                <div className="requisito-checkbox obligatorio" key={`tutorLegal.${campo}`}>
                  <label>
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                    />
                    {campo} <span className="obligatorio-tag">(Obligatorio)</span>
                  </label>
                </div>
              ))}
              {camposTutorLegalOpcionales.map((campo) => (
                <div className="requisito-checkbox" key={`tutorLegal.${campo}`}>
                  <label>
                    <input
                      type="checkbox"
                      checked={requisitosGuardados[`tutorLegal.${campo}`] || false}
                      onChange={(e) => handleCheckboxChange('tutorLegal', campo, e.target.checked)}
                    />
                    {campo}
                  </label>
                </div>
              ))}

              <h4>Del Profesor:
                <select value={profesorRequisitosMode} onChange={handleProfesorModeChange}>
                  <option value="obligatorio">Obligatorio</option>
                  <option value="opcional">Opcional</option>
                </select>
              </h4>
              <div className="seccion-acciones">
                <button type="button" onClick={() => handleSelectAll('profesor')}>Seleccionar Todos</button>
                <button type="button" onClick={() => handleDeselectAll('profesor')}>Deseleccionar Opcionales</button>
              </div>
              {camposProfesorObligatorios.map((campo) => (
                <div className="requisito-checkbox obligatorio" key={`profesor.${campo}`}>
                  <label>
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                    />
                    {campo} <span className="obligatorio-tag">(Obligatorio)</span>
                  </label>
                </div>
              ))}
              {camposProfesorOpcionales.map((campo) => (
                <div className="requisito-checkbox" key={`profesor.${campo}`}>
                  <label>
                    <input
                      type="checkbox"
                      checked={requisitosGuardados[`profesor.${campo}`] || false}
                      onChange={(e) => handleCheckboxChange('profesor', campo, e.target.checked)}
                    />
                    {campo}
                  </label>
                </div>
              ))}

              <button className="boton-guardar" onClick={handleGuardarRequisitos}>
                Guardar Configuración de Campos
              </button>
            </div>        )}
        </div>
      )}
      </div>
    </div>
  );
};

export default RegistroRequisitos;