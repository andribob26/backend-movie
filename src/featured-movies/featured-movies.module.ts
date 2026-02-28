import { Module } from '@nestjs/common';
import { FeaturedMoviesService } from './featured-movies.service';
import { FeaturedMoviesController } from './featured-movies.controller';
import { HttpModule } from '@nestjs/axios';
import { SequelizeModule } from '@nestjs/sequelize';
import { Movie } from 'src/entities/movie.entity';
import { FeaturedMovie } from 'src/entities/featured-movie.entity';

@Module({
  imports: [HttpModule, SequelizeModule.forFeature([FeaturedMovie, Movie])],
  providers: [FeaturedMoviesService],
  controllers: [FeaturedMoviesController],
})
export class FeaturedMoviesModule {}
