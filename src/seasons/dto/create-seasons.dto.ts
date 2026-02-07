import { Type } from 'class-transformer';
import { IsString, IsOptional, IsNumber, IsDate, IsUUID } from 'class-validator';
export class CreateSeasonsDto {
  @IsOptional()
  @IsUUID()
  movieId?: string | null;

  @IsNumber()
  seasonNumber: number;

  @IsOptional()
  @IsString()
  tmdbPosterUrl?: string | null;

  @IsString()
  title: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  airedAt?: Date | null;
}
