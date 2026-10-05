/**
 * Dirección del backend vista desde el servidor de Next (no desde el navegador). En desarrollo es localhost;
 * en Docker es el nombre del servicio del compose. Se fija al compilar.
 */
const BACKEND_INTERNAL_URL = (process.env.BACKEND_INTERNAL_URL || 'http://localhost:3000').replace(/\/$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Imagen Docker mínima: Next genera un servidor autocontenido en .next/standalone
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${BACKEND_INTERNAL_URL}/api/v1/:path*`,
      },
      {
        source: '/static/:path*',
        destination: `${BACKEND_INTERNAL_URL}/static/:path*`,
      },
    ];
  },
};

export default nextConfig;
