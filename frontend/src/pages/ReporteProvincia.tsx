import React, { useState, useEffect, ChangeEvent } from 'react';
import '../styles/Reportes.css';
import { styled } from '@mui/material/styles';
import {
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Divider,
} from '@mui/material';
import { obtenerTodasConvocatorias, obtenerReportePorCampoId, Convocatoria } from '../api/reportes';
import { exportarPDF } from '../components/exportarPDF';
import DescargarExcelButton from '../components/DescargarExcelButton';

interface ReporteInscripciones {
    id: string;
    estudiante: {
        nombres: string;
        apellidos: string;
        ci: string;
        grado: string;
        unidad_educativa: {
            nombre: string;
            departamento: string;
        };
        tutor_legal: {
            nombre: string;
            apellido: string;
            ci: string;
        };
    };
    [key: string]: any; // Para otras propiedades específicas de la inscripción
}

const ReporteProvincia = () => {
    const [reporteData, setReporteData] = useState<ReporteInscripciones[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [convocatorias, setConvocatorias] = useState<Convocatoria[] | null>(null);
    const [selectedConvocatoriaId, setSelectedConvocatoriaId] = useState<number | ''>('');
    const [selectedProvincia, setSelectedProvincia] = useState<string>('');
    const [selectedDepartamento, setSelectedDepartamento] = useState<string>('');
    const [loadingConvocatorias, setLoadingConvocatorias] = useState(false);
    const [errorConvocatorias, setErrorConvocatorias] = useState<string | null>(null);

    const departamentos: string[] = [
      "La Paz",
      "Cochabamba",
      "Santa Cruz",
      "Potosí",
      "Chuquisaca",
      "Oruro",
      "Tarija",
      "Beni",
      "Pando"
    ];

    const provincias : Record<string, string[]> = {
    "" : [ "Seleccione un departamento primero"],
    "La Paz": [
    "Abel Iturralde", "Aroma", "Bautista Saavedra", "Caranavi", "Eliodoro Camacho",
    "Franz Tamayo", "Gualberto Villarroel", "Ingavi", "Inquisivi", "José Ramón Loayza",
    "Larecaja", "Los Andes", "Manco Kapac", "Muñecas", "Nor Yungas", "Omasuyos",
    "Pacajes", "Pedro Domingo Murillo", "Sud Yungas"
  ],
  "Cochabamba": [
    "Arani", "Arque", "Ayopaya", "Capinota", "Carrasco", "Cercado", "Chapare",
    "Esteban Arce", "Germán Jordán", "Mizque", "Narciso Campero", "Punata",
    "Quillacollo", "Tapacarí", "Tiraque"
  ],
  "Santa Cruz": [
    "Andrés Ibáñez", "Ángel Sandoval", "Chiquitos", "Cordillera", "Florida",
    "Germán Busch", "Guarayos", "Ichilo", "Ignacio Warnes", "Manuel María Caballero",
    "Ñuflo de Chávez", "Obispo Santistevan", "Sara", "Vallegrande", "Velasco"
  ],
  "Potosí": [
    "Alonso de Ibáñez", "Antonio Quijarro", "Bernardino Bilbao", "Charcas",
    "Chayanta", "Cornelio Saavedra", "Daniel Campos", "Enrique Baldivieso",
    "José María Linares", "Modesto Omiste", "Nor Chichas", "Nor Lípez",
    "Rafael Bustillo", "Sud Chichas", "Sud Lípez", "Tomás Frías"
  ],
  "Chuquisaca": [
    "Azurduy", "Belisario Boeto", "Hernando Siles", "Jaime Zudáñez",
    "Juana Azurduy de Padilla", "Luis Calvo", "Nor Cinti", "Oropeza",
    "Sud Cinti", "Tomina", "Yamparáez"
  ],
  "Oruro": [
    "Abaroa", "Atahuallpa", "Carangas", "Cercado", "Eduardo Abaroa",
    "Ladislao Cabrera", "Litoral", "Nor Carangas", "Poopó", "Sabaya",
    "Sajama", "San Pedro de Totora", "Saucarí", "Sebastián Pagador",
    "Sud Carangas", "Tomás Barrón"
  ],
  "Tarija": [
    "Aniceto Arce", "Burdett O'Connor", "Cercado", "Eustaquio Méndez",
    "Gran Chaco", "José María Avilés"
  ],
  "Beni": [
    "Cercado", "Iténez", "José Ballivián", "Mamoré", "Marbán",
    "Moxos", "Vaca Díez", "Yacuma"
  ],
  "Pando": [
    "Abuná", "Federico Román", "Madre de Dios", "Manuripi", "Nicolás Suárez"
  ]
};

    
    useEffect(() => {
        const fetchConvocatorias = async () => {
            setLoadingConvocatorias(true);
            setErrorConvocatorias(null);
            try {
                const data = await obtenerTodasConvocatorias();
                setConvocatorias(data);
            } catch (error: any) {
                console.error('Error al cargar las convocatorias:', error);
                setErrorConvocatorias('Error al cargar las convocatorias.');
            } finally {
                setLoadingConvocatorias(false);
            }
        };

        fetchConvocatorias();
    }, []);

    useEffect(() => {
        const cargarReporte = async () => {
            if (selectedConvocatoriaId && selectedProvincia !== '') {
                setReporteData(null);
                setError(null);
                setLoading(true);
                try {
                    const params =  { 
                      departamento:selectedDepartamento,
                      provincia:selectedProvincia
                     };
                    const data = await obtenerReportePorCampoId('provincia', selectedConvocatoriaId , params);
                    setReporteData(data as ReporteInscripciones[]);
                } catch (err: any) {
                    console.error('Error al obtener el reporte de inscripciones:', err);
                    setError('Error al cargar el reporte de inscripciones.');
                    setReporteData(null);
                } finally {
                    setLoading(false);
                }
            } else {
                setReporteData(null);
            }
        };
        console.log(selectedConvocatoriaId,  selectedProvincia);
        cargarReporte();
    }, [selectedConvocatoriaId, selectedProvincia]);

    const handleConvocatoriaChange = (event: ChangeEvent<{ value: number | '' }>) => {
        setSelectedConvocatoriaId(event.target.value);
    };
    const handleDepartamentoChange = (event: ChangeEvent<{ value: string | '' }>) => {
        setSelectedDepartamento(event.target.value);
    };
    const handleProvinciaChange = (event: ChangeEvent<{ value: string | '' }>) => {
        setSelectedProvincia(event.target.value);
    };

    const manejarExportacion = () => {
        if (!reporteData || reporteData.length === 0) return;
        const nombreReporte = 'Reporte de Inscripciones por Convocatoria';
        const encabezados = [
            'Estudiante Nombres',
            'Estudiante Apellidos',
            'Estudiante CI',
            'Estudiante Grado',
            'Unidad Educativa',
            'Departamento',
            'Tutor Nombre',
            'Tutor Apellido',
            'Tutor CI',
            ...Object.keys(reporteData[0]).filter(key =>
                !['id', 'estudiante', 'created_at', 'updated_at', 'fecha_registro'].includes(key)
            ),
        ];

        const filas = reporteData.map((item) => {
            return [
                item.estudiante?.nombres ?? '',
                item.estudiante?.apellidos ?? '',
                item.estudiante?.ci ?? '',
                item.estudiante?.grado ?? '',
                item.estudiante?.unidad_educativa?.nombre ?? '',
                item.estudiante?.unidad_educativa?.departamento ?? '',
                item.estudiante?.tutor_legal?.nombre ?? '',
                item.estudiante?.tutor_legal?.apellido ?? '',
                item.estudiante?.tutor_legal?.ci ?? '',
                ...Object.keys(item)
                    .filter(key => !['id', 'estudiante', 'created_at', 'updated_at', 'fecha_registro'].includes(key))
                    .map(key => JSON.stringify(item[key])),
            ];
        });

        exportarPDF({ nombreReporte, encabezados, filas });
    };

    return (
        <Box className="reporte-convocatoria" sx={{ flexGrow: 1, p: 3, minWidth: 0 }}>
          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Reporte de Inscripciones por Provincia
            </Typography>
      
            <FormControl fullWidth margin="normal">
              <InputLabel id="select-convocatoria-label">Seleccionar Convocatoria</InputLabel>
              <Select
                labelId="select-convocatoria-label"
                id="select-convocatoria"
                value={selectedConvocatoriaId}
                label="Seleccionar Convocatoria"
                onChange={handleConvocatoriaChange}
              >
                <MenuItem value="">
                  <em>Ninguna</em>
                </MenuItem>
                {loadingConvocatorias && <MenuItem disabled>Cargando convocatorias...</MenuItem>}
                {errorConvocatorias && <MenuItem disabled>{errorConvocatorias}</MenuItem>}
                {convocatorias &&
                  convocatorias.map((convocatoria) => (
                    <MenuItem key={convocatoria.id} value={convocatoria.id}>
                      {convocatoria.nombre}
                    </MenuItem>
                  ))}
              </Select>
              </FormControl>

         
            <FormControl fullWidth margin="normal">

              <InputLabel id="select-departamento-label">Seleccionar Departamento</InputLabel>
              <Select
                labelId="select-departamento-label"
                id="select-departamento"
                value={selectedDepartamento}
                label="Seleccionar Departamento"
                onChange={handleDepartamentoChange}
              >

                <MenuItem value="">
                  <em>Ninguna</em>
                </MenuItem>
                  {departamentos.map((departamento) => (
                    <MenuItem key={departamento} value={departamento}>
                      {departamento}
                    </MenuItem>
                  ))}
              </Select>
              </FormControl>
            <FormControl fullWidth margin="normal">

              <InputLabel id="select-provincia-label">Seleccionar Provincia</InputLabel>
               <Select
                labelId="select-provincia-label"
                id="select-provincia"
                value={selectedProvincia}
                label="Seleccionar Provincia"
                onChange={handleProvinciaChange}
              >
                <MenuItem value="">
                  <em>Ninguna</em>
                </MenuItem>
                {loadingConvocatorias && <MenuItem disabled>Cargando convocatorias...</MenuItem>}
                {errorConvocatorias && <MenuItem disabled>{errorConvocatorias}</MenuItem>}
                {convocatorias &&
                    provincias[selectedDepartamento].map((provincia) => (
                    <MenuItem key={provincia} value={provincia}>
                      {provincia}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
      
            {loading && <Typography sx={{ mt: 2 }}>Cargando datos...</Typography>}
            {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
      
            {reporteData && reporteData.length === 0 && (
              <Typography sx={{ mt: 2 }}>No hubo inscripciones en esta convocatoria.</Typography>
            )}
      
            {reporteData && reporteData.length > 0 && (
              <>
                <TableContainer
                  component={Paper}
                  sx={{ width: '100%', maxHeight: '500px', mt: 4 }}
                >
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: 'black', fontWeight: 'bold' }}>Estudiante Nombres</TableCell>
                        <TableCell sx={{ color: 'black', fontWeight: 'bold' }}>Estudiante Apellidos</TableCell>
                        <TableCell sx={{ color: 'black', fontWeight: 'bold' }}>Estudiante CI</TableCell>
                        <TableCell sx={{ color: 'black', fontWeight: 'bold' }}>Estudiante Grado</TableCell>
                        <TableCell sx={{ color: 'black', fontWeight: 'bold' }}>Unidad Educativa</TableCell>
                        <TableCell sx={{ color: 'black', fontWeight: 'bold' }}>Departamento</TableCell>
                        <TableCell sx={{ color: 'black', fontWeight: 'bold' }}>Tutor Nombre</TableCell>
                        <TableCell sx={{ color: 'black', fontWeight: 'bold' }}>Tutor Apellido</TableCell>
                        <TableCell sx={{ color: 'black', fontWeight: 'bold' }}>Tutor CI</TableCell>
                        {Object.keys(reporteData[0]).filter(key =>
                          !['id', 'estudiante', 'created_at', 'updated_at', 'fecha_registro'].includes(key)
                        ).map((header, index) => (
                          <TableCell sx={{ color: 'black', fontWeight: 'bold' }} key={`extra_header_${index}`}>{header}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reporteData.map((item: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>{item.estudiante?.nombres}</TableCell>
                          <TableCell>{item.estudiante?.apellidos}</TableCell>
                          <TableCell>{item.estudiante?.ci}</TableCell>
                          <TableCell>{item.estudiante?.grado}</TableCell>
                          <TableCell>{item.estudiante?.unidad_educativa?.nombre}</TableCell>
                          <TableCell>{item.estudiante?.unidad_educativa?.departamento}</TableCell>
                          <TableCell>{item.estudiante?.tutor_legal?.nombre}</TableCell>
                          <TableCell>{item.estudiante?.tutor_legal?.apellido}</TableCell>
                          <TableCell>{item.estudiante?.tutor_legal?.ci}</TableCell>
                          {Object.keys(item)
                            .filter(key => !['id', 'estudiante', 'created_at', 'updated_at', 'fecha_registro'].includes(key))
                            .map((key, index) => (
                              <TableCell key={`extra_cell_${idx}_${index}`}>{JSON.stringify(item[key])}</TableCell>
                            ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
      
                <Button
                  variant="contained"
                  onClick={manejarExportacion}
                  sx={{ mt: 2 }}
                  disabled={!reporteData || reporteData.length === 0}
                >
                  Exportar PDF
                </Button>
                <DescargarExcelButton
                  data={reporteData} 
                  campo="Provincia"/>
              </>
            )}
          </Box>
        </Box>
      );
      
}

export default ReporteProvincia;