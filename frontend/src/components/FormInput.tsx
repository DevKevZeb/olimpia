import type { InputHTMLAttributes } from 'react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function FormInput({ label, error, ...props }: FormInputProps) {
  return (
    <div className="mb-4">
      <label className="block text-gray-700 font-medium mb-2">{label}</label>
      <input {...props} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
