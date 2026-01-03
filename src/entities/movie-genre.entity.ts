import { BelongsTo, ForeignKey, HasMany, Model } from 'sequelize-typescript';
import {
  AllowNull,
  Column,
  DataType,
  Default,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Genre } from './genre.entity';
import { Movie } from './movie.entity';
import { InferAttributes, InferCreationAttributes } from 'sequelize';

@Table({
  tableName: 'movies_genres',
  timestamps: true,
  underscored: true,
})
export class MovieGenre extends Model<
  InferAttributes<MovieGenre>,
  InferCreationAttributes<MovieGenre>
> {
  @ForeignKey(() => Movie)
  @AllowNull(false)
  @Column(DataType.UUID)
  movieId: string;

  @ForeignKey(() => Genre)
  @AllowNull(false)
  @Column(DataType.UUID)
  genreId: string;

  @Column(DataType.DATE)
  declare createdAt: Date;

  @Column(DataType.DATE)
  declare updatedAt: Date;
}
