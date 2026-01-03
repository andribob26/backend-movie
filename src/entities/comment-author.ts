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
import { Comment } from './comment.entity';

@Table({
  tableName: 'comment_authors',
  timestamps: true,
  underscored: true,
})
export class CommentAuthor extends Model<
  InferAttributes<CommentAuthor>,
  InferCreationAttributes<CommentAuthor>
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
  @Column({ type: DataType.STRING, unique: true })
  email: string;

  @HasMany(() => Comment)
  comments: Comment[];

  @Column(DataType.DATE)
  declare createdAt: Date;

  @Column(DataType.DATE)
  declare updatedAt: Date;
}
