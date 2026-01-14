import { Module } from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Movie } from 'src/entities/movie.entity';
import { DailyView } from 'src/entities/daily-views.entity';
import { DailyViewsModule } from 'src/daily-views/daily-views.module';

@Module({
  imports: [SequelizeModule.forFeature([Movie, DailyView]), DailyViewsModule],
  providers: [InteractionsService],
})
export class InteractionsModule {}
