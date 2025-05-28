import axiosInstance from '../axiosInstance';

/**
 * Verifica si existe una orden de pago con el código especificado
 * @param codigo Código único de la orden
 */
export const verificarCodigoOrden = async (codigo: string) => {
  try {
    const response = await axiosInstance.post('/v1/comprobantes-pago/verificar-codigo', {
      codigo_orden: codigo
    });
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error al verificar el código:', error);
    throw error;
  }
};

/**
 * Sube un comprobante de pago para una orden de pago
 * @param formData FormData con los datos del comprobante y el archivo
 */
export const subirComprobantePago = async (formData: FormData) => {
  try {
    const response = await axiosInstance.post('/v1/comprobantes-pago/por-codigo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        // Esta función se puede usar para reportar el progreso
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`Progreso de carga: ${percentCompleted}%`);
        // Aquí podrías actualizar el estado en el componente
      }
    });
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error al subir el comprobante:', error);
    throw error;
  }
};
