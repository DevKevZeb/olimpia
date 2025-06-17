import { RequisitoConvocatoria } from '../types/RequisitoConvocatoria';
import axiosInstance from './axiosInstance';

export const fetchConvocatorias = async (): Promise<{ id_convocatoria: number; nombre: string; max_areas_por_estudiante: number }[]> => {
  try {
    const response = await axiosInstance.get('/v1/convocatorias'); 
    return response.data.data.map((convocatoria: any) => ({ // Accede a response.data.data y mapea
      id_convocatoria: convocatoria.id,
      nombre: convocatoria.nombre,
      estado: convocatoria.estado,
      max_areas_por_estudiante: convocatoria.max_areas_por_estudiante,
    }));
  } catch (error: any) {
    console.error('Error al obtener las convocatorias:', error);
    throw error;
  }
};

export const fetchRequisitosConvocatoria = async (
    idConvocatoria: number
  ): Promise<RequisitoConvocatoria[]> => {
    try {
      const response = await axiosInstance.get(`/v1/convocatorias/${idConvocatoria}/requisitos`);
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else {
        // Handle cases where the 'data' property might be missing or not an array
        console.warn('API response did not contain an array at response.data.data:', response.data);
        return []; // Return an empty array to prevent further errors
      }
    } catch (error: any) {
      console.error(`Error al obtener los requisitos para la convocatoria ${idConvocatoria}:`, error);
      throw error;
    }
  };

export const saveRequisitosConvocatoria = async (
  idConvocatoria: number,
  requisitos: Omit<RequisitoConvocatoria, 'id' | 'created_at' | 'updated_at'>[]
): Promise<any> => {
  try {
    const response = await axiosInstance.post(`/v1/convocatorias/${idConvocatoria}/requisitos`, requisitos, {
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '', // Si estás usando el CSRF de Laravel
      },
    });
    return response.data; // La estructura de la respuesta para POST puede variar
  } catch (error: any) {
    console.error('Error al guardar los requisitos:', error);
    throw error;
  }
};