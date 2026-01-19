import { IsString, IsOptional, IsUUID, IsNumber } from 'class-validator';

export class AssocCharacterDto {
  @IsOptional()
  @IsUUID()
  movieId?: string | null;

  @IsUUID()
  personId: string;

  @IsOptional()
  @IsString()
  character?: string | null;

  @IsOptional()
  @IsNumber()
  order?: number | null;
}
