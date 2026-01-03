import { InferAttributes, InferCreationAttributes } from 'sequelize';
import {
  Table,
  Model,
  Column,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

@Table({
  tableName: 'files',
  timestamps: true,
  underscored: true,
})
export class File extends Model<
  InferAttributes<File>,
  InferCreationAttributes<File>
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
  uploadId: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  folder: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  originalName: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  fileName: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  mimeType: string;

  @AllowNull(false)
  @Column(DataType.BIGINT)
  size: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  uploadedChunks: number;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  completed: boolean;

  @AllowNull(true)
  @Column(DataType.TEXT)
  filePath: string | null;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  isUsed: boolean;

  @Column(DataType.DATE)
  declare createdAt: Date;

  @Column(DataType.DATE)
  declare updatedAt: Date;
}
