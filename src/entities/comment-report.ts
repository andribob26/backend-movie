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
  tableName: 'comment_reports',
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

  // Comment yang dilaporkan
  @ForeignKey(() => Comment)
  @AllowNull(false)
  @Column(DataType.UUID)
  commentId: string;

  @BelongsTo(() => Comment)
  comment: Comment;

  // Siapa yang report (optional)
  @ForeignKey(() => CommentAuthor)
  @AllowNull(true)
  @Column(DataType.UUID)
  reporterId?: string | null;

  @BelongsTo(() => CommentAuthor)
  reporter: CommentAuthor;

  // Alasan report, misal 'spam', 'offensive', 'other'
  @AllowNull(false)
  @Column(DataType.STRING)
  reason: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  details?: string | null;

  // pending Baru dilaporkan, belum ditindaklanjuti
  // action_taken Report sudah ditindaklanjuti → komentar dihapus atau dibanned
  // dismissed Report tidak valid, komentar tetap
  // reviewed Opsional, untuk menandai sudah diperiksa tapi belum hapus
  @AllowNull(false)
  @Default('pending')
  @Column(DataType.STRING)
  status: string;

  @Column(DataType.DATE)
  declare createdAt: Date;

  @Column(DataType.DATE)
  declare updatedAt: Date;
}
