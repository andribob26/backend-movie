import { Module } from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Movie } from 'src/entities/movie.entity';
import { DailyView } from 'src/entities/daily-views.entity';
import { DailyViewsModule } from 'src/daily-views/daily-views.module';
import { Season } from 'src/entities/season.entity';
import { Episode } from 'src/entities/episode.entity';
import { InteractionsController } from './interactions.controller';

@Module({
  imports: [SequelizeModule.forFeature([Movie, Season, Episode, DailyView]), DailyViewsModule],
  providers: [InteractionsService],
  controllers: [InteractionsController],
})
export class InteractionsModule {}
