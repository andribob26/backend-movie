// import {
//   Table,
//   Column,
//   Model,
//   DataType,
//   PrimaryKey,
//   Default,
//   AllowNull,
// } from 'sequelize-typescript';
// import { InferAttributes, InferCreationAttributes } from 'sequelize';

// @Table({
//   tableName: 'notifications',
//   timestamps: true,
//   underscored: true, // created_at, updated_at
// })
// export class Notification extends Model<
//   InferAttributes<Notification>,
//   InferCreationAttributes<Notification>
// > {
//   @PrimaryKey
//   @Default(DataType.INTEGER)
//   @Column({
//     type: DataType.INTEGER,
//     autoIncrement: true,
//   })
//   id: number;

//   // Judul notifikasi
//   @AllowNull(false)
//   @Column(DataType.STRING)
//   title: string;

//   // Isi notifikasi (string / JSON string)
//   @AllowNull(true)
//   @Column(DataType.TEXT)
//   message?: string;

//   // Tipe event: comment, reply, like, movie_update, dll
//   @AllowNull(false)
//   @Column(DataType.STRING)
//   type: string;

//   // Penerima notifikasi
//   @AllowNull(true)
//   @Column(DataType.STRING)
//   receiverName?: string;

//   @AllowNull(true)
//   @Column(DataType.STRING)
//   receiverEmail?: string;

//   // Status notifikasi
//   @AllowNull(false)
//   @Default(false)
//   @Column(DataType.BOOLEAN)
//   isRead: boolean;

//   // Metadata fleksibel
//   @AllowNull(true)
//   @Column(DataType.JSON)
//   metadata?: Record<string, any>;
// }
