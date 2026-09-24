import { http, HttpResponse } from 'msw';
import { db, siguienteId } from '../db';
import { IP_DEMO } from '../data/seguridad';
import { ADMIN_DEMO, adminPublico, generarToken, requiereAdmin, tokenDe } from '../utils/auth';
import { fechaSql, isoLaravel } from '../utils/fechas';
import { EMAIL_RE, leerObjeto, texto } from '../utils/http';

/** AdminAuthController: login, logout, profile, check-auth y estadísticas de acceso. */

const MINUTO = 60 * 1000;

const registrarIntento = (email: string | null, exitoso: boolean): void => {
  db.intentosLogin.push({
    id: siguienteId(db.intentosLogin, (i) => i.id),
    ip_address: IP_DEMO,
    email,
    successful: exitoso,
    user_agent: navigator.userAgent,
    creado: Date.now(),
  });
};

/** LoginAttempt::isBlocked(): 5 o más fallos de la IP en los últimos 15 minutos. */
const ipBloqueada = (ip: string): boolean =>
  db.intentosLogin.filter((i) => i.ip_address === ip && !i.successful && i.creado >= Date.now() - 15 * MINUTO).length >= 5;

const estadisticas = (desde: number) => {
  const intentos = db.intentosLogin.filter((i) => i.creado >= desde);
  return {
    total_attempts: intentos.length,
    successful_logins: intentos.filter((i) => i.successful).length,
    failed_attempts: intentos.filter((i) => !i.successful).length,
    unique_ips: new Set(intentos.map((i) => i.ip_address)).size,
  };
};

export const authHandlers = [
  http.post('*/api/admin/login', async ({ request }) => {
    const cuerpo = await leerObjeto(request);
    const email = texto(cuerpo.email);
    const password = texto(cuerpo.password);

    if (ipBloqueada(IP_DEMO)) {
      registrarIntento(email, false);
      return HttpResponse.json(
        { success: false, message: 'Demasiados intentos de login. Intenta nuevamente en 15 minutos.' },
        { status: 429 },
      );
    }

    let errorValidacion: string | null = null;
    if (!email) errorValidacion = 'El correo electrónico es requerido';
    else if (!EMAIL_RE.test(email)) errorValidacion = 'El correo electrónico debe tener un formato válido';
    else if (!password) errorValidacion = 'La contraseña es requerida';
    else if (password.length < 6) errorValidacion = 'La contraseña debe tener al menos 6 caracteres';

    if (errorValidacion) {
      registrarIntento(email, false);
      return HttpResponse.json({ success: false, message: errorValidacion }, { status: 422 });
    }

    if (email !== ADMIN_DEMO.email || password !== ADMIN_DEMO.password) {
      registrarIntento(email, false);
      return HttpResponse.json({ success: false, message: 'Credenciales incorrectas' }, { status: 401 });
    }

    registrarIntento(email, true);
    return HttpResponse.json({
      success: true,
      message: 'Login exitoso',
      data: {
        admin: adminPublico(),
        token: generarToken(),
        // config('sanctum.expiration') = 1440 minutos
        expires_at: isoLaravel(new Date(Date.now() + 24 * 60 * MINUTO)),
      },
    });
  }),

  http.post('*/api/admin/logout', ({ request }) => {
    const denegado = requiereAdmin(request);
    if (denegado) return denegado;
    const token = tokenDe(request);
    if (token) db.tokensRevocados.add(token);
    return HttpResponse.json({ success: true, message: 'Sesión cerrada correctamente' });
  }),

  http.get('*/api/admin/profile', ({ request }) => {
    const denegado = requiereAdmin(request);
    if (denegado) return denegado;
    return HttpResponse.json({ success: true, data: { admin: adminPublico() } });
  }),

  http.get('*/api/admin/check-auth', ({ request }) => {
    const denegado = requiereAdmin(request);
    if (denegado) return denegado;
    return HttpResponse.json({ success: true, authenticated: true, data: { admin: adminPublico() } });
  }),

  http.get('*/api/admin/login-statistics', ({ request }) => {
    const denegado = requiereAdmin(request);
    if (denegado) return denegado;

    const ahora = Date.now();
    const fallosRecientes = new Map<string, number>();
    db.intentosLogin
      .filter((i) => !i.successful && i.creado >= ahora - 15 * MINUTO)
      .forEach((i) => fallosRecientes.set(i.ip_address, (fallosRecientes.get(i.ip_address) ?? 0) + 1));

    const recientes = db.intentosLogin
      .filter((i) => i.creado >= ahora - 2 * 60 * MINUTO)
      .sort((a, b) => b.creado - a.creado)
      .slice(0, 50)
      .map((i) => ({
        id: i.id,
        ip_address: i.ip_address,
        email: i.email,
        successful: i.successful,
        user_agent: i.user_agent,
        created_at: fechaSql(new Date(i.creado)),
      }));

    return HttpResponse.json({
      success: true,
      data: {
        last_24_hours: estadisticas(ahora - 24 * 60 * MINUTO),
        last_7_days: estadisticas(ahora - 7 * 24 * 60 * MINUTO),
        last_30_days: estadisticas(ahora - 30 * 24 * 60 * MINUTO),
        blocked_ips: [...fallosRecientes].filter(([, fallos]) => fallos >= 5).map(([ip]) => ip),
        recent_attempts: recientes,
        generated_at: fechaSql(new Date(ahora)),
      },
    });
  }),
];
