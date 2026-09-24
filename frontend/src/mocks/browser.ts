import { setupWorker } from 'msw/browser';
import { sembrar } from './db';
import { handlers } from './handlers';

/**
 * Worker de MSW para el modo demo (VITE_DEMO_MODE=true). Solo se importa de
 * forma dinámica desde main.tsx, así que no forma parte del bundle normal.
 */
sembrar();

export const worker = setupWorker(...handlers);
