import React, { useState, useEffect, ChangeEvent, ReactNode } from 'react';
import '../styles/Reportes.css';
import { styled } from '@mui/material/styles';
import {
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    IconButton,
    Typography,
    Collapse,
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
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { obtenerTodasConvocatorias, obtenerReportePorCampoId, Convocatoria } from '../api/reportes';
import { exportarPDF } from '../components/exportarPDF';

interface ReporteItem {
    id: string;
    nombre: string;
    fetchData?: (id: string) => Promise<any | null>;
    renderTableHeaders?: (data: any) => string[];
    renderTableRow?: (item: any) => ReactNode[];
}

const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    ...theme.mixins.toolbar,
    justifyContent: 'flex-end',
}));

const reportesInicial: ReporteItem[] = [
    {
        id: 'reporte_inscripciones',
        nombre: 'Reporte de Inscripciones por convocatoria',
        renderTableHeaders: (data: any) => {
            if (data && Array.isArray(data) && data.length > 0) {
                const firstItem = data[0];
                const headers = [];
                for (const key in firstItem) {
                    if (firstItem.hasOwnProperty(key) && key === 'estudiante') {
                        const estudiante = firstItem[key];
                        if (estudiante.hasOwnProperty('nombres')) headers.push('estudiante.nombres');
                        if (estudiante.hasOwnProperty('apellidos')) headers.push('estudiante.apellidos');
                        if (estudiante.hasOwnProperty('ci')) headers.push('estudiante.ci');
                        if (estudiante.hasOwnProperty('grado')) headers.push('estudiante.grado');
                        if (estudiante.hasOwnProperty('unidad_educativa')) {
                            const unidadEducativa = estudiante['unidad_educativa'];
                            if (unidadEducativa.hasOwnProperty('nombre')) headers.push('estudiante.unidad_educativa.nombre');
                            if (unidadEducativa.hasOwnProperty('departamento')) headers.push('estudiante.unidad_educativa.departamento');
                        }
                        if (estudiante.hasOwnProperty('tutor_legal')) {
                            const tutorLegal = estudiante['tutor_legal'];
                            if (tutorLegal.hasOwnProperty('nombre')) headers.push('estudiante.tutor_legal.nombre');
                            if (tutorLegal.hasOwnProperty('apellido')) headers.push('estudiante.tutor_legal.apellido');
                            if (tutorLegal.hasOwnProperty('ci')) headers.push('estudiante.tutor_legal.ci');
                        }
                    } else if (!key.includes('estudiante') && !key.includes('id') && !key.includes('created_at') && !key.includes('updated_at') && !key.includes('fecha_registro')) {
                        headers.push(key);
                    }
                }
                return headers;
            }
            return [];
        },
        renderTableRow: (item: any) => {
            const rowData: ReactNode[] = [];
            for (const key in item) {
                if (item.hasOwnProperty(key) && key === 'estudiante') {
                    const estudiante = item[key];
                    if (estudiante.hasOwnProperty('nombres')) rowData.push(<TableCell key="estudiante.nombres">{JSON.stringify(estudiante['nombres'])}</TableCell>);
                    if (estudiante.hasOwnProperty('apellidos')) rowData.push(<TableCell key="estudiante.apellidos">{JSON.stringify(estudiante['apellidos'])}</TableCell>);
                    if (estudiante.hasOwnProperty('ci')) rowData.push(<TableCell key="estudiante.ci">{JSON.stringify(estudiante['ci'])}</TableCell>);
                    if (estudiante.hasOwnProperty('grado')) rowData.push(<TableCell key="estudiante.grado">{JSON.stringify(estudiante['grado'])}</TableCell>);
                    if (estudiante.hasOwnProperty('unidad_educativa')) {
                        const unidadEducativa = estudiante['unidad_educativa'];
                        if (unidadEducativa.hasOwnProperty('nombre')) rowData.push(<TableCell key="estudiante.unidad_educativa.nombre">{JSON.stringify(unidadEducativa['nombre'])}</TableCell>);
                        if (unidadEducativa.hasOwnProperty('departamento')) rowData.push(<TableCell key="estudiante.unidad_educativa.departamento">{JSON.stringify(unidadEducativa['departamento'])}</TableCell>);
                    }
                    if (estudiante.hasOwnProperty('tutor_legal')) {
                        const tutorLegal = estudiante['tutor_legal'];
                        if (tutorLegal.hasOwnProperty('nombre')) rowData.push(<TableCell key="estudiante.tutor_legal.nombre">{JSON.stringify(tutorLegal['nombre'])}</TableCell>);
                        if (tutorLegal.hasOwnProperty('apellido')) rowData.push(<TableCell key="estudiante.tutor_legal.apellido">{JSON.stringify(tutorLegal['apellido'])}</TableCell>);
                        if (tutorLegal.hasOwnProperty('ci')) rowData.push(<TableCell key="estudiante.tutor_legal.ci">{JSON.stringify(tutorLegal['ci'])}</TableCell>);
                    }
                } else if (!key.includes('estudiante') && !key.includes('id') && !key.includes('created_at') && !key.includes('updated_at') && !key.includes('fecha_registro')) {
                    rowData.push(<TableCell key={key}>{JSON.stringify(item[key])}</TableCell>);
                }
            }
            return rowData;
        },
        fetchData: (id: string) => obtenerReportePorCampoId('convocatoria', parseInt(id), {}),
    },
    {
        id: 'otro_reporte_1',
        nombre: 'Otro Reporte 1',
    },
    {
        id: 'otro_reporte_2',
        nombre: 'Otro Reporte 2',
        // ... define fetchData, renderTableHeaders, renderTableRow for other reports
    },
];
  

