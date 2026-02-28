import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { FeaturedMovieItemDto } from './fetured-movie-item.dto';

export class CreateFeaturedMovieDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeaturedMovieItemDto)
  featuredMovies: FeaturedMovieItemDto[];
}
