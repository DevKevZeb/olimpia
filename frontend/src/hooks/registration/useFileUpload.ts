import { useState } from 'react';
import axios from 'axios';

export interface UseFileUploadReturn {
  uploadFile: (file: File) => Promise<unknown>;
  isUploading: boolean;
  error: string | null;
  uploadProgress: number;
  clearError: () => void;
}

export function useFileUpload(
  uploadFunction: (file: File) => Promise<unknown>
): UseFileUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadFile = async (file: File) => {
    if (!file) {
      setError('Por favor seleccione un archivo');
      return;
    }

    // Validar tipo de archivo
    if (file.type !== 'application/pdf') {
      setError('Solo se permiten archivos PDF');
      return;
    }

    // Validar tamaño (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo no debe superar los 10MB');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const response = await uploadFunction(file);
      setUploadProgress(100);
      return response;
    } catch (error: unknown) {
      let message = 'Error al subir el archivo';
      const responseMessage = axios.isAxiosError<{ message?: string }>(error) ? error.response?.data?.message : undefined;
      
      if (responseMessage) {
        message = responseMessage;
      }
      
      setError(message);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    uploadFile,
    isUploading,
    error,
    uploadProgress,
    clearError
  };
}