const ReportesView = () => {
    const [openDrawer, setOpenDrawer] = useState(false);
    const [reporteSeleccionado, setReporteSeleccionado] = useState<ReporteItem | null>(null);
    const [reporteData, setReporteData] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [openOtrosReportes, setOpenOtrosReportes] = useState(true);
    const [convocatorias, setConvocatorias] = useState<Convocatoria[] | null>(null);
    const [selectedConvocatoriaId, setSelectedConvocatoriaId] = useState<number | ''>('');
    const [loadingConvocatorias, setLoadingConvocatorias] = useState(false);
    const [errorConvocatorias, setErrorConvocatorias] = useState<string | null>(null);
    const [shouldLoadReport, setShouldLoadReport] = useState(false);

    const reporteInscripciones = reportesInicial.find(repo => repo.id === 'reporte_inscripciones');
    const otrosReportes = reportesInicial.filter(repo => repo.id !== 'reporte_inscripciones');

    const manejarExportacion = () => {
        if (!reporteData || reporteData.length === 0) return;
        const nombreReporte = reporteSeleccionado.nombre;
        const encabezados = reporteSeleccionado.renderTableHeaders(reporteData);
      
        const filas = reporteData.map((item: any) => {
            const rowElements = reporteSeleccionado.renderTableRow(item);
            return rowElements.map((cell: any) =>
                typeof cell === 'string' || typeof cell === 'number'
                    ? cell
                    : (cell?.props?.children ?? '') // Intenta extraer el texto si es un componente
            );
        });
      
        exportarPDF({ nombreReporte, encabezados, filas });
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
            if (selectedConvocatoriaId && reporteInscripciones && shouldLoadReport) {
                setReporteSeleccionado(reporteInscripciones);
                setReporteData(null);
                setError(null);
                setLoading(true);
                try {
                    const data = await obtenerReportePorCampoId('convocatoria', selectedConvocatoriaId, {}      );
                    setReporteData(data);
                } catch (err: any) {
                    console.error('Error al obtener el reporte de inscripciones:', err);
                    setError('Error al cargar el reporte de inscripciones.');
                    setReporteData(null);
                } finally {
                    setLoading(false);
                    setShouldLoadReport(false);
                }
            } else if (!selectedConvocatoriaId) {
                setReporteSeleccionado(null);
                setReporteData(null);
                setShouldLoadReport(false);
            }
        };

        cargarReporte();
    }, [selectedConvocatoriaId, reporteInscripciones, shouldLoadReport]);

    const handleDrawerToggle = () => {
        setOpenDrawer(!openDrawer);
    };

    const handleReporteSeleccionado = (reporte: ReporteItem) => {
        setReporteSeleccionado(reporte);
        if (reporte.id !== 'reporte_inscripciones') {
            setSelectedConvocatoriaId('');
            setShouldLoadReport(false);
        }
        if (!openDrawer) {
            setOpenDrawer(true);
        }
    };

    const toggleOtrosReportes = () => {
        setOpenOtrosReportes(!openOtrosReportes);
    };

    const handleConvocatoriaChange = (event: ChangeEvent<{ value: number | '' }>) => {
        setSelectedConvocatoriaId(event.target.value);
    };

    const handleCargarReporteClick = () => {
        setShouldLoadReport(true);
    };

    const drawerWidth = 240;

    return (
        <Box sx={{ display: 'flex' }}>
            <IconButton
                aria-label="open drawer"
                onClick={handleDrawerToggle}
                edge="start"
                sx={{ mr: 2, ...(openDrawer && { display: 'none' }) }}
            >
                <MenuIcon />
            </IconButton>
            <Drawer
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                    },
                }}
                variant="persistent"
                anchor="left"
                open={openDrawer}
            >
                <DrawerHeader>
                    <IconButton onClick={handleDrawerToggle}>
                        <ChevronLeftIcon />
                    </IconButton>
                </DrawerHeader>
                <List>
                    <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, ml: 2 }}>
                        Reportes Disponibles
                    </Typography>
                    {reportesInicial.map((reporte) => (
                        <ListItem key={reporte.id} disablePadding>
                            <ListItemButton onClick={() => handleReporteSeleccionado(reporte)}>
                                <ListItemIcon>
                                    <AssignmentIcon />
                                </ListItemIcon>
                                <ListItemText primary={reporte.nombre} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Drawer>
    
            <Box component="main" sx={{ flexGrow: 1, p: 3, minWidth: 0 }}>
                <DrawerHeader />
    
                {reporteSeleccionado ? (
                    <>
                        <Typography variant="h6" gutterBottom>
                            {reporteSeleccionado.nombre}
                        </Typography>
    
                        {reporteSeleccionado.id === 'reporte_inscripciones' && (
                            <>
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
    
                                <Button
                                    variant="contained"
                                    onClick={handleCargarReporteClick}
                                    disabled={!selectedConvocatoriaId}
                                    sx={{ mt: 2 }}
                                >
                                    Cargar Reporte
                                </Button>
                            </>
                        )}
    
                        {loading && <Typography sx={{ mt: 2 }}>Cargando datos...</Typography>}
                        {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
    
                        {reporteData && Array.isArray(reporteData) && reporteData.length === 0 && (
                            <Typography sx={{ mt: 2 }}>No hubo inscripciones en esta convocatoria.</Typography>
                        )}

                        {reporteData && Array.isArray(reporteData) && reporteData.length > 0 &&
                            reporteSeleccionado.renderTableHeaders &&
                            reporteSeleccionado.renderTableRow && (
                                <>
                                        <TableContainer
                                            component={Paper}
                                            className="reporteTableContainer"
                                            sx={{ width: '100%', overflowX: 'auto', maxHeight: '400px', mt: 4 }}
                                        >
                                            <Table stickyHeader>
                                                <TableHead>
                                                    <TableRow>
                                                        {reporteSeleccionado.renderTableHeaders(reporteData).map((header, index) => (
                                                            <TableCell key={index}>{header}</TableCell>
                                                        ))}
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {reporteData.map((item: any, idx: number) => (
                                                        <TableRow key={idx}>
                                                            {reporteSeleccionado.renderTableRow(item)}
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>

                                        <Button
                                        onClick={manejarExportacion}
                                        disabled={!reporteData || reporteData.length === 0}
                                        sx={{ mt: 2 }}
                                    >
                                        Exportar PDF
                                    </Button>
                                </>
                        )}
                    </>
                ) : (
                    <Typography variant="h6">Seleccione un reporte del menú</Typography>
                )}
            </Box>
        </Box>
    );
}    

export default ReportesView;