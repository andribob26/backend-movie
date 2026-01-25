import { Module } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { MoviesController } from './movies.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Movie } from 'src/entities/movie.entity';
import { Country } from 'src/entities/country.entity';
import { Genre } from 'src/entities/genre.entity';
import { File } from 'src/entities/file.entity';
import { MovieGenre } from 'src/entities/movie-genre.entity';
import { Video } from 'src/entities/video.entity';
import { AgeRating } from 'src/entities/age-rating.entity';
import { Subtitle } from 'src/entities/subtitle.entity';
import { Comment } from 'src/entities/comment.entity';
import { CommentAuthor } from 'src/entities/comment-author';
import { CommentMeta } from 'src/entities/comment-meta';

import { DailyView } from 'src/entities/daily-views.entity';
import { Season } from 'src/entities/season.entity';
import { Episode } from 'src/entities/episode.entity';
import { FeaturedMovie } from 'src/entities/featured-movie.entity';
import { HttpModule } from '@nestjs/axios';

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
      Comment,
      CommentAuthor,
      CommentMeta,
      DailyView,
      Season,
      Episode,
      FeaturedMovie,
    ]),
  ],
  providers: [MoviesService],
  controllers: [MoviesController],
})
export class MoviesModule {}
