import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { HttpModule } from '@nestjs/axios';
import { SequelizeModule } from '@nestjs/sequelize';
import { Movie } from 'src/entities/movie.entity';

@Module({
  imports: [HttpModule, SequelizeModule.forFeature([Movie])],
  providers: [MediaService],
  controllers: [MediaController],
})
export class MediaModule {}
