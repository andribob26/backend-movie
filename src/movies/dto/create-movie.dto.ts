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
} from 'class-validator';
import { AssocCharacterDto } from 'src/characters/dto/assoc-character.dto';
import { AssocMovieGenreDto } from 'src/movie-genres/dto/assoc-movie-genre.dto';
import { AssocVideoAlternativeDto } from 'src/video-alternatives/dto/assoc-video-alternative.dto';
import { AssocSubtitleDto } from 'src/subtitles/dto/assoc-subtitle.dto';

export class CreateMovieDto {
  @IsString()
  title: string;

  @IsString()
  slug: string;

  @Type(() => Boolean)
  @IsBoolean()
  isPublish: boolean;

  @IsOptional()
  @IsNumber()
  rating?: number | null;

  @IsOptional()
  @IsString()
  source?: string | null;

  @IsOptional()
  @IsString()
  resolution?: string | null;

  @IsOptional()
  @IsString()
  yearOfRelease?: string | null;

  @IsOptional()
  @IsString()
  synopsis?: string | null;

  @IsOptional()
  @IsString()
  budget?: string | null;

  @IsOptional()
  @IsString()
  worldwideGross?: string | null;

  @IsOptional()
  @IsString()
  trailerUrl?: string | null;

  @IsOptional()
  @IsUUID()
  fileId?: string | null;

  @IsOptional()
  @IsUUID()
  videoId: string | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssocSubtitleDto)
  subtitles?: AssocSubtitleDto[] | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssocCharacterDto)
  characters?: AssocCharacterDto[] | null;

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
  @ValidateNested({ each: true })
  @Type(() => AssocVideoAlternativeDto)
  videoAlternatives?: AssocVideoAlternativeDto[] | null;

  @IsOptional()
  @IsDate()
  releasedAt?: Date | null;
}
