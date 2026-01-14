import { Module } from '@nestjs/common';
import { FileCleansService } from './file-cleans.service';
import { FileCleansController } from './file-cleans.controller';
import { FileCleansProcessor } from './file-cleans.processor';
import { BullModule } from '@nestjs/bullmq';
import { SequelizeModule } from '@nestjs/sequelize';
import { File } from 'src/entities/file.entity';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'file_cleanup',
    }),
    BullBoardModule.forFeature({
      name: 'file_cleanup',
      adapter: BullMQAdapter, //or use BullAdapter if you're using bull instead of bullMQ
    }),
    SequelizeModule.forFeature([File]),
  ],
  providers: [FileCleansService, FileCleansProcessor],
  controllers: [FileCleansController],
})
export class FileCleansModule {}
