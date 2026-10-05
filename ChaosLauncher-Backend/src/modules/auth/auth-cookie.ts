import type { Response } from 'express';

export const AUTH_COOKIE_NAME = 'chaos_token';

/**
 * La cookie es `Secure` en producción (solo HTTPS). Si el despliegue se sirve por HTTP (p. ej. una IP sin
 * certificado), el navegador rechazaría la cookie y no se podría iniciar sesión: COOKIE_SECURE=false lo permite.
 */
function isSecureCookie(): boolean {
  const override = process.env.COOKIE_SECURE;
  if (override === 'true') return true;
  if (override === 'false') return false;
  return process.env.NODE_ENV === 'production';
}

function parseDurationMs(raw: string | undefined, fallbackMs: number): number {
  const m = /^(\d+)\s*([smhd])?$/.exec((raw || '').trim());
  if (!m) return fallbackMs;
  const n = parseInt(m[1], 10);
  const unit = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[m[2] || 's'];
  return n * unit;
}

/** Guarda el JWT en una cookie httpOnly (no accesible desde JavaScript, mitiga robo por XSS). */
export function setAuthCookie(res: Response, token: string, expiresIn?: string): void {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: 'lax',
    path: '/',
    maxAge: parseDurationMs(expiresIn, 7 * 86400000),
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: 'lax',
    path: '/',
  });
}
