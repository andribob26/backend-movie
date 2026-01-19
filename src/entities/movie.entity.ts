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
import { Country } from './country.entity';
import { Genre } from './genre.entity';
import { MovieGenre } from './movie-genre.entity';
import { File } from './file.entity';
import { Video } from './video.entity';
import { InferAttributes, InferCreationAttributes } from 'sequelize';
import { AgeRating } from './age-rating.entity';
import { Person } from './person.entity';
import { Subtitle } from './subtitle.entity';
import { Character } from './character.entity';
import { Comment } from './comment.entity';
import { VideoAlternative } from './video-alternative.entity';
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
  @Column(DataType.STRING)
  title: string;

  @AllowNull(false)
  @Column({ type: DataType.STRING, unique: true })
  slug: string;

  @AllowNull(true)
  @Column(DataType.FLOAT)
  rating: number | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  source: string | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  resolution: string | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  duration: string | null;

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
  worldwideGross: string | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  trailerUrl: string | null;

  @ForeignKey(() => File)
  @AllowNull(true)
  @Column(DataType.UUID)
  fileId: string | null;

  @BelongsTo(() => File)
  poster: File;

  @ForeignKey(() => Video)
  @AllowNull(true)
  @Column(DataType.UUID)
  videoId: string | null;

  @BelongsTo(() => Video)
  video: Video;

  @HasMany(() => Character)
  characters: Character[];

  @HasMany(() => Subtitle)
  subtitles: Subtitle[];

  @BelongsToMany(() => Person, () => Character)
  persons: Person[];

  @ForeignKey(() => AgeRating)
  @AllowNull(true)
  @Column(DataType.UUID)
  ageRatingId: string | null;

  @BelongsTo(() => AgeRating)
  ageRating: AgeRating;

  @BelongsToMany(() => Genre, () => MovieGenre)
  genres: Genre[];

  @ForeignKey(() => Country)
  @AllowNull(true)
  @Column(DataType.UUID)
  countryId: string | null;

  @BelongsTo(() => Country)
  country: Country;

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
  totalLike: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  totalComment: number;

  @HasMany(() => VideoAlternative)
  videoAlternatives: VideoAlternative[];

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

  @AllowNull(true)
  @Column(DataType.DATE)
  releasedAt: Date | null;

  @AllowNull(false)
  @Default('movie')
  @Column(DataType.ENUM('movie', 'series'))
  type: 'movie' | 'series';

  @HasMany(() => Season)
  seasons: Season[];

  @Column(DataType.DATE)
  declare createdAt: Date;

  @Column(DataType.DATE)
  declare updatedAt: Date;
}
