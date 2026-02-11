import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsDate,
  IsUUID,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { AssocSubtitleDto } from 'src/subtitles/dto/assoc-subtitle.dto';
export class CreateEpisodeDto {
  @IsUUID()
  seasonId?: string | null;

  @IsNumber()
  tmdbId: number;

  @IsNumber()
  episodeNumber: number;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string | null;

  @IsOptional()
  @IsString()
  imdbId: string;

  @IsOptional()
  @IsString()
  byseSlug: string;

  @IsOptional()
  @IsString()
  hydraxSlug: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsNumber()
  duration?: number | null;

  @IsOptional()
  @IsString()
  synopsis?: string | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssocSubtitleDto)
  subtitles?: AssocSubtitleDto[] | null;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  airedAt?: Date | null;
}
