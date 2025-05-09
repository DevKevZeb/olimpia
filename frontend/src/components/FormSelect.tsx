import React from 'react';

export default function FormSelect({ label, error, children, ...props }) {
  return (
    <div className="mb-4">
      <label className="block text-gray-700 font-medium mb-2">{label}</label>
      <select {...props} className="w-full border border-gray-300 rounded-lg px-4 py-2">
        {children}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
