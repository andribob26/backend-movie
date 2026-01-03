import { IsString, IsOptional, IsUUID } from 'class-validator';

export class AssocMovieGenreDto {
  @IsOptional()
  @IsUUID()
  movieId?: string | null;

  @IsUUID()
  genreId: string;
}
