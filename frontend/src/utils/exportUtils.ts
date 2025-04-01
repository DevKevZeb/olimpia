/**
 * Utilidades para exportación de datos en diferentes formatos
 */

/**
 * Convierte datos a formato CSV y genera una descarga
 * @param data Arreglo de objetos a exportar
 * @param fileName Nombre del archivo (sin extensión)
 * @param columns Columnas a incluir (key:valor)
 */
export const exportToCSV = <T>(data: T[], fileName: string, columns: Record<string, string>): void => {
  try {
    // Headers del CSV (nombres de columnas)
    const headers = Object.values(columns).join(',');
    
    // Convertir datos a formato CSV
    const csvRows = data.map(row => {
      return Object.keys(columns)
        .map(key => {
          // Acceder a propiedades anidadas con notación de punto
          const value = key.split('.').reduce((obj: any, key) => 
            obj && obj[key] !== undefined ? obj[key] : '', row as any);
          
          // Escapar comillas y comas en los valores
          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(',');
    });
    
    // Combinar headers y filas
    const csvContent = `${headers}\n${csvRows.join('\n')}`;
    
    // Crear blob y descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    createDownload(blob, `${fileName}.csv`);
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    throw error;
  }
};

/**
 * Exporta datos a Excel (en realidad CSV con formato para Excel)
 */
export const exportToExcel = <T>(data: T[], fileName: string, columns: Record<string, string>): void => {
  try {
    // Similar a CSV pero con codificación para Excel
    const headers = Object.values(columns).join('\t');
    
    const xlsRows = data.map(row => {
      return Object.keys(columns)
        .map(key => {
          const value = key.split('.').reduce((obj: any, key) => 
            obj && obj[key] !== undefined ? obj[key] : '', row as any);
          
          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join('\t');
    });
    
    const xlsContent = `${headers}\n${xlsRows.join('\n')}`;
    
    // Excel usa UTF-16LE con BOM
    const blob = new Blob(['\ufeff' + xlsContent], { 
      type: 'application/vnd.ms-excel;charset=utf-8'
    });
    
    createDownload(blob, `${fileName}.xls`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
};

/**
 * Exporta datos a formato PDF usando la librería jsPDF (debe estar instalada)
 * Nota: Esta función requiere que jsPDF esté instalada como dependencia:
 * npm install jspdf jspdf-autotable
 */
export const exportToPDF = <T>(
  data: T[], 
  fileName: string, 
  columns: Record<string, string>,
  title?: string
): void => {
  try {
    // Esta implementación requiere importar jsPDF dinámicamente
    import('jspdf').then(jsPDFModule => {
      const jsPDF = jsPDFModule.default;
      
      import('jspdf-autotable').then(() => {
        const doc = new jsPDF();
        
        // Añadir título si se proporcionó
        if (title) {
          doc.text(title, 14, 15);
        }
        
        // Preparar datos para la tabla
        const headers = Object.values(columns);
        const rows = data.map(row => 
          Object.keys(columns).map(key => {
            return key.split('.').reduce((obj: any, key) => 
              obj && obj[key] !== undefined ? obj[key] : '', row as any);
          })
        );
        
        // Generar tabla
        doc.autoTable({
          head: [headers],
          body: rows,
          startY: title ? 20 : 10,
          theme: 'grid',
          styles: {
            fontSize: 8,
            cellPadding: 3
          },
          headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: 'bold'
          }
        });
        
        // Descargar PDF
        doc.save(`${fileName}.pdf`);
      });
    }).catch(error => {
      console.error('Error loading jsPDF:', error);
      alert('No se pudo cargar la librería jsPDF. Intente exportar en otro formato.');
    });
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw error;
  }
};

/**
 * Función auxiliar para crear y descargar un archivo Blob
 */
const createDownload = (blob: Blob, fileName: string): void => {
  // Crear URL para el blob
  const url = window.URL.createObjectURL(blob);
  
  // Crear elemento <a> para la descarga
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  
  // Añadir al DOM, activar y limpiar
  document.body.appendChild(link);
  link.click();
  
  // Pequeño retraso para asegurar la descarga
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
  }, 100);
};
