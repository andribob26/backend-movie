import { Module } from '@nestjs/common';
import { TvSeriesService } from './tv-series.service';
import { TvSeriesController } from './tv-series.controller';
import { HttpModule } from '@nestjs/axios';
import { SequelizeModule } from '@nestjs/sequelize';
import { Movie } from 'src/entities/movie.entity';
import { AgeRating } from 'src/entities/age-rating.entity';
import { Country } from 'src/entities/country.entity';
import { Genre } from 'src/entities/genre.entity';
import { MovieGenre } from 'src/entities/movie-genre.entity';
import { Subtitle } from 'src/entities/subtitle.entity';
import { Video } from 'src/entities/video.entity';
import { File } from 'src/entities/file.entity';
import { Season } from 'src/entities/season.entity';
import { Episode } from 'src/entities/episode.entity';

@Module({
  imports: [
    HttpModule,
    SequelizeModule.forFeature([
      Movie,
      MovieGenre,
      File,
      Country,
      Genre,
      Video,
      AgeRating,
      Subtitle,
      Season,
      Episode,
    ]),
  ],
  providers: [TvSeriesService],
  controllers: [TvSeriesController],
})
export class TvSeriesModule {}
