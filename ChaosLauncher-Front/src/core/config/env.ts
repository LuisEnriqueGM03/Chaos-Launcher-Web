/**
 * Configuración estricta de variables de entorno para el Frontend
 */
export const ENV = {
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'ChaosLauncher Web Studio',
  DEFAULT_SERVER_IP: process.env.NEXT_PUBLIC_DEFAULT_SERVER_IP || '',
  LAUNCHER_REPO: process.env.NEXT_PUBLIC_LAUNCHER_REPO || 'LuisEnriqueGM03/Chaos-Launcher-Esc',
  WINGET_PACKAGE_ID: process.env.NEXT_PUBLIC_WINGET_PACKAGE_ID || 'ChaosStudio.ChaosLauncher',
  /** Poner NEXT_PUBLIC_WINGET_LIVE=true cuando el paquete esté aprobado en winget-pkgs. */
  WINGET_LIVE: process.env.NEXT_PUBLIC_WINGET_LIVE === 'true',
} as const;

export function getApiUrl(): string {
  const url = ENV.API_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_API_URL no está definida en el archivo .env.local');
  }
  const clean = url.replace(/\/$/, '');
  // URL relativa ('/api/v1', modo Docker con proxy de Next): en el navegador se muestra como URL completa
  if (clean.startsWith('/') && typeof window !== 'undefined') {
    return `${window.location.origin}${clean}`;
  }
  return clean;
}
