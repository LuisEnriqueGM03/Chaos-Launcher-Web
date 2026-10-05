import { Module } from '@nestjs/common';
import { ModpacksService } from './modpacks.service';
import { ModpacksController } from './modpacks.controller';
import { GithubModule } from '../github/github.module';

@Module({
  imports: [GithubModule],
  controllers: [ModpacksController],
  providers: [ModpacksService],
  exports: [ModpacksService],
})
export class ModpacksModule {}
