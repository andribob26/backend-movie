import {
  BelongsTo,
  BelongsToMany,
  ForeignKey,
  HasMany,
  Model,
} from 'sequelize-typescript';
import {
  AllowNull,
  Column,
  DataType,
  Default,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { MovieGenre } from './movie-genre.entity';
import { Movie } from './movie.entity';
import { InferAttributes, InferCreationAttributes } from 'sequelize';

@Table({
  tableName: 'genres',
  timestamps: true,
  underscored: true,
})
export class Genre extends Model<
  InferAttributes<Genre>,
  InferCreationAttributes<Genre>
> {
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
  })
  declare id: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  tmdbId: number;

  @AllowNull(false)
  @Column({ type: DataType.STRING, unique: true })
  name: string;

  @BelongsToMany(() => Movie, () => MovieGenre)
  movies: Movie[];

  @Column(DataType.DATE)
  declare createdAt: Date;

  @Column(DataType.DATE)
  declare updatedAt: Date;
}
