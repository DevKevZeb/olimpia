import React from 'react';
import axios from 'axios';
import '../styles/DowloadTemplate.css';
import {descargarPlantilla} from '../api/datosExcel';

interface DownloadTemplateProps {
  selectedConvocatoriaId: number | null;
}

const DownloadTemplate: React.FC<DownloadTemplateProps> = ({ selectedConvocatoriaId }) => {
  const handleDownload = async () => {
    if (selectedConvocatoriaId) {
      console.log('Descargando plantilla para la convocatoria ID:', selectedConvocatoriaId);
      try {
        await descargarPlantilla(selectedConvocatoriaId); // Llama a la función importada
      } catch (error) {
        console.error('Error al descargar la plantilla:', (axios.isAxiosError(error) && error.response) || error);
        alert('Error al descargar la plantilla.');
      }
    } else {
      alert('Por favor, selecciona una convocatoria antes de descargar la plantilla.');
    }
  };

  return (
    <div className='download-template-container'>
      <h2>Descargar Plantilla Excel</h2>
      <button onClick={handleDownload} disabled={!selectedConvocatoriaId}>
        Descargar Plantilla
      </button>
        
      {!selectedConvocatoriaId && (
        <p style={{ color: 'orange' }}>Selecciona una convocatoria para descargar la plantilla.</p>
      )}
      
      <div>
        <a href="/llenarexcel" >
          Ir a la Guía de Llenado del Excel
        </a>
      </div>
    </div>
  );
};

export default DownloadTemplate;