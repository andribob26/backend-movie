// featured-movie-item.dto.ts
import { IsUUID, IsNumber } from 'class-validator';

export class FeaturedMovieItemDto {
  @IsUUID()
  movieId: string;

  @IsNumber()
  position: number;
}
