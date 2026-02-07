import { Module } from '@nestjs/common';
import { SeasonsController } from './seasons.controller';
import { SeasonsService } from './seasons.service';
import { HttpModule } from '@nestjs/axios';
import { SequelizeModule } from '@nestjs/sequelize';
import { Season } from 'src/entities/season.entity';
import { Movie } from 'src/entities/movie.entity';

@Module({
  imports: [HttpModule, SequelizeModule.forFeature([Season, Movie])],
  controllers: [SeasonsController],
  providers: [SeasonsService],
})
export class SeasonsModule {}
