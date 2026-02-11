import {
  AllowNull,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  BelongsTo,
  Model,
  PrimaryKey,
  Default,
  Table,
} from 'sequelize-typescript';
import { InferAttributes, InferCreationAttributes } from 'sequelize';
import { Season } from './season.entity';
import { Video } from './video.entity';
import { Subtitle } from './subtitle.entity';

@Table({
  tableName: 'episodes',
  timestamps: true,
  underscored: true,
})
export class Episode extends Model<
  InferAttributes<Episode>,
  InferCreationAttributes<Episode>
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column({ type: DataType.INTEGER, unique: true })
  tmdbId: number;

  @AllowNull(true)
  @Column({ type: DataType.STRING, unique: true })
  imdbId: string | null;

  @ForeignKey(() => Season)
  @AllowNull(false)
  @Column(DataType.UUID)
  seasonId: string;

  @BelongsTo(() => Season)
  season: Season;

  @AllowNull(false)
  @Column({ type: DataType.INTEGER, unique: true })
  episodeNumber: number; // 1, 2, 3, ...

  @AllowNull(true)
  @Column({ type: DataType.STRING, unique: true })
  byseSlug: string | null;

  @AllowNull(true)
  @Column({ type: DataType.STRING, unique: true })
  hydraxSlug: string | null;

  @AllowNull(false)
  @Column(DataType.STRING)
  title: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  synopsis: string | null;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  duration: number | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  thumbnailUrl: string | null;

  // Statistik per episode (mirip movie)
  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  totalView: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  totalLike: number;

  @HasMany(() => Subtitle)
  subtitles: Subtitle[];

  @AllowNull(true)
  @Column(DataType.DATE)
  airedAt: Date | null;

  @Column(DataType.DATE)
  declare createdAt: Date;

  @Column(DataType.DATE)
  declare updatedAt: Date;
}
