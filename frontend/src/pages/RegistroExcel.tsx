import React, { useState, useCallback, useEffect } from 'react';
import '../styles/DowloadTemplate.css';
import '../styles/RegistroExcel.css';
import '../styles/UploadAndScan.css';
import '../styles/DataSummary.css';
import * as XLSX from 'xlsx';
import { fetchConvocatorias } from '../api/requisitoConvocatoria'; // Import para obtener la configuración de la convocatoria
import { loadAllConvocatoriaNivelConfigs, loadAllGrades, buscarIdConvocatoriaNivelEnMemoria, getGradoIdByName} from '../api/datosExcel';
import { inscribirEstudiante } from '../api/registration/inscripcionCompletaApi';
import DownloadTemplate from './DownloadTemplate';
import 'react-toastify/dist/ReactToastify.css';
import { toast, ToastContainer } from 'react-toastify';
import FormularioEncargadoPago from './FormularioEncargadoPago';

interface Convocatoria {
  id_convocatoria: number;
  nombre: string;
  estado: string;
  max_areas_por_estudiante: number;
}

interface UploadAndScanProps {
  selectedConvocatoriaId: number | null;
  onDataScanned: (data: any[]) => void;
  convocatoriaData: Convocatoria | null; // Pasar la información de la convocatoria
}

