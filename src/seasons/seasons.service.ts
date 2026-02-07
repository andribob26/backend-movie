import { HttpService } from '@nestjs/axios';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Season } from 'src/entities/season.entity';
import { CreateSeasonsDto } from './dto/create-seasons.dto';
import { BaseResponse } from 'src/commons/interfaces/base-response.interface';
import { InferCreationAttributes } from 'sequelize';
import { Movie } from 'src/entities/movie.entity';
const NAME = 'Season';
@Injectable()
export class SeasonsService {
  constructor(
    @InjectModel(Season)
    private readonly seasonModel: typeof Season,
    @InjectModel(Movie)
    private readonly movieModel: typeof Movie,
    private readonly sequelize: Sequelize,
    private readonly httpService: HttpService,
  ) {}

  private opt = {
    attributes: [
      'id',
      'seasonNumber',
      'tmdbPosterUrl',
      'title',
      'totalEpisodes',
      'airedAt',
    ],
    include: [],
  };

  async create(data: CreateSeasonsDto): Promise<BaseResponse<Season>> {
    const transaction = await this.sequelize.transaction();

    try {
      if (data.movieId) {
        const movie = await this.movieModel.findByPk(data.movieId, {
          transaction,
        });
        if (!movie) throw new NotFoundException('Movie not found');
      }

      // ====== CREATE MOVIE ======
      const season = await this.seasonModel.create(
        {
          movieId: data.movieId,
          seasonNumber: data.seasonNumber,
          tmdbPosterUrl: data.tmdbPosterUrl,
          title: data.title,
          airedAt: data.airedAt,
        } as InferCreationAttributes<Season>,
        { transaction },
      );

      await transaction.commit();

      try {
        const res = await fetch('http://localhost:4000/api/revalidate/movie', {
          method: 'POST',
        });

        if (!res.ok) {
          console.error('❌ Revalidate failed with status:', res.status);
        } else {
          console.log('✅ Revalidate triggered for /movie');
        }
      } catch (err) {
        if (err instanceof Error) {
          console.error('🔥 Error triggering revalidate:', err.message);
        } else {
          console.error('🔥 Error triggering revalidate:', err);
        }
      }
      return { message: `${NAME} created successfully`, data: season };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
