import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateGenreDto {
  @IsString()
  name: string;
}
