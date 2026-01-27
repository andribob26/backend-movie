import { Model } from 'sequelize-typescript';
import {
  AllowNull,
  Column,
  DataType,
  Default,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

@Table({
  tableName: 'videos',
  timestamps: true,
  underscored: true,
})
export class Video extends Model<Video> {
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
  })
  declare id: string;

  @AllowNull(true)
  @Column({ type: DataType.INTEGER, unique: true })
  tmdbId: number | null;

  @AllowNull(true)
  @Column({ type: DataType.STRING, unique: true })
  imdbId: string | null;

  @AllowNull(false)
  @Column(DataType.STRING)
  fileName: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  originalName: string;

  @AllowNull(false)
  @Column({
    type: DataType.TEXT,
    unique: true,
  })
  prefix: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  hlsObject: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  thumbnail: string;

  @AllowNull(false)
  @Column(DataType.JSONB)
  sprites: string[];

  @AllowNull(true)
  @Column(DataType.JSONB)
  uploadedFiles?: string[] | null;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.BIGINT)
  uploadedSize: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  uploadedProgress: number;

  @Column(DataType.DATE)
  declare createdAt: Date;

  @Column(DataType.DATE)
  declare updatedAt: Date;
}
