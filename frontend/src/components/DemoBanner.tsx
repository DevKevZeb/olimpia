import { useState } from 'react';

/** Enlace al repositorio del proyecto; si está vacío no se muestra. */
const REPO_URL = '';

/** Barra fina que avisa que la aplicación corre con datos ficticios (solo en modo demo). */
export default function DemoBanner() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div
      role="status"
      className="relative z-20 flex h-6 items-center justify-center gap-2 bg-amber-100 px-8 text-[11px] leading-none text-amber-900 border-b border-amber-200"
    >
      <span className="truncate">
        <strong className="font-semibold">Modo demo</strong> · datos ficticios, los cambios se pierden al recargar
      </span>
      {REPO_URL && (
        <a href={REPO_URL} target="_blank" rel="noreferrer" className="shrink-0 font-medium underline hover:text-amber-700">
          Ver en GitHub
        </a>
      )}
      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label="Ocultar aviso de modo demo"
        className="absolute right-2 rounded px-1 text-amber-700 hover:bg-amber-200"
      >
        ×
      </button>
    </div>
  );
}
