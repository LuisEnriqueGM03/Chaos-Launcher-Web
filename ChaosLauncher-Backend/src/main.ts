import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';
import helmet from 'helmet';
import cookieParser = require('cookie-parser');
import * as fs from 'fs';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(cookieParser());
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.useBodyParser('json', { limit: '5mb' });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 3000;
  const apiPrefix = configService.get<string>('apiPrefix') || 'api/v1';
  const corsOrigin = configService.get<string>('cors.origin') || 'http://localhost:3001';
  const isProd = configService.get<string>('env') === 'production';
  const uploadDir = configService.get<string>('storage.uploadDir') || './uploads';
  const staticPath = configService.get<string>('storage.staticServePath') || '/static';

  // 1. Asegurar carpeta de uploads
  const absoluteUploadDir = path.resolve(process.cwd(), uploadDir);
  if (!fs.existsSync(absoluteUploadDir)) {
    fs.mkdirSync(absoluteUploadDir, { recursive: true });
  }

  // 2. Servir estáticos para imágenes (iconos y wallpapers)
  app.useStaticAssets(absoluteUploadDir, {
    prefix: staticPath.endsWith('/') ? staticPath : `${staticPath}/`,
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'; sandbox");
    },
  });

  // 3. CORS para aplicaciones cliente y Electron
  app.enableCors({
    // '*' solo sin credenciales; con orígenes explícitos se habilitan credenciales
    origin: corsOrigin === '*' ? '*' : corsOrigin.split(',').map((o) => o.trim()),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: corsOrigin !== '*',
  });

  // 4. Prefijo global de API
  app.setGlobalPrefix(apiPrefix);

  // 5. Validaciones y transformación de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 6. Filtro global de excepciones
  app.useGlobalFilters(new HttpExceptionFilter());

  // 7. Interceptores globales (Transform y Logging)
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(reflector),
  );

  // 8. Swagger OpenAPI Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('ChaosLauncher API')
    .setDescription(
      'API REST modular para la gestión centralizada de modpacks, versiones, sincronización diferencial de archivos y monitoreo de servidores Minecraft para ChaosLauncher.',
    )
    .setVersion('1.0.0')
    .addTag('Modpacks', 'Catálogo y gestión de modpacks del launcher')
    .addTag('Manifests', 'Generación de manifiestos y differential sync para ChaosLauncher-esc')
    .addTag('Server Status', 'Monitoreo de estado y jugadores en línea con caché')
    .addTag('GitHub Integration', 'Sincronización automática de releases y manifiestos de GitHub')
    .addTag('Uploads', 'Carga de iconos y wallpapers locales')
    .addTag('Health', 'Estado del sistema y de la base de datos')
    .build();

  if (!isProd) {
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      customSiteTitle: 'ChaosLauncher API - Swagger Docs',
    });
  }

  // 9. Iniciar servidor
  await app.listen(port);
  logger.log(`🚀 Servidor ejecutándose en: http://localhost:${port}/${apiPrefix}`);
  if (!isProd) logger.log(`📚 Documentación Swagger interactiva: http://localhost:${port}/docs`);
}

bootstrap();
