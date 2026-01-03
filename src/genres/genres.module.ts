import { Module } from '@nestjs/common';
import { GenresService } from './genres.service';
import { GenresController } from './genres.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Genre } from 'src/entities/genre.entity';

@Module({
  imports: [SequelizeModule.forFeature([Genre])],
  providers: [GenresService],
  controllers: [GenresController],
})
export class GenresModule {}
