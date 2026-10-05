import { PartialType } from '@nestjs/swagger';
import { CreateModpackDto } from './create-modpack.dto';

export class UpdateModpackDto extends PartialType(CreateModpackDto) {}
