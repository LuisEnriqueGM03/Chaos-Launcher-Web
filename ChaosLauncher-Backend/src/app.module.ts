import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ModpacksModule } from './modules/modpacks/modpacks.module';
import { ManifestsModule } from './modules/manifests/manifests.module';
import { ServerStatusModule } from './modules/server-status/server-status.module';
import { GithubModule } from './modules/github/github.module';
import { ModpackImportModule } from './modules/modpack-import/modpack-import.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    AppConfigModule,
    DatabaseModule,
    AuthModule,
    UsersModule,
    ModpacksModule,
    ManifestsModule,
    ServerStatusModule,
    GithubModule,
    ModpackImportModule,
    UploadsModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
