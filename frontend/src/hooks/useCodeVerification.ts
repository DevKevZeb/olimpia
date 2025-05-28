import { useState } from 'react';
import { verificarCodigoOrden } from '../api/registration/boletaPagoApi';

interface UseCodeVerificationReturn {
  verifyCode: (code: string) => Promise<any>;
  isLoading: boolean;
  error: string | null;
  data: any | null;
  clearError: () => void;
}

export function useCodeVerification(): UseCodeVerificationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any | null>(null);

  const verifyCode = async (code: string) => {
    if (!code.trim()) {
      setError('Por favor ingrese un código de verificación');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await verificarCodigoOrden(code);
      setData(response);
      return response;
    } catch (error: any) {
      let message = 'Error al verificar el código';
      
      if (error.response) {
        if (error.response.status === 404) {
          message = 'No se encontró una orden con ese código';
        } else if (error.response.data?.message) {
          message = error.response.data.message;
        }
      }
      
      setError(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    verifyCode,
    isLoading,
    error,
    data,
    clearError
  };
}
