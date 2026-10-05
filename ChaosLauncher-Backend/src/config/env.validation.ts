import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, MinLength, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  PORT: number = 3000;

  @IsString()
  @IsOptional()
  API_PREFIX: string = 'api/v1';

  @IsString()
  @IsOptional()
  APP_NAME: string = 'ChaosLauncher-API';

  @IsString()
  DATABASE_URL: string;

  @IsString()
  @IsOptional()
  SUPERADMIN_USERNAME: string = 'admin';

  @IsString()
  @MinLength(8)
  SUPERADMIN_PASSWORD: string;

  @IsString()
  @MinLength(32, { message: 'JWT_SECRET debe tener al menos 32 caracteres' })
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string = '7d';

  @IsString()
  @IsOptional()
  CORS_ORIGIN: string = 'http://localhost:3001';

  @IsString()
  @IsOptional()
  GITHUB_TOKEN: string = '';

  @IsString()
  @IsOptional()
  GITHUB_API_URL: string = 'https://api.github.com';

  @IsString()
  @IsOptional()
  CURSEFORGE_API_KEY: string = '';

  @IsNumber()
  @IsOptional()
  STATUS_CACHE_TTL_SECONDS: number = 30;

  @IsString()
  @IsOptional()
  UPLOAD_DIR: string = './uploads';

  @IsString()
  @IsOptional()
  STATIC_SERVE_PATH: string = '/static';
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Config validation error: ${errors.toString()}`);
  }
  return validatedConfig;
}
