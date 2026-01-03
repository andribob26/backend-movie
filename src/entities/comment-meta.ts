import { InferCreationAttributes, InferAttributes } from 'sequelize';
import {
  Table,
  PrimaryKey,
  Default,
  DataType,
  Column,
  ForeignKey,
  AllowNull,
  BelongsTo,
  Model,
} from 'sequelize-typescript';
import { Comment } from './comment.entity';

@Table({
  tableName: 'comment_meta',
  timestamps: true,
  underscored: true,
})
export class CommentMeta extends Model<
  InferAttributes<CommentMeta>,
  InferCreationAttributes<CommentMeta>
> {
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
  })
  declare id: string;

  @ForeignKey(() => Comment)
  @AllowNull(false)
  @Column(DataType.UUID)
  commentId: string;

  @BelongsTo(() => Comment)
  comment: Comment;

  @AllowNull(true)
  @Column(DataType.STRING)
  ipAddress?: string | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  userAgent?: string | null;

  @Column(DataType.DATE)
  declare createdAt: Date;

  @Column(DataType.DATE)
  declare updatedAt: Date;
}
