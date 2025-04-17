import React, { useState, useEffect } from 'react';
import '../styles/CamposObligatorios.css';
import { RequisitoConvocatoria } from '../types/RequisitoConvocatoria'; // Asegúrate de crear este archivo de tipos
import { fetchConvocatorias, fetchRequisitosConvocatoria, saveRequisitosConvocatoria } from '../api/requisitoConvocatoria'; // Asegúrate de crear este archivo de API


interface Props {
  // Puedes pasar un ID de convocatoria inicial si es necesario
  initialConvocatoriaId?: number;
}

const RegistroRequisitos: React.FC<Props> = ({ initialConvocatoriaId }) => {
  const [convocatorias, setConvocatorias] = useState<{ id_convocatoria: number; nombre: string }[]>([]);
  const [selectedConvocatoriaId, setSelectedConvocatoriaId] = useState<number | undefined>(initialConvocatoriaId);
  const [requisitosGuardados, setRequisitosGuardados] = useState<Record<string, boolean>>({});
  const [loadingConvocatorias, setLoadingConvocatorias] = useState(true);
  const [loadingRequisitos, setLoadingRequisitos] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const camposPostulante = ['nombres', 'apellidos', 'ci', 'fecha_nacimiento', 'email', 'id_unidad_educativa', 'id_grado', 'id_tutor_legal'];
  const camposTutorLegal = ['nombres', 'apellidos', 'ci', 'telefono', 'email', 'parentesco', 'es_el_mismo_estudiante'];
  const camposTutorAcademico = ['nombres', 'apellidos', 'ci', 'telefono', 'email'];

  useEffect(() => {
    const loadConvocatorias = async () => {
      try {
        const data = await fetchConvocatorias();
        setConvocatorias(data);
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
    setRequisitosGuardados((prev) => ({
      ...prev,
      [`${entidad}.${campo}`]: checked,
    }));
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

  if (loadingConvocatorias) {
    return <div>Cargando convocatorias...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="registro-requisitos">
      <h2>Configuracion de Campos Obligatorios por Convocatoria</h2>

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
              {camposPostulante.map((campo) => (
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
              {camposTutorLegal.map((campo) => (
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

              <h4>Del Tutor Académico:</h4>
              {camposTutorAcademico.map((campo) => (
                <div className="requisito-checkbox" key={`tutorAcademico.${campo}`}>
                  <label>
                    <input
                      type="checkbox"
                      checked={requisitosGuardados[`tutorAcademico.${campo}`] || false}
                      onChange={(e) => handleCheckboxChange('tutorAcademico', campo, e.target.checked)}
                    />
                    {campo}
                  </label>
                </div>
              ))}

              <button className="boton-guardar" onClick={handleGuardarRequisitos}>
                Guardar Configuración de Campos
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RegistroRequisitos;