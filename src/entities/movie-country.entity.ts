import { BelongsTo, ForeignKey, HasMany, Model } from 'sequelize-typescript';
import {
  AllowNull,
  Column,
  DataType,
  Default,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { InferAttributes, InferCreationAttributes } from 'sequelize';
import { Country } from './country.entity';
import { Movie } from './movie.entity';

@Table({
  tableName: 'movies_countries',
  timestamps: true,
  underscored: true,
})
export class MovieCountry extends Model<
  InferAttributes<MovieCountry>,
  InferCreationAttributes<MovieCountry>
> {
  @ForeignKey(() => Movie)
  @AllowNull(false)
  @Column(DataType.UUID)
  movieId: string;

  @ForeignKey(() => Country)
  @AllowNull(false)
  @Column(DataType.UUID)
  countryId: string;

  @Column(DataType.DATE)
  declare createdAt: Date;

  @Column(DataType.DATE)
  declare updatedAt: Date;
}
