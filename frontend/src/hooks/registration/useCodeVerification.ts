import { useCallback, useState } from 'react';
import axios from 'axios';
import { verificarCodigoOrden } from '../../api/registration/boletaPagoApi';

export interface UseCodeVerificationReturn<T = unknown> {
  verifyCode: (code: string) => Promise<T | undefined>;
  isLoading: boolean;
  error: string | null;
  data: T | null;
  clearError: () => void;
}

export function useCodeVerification<T = unknown>(): UseCodeVerificationReturn<T> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  // Memorizada: la página la usa como dependencia de un efecto de auto-verificación
  const verifyCode = useCallback(async (code: string): Promise<T | undefined> => {
    if (!code.trim()) {
      setError('Por favor ingrese un código de verificación');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response: T = await verificarCodigoOrden(code);
      setData(response);
      return response;
    } catch (error: unknown) {
      let message = 'Error al verificar el código';
      const axiosError = axios.isAxiosError<{ message?: string }>(error) ? error : undefined;
      
      if (axiosError?.response) {
        if (axiosError.response.status === 404) {
          message = 'No se encontró una orden con ese código';
        } else if (axiosError.response.data?.message) {
          message = axiosError.response.data.message;
        }
      }
      
      setError(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    verifyCode,
    isLoading,
    error,
    data,
    clearError
  };
}
