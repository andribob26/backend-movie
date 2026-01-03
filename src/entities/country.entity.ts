import { HasMany, Model } from 'sequelize-typescript';
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

@Table({
  tableName: 'countries',
  timestamps: true,
  underscored: true,
})
export class Country extends Model<
  InferAttributes<Country>,
  InferCreationAttributes<Country>
> {
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
  })
  declare id: string;

  @AllowNull(false)
  @Column({ type: DataType.STRING, unique: true })
  name: string;

  @AllowNull(false)
  @Column({ type: DataType.STRING, unique: true })
  code: string;

  @HasMany(() => Movie)
  movies: Movie[];

  @Column(DataType.DATE)
  declare createdAt: Date;

  @Column(DataType.DATE)
  declare updatedAt: Date;
}
