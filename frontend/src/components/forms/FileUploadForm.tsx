import React, { useState, useRef, DragEvent } from 'react';
import { Upload, File, X } from 'lucide-react';
import Button from '../ui/Button';
import Alert from '../ui/Alert';

interface FileUploadFormProps {
  onUpload: (file: File) => Promise<any>;
  loading?: boolean;
  error?: string | null;
  acceptedTypes?: string;
  maxSize?: number; // in MB
  title?: string;
  description?: string;
}

export default function FileUploadForm({
  onUpload,
  loading = false,
  error,
  acceptedTypes = ".pdf",
  maxSize = 10,
  title = "Subir Archivo",
  description = "Seleccione o arrastre un archivo PDF"
}: FileUploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (selectedFile) {
      await onUpload(selectedFile);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>

      {error && (
        <Alert type="error" message={error} />
      )}

      {/* File Drop Zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center
          transition-colors duration-200
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${selectedFile ? 'bg-gray-50' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {!selectedFile ? (
          <>
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Arrastre su archivo aquí o{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  haga clic para seleccionar
                </button>
              </p>
              <p className="text-xs text-gray-500">
                Archivos permitidos: {acceptedTypes} (máximo {maxSize}MB)
              </p>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
            <div className="flex items-center space-x-3">
              <File className="h-8 w-8 text-blue-600" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={removeFile}
              className="text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {selectedFile && (
        <Button
          onClick={handleUpload}
          loading={loading}
          disabled={loading}
          className="w-full"
        >
          Subir Archivo
        </Button>
      )}
    </div>
  );
}
