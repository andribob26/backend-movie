import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { File } from 'src/entities/file.entity';
import { FilesController } from './files.controller';
import { FilesGateway } from './files.gateway';

@Module({
  imports: [SequelizeModule.forFeature([File])],
  providers: [FilesService, FilesGateway],
  controllers: [FilesController],
})
export class FilesModule {}
