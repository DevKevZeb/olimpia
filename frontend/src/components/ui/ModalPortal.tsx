import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';

interface ModalPortalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ModalPortal: React.FC<ModalPortalProps> = ({
  title,
  isOpen,
  onClose,
  children,
  size = 'md'
}) => {
  // No renderizar nada si el modal no está abierto
  if (!isOpen) return null;

  // Prevenir scroll en el body cuando el modal está abierto
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    
    // Cleanup: restaurar el scroll cuando el componente se desmonte
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen]);

  // Manejar cierre con tecla Escape
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  // Obtener el tamaño del modal basado en el prop
  const getModalSize = () => {
    switch (size) {
      case 'sm': return 'max-w-md';
      case 'md': return 'max-w-lg';
      case 'lg': return 'max-w-2xl';
      case 'xl': return 'max-w-4xl';
      default: return 'max-w-lg';
    }
  };

  // Crear el portal para renderizar el modal fuera del árbol DOM principal
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay con efecto de desenfoque */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Contenedor centrado */}
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Modal */}
        <div className={`relative bg-white rounded-lg shadow-xl ${getModalSize()} w-full`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              type="button"
              className="text-gray-400 bg-transparent hover:bg-gray-100 hover:text-gray-900 rounded-lg p-1.5"
              onClick={onClose}
            >
              <X size={20} />
              <span className="sr-only">Cerrar</span>
            </button>
          </div>
          
          {/* Body */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
