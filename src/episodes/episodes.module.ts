import { Module } from '@nestjs/common';
import { EpisodesService } from './episodes.service';
import { HttpModule } from '@nestjs/axios';
import { SequelizeModule } from '@nestjs/sequelize';
import { Episode } from 'src/entities/episode.entity';
import { Season } from 'src/entities/season.entity';
import { Subtitle } from 'src/entities/subtitle.entity';
import { File } from 'src/entities/file.entity';
import { EpisodesController } from './episodes.controller';

@Module({
  imports: [
    HttpModule,
    SequelizeModule.forFeature([Episode, Season, Subtitle, File]),
  ],
  providers: [EpisodesService],
  controllers: [EpisodesController],
})
export class EpisodesModule {}
