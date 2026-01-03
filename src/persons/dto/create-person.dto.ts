import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreatePersonDto {
  @IsString()
  name: string;

  @IsString()
  position: string;

  @IsOptional()
  @IsUUID()
  fileId?: string | null;
}
