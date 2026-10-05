export default () => ({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  appName: process.env.APP_NAME || 'ChaosLauncher-API',
  appUrl: process.env.APP_URL || process.env.PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3000}`,
  database: {
    url: process.env.DATABASE_URL,
  },
  auth: {
    superadminUsername: process.env.SUPERADMIN_USERNAME || 'admin',
    superadminPassword: process.env.SUPERADMIN_PASSWORD,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  },
  github: {
    token: process.env.GITHUB_TOKEN || '',
    apiUrl: process.env.GITHUB_API_URL || 'https://api.github.com',
  },
  curseforge: {
    apiKey: process.env.CURSEFORGE_API_KEY || '',
  },
  serverStatus: {
    cacheTtlSeconds: parseInt(process.env.STATUS_CACHE_TTL_SECONDS, 10) || 30,
  },
  storage: {
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    staticServePath: process.env.STATIC_SERVE_PATH || '/static',
  },
});
