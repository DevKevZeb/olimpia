import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, MenuItem, Select, Typography
} from '@mui/material';

interface Convocatoria {
  id_convocatoria: number;
  nombre: string;
}

interface Area {
  id_area: number;
  area: {
    nombre_area: string;
  };
}

const AgregarDocumento: React.FC = () => {
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
  const [convocatoriaSeleccionada, setConvocatoriaSeleccionada] = useState<number | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [modalAbierto, setModalAbierto] = useState<number | null>(null);
  const [archivo, setArchivo] = useState<File | null>(null);

  useEffect(() => {
    const obtenerConvocatorias = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/convocatorias');
        setConvocatorias(res.data.data); // asumiendo que tu backend responde con { data: [] }
      } catch (err) {
        console.error('Error al obtener convocatorias', err);
      }
    };
    obtenerConvocatorias();
  }, []);

  useEffect(() => {
    const obtenerAreas = async () => {
      if (!convocatoriaSeleccionada) return;
      try {
        const res = await axios.get(`http://localhost:8000/api/convocatorias/${convocatoriaSeleccionada}/areas`);
        setAreas(res.data.data); // igual, suponiendo formato { data: [] }
      } catch (err) {
        console.error('Error al obtener áreas', err);
      }
    };
    obtenerAreas();
  }, [convocatoriaSeleccionada]);

  // 🔒 Lógica reservada para más adelante
  const handleSubirArchivo = async (id_area: number) => {

    if (!archivo) {
      console.error('No hay archivo para subir');
      return;
    }

    const formData = new FormData();
    formData.append('file', archivo); // Ajusta 'file' si el backend espera otro nombre
    formData.append('id_area', id_area.toString());
    formData.append('id_convocatoria', convocatoriaSeleccionada.toString());
    
    try {
      const response = await axios.post('http://localhost:8000/api/documentos/subir', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
  
      console.log('Archivo subido con éxito:', response.data);
      alert('Archivo subido con éxito');
    } catch (error) {
      console.error('Error al subir el archivo:', error);
      alert('Hubo un error al subir el archivo');
    } finally {
      setModalAbierto(null);
      setArchivo(null);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <Typography variant="h5" gutterBottom>Agregar Documentos por Área</Typography>

      <FormControl fullWidth margin="normal">
        <InputLabel>Seleccionar Convocatoria</InputLabel>
        <Select
          value={convocatoriaSeleccionada || ''}
          onChange={(e) => setConvocatoriaSeleccionada(Number(e.target.value))}
        >
          {convocatorias.map((c) => (
            <MenuItem key={c.id_convocatoria} value={c.id_convocatoria}>
              {c.nombre}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <div style={{ marginTop: '2rem' }}>
        {areas.map((area) => (
          <div
            key={area.id_area}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              border: '1px solid #ccc',
              borderRadius: '8px',
              marginBottom: '1rem',
            }}
          >
            <Typography>{area.area?.nombre_area}</Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setModalAbierto(area.id_area)}
            >
              Agregar Documento
            </Button>

            <Dialog open={modalAbierto === area.id_area} onClose={() => setModalAbierto(null)}>
              <DialogTitle>Subir Documento para {area.nombre_area}</DialogTitle>
              <DialogContent>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file?.type !== 'application/pdf') {
                      alert('Solo se permiten archivos PDF');
                      return;
                    }
                    setArchivo(file);
                  }}
                />
                <p>Si el área ya tenia un anexo asignado, este será reemplazado</p>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setModalAbierto(null)}>Cancelar</Button>
                <Button
                  variant="contained"
                  onClick={() => handleSubirArchivo(area.id_area)}
                  disabled={!archivo}
                >
                  Agregar 
                </Button>
              </DialogActions>
            </Dialog>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgregarDocumento;