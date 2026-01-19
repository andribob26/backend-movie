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

  @ForeignKey(() => Season)
  @AllowNull(false)
  @Column(DataType.UUID)
  seasonId: string;

  @BelongsTo(() => Season)
  season: Season;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  episodeNumber: number; // 1, 2, 3, ...

  @AllowNull(false)
  @Column(DataType.STRING)
  title: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  synopsis: string | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  duration: string | null;

  @ForeignKey(() => Video)
  @AllowNull(true)
  @Column(DataType.UUID)
  videoId: string | null;

  @BelongsTo(() => Video)
  video: Video;

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

  @Column(DataType.DATE)
  declare createdAt: Date;

  @Column(DataType.DATE)
  declare updatedAt: Date;
}
