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
  tableName: 'video-alternatives',
  timestamps: true,
  underscored: true,
})
export class VideoAlternative extends Model<
  InferAttributes<VideoAlternative>,
  InferCreationAttributes<VideoAlternative>
> {
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
  })
  declare id: string;

  @ForeignKey(() => Movie)
  @AllowNull(false)
  @Column(DataType.UUID)
  movieId: string;

  @BelongsTo(() => Movie)
  movie: Movie;

  // youtube | vimeo | self | other
  @AllowNull(false)
  @Column(DataType.STRING)
  provider: string;

  // SIMPAN URL EMBED, BUKAN IFRAME
  // contoh: https://www.youtube.com/embed/xxxx
  @AllowNull(false)
  @Column(DataType.TEXT)
  source: string;

  @Column(DataType.DATE)
  declare createdAt: Date;

  @Column(DataType.DATE)
  declare updatedAt: Date;
}
