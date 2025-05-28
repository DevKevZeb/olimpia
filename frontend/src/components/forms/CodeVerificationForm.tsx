import React, { useState, FormEvent } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Alert from '../ui/Alert';

interface CodeVerificationFormProps {
  onVerify: (code: string) => Promise<any>;
  loading?: boolean;
  error?: string | null;
  placeholder?: string;
  buttonText?: string;
  helperText?: string;
}

export default function CodeVerificationForm({
  onVerify,
  loading = false,
  error,
  placeholder = "Ingrese su código de verificación",
  buttonText = "Verificar",
  helperText
}: CodeVerificationFormProps) {
  const [code, setCode] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      await onVerify(code.trim());
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert 
          type="error" 
          message={error} 
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={placeholder}
          disabled={loading}
          helperText={helperText}
          required
        />

        <Button
          type="submit"
          loading={loading}
          disabled={loading || !code.trim()}
          className="w-full"
        >
          {buttonText}
        </Button>
      </form>
    </div>
  );
}
