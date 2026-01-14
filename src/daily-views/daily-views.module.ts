import { Module } from '@nestjs/common';
import { DailyViewsService } from './daily-views.service';
import { BullModule } from '@nestjs/bullmq';
import { SequelizeModule } from '@nestjs/sequelize';
import { Movie } from 'src/entities/movie.entity';
import { DailyViewsProcessor } from './daily-views.processor';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { DailyViewsController } from './daily-views.controller';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'views_rollup',
    }),
    BullBoardModule.forFeature({
      name: 'views_rollup',
      adapter: BullMQAdapter,
    }),
    SequelizeModule.forFeature([Movie]),
  ],
  providers: [DailyViewsService, DailyViewsProcessor],
  exports: [BullModule],
  controllers: [DailyViewsController],
})
export class DailyViewsModule {}
