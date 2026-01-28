import { Module } from '@nestjs/common';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { MulterModule } from '@nestjs/platform-express';
import { Video } from 'src/entities/video.entity';
import { SequelizeModule } from '@nestjs/sequelize';
import { Movie } from 'src/entities/movie.entity';

@Module({
  imports: [SequelizeModule.forFeature([Video, Movie])],
  controllers: [VideosController],
  providers: [VideosService],
})
export class VideosModule {}
