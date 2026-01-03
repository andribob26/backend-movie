import { IsString, IsOptional, IsUUID } from 'class-validator';

export class AssocCharacterDto {
  @IsOptional()
  @IsUUID()
  movieId?: string | null;

  @IsUUID()
  personId: string;

  @IsOptional()
  @IsString()
  character?: string | null;
}
