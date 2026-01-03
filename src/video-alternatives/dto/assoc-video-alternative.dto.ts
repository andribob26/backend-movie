import { IsString, IsOptional, IsUUID } from 'class-validator';

export class AssocVideoAlternativeDto {
  @IsOptional()
  @IsUUID()
  movieId?: string | null;

  @IsString()
  provider: string;

  @IsString()
  source: string;
}
