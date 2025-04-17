import axiosInstance from './axiosInstance';

interface GradoResponse {
    id: number;
    nombre_grado: string;
    orden: number;
    created_at: string;
    updated_at: string;
}
  
interface ApiResponse {
    success: boolean;
    message: string;
    data: GradoResponse;
}

/**
 * Busca el ID de convocatoria nivel basado en los nombres proporcionados.
 * @param idConvocatoria ID de la convocatoria activa
 * @param nombreArea Nombre del área
 * @param nombreNivel Nombre del nivel
 * @param nombreGrado Nombre del grado
 */
export const buscarIdConvocatoriaNivel = async (
  idConvocatoria: number,
  nombreArea: string,
  nombreNivel: string,
  nombreGrado: string
): Promise<number | null> => {
  try {
    const response = await axiosInstance.post('/v1/buscar-convocatoria-nivel', {
      id_convocatoria: idConvocatoria,
      nombre_area: nombreArea,
      nombre_nivel: nombreNivel,
      nombre_grado: nombreGrado,
    });
    return response.data?.data?.id_convocatoria_nivel || null;
  } catch (error) {
    console.error('Error al buscar ID de convocatoria nivel:', error);
    alert("Opsie! No se encontró una configuración válida para los datos proporcionados.");
    throw error;
  }
};

export const descargarPlantilla = async (idConvocatoria: number) => {
  try {
    const response = await axiosInstance.get(`/v1/excel/plantilla/${idConvocatoria}`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `plantilla_inscripcion_${idConvocatoria}.xlsx`);
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error al descargar plantilla:', error);
    alert('Error al descargar la plantilla.');
    throw error;
  }
};

export const obtenerIdGradoPorNombre = async (nombreGrado: string): Promise<GradoResponse | null> => {
    try {
      const response = await axiosInstance.get<ApiResponse>(`/v1/grados/por-nombre/${encodeURIComponent(nombreGrado)}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return null;
    } catch (error: any) {
      console.error('Error al obtener ID del grado por nombre:', error);
      throw error;
    }
  };