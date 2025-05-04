import React, { useState, useEffect } from 'react';
import '../styles/FormularioEncargadoPago.css';

interface FormularioEncargadoPagoProps {
  formData: Record<string, any>;
  onInputChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onFormValidityChange: (isValid: boolean) => void;
}

const FormularioEncargadoPago: React.FC<FormularioEncargadoPagoProps> = ({ formData, onInputChange, onFormValidityChange }) => {
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    // Verifica si todos los campos obligatorios están llenos
    const {
      ci_encargado,
      nombres_encargado,
      apellidos_encargado,
      email_encargado,
    } = formData;

    const isValid =
      !!ci_encargado &&
      !!nombres_encargado &&
      !!apellidos_encargado &&
      !!email_encargado;

    setIsFormValid(isValid);
    onFormValidityChange(isValid); // Comunica la validez al padre
  }, [formData, onFormValidityChange]);

  return (
    <div className="formulario-encargado-pago">
      <h3>Datos del Encargado de Pago</h3>
      <div className="form-group">
        <label htmlFor="ci_encargado">CI:</label>
        <input
          type="text"
          id="ci_encargado"
          name="ci_encargado"
          value={formData.ci_encargado || ''}
          onChange={onInputChange}
        />
      </div>
      <div className="form-group">
        <label htmlFor="nombres_encargado">Nombres:</label>
        <input
          type="text"
          id="nombres_encargado"
          name="nombres_encargado"
          value={formData.nombres_encargado || ''}
          onChange={onInputChange}
        />
      </div>
      <div className="form-group">
        <label htmlFor="apellidos_encargado">Apellidos:</label>
        <input
          type="text"
          id="apellidos_encargado"
          name="apellidos_encargado"
          value={formData.apellidos_encargado || ''}
          onChange={onInputChange}
        />
      </div>
      <div className="form-group">
        <label htmlFor="email_encargado">Email:</label>
        <input
          type="email"
          id="email_encargado"
          name="email_encargado"
          value={formData.email_encargado || ''}
          onChange={onInputChange}
        />
      </div>
      
      {/* Puedes añadir más campos según tus necesidades */}
    </div>
  );
};

export default FormularioEncargadoPago;