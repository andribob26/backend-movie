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
import { Movie } from './movie.entity';
import { InferAttributes, InferCreationAttributes } from 'sequelize';

@Table({
  tableName: 'daily_views',
  timestamps: true,
  underscored: true,
})
export class DailyView extends Model<
  InferAttributes<DailyView>,
  InferCreationAttributes<DailyView>
> {
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
  })
  declare id: string;

  @ForeignKey(() => Movie)
  @Column(DataType.UUID)
  movieId: string;

  @BelongsTo(() => Movie)
  movie: Movie;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  viewDate: Date; 

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  viewCount: number;

  @Column(DataType.DATE)
  declare createdAt: Date;

  @Column(DataType.DATE)
  declare updatedAt: Date;
}
