import { HttpService } from '@nestjs/axios';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { firstValueFrom } from 'rxjs';
import { Model, Sequelize } from 'sequelize-typescript';
import { BaseResponse } from 'src/commons/interfaces/base-response.interface';
import { PaginationResponse } from 'src/commons/interfaces/pagination-response.interface';
import { AgeRating } from 'src/entities/age-rating.entity';
import { Country } from 'src/entities/country.entity';
import { Genre } from 'src/entities/genre.entity';
import { Movie } from 'src/entities/movie.entity';
import { InferCreationAttributes, Op } from 'sequelize';
import { File } from 'src/entities/file.entity';
import { CreateTvSeriesDto } from './dto/create-tv-series.dto';
import { MovieGenre } from 'src/entities/movie-genre.entity';
import { Season } from 'src/entities/season.entity';

const NAME = 'TV';

@Injectable()
export class TvSeriesService {
  private readonly urlTMDB = 'https://api.themoviedb.org/3';
  private readonly tokenTMDB =
    'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4YzEyMmVmMzE2NmI1MTAxNDczNTA0MDZmMjEwMjhjZSIsIm5iZiI6MTcyNTc2MjQyNy44OTYsInN1YiI6IjY2ZGQwYjdhODFlYTZiZjBmZDc4NzEzOCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.hAVV5g9v6St9q02WJyFOLIOiMRXXrm7eyjTmdzTelL0';
  constructor(
    @InjectModel(Movie)
    private readonly movieModel: typeof Movie,
    @InjectModel(Country)
    private readonly countryModel: typeof Country,
    @InjectModel(AgeRating)
    private readonly ageRatingModel: typeof AgeRating,
    @InjectModel(MovieGenre)
    private readonly movieGenreModel: typeof MovieGenre,
    private readonly sequelize: Sequelize,
    private readonly httpService: HttpService,
  ) {}

  private opt = {
    attributes: [
      'id',
      'tmdbId',
      'imdbId',
      'byseSlug',
      'hydraxSlug',
      'tmdbPosterUrl',
      'tmdbBackDropUrl',
      'title',
      'slug',
      'trailerUrl',
      'tmdbRating',
      'imdbRating',
      'quality',
      'resolution',
      'duration',
      'yearOfRelease',
      'synopsis',
      'budget',
      'revenue',
      'popularityScore',
      'releasedAt',
      'updatedAt',
      'createdAt',
      'view7',
      'type',
      'director',
      'casts',
      'isPublish',
    ],
    include: [
      {
        model: File,
        as: 'poster',
        attributes: ['id', 'fileName', 'folder', 'originalName', 'mimeType'],
      },
      {
        model: Season,
        as: 'seasons',
        attributes: [
          'id',
          'seasonNumber',
          'tmdbPosterUrl',
          'title',
          'totalEpisodes',
          'airedAt',
        ],
      },
      {
        model: AgeRating,
        as: 'ageRating',
        attributes: ['id', 'code', 'name'],
      },
      {
        model: Genre,
        as: 'genres',
        attributes: ['id', 'tmdbId', 'name'],
        through: { attributes: [] },
      },
      {
        model: Country,
        as: 'country', // ← tambahkan ini kalau belum ada
        attributes: ['id', 'name', 'code'],
      },
    ],
  };

  async findAll(data: {
    page?: number;
    limit?: number;
    search: string;
    orderBy: string;
    orderDirection: 'ASC' | 'DESC';
  }): Promise<PaginationResponse<Movie>> {
    const { page, limit, search, orderBy, orderDirection } = data;

    const where: any = {
      type: 'series',
    };

    if (search && search.trim() !== '') {
      where.title = {
        [Op.iLike]: `%${search}%`,
      };
    }

    const orderByMap: Record<string, string> = {
      title: 'title',
      releasedAt: 'releasedAt',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    };

    const orderField = orderByMap[orderBy] ?? 'createdAt';

    const offset =
      page !== undefined && limit !== undefined
        ? (page - 1) * limit
        : undefined;

    const queryOptions: any = {
      where,
      attributes: this.opt.attributes,
      include: this.opt.include,
      order: [[orderField, orderDirection]],
    };

    if (offset !== undefined && limit !== undefined) {
      queryOptions.offset = offset;
      queryOptions.limit = limit;
    }

    const { rows, count } = await this.movieModel.findAndCountAll({
      ...queryOptions,
      distinct: true,
    });

    return {
      message: `${NAME} fetched successfully`,
      data: rows,
      total: count,
      page: page ?? 1,
      limit: limit ?? count,
      lastPage: limit ? Math.ceil(count / limit) : 1,
    };
  }

