/**
 * Intentos de inicio de sesión ficticios para el panel de seguridad.
 * IPs de rangos privados o de documentación (RFC 5737).
 */

export type IntentoLoginSeed = {
  /** Minutos antes del momento en que se abre la demo. */
  minutos: number;
  ip: string;
  email: string | null;
  exitoso: boolean;
  agente: 'chrome' | 'firefox' | 'safari' | 'curl';
};

export const AGENTES: Record<IntentoLoginSeed['agente'], string> = {
  chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  firefox: 'Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0',
  safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15',
  curl: 'curl/8.9.1',
};

const ADMIN = 'admin@olimpia.test';
const DIA = 24 * 60;

export const INTENTOS_LOGIN_SEED: readonly IntentoLoginSeed[] = [
  { minutos: 28 * DIA, ip: '192.168.1.24', email: ADMIN, exitoso: true, agente: 'chrome' },
  { minutos: 25 * DIA, ip: '192.168.1.24', email: ADMIN, exitoso: false, agente: 'chrome' },
  { minutos: 25 * DIA - 2, ip: '192.168.1.24', email: ADMIN, exitoso: true, agente: 'chrome' },
  { minutos: 21 * DIA, ip: '10.0.0.15', email: ADMIN, exitoso: true, agente: 'firefox' },
  { minutos: 18 * DIA, ip: '203.0.113.47', email: 'root@olimpia.test', exitoso: false, agente: 'curl' },
  { minutos: 18 * DIA - 1, ip: '203.0.113.47', email: 'admin@olimpia.test', exitoso: false, agente: 'curl' },
  { minutos: 18 * DIA - 2, ip: '203.0.113.47', email: 'test@olimpia.test', exitoso: false, agente: 'curl' },
  { minutos: 14 * DIA, ip: '192.168.1.24', email: ADMIN, exitoso: true, agente: 'chrome' },
  { minutos: 10 * DIA, ip: '10.0.0.15', email: ADMIN, exitoso: true, agente: 'firefox' },
  { minutos: 6 * DIA, ip: '198.51.100.8', email: 'soporte@olimpia.test', exitoso: false, agente: 'safari' },
  { minutos: 6 * DIA - 3, ip: '198.51.100.8', email: ADMIN, exitoso: false, agente: 'safari' },
  { minutos: 5 * DIA, ip: '192.168.1.24', email: ADMIN, exitoso: true, agente: 'chrome' },
  { minutos: 3 * DIA, ip: '10.0.0.15', email: ADMIN, exitoso: true, agente: 'firefox' },
  { minutos: 2 * DIA, ip: '192.168.1.31', email: ADMIN, exitoso: false, agente: 'chrome' },
  { minutos: 2 * DIA - 1, ip: '192.168.1.31', email: ADMIN, exitoso: true, agente: 'chrome' },
  { minutos: 20 * 60, ip: '192.168.1.24', email: ADMIN, exitoso: true, agente: 'chrome' },
  { minutos: 9 * 60, ip: '203.0.113.90', email: null, exitoso: false, agente: 'curl' },
  { minutos: 5 * 60, ip: '10.0.0.15', email: ADMIN, exitoso: true, agente: 'firefox' },
  { minutos: 95, ip: '198.51.100.23', email: 'admin@olimpia.bo', exitoso: false, agente: 'safari' },
  { minutos: 40, ip: '192.168.1.24', email: ADMIN, exitoso: true, agente: 'chrome' },
];

/** IP con la que se registran los intentos hechos desde la demo. */
export const IP_DEMO = '127.0.0.1';
