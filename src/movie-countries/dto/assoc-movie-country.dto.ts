import { IsString, IsOptional, IsUUID } from 'class-validator';

export class AssocMovieCountryDto {
  @IsOptional()
  @IsUUID()
  movieId?: string | null;

  @IsUUID()
  countryId: string;
}
