import axiosInstance from './axiosInstance';

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
