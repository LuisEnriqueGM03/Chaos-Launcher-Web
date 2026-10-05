import { Module } from '@nestjs/common';
import { GithubModule } from '../github/github.module';
import { ChunkedUploadService } from './chunked-upload.service';
import { CurseForgeService } from './curseforge.service';
import { ModpackImportController } from './modpack-import.controller';
import { ModpackImportService } from './modpack-import.service';

@Module({
  imports: [GithubModule],
  controllers: [ModpackImportController],
  providers: [ModpackImportService, CurseForgeService, ChunkedUploadService],
})
export class ModpackImportModule {}
