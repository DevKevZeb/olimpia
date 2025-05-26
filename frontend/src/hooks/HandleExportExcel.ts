import * as XLSX from 'xlsx';

export default function handleExportExcel(data, campo){
    // data = Array.from(data);
    console.log(data)
    console.log("SEGA")
    if (data.length === 0) return;
    // Aplanar los datos para Excel: una fila por estudiante, con el nombre del área
    const excelRows: any[] = [];

    
    data.forEach( dt => {
      var row = {
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