const UploadAndScan: React.FC<UploadAndScanProps> = ({ selectedConvocatoriaId, onDataScanned, convocatoriaData }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  useEffect(() => {
      const initializeData = async () => {
          if (selectedConvocatoriaId) {
              setIsLoadingData(true);
              try {
                  await loadAllConvocatoriaNivelConfigs(selectedConvocatoriaId);
                  await loadAllGrades();
                  //toast.success('Datos de configuración y grados cargados correctamente en memoria.');
              } catch (error) {
                  console.error('Error during initial data load:', error);
                  //toast.error('Error al cargar datos iniciales para el procesamiento de Excel.');
                  setScanError('Error al preparar los datos. Intenta recargar la página.');
              } finally {
                  setIsLoadingData(false);
              }
          }
      };

      initializeData();
  }, [selectedConvocatoriaId]); 

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      console.log('Archivo seleccionado:', file);
    } else {
      setSelectedFile(null);
      console.log('No se seleccionó ningún archivo.');
    }
  };

  const excelDateToJSDate = useCallback((serial: number): string => {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date = new Date(utc_value * 1000);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const handleScan = useCallback(async () => {
      console.log('--- handleScan INICIO ---');
      setScanError(null); // Clear previous errors

      if (!selectedFile) {
          setScanError('Por favor, selecciona un archivo Excel.');
          return;
      }

      if (!selectedConvocatoriaId) {
          setScanError('Por favor, selecciona una convocatoria.');
          return;
      }

      if (!convocatoriaData?.max_areas_por_estudiante) {
          setScanError('No se pudo obtener la configuración del máximo de áreas para esta convocatoria. Asegúrate de que la convocatoria esté cargada.');
          return;
      }

      if (isLoadingData) {
          setScanError('Los datos aún se están cargando. Por favor, espera un momento.');
          return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
          const binaryString = e.target?.result;
          if (binaryString) {
              try {
                  const workbook = XLSX.read(binaryString, { type: 'binary' });
                  const sheetName = workbook.SheetNames[0];
                  const worksheet = workbook.Sheets[sheetName];
                  const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                  console.log('rawData (datos crudos del Excel):', rawData);

                  if (rawData.length <= 1) {
                      setScanError('El archivo Excel está vacío o no tiene datos (solo encabezados).');
                      return;
                  }

                  const headers = rawData[0]?.map((header: any) => String(header).trim().toLowerCase()) || [];
                  console.log('Headers extraídos:', headers);
                  const dataRows = rawData.slice(1);
                  const transformedData: any[] = [];
                  const studentAreaCounts: { [ci: string]: number } = {};
                  const errors: string[] = []; // Array para almacenar los errores de validación de filas

                  for (let i = 0; i < dataRows.length; i++) {
                      const row = dataRows[i];
                      const rowNumber = i + 2; // Real row number in Excel (1-based, +1 for headers)
                      console.log(`--- Procesando fila ${rowNumber} ---`, row);

                      let isValidRow = true;
                      const rowErrors: string[] = [];

                      const nombre_area = String(row[0] || '').trim();
                      if (!nombre_area) { isValidRow = false; rowErrors.push('"Nombre Área" es obligatorio.'); }

                      const nombre_nivel = String(row[1] || '').trim();
                      if (!nombre_nivel) { isValidRow = false; rowErrors.push('"Nombre Nivel" es obligatorio.'); }

                      const nombre_grado = String(row[12] || '').trim();
                      if (!nombre_grado) { isValidRow = false; rowErrors.push('"Grado" es obligatorio.'); }

                      const nombres = String(row[3] || '').trim();
                      if (!nombres) { isValidRow = false; rowErrors.push('"Nombres" es obligatorio.'); }
                      else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombres)) { isValidRow = false; rowErrors.push('"Nombres" debe contener solo letras y espacios.'); }

                      const apellidos = String(row[4] || '').trim();
                      if (!apellidos) { isValidRow = false; rowErrors.push('"Apellidos" es obligatorio.'); }
                      else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(apellidos)) { isValidRow = false; rowErrors.push('"Apellidos" debe contener solo letras y espacios.'); }

                      const ci_raw = row[5];
                      const ci = typeof ci_raw === 'number' ? String(ci_raw) : String(ci_raw || '').trim();
                      if (!ci) { isValidRow = false; rowErrors.push('"CI" es obligatorio.'); }
                      else if (!/^[0-9]+$/.test(ci)) { isValidRow = false; rowErrors.push('"CI" debe contener solo números.'); }

                      const genero = String(row[6] || '').trim();
                      if (!genero) { isValidRow = false; rowErrors.push('"Género" es obligatorio.'); }

                      const fecha_nacimiento_raw = row[7];
                      let fecha_nacimiento = '';
                      if (typeof fecha_nacimiento_raw === 'number') {
                          fecha_nacimiento = excelDateToJSDate(fecha_nacimiento_raw);
                      } else if (typeof fecha_nacimiento_raw === 'string') {
                          fecha_nacimiento = fecha_nacimiento_raw.trim();
                          if (fecha_nacimiento && !/^\d{4}-\d{2}-\d{2}$/.test(fecha_nacimiento)) {
                              isValidRow = false;
                              rowErrors.push('"Fecha de Nacimiento" debe tener el formato YYYY-MM-DD.');
                          }
                      } else {
                          isValidRow = false;
                          rowErrors.push('"Fecha de Nacimiento" tiene un formato incorrecto o es nulo.');
                      }

                      const email = String(row[8] || '').trim();
                      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                          isValidRow = false;
                          rowErrors.push('"Email" tiene un formato inválido.');
                      }

                      const unidad_educativa_nombre = String(row[9] || '').trim();
                      if (!unidad_educativa_nombre) { isValidRow = false; rowErrors.push('"Unidad Educativa" es obligatorio.'); }

                      const departamento = String(row[10] || '').trim();
                      if (!departamento) { isValidRow = false; rowErrors.push('"Departamento" es obligatorio.'); }

                      const provincia = String(row[11] || '').trim();
                      if (!provincia) { isValidRow = false; rowErrors.push('"Provincia" es obligatorio.'); }

                      const tutor_legal_nombres = String(row[14] || '').trim();
                      if (!tutor_legal_nombres) { isValidRow = false; rowErrors.push('"Nombres del Tutor Legal" es obligatorio.'); }
                      else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(tutor_legal_nombres)) { isValidRow = false; rowErrors.push('"Nombres del Tutor Legal" debe contener solo letras y espacios.'); }

                      const tutor_legal_apellidos = String(row[15] || '').trim();
                      if (!tutor_legal_apellidos) { isValidRow = false; rowErrors.push('"Apellidos del Tutor Legal" es obligatorio.'); }
                      else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(tutor_legal_apellidos)) { isValidRow = false; rowErrors.push('"Apellidos del Tutor Legal" debe contener solo letras y espacios.'); }

                      const tutor_legal_ci_raw = row[16];
                      const tutor_legal_ci = typeof tutor_legal_ci_raw === 'number' ? String(tutor_legal_ci_raw) : String(tutor_legal_ci_raw || '').trim();
                      if (tutor_legal_ci && !/^[0-9]+$/.test(tutor_legal_ci)) { isValidRow = false; rowErrors.push('"CI Tutor Legal" debe contener solo números.'); }

                      const tutor_legal_telefono_raw = row[17];
                      const tutor_legal_telefono = typeof tutor_legal_telefono_raw === 'number' ? String(tutor_legal_telefono_raw) : String(tutor_legal_telefono_raw || '').trim();
                      if (tutor_legal_telefono && !/^[0-9]+$/.test(tutor_legal_telefono)) { isValidRow = false; rowErrors.push('"Teléfono Tutor Legal" debe contener solo números.'); }

                      const tutor_legal_email = String(row[18] || '').trim();
                      if (tutor_legal_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tutor_legal_email)) {
                          isValidRow = false;
                          rowErrors.push('"Email Tutor Legal" tiene un formato inválido.');
                      }

                      const tutor_legal_parentesco = String(row[19] || '').trim();
                      if (!tutor_legal_parentesco) { isValidRow = false; rowErrors.push('"Parentesco del Tutor Legal" es obligatorio.'); }
                      else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(tutor_legal_parentesco)) { isValidRow = false; rowErrors.push('"Parentesco del Tutor Legal" debe contener solo letras y espacios.'); }

                      let tutor_academico_nombres = String(row[21] || '').trim();
                      let tutor_academico_apellidos = String(row[22] || '').trim();
                      const tutor_academico_ci_raw = row[23];
                      let tutor_academico_ci = typeof tutor_academico_ci_raw === 'number' ? String(tutor_academico_ci_raw) : String(tutor_academico_ci_raw || '').trim();
                      const tutor_academico_telefono_raw = row[24];
                      let tutor_academico_telefono = typeof tutor_academico_telefono_raw === 'number' ? String(tutor_academico_telefono_raw) : String(tutor_academico_telefono_raw || '').trim();
                      let tutor_academico_email = String(row[25] || '').trim();

                      const hasTutorAcademicoData = tutor_academico_nombres || tutor_academico_apellidos || tutor_academico_ci || tutor_academico_telefono || tutor_academico_email;

                      if (hasTutorAcademicoData) {
                          if (!tutor_academico_nombres) { isValidRow = false; rowErrors.push('"Nombres del Tutor Académico" son obligatorios si se proporciona información.'); }
                          else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(tutor_academico_nombres)) { isValidRow = false; rowErrors.push('"Nombres del Tutor Académico" debe contener solo letras y espacios.'); }

                          if (!tutor_academico_apellidos) { isValidRow = false; rowErrors.push('"Apellidos del Tutor Académico" son obligatorios si se proporciona información.'); }
                          else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(tutor_academico_apellidos)) { isValidRow = false; rowErrors.push('"Apellidos del Tutor Académico" deben contener solo letras y espacios.'); }

                          if (tutor_academico_ci && !/^[0-9]+$/.test(tutor_academico_ci)) { isValidRow = false; rowErrors.push('"CI Tutor Académico" debe contener solo números.'); }

                          if (tutor_academico_telefono && !/^[0-9]+$/.test(tutor_academico_telefono)) { isValidRow = false; rowErrors.push('"Teléfono Tutor Académico" debe contener solo números.'); }

                          if (tutor_academico_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tutor_academico_email)) {
                              isValidRow = false;
                              rowErrors.push('"Email Tutor Académico" tiene un formato inválido.');
                          }
                      } else {
                          // If no academic tutor data is provided, ensure fields are empty strings for consistent payload
                          tutor_academico_nombres = '';
                          tutor_academico_apellidos = '';
                          tutor_academico_telefono = '';
                          tutor_academico_email = '';
                          tutor_academico_ci = '';
                      }

                      if (!isValidRow) {
                          errors.push(`Fila ${i + 2}: ${rowErrors.join(',\n')}`);
                          continue;
                      }

                      // --- Logic to get id_convocatoria_nivel from memory ---
                      if (ci && nombre_area && nombre_nivel && nombre_grado) {
                          // Initialize studentAreaCounts for CI if not already done
                          if (studentAreaCounts[ci] === undefined) {
                              studentAreaCounts[ci] = 0;
                          }

                          if (studentAreaCounts[ci] < convocatoriaData.max_areas_por_estudiante) {
                              // *** HERE IS THE KEY CHANGE ***
                              // Call the in-memory lookup function. No 'await' needed!
                              const id_convocatoria_nivel_result = buscarIdConvocatoriaNivelEnMemoria(
                                  nombre_area,
                                  nombre_nivel,
                                  nombre_grado 
                              );

                              const id_grado = getGradoIdByName(nombre_grado);

                              console.log(`Fila ${rowNumber}: id_convocatoria_nivel_result`, id_convocatoria_nivel_result);

                              if (id_convocatoria_nivel_result !== null) {
                                  transformedData.push({
                                      nombres: nombres,
                                      apellidos: apellidos,
                                      ci: ci,
                                      genero: genero,
                                      fecha_nacimiento: fecha_nacimiento,
                                      email: email,
                                      id_grado: id_grado,
                                      unidad_educativa: {
                                          id_unidad_educativa: null, // Not provided in Excel
                                          nombre: unidad_educativa_nombre,
                                          departamento: departamento,
                                          provincia: provincia,
                                      },
                                      tutor_legal: {
                                          nombres: tutor_legal_nombres,
                                          apellidos: tutor_legal_apellidos,
                                          ci: tutor_legal_ci,
                                          telefono: tutor_legal_telefono,
                                          email: tutor_legal_email,
                                          parentesco: tutor_legal_parentesco,
                                          es_el_mismo_estudiante: false, // TODO: Implement logic if necessary
                                      },
                                      id_convocatoria: String(selectedConvocatoriaId),
                                      areas_seleccionadas: [{ id_convocatoria_nivel: id_convocatoria_nivel_result }],
                                      tutores_academicos: hasTutorAcademicoData ? [{
                                          id_convocatoria_nivel: id_convocatoria_nivel_result, // Associate with this specific area
                                          nombres: tutor_academico_nombres,
                                          apellidos: tutor_academico_apellidos,
                                          ci: tutor_academico_ci,
                                          telefono: tutor_academico_telefono,
                                          email: tutor_academico_email,
                                      }] : [],
                                  });
                                  studentAreaCounts[ci]++; 
                              } else {
                                  errors.push(`Fila ${rowNumber}: No se encontró configuración de Convocatoria-Nivel para Área="${nombre_area}", Nivel="${nombre_nivel}", Grado="${nombre_grado}".`);
                              }
                          } else {
                              errors.push(`Fila ${rowNumber}: El estudiante con CI ${ci} ha alcanzado el máximo de áreas permitidas (${convocatoriaData.max_areas_por_estudiante}).`);
                          }
                      } else {
                          errors.push(`Fila ${rowNumber}: Faltan campos obligatorios (Nombre Área, Nombre Nivel, Nombres, Apellidos, CI, Grado) para esta fila.`);
                      }
                  }

                  if (errors.length > 0) {
                      setScanError(`Se encontraron los siguientes errores en el archivo Excel:\n${errors.join('\n')}`);
                      return;
                  }

                  console.log('transformedData (datos transformados):', transformedData);
                  onDataScanned(transformedData);
                  setScanError(null);

              } catch (error: any) {
                  setScanError('Error al leer el archivo Excel. Asegúrate de que el formato sea correcto.');
                  console.error('Error al leer Excel:', error);
              }
          }
      };
      reader.readAsBinaryString(selectedFile);
  }, [selectedFile, onDataScanned, selectedConvocatoriaId, convocatoriaData, excelDateToJSDate]); 

  return (
      <div className='upload-scan-container'>
          <h2>Subir y Escanear Archivo Excel</h2>
          <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
          <button
              onClick={handleScan}
              disabled={!selectedFile || !selectedConvocatoriaId || !convocatoriaData || isLoadingData}
          >
              {isLoadingData ? 'Cargando datos...' : 'Escanear y Convertir'}
          </button>
          {scanError && <p style={{ color: 'red' }}>{scanError}</p>}
          {isLoadingData && (
              <p style={{ color: 'blue' }}>Cargando datos de configuración y grados...</p>
          )}
          {!convocatoriaData?.max_areas_por_estudiante && selectedConvocatoriaId && !isLoadingData && (
              <p style={{ color: 'orange' }}>Esperando la configuración de la convocatoria...</p>
          )}
          <ToastContainer />
      </div>
  );
};

