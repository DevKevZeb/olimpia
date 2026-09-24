import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

/**
 * En modo demo (VITE_DEMO_MODE=true) las peticiones a la API las responde MSW
 * con datos ficticios en memoria. Las importaciones son dinámicas para que los
 * mocks no formen parte del bundle normal.
 */
async function iniciar() {
  let aviso: ReactNode = null;

  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    const [{ worker }, { default: DemoBanner }] = await Promise.all([
      import('./mocks/browser'),
      import('./components/DemoBanner'),
    ]);
    await worker.start({ onUnhandledRequest: 'bypass' });
    aviso = <DemoBanner />;
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      {aviso}
      <App />
    </StrictMode>
  );
}

iniciar();
