import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { getSequelizeConfig } from './configs/database.config';
import { VideosModule } from './videos/videos.module';
import { MoviesModule } from './movies/movies.module';
import { FilesModule } from './files/files.module';
import { FileCleansModule } from './file-cleans/file-cleans.module';
import { BullModule } from '@nestjs/bullmq';
import { AgeRatingsModule } from './age-ratings/age-ratings.module';
import { PersonsModule } from './persons/persons.module';
import { GenresModule } from './genres/genres.module';
import { CountriesModule } from './countries/countries.module';
import { SubtitlesModule } from './subtitles/subtitles.module';
import { MovieGenresModule } from './movie-genres/movie-genres.module';
import { CharactersModule } from './characters/characters.module';
import { CommentsModule } from './comments/comments.module';
import { VideoAlternativesModule } from './video-alternatives/video-alternatives.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SequelizeModule.forRootAsync({
      imports: [ConfigModule], // import ConfigModule agar bisa inject
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        getSequelizeConfig(configService),
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST'),
          port: config.get('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
    VideosModule,
    MoviesModule,
    FilesModule,
    FileCleansModule,
    AgeRatingsModule,
    PersonsModule,
    GenresModule,
    CountriesModule,
    SubtitlesModule,
    CharactersModule,
    MovieGenresModule,
    CommentsModule,
    VideoAlternativesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
