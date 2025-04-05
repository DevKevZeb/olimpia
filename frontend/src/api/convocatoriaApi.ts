import axiosInstance from './axiosInstance';

export const getConvocatoriaActual = async () => {
  const response = await axiosInstance.get('/public/convocatoria-actual');
  return response.data;
};

export const getDatosInscripcion = async () => {
  const response = await axiosInstance.get('/inscripcion/datos');
  return response.data;
};

export const crearConvocatoria = async (data: any) => {
  const response = await axiosInstance.post('/convocatorias', data);
  return response.data;
};
