import {
  BelongsTo,
  ForeignKey,
  HasMany,
  HasOne,
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
import { CommentAuthor } from './comment-author';
import { CommentMeta } from './comment-meta';

@Table({
  tableName: 'comments',
  timestamps: true,
  underscored: true,
})
export class Comment extends Model<
  InferAttributes<Comment>,
  InferCreationAttributes<Comment>
> {
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
  })
  declare id: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  content: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  targetId: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  targetType: string;

  @ForeignKey(() => CommentAuthor)
  @AllowNull(false)
  @Column(DataType.UUID)
  authorId: number;

  @BelongsTo(() => CommentAuthor)
  author: CommentAuthor;

  @AllowNull(true)
  @Column(DataType.UUID)
  rootId?: string | null;

  @ForeignKey(() => Comment)
  @AllowNull(true)
  @Column(DataType.UUID)
  parentId?: string | null;

  @BelongsTo(() => Comment, 'parentId')
  parent: Comment;

  @HasMany(() => Comment, 'parentId')
  replies: Comment[];

  @HasOne(() => CommentMeta)
  meta: CommentMeta;

  @Column(DataType.DATE)
  declare createdAt: Date;

  @Column(DataType.DATE)
  declare updatedAt: Date;
}
