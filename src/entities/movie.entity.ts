import {
  BelongsTo,
  BelongsToMany,
  ForeignKey,
  HasMany,
  HasOne,
  Index,
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
import { Country } from './country.entity';
import { Genre } from './genre.entity';
import { MovieGenre } from './movie-genre.entity';
import { File } from './file.entity';
import { Video } from './video.entity';
import { InferAttributes, InferCreationAttributes } from 'sequelize';
import { AgeRating } from './age-rating.entity';
import { Subtitle } from './subtitle.entity';
import { Comment } from './comment.entity';
import { Season } from './season.entity';
@Table({
  tableName: 'movies',
  timestamps: true,
  underscored: true,
})
export class Movie extends Model<
  InferAttributes<Movie>,
  InferCreationAttributes<Movie>
> {
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
  })
  declare id: string;

  @AllowNull(false)
  @Column({ type: DataType.INTEGER, unique: true })
  tmdbId: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  @Index('idx_movie_title')
  title: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  tmdbPosterUrl: string | null;

  @AllowNull(false)
  @Column({ type: DataType.STRING, unique: true })
  slug: string;

  @AllowNull(true)
  @Column(DataType.FLOAT)
  tmdbRating: number | null;

  @AllowNull(true)
  @Column(DataType.FLOAT)
  imdbRating: number | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  quality: string | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  resolution: string | null;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  duration: number | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  yearOfRelease: string | null;

  @AllowNull(true)
  @Column(DataType.TEXT)
  synopsis: string | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  budget: string | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  revenue: string | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  trailerUrl: string | null;

  @ForeignKey(() => File)
  @AllowNull(true)
  @Column(DataType.UUID)
  fileId: string | null;

  @BelongsTo(() => File)
  poster: File;

  @HasMany(() => Subtitle)
  subtitles: Subtitle[];

  @BelongsToMany(() => Genre, () => MovieGenre)
  genres: Genre[];

  @ForeignKey(() => Country)
  @AllowNull(true)
  @Column(DataType.UUID)
  countryId: string | null;

  @BelongsTo(() => Country)
  country: Country;

  @ForeignKey(() => AgeRating)
  @AllowNull(true)
  @Column(DataType.UUID)
  ageRatingId: string | null;

  @BelongsTo(() => AgeRating)
  ageRating: AgeRating;

  @AllowNull(false)
  @Default('movie')
  @Column(DataType.ENUM('movie', 'series'))
  type: 'movie' | 'series';

  @AllowNull(true)
  @Column(DataType.JSONB)
  casts: any | null;

  @AllowNull(true)
  @Column(DataType.JSONB)
  director: any | null;

  @AllowNull(true)
  @Column(DataType.DATE)
  releasedAt: Date | null;

  // ===========================
  // Kolom tambahan untuk popularitas
  // ===========================
  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  totalView: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  view7: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  view30: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  totalComment: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.FLOAT)
  popularityScore: number;

  @Column(DataType.DATE)
  popularityScoreLastUpdated: Date | null;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  isPublish: boolean;

  @HasMany(() => Season)
  seasons?: Season[];

  @Column(DataType.DATE)
  declare createdAt: Date;

  @Column(DataType.DATE)
  declare updatedAt: Date;
}
