import * as XLSX from 'xlsx';

export interface FilaReporteExcel {
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
    estado_inscripcion: string;
    areas_inscritas: string;
    fecha_inscripcion: string;
}

export default function handleExportExcel(data: FilaReporteExcel[], campo: string){
    // data = Array.from(data);
    console.log(data)
    console.log("SEGA")
    if (data.length === 0) return;
    // Aplanar los datos para Excel: una fila por estudiante, con el nombre del área
    const excelRows: Record<string, string>[] = [];

    
    data.forEach( dt => {
      const row = {
          "Estudiante Nombres": dt.estudiante.nombres ,
          "Estudiante Apellidos": dt.estudiante.apellidos,
          "CI": dt.estudiante.ci,
          "Grado": dt.estudiante.grado,
          "Unidad Educativa": dt.estudiante.unidad_educativa.nombre,
          "Departamento": dt.estudiante.unidad_educativa.departamento,
          "Tutor Legal nombre": dt.estudiante.tutor_legal.nombre,
          "Tutor Legal apellido": dt.estudiante.tutor_legal.apellido,
          "Tutor Legal CI": dt.estudiante.tutor_legal.ci, 
          "Estado Inscripcion": dt.estado_inscripcion,
          "Area Inscrito": dt.areas_inscritas,
          "Fecha de Inscripcion": dt.fecha_inscripcion.split("T")[0] 
      };
      
      excelRows.push(row);
    });

    const ws = XLSX.utils.json_to_sheet(excelRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, campo);
    XLSX.writeFile(wb, `reporte_${campo}.xlsx`);
  };