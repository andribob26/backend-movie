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

@Table({
  tableName: 'characters',
  timestamps: true,
  underscored: true,
})
export class Character extends Model<
  InferAttributes<Character>,
  InferCreationAttributes<Character>
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

  @ForeignKey(() => Person)
  @AllowNull(false)
  @Column(DataType.UUID)
  personId: string;

  @BelongsTo(() => Person)
  person: Person;

  @AllowNull(true)
  @Column(DataType.STRING)
  character?: string | null;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  order: number | null;

  @Column(DataType.DATE)
  declare createdAt: Date;

  @Column(DataType.DATE)
  declare updatedAt: Date;
}
