import { getApiUrl } from '../../core/config/env';

/**
 * Resuelve URLs de imágenes relativas o absolutas hacia el backend de ChaosLauncher.
 * Si es un Blob local, URL externa (http/https/data) la deja intacta.
 * Si es una ruta relativa (/static/...) le antepone el host del backend.
 */
export function resolveImageUrl(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  if (trimmed.startsWith('/static/')) {
    const backendBase = getApiUrl().replace(/\/api\/v1\/?$/, '');
    return `${backendBase}${trimmed}`;
  }

  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  return trimmed;
}
