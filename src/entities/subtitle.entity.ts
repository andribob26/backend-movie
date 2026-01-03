import { BelongsTo, ForeignKey, HasMany, Model } from 'sequelize-typescript';
import {
  AllowNull,
  Column,
  DataType,
  Default,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Person } from './person.entity';
import { Movie } from './movie.entity';
import { InferAttributes, InferCreationAttributes } from 'sequelize';
import { File } from './file.entity';

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

  @ForeignKey(() => Movie)
  @AllowNull(false)
  @Column(DataType.UUID)
  movieId: string;

  @BelongsTo(() => Movie)
  movie: Movie;

  @Column(DataType.DATE)
  declare createdAt: Date;

  @Column(DataType.DATE)
  declare updatedAt: Date;
}
