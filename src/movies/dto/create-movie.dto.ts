import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  IsArray,
  IsDate,
  ValidateNested,
  IsBoolean,
  IsObject,
} from 'class-validator';
import { AssocMovieGenreDto } from 'src/movie-genres/dto/assoc-movie-genre.dto';
import { AssocSubtitleDto } from 'src/subtitles/dto/assoc-subtitle.dto';

export class CreateMovieDto {
  @IsNumber()
  tmdbId: number;

  @IsOptional()
  @IsString()
  imdbId: string;

  @IsOptional()
  @IsString()
  castSlug: string;

  @IsOptional()
  @IsString()
  hydraxSlug: string;

  @IsOptional()
  @IsString()
  tmdbPosterUrl?: string | null;

  @IsOptional()
  @IsString()
  tmdbBackDropUrl?: string | null;

  @IsString()
  title: string;

  @IsString()
  slug: string;

  @Type(() => Boolean)
  @IsBoolean()
  isPublish: boolean;

  @IsOptional()
  @IsNumber()
  tmdbRating?: number | null;

  @IsOptional()
  @IsNumber()
  imdbRating?: number | null;

  @IsOptional()
  @IsString()
  quality?: string | null;

  @IsOptional()
  @IsString()
  resolution?: string | null;

  @IsOptional()
  @IsString()
  yearOfRelease?: string | null;

  @IsOptional()
  @IsNumber()
  duration?: number | null;

  @IsOptional()
  @IsString()
  synopsis?: string | null;

  @IsOptional()
  @IsString()
  budget?: string | null;

  @IsOptional()
  @IsString()
  revenue?: string | null;

  @IsOptional()
  @IsString()
  trailerUrl?: string | null;

  @IsOptional()
  @IsUUID()
  fileId?: string | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssocSubtitleDto)
  subtitles?: AssocSubtitleDto[] | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssocMovieGenreDto)
  genres?: AssocMovieGenreDto[] | null;

  @IsOptional()
  @IsUUID()
  ageRatingId?: string | null;

  @IsOptional()
  @IsUUID()
  countryId?: string | null;

  @IsOptional()
  @IsArray()
  casts?: any[] | null;

  @IsOptional()
  @IsObject()
  director?: Record<string, any> | null;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  releasedAt?: Date | null;
}
