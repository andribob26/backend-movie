import { IsString, IsOptional, IsUUID } from 'class-validator';

export class AssocSubtitleDto {
  
  @IsOptional()
  @IsUUID()
  movieId?: string | null;

  @IsString()
  language: string;

  @IsUUID()
  fileId: string;
}
