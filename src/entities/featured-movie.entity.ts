import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Movie } from './movie.entity';
import { InferAttributes, InferCreationAttributes } from 'sequelize';

@Table({
  tableName: 'featured_movies',
  timestamps: true,
  underscored: true,
})
export class FeaturedMovie extends Model<
  InferAttributes<FeaturedMovie>,
  InferCreationAttributes<FeaturedMovie>
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => Movie)
  @AllowNull(false)
  @Column(DataType.UUID)
  movieId: string;

  @BelongsTo(() => Movie)
  movie: Movie;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  position: number; // 1 = paling atas, 2, dst (per section)

  @Column(DataType.DATE)
  declare createdAt: Date;

  @Column(DataType.DATE)
  declare updatedAt: Date;
}
