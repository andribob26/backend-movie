import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';

export const getSequelizeConfig = (
  configService: ConfigService,
): SequelizeModuleOptions => ({
  dialect: 'postgres',
  uri: configService.get<string>('DB_URL_LOCAL'),
  // dialectOptions: {
  //   ssl: {
  //     require: true,
  //     rejectUnauthorized: false, // penting untuk Neon
  //   },
  // },
  autoLoadModels: true, // otomatis load semua models yang diimport
  synchronize: true, // auto-create tabel (dev only)
  // logging: true, // bisa diaktifkan jika mau debug
});