  async create(data: CreateTvSeriesDto): Promise<BaseResponse<Movie>> {
    const transaction = await this.sequelize.transaction();

    try {
      // ====== VALIDASI FOREIGN KEY ======
      if (data.countryId) {
        const country = await this.countryModel.findByPk(data.countryId, {
          transaction,
        });
        if (!country) throw new NotFoundException('Country not found');
      }

      // ====== CREATE MOVIE ======
      const movie = await this.movieModel.create(
        {
          tmdbId: data.tmdbId,
          imdbId: data.imdbId,
          tmdbPosterUrl: data.tmdbPosterUrl,
          tmdbBackDropUrl: data.tmdbBackDropUrl,
          title: data.title,
          slug: data.slug,
          isPublish: data.isPublish,
          tmdbRating: data.tmdbRating,
          imdbRating: data.imdbRating,
          quality: data.quality,
          resolution: data.resolution,
          yearOfRelease: data.yearOfRelease,
          synopsis: data.synopsis,
          trailerUrl: data.trailerUrl,
          countryId: data.countryId,
          releasedAt: data.releasedAt,
          creator: data.creator,
          casts: data.casts,
          type: 'series',
        } as InferCreationAttributes<Movie>,
        { transaction },
      );

      // ====== ASSOCIATE GENRES ======
      if (data.genres && data.genres.length > 0) {
        await this.movieGenreModel.bulkCreate(
          data.genres.map(
            (g) =>
              ({
                movieId: movie.dataValues.id,
                genreId: g.genreId,
              }) as InferCreationAttributes<MovieGenre>,
          ),
          { transaction },
        );
      }

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
      return { message: `${NAME} created successfully`, data: movie };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getSeries(data: { tmdbId: string }): Promise<BaseResponse<any>> {
    const headers = {
      accept: 'application/json',
      Authorization: this.tokenTMDB,
    };

    const seriesRes = await firstValueFrom(
      this.httpService.get(
        `${this.urlTMDB}/tv/${data.tmdbId}?language=en-US&append_to_response=external_ids,release_dates,credits,videos`,
        { headers },
      ),
    );
    const { external_ids, credits, videos, release_dates, ...seriesData } =
      seriesRes.data;

    const trailer =
      videos?.results?.find(
        (v: any) => v.site === 'YouTube' && v.type === 'Trailer',
      ) ?? null;

    const imdbId = external_ids?.imdb_id; // contoh: "tt1375666"

    const imdbResponse = await firstValueFrom(
      this.httpService.get(`https://api.imdbapi.dev/titles/${imdbId}`, {
        headers: {
          'content-type': 'application/json',
        },
      }),
    );

    const imdbData = imdbResponse.data;

    return {
      message: 'TMDB TV fetched successfully',
      data: {
        ...seriesData,
        imdb_rating: imdbData.rating,
        imdb_id: imdbId,
        casts: credits.cast.slice(0, 9),
        trailer: trailer
          ? {
              name: trailer.name,
              key: trailer.key,
              url: `https://www.youtube.com/watch?v=${trailer.key}`,
            }
          : null,
      },
    };
  }

  async getSeason(data: {
    tmdbId: string;
    seasonNumber: number;
  }): Promise<BaseResponse<any>> {
    const headers = {
      accept: 'application/json',
      Authorization: this.tokenTMDB,
    };

    const seasonRes = await firstValueFrom(
      this.httpService.get(
        `${this.urlTMDB}/tv/${data.tmdbId}/season/${data.seasonNumber}?language=en-US`,
        { headers },
      ),
    );

    console.log(seasonRes.data, 'mmm');

    const { episodes, ...seasonData } = seasonRes.data;

    return {
      message: 'TMDB TV Season fetched successfully',
      data: {
        ...seasonData,
      },
    };
  }

  async getEpisode(data: {
    tmdbId: string;
    seasonNumber: number;
    episodeNumber: number;
  }): Promise<BaseResponse<any>> {
    const headers = {
      accept: 'application/json',
      Authorization: this.tokenTMDB,
    };

    const episodeRes = await firstValueFrom(
      this.httpService.get(
        `${this.urlTMDB}/tv/${data.tmdbId}/season/${data.seasonNumber}/episode/${data.episodeNumber}?language=en-US&append_to_response=external_ids`,
        { headers },
      ),
    );

    const { external_ids, crew, guest_stars, ...episodeData } = episodeRes.data;

    return {
      message: 'TMDB TV Episode fetched successfully',
      data: {
        ...episodeData,
        imdb_id: external_ids?.imdb_id ?? null,
      },
    };
  }
}
