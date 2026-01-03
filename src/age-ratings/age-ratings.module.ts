import { Module } from '@nestjs/common';
import { AgeRatingsService } from './age-ratings.service';
import { AgeRatingsController } from './age-ratings.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { AgeRating } from 'src/entities/age-rating.entity';

@Module({
  imports: [SequelizeModule.forFeature([AgeRating])],
  providers: [AgeRatingsService],
  controllers: [AgeRatingsController],
})
export class AgeRatingsModule {}
