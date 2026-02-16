import { Module } from '@nestjs/common';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { MulterModule } from '@nestjs/platform-express';
import { Video } from 'src/entities/video.entity';
import { SequelizeModule } from '@nestjs/sequelize';
import { Movie } from 'src/entities/movie.entity';
import { Episode } from 'src/entities/episode.entity';
import { Season } from 'src/entities/season.entity';

@Module({
  imports: [SequelizeModule.forFeature([Video, Movie, Season, Episode])],
  controllers: [VideosController],
  providers: [VideosService],
})
export class VideosModule {}
