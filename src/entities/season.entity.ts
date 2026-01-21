import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { InferAttributes, InferCreationAttributes } from 'sequelize';
import { Movie } from './movie.entity';
import { Episode } from './episode.entity';

@Table({
  tableName: 'seasons',
  timestamps: true,
  underscored: true,
})
export class Season extends Model<
  InferAttributes<Season>,
  InferCreationAttributes<Season>
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
  seasonNumber: number; // 1, 2, 3, ...

  @AllowNull(true)
  @Column(DataType.STRING)
  title: string | null; // misal "Season 1"

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  totalEpisodes: number;

  @HasMany(() => Episode)
  episodes: Episode[];

  @Column(DataType.DATE)
  declare createdAt: Date;

  @Column(DataType.DATE)
  declare updatedAt: Date;
}
