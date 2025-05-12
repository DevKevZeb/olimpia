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
} from '@mui/material';
import { obtenerTodasConvocatorias, obtenerReportePorCampoId, Convocatoria } from '../api/reportes';
import { exportarPDF } from '../components/exportarPDF';

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

const ReporteConvocatoriaView = () => {
    const [reporteData, setReporteData] = useState<ReporteInscripciones[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [convocatorias, setConvocatorias] = useState<Convocatoria[] | null>(null);
    const [selectedConvocatoriaId, setSelectedConvocatoriaId] = useState<number | ''>('');
    const [loadingConvocatorias, setLoadingConvocatorias] = useState(false);
    const [errorConvocatorias, setErrorConvocatorias] = useState<string | null>(null);

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
            if (selectedConvocatoriaId) {
                setReporteData(null);
                setError(null);
                setLoading(true);
                try {
                    const data = await obtenerReportePorCampoId('convocatoria', selectedConvocatoriaId);
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

        cargarReporte();
    }, [selectedConvocatoriaId]);

    const handleConvocatoriaChange = (event: ChangeEvent<{ value: number | '' }>) => {
        setSelectedConvocatoriaId(event.target.value);
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
              Reporte de Inscripciones por Convocatoria
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
                        <TableCell>Estudiante Nombres</TableCell>
                        <TableCell>Estudiante Apellidos</TableCell>
                        <TableCell>Estudiante CI</TableCell>
                        <TableCell>Estudiante Grado</TableCell>
                        <TableCell>Unidad Educativa</TableCell>
                        <TableCell>Departamento</TableCell>
                        <TableCell>Tutor Nombre</TableCell>
                        <TableCell>Tutor Apellido</TableCell>
                        <TableCell>Tutor CI</TableCell>
                        {Object.keys(reporteData[0]).filter(key =>
                          !['id', 'estudiante', 'created_at', 'updated_at', 'fecha_registro'].includes(key)
                        ).map((header, index) => (
                          <TableCell key={`extra_header_${index}`}>{header}</TableCell>
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
              </>
            )}
          </Box>
        </Box>
      );
      
}

export default ReporteConvocatoriaView;