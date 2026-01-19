import {
  BelongsTo,
  BelongsToMany,
  ForeignKey,
  HasMany,
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
import { Movie } from './movie.entity';
import { File } from './file.entity';
import { InferAttributes, InferCreationAttributes, Op } from 'sequelize';
import { Character } from './character.entity';

@Table({
  tableName: 'persons',
  timestamps: true,
  underscored: true,
})
export class Person extends Model<
  InferAttributes<Person>,
  InferCreationAttributes<Person>
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
  name: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  position: string;

  @ForeignKey(() => File)
  @AllowNull(true)
  @Column(DataType.UUID)
  fileId: string | null;

  @BelongsTo(() => File)
  image: File;

  @HasMany(() => Character)
  characters: Character[];

  @BelongsToMany(() => Movie, () => Character)
  movies: Movie[];

  @Column(DataType.DATE)
  declare createdAt: Date;

  @Column(DataType.DATE)
  declare updatedAt: Date;
}
