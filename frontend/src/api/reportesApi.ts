import axiosInstance from './axiosInstance';

export const getEstudiantesPorConvocatoria = async (convocatoriaId: number|string) => {
  const response = await axiosInstance.get(`/v1/reportes/estudiantes-por-convocatoria`, {
    params: { convocatoria_id: convocatoriaId }
  });
  return response.data;
};

export const getInscritosPorArea = async (convocatoriaId: number|string) => {
  const response = await axiosInstance.get(`/v1/reportes/inscritos-por-area`, {
    params: { convocatoria_id: convocatoriaId }
  });
  return response.data;
};

export const getInscritosPorDepartamento = async (convocatoriaId:string ,depatamento:string ) => {
  const response = await axiosInstance.get(`/v1/reportes/inscritos-por-departamento`, {
    params: {
      convocatoria_id: convocatoriaId ,
      departamento: depatamento 
    }
  });
  return response.data;
};
