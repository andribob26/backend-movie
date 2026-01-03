import { Module } from '@nestjs/common';
import { FileCleansService } from './file-cleans.service';
import { FileCleansController } from './file-cleans.controller';
import { FileCleansProcessor } from './file-cleans.processor';
import { BullModule } from '@nestjs/bullmq';
import { SequelizeModule } from '@nestjs/sequelize';
import { File } from 'src/entities/file.entity';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'file_cleanup',
    }),
    SequelizeModule.forFeature([File]),
  ],
  providers: [FileCleansService, FileCleansProcessor],
  controllers: [FileCleansController],
})
export class FileCleansModule {}
