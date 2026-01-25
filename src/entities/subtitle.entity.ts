import { BelongsTo, ForeignKey, HasMany, Model } from 'sequelize-typescript';
import {
  AllowNull,
  Column,
  DataType,
  Default,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Movie } from './movie.entity';
import { InferAttributes, InferCreationAttributes } from 'sequelize';
import { File } from './file.entity';
import { Episode } from './episode.entity';

@Table({
  tableName: 'subtitles',
  timestamps: true,
  underscored: true,
})
export class Subtitle extends Model<
  InferAttributes<Subtitle>,
  InferCreationAttributes<Subtitle>
> {
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
  })
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  language: string;

  @ForeignKey(() => File)
  @AllowNull(false)
  @Column(DataType.UUID)
  fileId: string | null;

  @BelongsTo(() => File)
  file: File;

  // Opsional: untuk movie tunggal
  @ForeignKey(() => Movie)
  @AllowNull(true) // bisa null kalau subtitle untuk episode
  @Column(DataType.UUID)
  movieId: string | null;

  @BelongsTo(() => Movie)
  movie: Movie | null;

  // Opsional: untuk episode
  @ForeignKey(() => Episode)
  @AllowNull(true) // bisa null kalau subtitle untuk movie
  @Column(DataType.UUID)
  episodeId: string | null;

  @BelongsTo(() => Episode)
  episode: Episode | null;

  @Column(DataType.DATE)
  declare createdAt: Date;

  @Column(DataType.DATE)
  declare updatedAt: Date;
}