const DataSummary = ({ scannedData, onCancel, onSave }: { scannedData: any[]; onCancel: () => void; onSave: (data: any) => void }) => {
  console.log("DataSummary recibió scannedData transformado:", scannedData);
  const headers = scannedData[0] ? Object.keys(scannedData[0]) : [];
  const [showPagoForm, setShowPagoForm] = useState(false);
  const [pagoFormData, setPagoFormData] = useState<Record<string, any>>({
    ci_encargado: '',
    nombres_encargado: '',
    apellidos_encargado: '',
    email_encargado: '',
  });
  const [isPagoFormValid, setIsPagoFormValid] = useState(false); 

  const handlePagoFormInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setPagoFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleMostrarFormularioPago = () => {
    setShowPagoForm(true);
  };

  const handlePagoFormValidityChange = (isValid: boolean) => {
    setIsPagoFormValid(isValid);
  };

  const handleGuardarInscripcion = () => {
    if (scannedData.length > 0 && isPagoFormValid) {
      const codigo_unico = `O-SANSI-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
      const dataConPago = {
        lista_inscripcion: scannedData,
        id_convocatoria: scannedData[0]?.id_convocatoria,
        codigo_unico: codigo_unico,
        encargado_pago: pagoFormData,
      };
      onSave(dataConPago);
    } else if (!isPagoFormValid) {
      alert('Por favor, completa todos los campos del formulario del encargado de pago.');
    } else {
      alert('No hay datos para inscribir.');
    }
  };

  return (
    <div className='data-summary-container'>
      <h2>Vista Previa de Datos para Inscripción</h2>

      {/* MODIFICACIÓN CLAVE AQUÍ */}
      {scannedData.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#555', marginTop: '20px' }}>
          No hay datos para mostrar en la vista previa. Asegúrate de que el archivo Excel contenga datos válidos y que no haya errores durante el escaneo.
        </p>
      ) : (
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                {headers.map((header) => (
                  <th
                    key={header}
                    style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scannedData.map((row, index) => (
                <tr key={index}>
                  {headers.map((header) => (
                    <td key={`${index}-${header}`} style={{ border: '1px solid #ddd', padding: '8px' }}>
                      {header === 'unidad_educativa' ? (
                        <>
                          {row.unidad_educativa?.nombre}
                          {row.unidad_educativa?.departamento && ` (${row.unidad_educativa.departamento})`}
                          {row.unidad_educativa?.provincia && `, ${row.unidad_educativa.provincia}`}
                        </>
                      ) : header === 'tutor_legal' ? (
                        <>
                          Nombre: {row.tutor_legal?.nombres} {row.tutor_legal?.apellidos}<br />
                          CI: {row.tutor_legal?.ci}<br />
                          Teléfono: {row.tutor_legal?.telefono}<br />
                          Email: {row.tutor_legal?.email}<br />
                          Parentesco: {row.tutor_legal?.parentesco}
                        </>
                      ) : header === 'areas_seleccionadas' ? (
                        // Muestra los IDs de convocatoria_nivel.
                        // Si quieres mostrar los nombres de Área y Nivel, necesitarías un mapeo adicional.
                        row.areas_seleccionadas?.map((area: { id_convocatoria_nivel: any }) => area.id_convocatoria_nivel).join(', ')
                      ) : header === 'tutores_academicos' ? (
                        row.tutores_academicos?.length > 0 ? (
                          row.tutores_academicos.map((tutor: { nombres: any; apellidos: any; ci: any; telefono: any; email: any }, index: number) => (
                            <React.Fragment key={index}>
                              Nombre: {tutor.nombres} {tutor.apellidos}<br />
                              CI: {tutor.ci}<br />
                              Teléfono: {tutor.telefono}<br />
                              Email: {tutor.email}<br />
                              {index < row.tutores_academicos.length - 1 && <hr />}
                            </React.Fragment>
                          ))
                        ) : (
                          'No asignado'
                        )
                      ) : (
                        row[header]
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="actions">
        <button onClick={onCancel}>Volver</button>
        <button onClick={handleMostrarFormularioPago} disabled={scannedData.length === 0}>Inscribir Estudiantes</button>
      </div>

      {showPagoForm && (
        <div className="formulario-pago-container">
          <FormularioEncargadoPago
            formData={pagoFormData}
            onInputChange={handlePagoFormInputChange}
            onFormValidityChange={handlePagoFormValidityChange}
          />
          <button onClick={handleGuardarInscripcion} disabled={!isPagoFormValid }>
            Guardar Inscripción con Datos de Pago
          </button>
        </div>
      )}
    </div>
  );
};

const ExcelWorkflow = () => {
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
  const [loadingConvocatorias, setLoadingConvocatorias] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConvocatoriaId, setSelectedConvocatoriaId] = useState<number | null>(null);
  const [showExcelUpload, setShowExcelUpload] = useState(false);
  const [scannedData, setScannedData] = useState<any[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [convocatoriaData, setConvocatoriaData] = useState<Convocatoria | null>(null);
  const [globalErrorMessages, setGlobalErrorMessages] = useState<string[]>([]);

  useEffect(() => {
    const loadConvocatorias = async () => {
      try {
        const data = await fetchConvocatorias();
        const openConvocatorias = data.filter(c => c.estado === 'abierta');
        setConvocatorias(openConvocatorias);
        setLoadingConvocatorias(false);
      } catch (error: any) {
        setError('Error al cargar las convocatorias: ' + error.message);
        setLoadingConvocatorias(false);
      }
    };

    loadConvocatorias();
  }, []);

  useEffect(() => {
    const loadConvocatoriaConfig = async () => {
      if (selectedConvocatoriaId) {
        const convocatoria = convocatorias.find(c => c.id_convocatoria === selectedConvocatoriaId);
        setConvocatoriaData(convocatoria || null);
      } else {
        setConvocatoriaData(null);
      }
    };

    loadConvocatoriaConfig();
  }, [selectedConvocatoriaId, convocatorias]);

  const handleConvocatoriaChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const convocatoriaId = event.target.value ? parseInt(event.target.value, 10) : null;
    setSelectedConvocatoriaId(convocatoriaId);
    setShowExcelUpload(!!convocatoriaId);
    setShowScanner(!!convocatoriaId);
    setShowSummary(false);
    setScannedData([]);
    setConvocatoriaData(convocatorias.find(c => c.id_convocatoria === convocatoriaId) || null);
  };

  const handleDataScanned = (data: any[]) => {
    console.log("Datos escaneados y transformados:", data);
    setScannedData(data);
    setShowScanner(false);
    setShowSummary(true);
  };

  const handleCancelSummary = () => {
    setShowScanner(true);
    setShowSummary(false);
    setScannedData([]);
  };

  const handleInscribir = async (dataToSend: any) => {
    console.log('Datos a enviar al backend:', dataToSend);
    setGlobalErrorMessages([]);
    try {
      const response = await inscribirEstudiante(dataToSend); 
      const codigoUnico = response.codigo_unico || dataToSend.codigo_unico;
      console.log('Respuesta de inscripción:', response);
      toast.success(`Inscripción completada con éxito. Su código único es: ${codigoUnico}`, {
        position: "top-right",
      });
      setShowSummary(false);
      setScannedData([]);
      setSelectedConvocatoriaId(null);
      setShowExcelUpload(false);
      setShowScanner(false);
      setConvocatoriaData(null);
    } catch (error: any) {
      
      if (error.response?.status === 422 && error.response?.data?.errors) {
        const messages = Object.values(error.response.data.errors).flat() as string[];
        setGlobalErrorMessages(messages); // Almacena todos los mensajes de error
        toast.error(`Opsie! Errores en los datos. Por favor, revisa el cuadro de errores.`, {
                position: "top-right",
                autoClose: 10000,
        });
      } else if (error.response?.status === 409) {
        toast.error("Opsie! El estudiante ya está inscrito en esta materia y nivel.", {
            position: "top-right",
            autoClose: 5000,
        });
      } else {
        toast.error(`Opsie! Algo salió mal: ${error.response?.data?.message || error.message || 'Error desconocido'}`, {
            position: "top-right",
            autoClose: 5000,
        });
      }
      console.error('Error al inscribir estudiantes:', error);
      console.error('Detalles del error de validación:', error.response?.data);

    }
  };

  return (
    <div className="registro-requisitos">
      <h2>Inscripcion mediante planilla Excel</h2>

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

      <DownloadTemplate selectedConvocatoriaId={selectedConvocatoriaId} />

      {showExcelUpload && (
        <>
          {showScanner && (
            <UploadAndScan
              selectedConvocatoriaId={selectedConvocatoriaId}
              onDataScanned={handleDataScanned}
              convocatoriaData={convocatoriaData}
            />
          )}
          {showSummary && (
            <DataSummary scannedData={scannedData} onCancel={handleCancelSummary} onSave={handleInscribir} />
          )}
        </>
      )}

      {loadingConvocatorias && <div>Cargando convocatorias...</div>}
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}

      {globalErrorMessages.length > 0 && (
            <div style={{
                border: '1px solid red',
                padding: '15px',
                margin: '20px 0',
                backgroundColor: '#ffe6e6',
                borderRadius: '5px',
                color: '#cc0000'
            }}>
                <h4>¡Atención! Errores de validación:</h4>
                <ul>
                    {globalErrorMessages.map((msg, index) => (
                        <li key={index}>{msg}</li>
                    ))}
                </ul>
                <button onClick={() => setGlobalErrorMessages([])} style={{ marginTop: '10px' }}>
                    Entendido
                </button>
            </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default ExcelWorkflow;