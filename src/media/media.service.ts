import { HttpService } from '@nestjs/axios';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Sequelize } from 'sequelize';
import { BaseResponse } from 'src/commons/interfaces/base-response.interface';
import { PaginationResponse } from 'src/commons/interfaces/pagination-response.interface';
import { AgeRating } from 'src/entities/age-rating.entity';
import { Country } from 'src/entities/country.entity';
import { FeaturedMovie } from 'src/entities/featured-movie.entity';
import { File } from 'src/entities/file.entity';
import { Genre } from 'src/entities/genre.entity';
import { MovieGenre } from 'src/entities/movie-genre.entity';
import { Movie } from 'src/entities/movie.entity';
import { Season } from 'src/entities/season.entity';
import { Subtitle } from 'src/entities/subtitle.entity';
import { Video } from 'src/entities/video.entity';

const NAME = 'Media';

@Injectable()
export class MediaService {
  constructor(
    @InjectModel(Movie)
    private readonly movieModel: typeof Movie,
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
      'creator',
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
        model: Subtitle,
        as: 'subtitles',
        attributes: ['id', 'language'],
        include: [
          {
            model: File,
            as: 'file',
            attributes: [
              'id',
              'fileName',
              'folder',
              'originalName',
              'mimeType',
            ],
          },
        ],
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

  private normalizeTitleWord(word: string): string {
    return word
      .toLowerCase()
      .replace(/[^\w]/g, '') // hapus : , . - dll
      .replace(/s$/, ''); // singular: aliens → alien
  }

  async findOne(data: { slug: string }): Promise<BaseResponse<Movie>> {
    try {
      const dataGenre = await this.movieModel.findOne({
        where: { slug: data.slug },
        attributes: this.opt.attributes,
        include: this.opt.include,
      });

      if (!dataGenre) {
        throw new NotFoundException(`${NAME} with slug ${data.slug} not found`);
      }

      return {
        message: `${NAME} fetched successfully`,
        data: dataGenre,
      };
    } catch (error) {
      throw error;
    }
  }

  async findRecommendations(data: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginationResponse<Movie>> {
    const { page, limit, search } = data;

    const whereBase: any = {
      // isPublish: true,
      releasedAt: { [Op.lte]: new Date() },
    };

    if (search && search.trim() !== '') {
      whereBase.title = { [Op.iLike]: `%${search.trim()}%` };
    }

    // Hitung offset hanya kalau page & limit benar-benar ada
    const offset =
      page !== undefined && limit !== undefined
        ? (page - 1) * limit
        : undefined;

    // Proporsi limit per kategori (tetap sama)
    const popularLimit = Math.floor((limit ?? 20) * 0.4); // default 20 kalau limit undefined
    const trendingLimit = Math.floor((limit ?? 20) * 0.3);
    const newLimit = Math.floor((limit ?? 20) * 0.2);
    const bestRatedLimit =
      (limit ?? 20) - (popularLimit + trendingLimit + newLimit);

    const popularRows = await this.movieModel.findAll({
      where: whereBase,
      attributes: this.opt.attributes,
      include: this.opt.include,
      order: [
        ['popularityScore', 'DESC'],
        ['releasedAt', 'DESC'],
      ],
      limit: popularLimit,
    });

    const trendingRows = await this.movieModel.findAll({
      where: { ...whereBase, view7: { [Op.gt]: 0 } },
      attributes: this.opt.attributes,
      include: this.opt.include,
      order: [
        ['view7', 'DESC'],
        ['releasedAt', 'DESC'],
      ],
      limit: trendingLimit,
    });

    const newRows = await this.movieModel.findAll({
      where: {
        ...whereBase,
        releasedAt: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      attributes: this.opt.attributes,
      include: this.opt.include,
      order: [
        ['releasedAt', 'DESC'],
        ['popularityScore', 'DESC'],
      ],
      limit: newLimit,
    });

    const bestRatedRows = await this.movieModel.findAll({
      where: { ...whereBase, rating: { [Op.not]: null } },
      attributes: this.opt.attributes,
      include: this.opt.include,
      order: [
        ['rating', 'DESC'],
        ['releasedAt', 'DESC'],
      ],
      limit: bestRatedLimit,
    });

    // Gabung & shuffle ringan
    let allRecommendations = [
      ...popularRows,
      ...trendingRows,
      ...newRows,
      ...bestRatedRows,
    ];

    allRecommendations = allRecommendations.sort(() => Math.random() - 0.7);

    // Pagination sesuai standar findAll
    let paginated = allRecommendations;
    if (offset !== undefined && limit !== undefined) {
      paginated = allRecommendations.slice(offset, offset + limit);
    }

    const total = allRecommendations.length; // pakai length hasil gabungan (karena mixed)

    return {
      message: 'Rich recommended movies fetched successfully',
      data: paginated,
      total,
      page: page ?? 1,
      limit: limit ?? total,
      lastPage: limit ? Math.ceil(total / limit) : 1,
    };
  }

  async findRelatedMovies(
    movieId: string,
    data: { limit?: number } = { limit: 10 },
  ): Promise<BaseResponse<Movie[]>> {
    const limit = data.limit ?? 10;

    const mainMovie = await this.movieModel.findByPk(movieId, {
      attributes: ['id', 'title', 'year_of_release', 'countryId'],
      include: [
        {
          model: Genre,
          as: 'genres',
          attributes: ['id'],
          through: { attributes: [] },
        },
      ],
    });

    if (!mainMovie) {
      throw new NotFoundException('Movie not found');
    }

    const genreIds = mainMovie.dataValues.genres?.map((g) => g.id) || [];
    const countryId = mainMovie.dataValues.countryId || null;
    const mainDirectorTmdbId = mainMovie.dataValues.director?.tmdbId || null;

    let titleWords: string[] = [];

    if (
      mainMovie.dataValues.title &&
      typeof mainMovie.dataValues.title === 'string' &&
      mainMovie.dataValues.title.trim() !== ''
    ) {
      titleWords = mainMovie.dataValues.title
        .trim()
        .split(/\s+/)
        .map(this.normalizeTitleWord)
        .filter((word) => word.length > 2)
        .slice(0, 5);
    } else {
      console.warn(`Film ID ${movieId} tidak punya title valid`);
    }

    const titleConditions = titleWords.map((word) => ({
      title: { [Op.iLike]: `%${word}%` },
    }));

    const orConditions: any[] = [];

    if (titleConditions.length > 0) {
      orConditions.push({ [Op.or]: titleConditions });
    }

    if (genreIds.length > 0) {
      orConditions.push(
        Sequelize.where(
          Sequelize.literal(`(
          SELECT COUNT(*) 
          FROM "movies_genres" 
          WHERE "movie_id" = "Movie"."id" 
          AND "genre_id" IN (${genreIds.map((id) => `'${id}'`).join(',')})
        )`),
          Op.gt,
          0,
        ),
      );
    }

    let minYear: number | undefined;
    let maxYear: number | undefined;

    if (
      countryId &&
      mainMovie.dataValues.yearOfRelease &&
      !isNaN(parseInt(mainMovie.dataValues.yearOfRelease))
    ) {
      const releaseYear = parseInt(mainMovie.dataValues.yearOfRelease);
      minYear = releaseYear - 5;
      maxYear = releaseYear + 5;
    }

    if (minYear !== undefined && maxYear !== undefined && countryId) {
      orConditions.push(
        Sequelize.and(
          {
            countryId: countryId,
          },
          {
            year_of_release: {
              [Op.between]: [minYear.toString(), maxYear.toString()],
            },
          },
        ),
      );
    }

    const where: any = {
      id: { [Op.ne]: movieId },
      // isPublish: false,
      releasedAt: { [Op.lte]: new Date() },
    };

    if (orConditions.length > 0) {
      where[Op.or] = orConditions;
    } else {
      // Fallback ke semua film publish & rilis (urut popular) kalau tidak ada match
      console.warn(
        `Tidak ada match spesifik untuk film ${movieId}, fallback ke popular`,
      );
    }

    const relatedMovies = await this.movieModel.findAll({
      where,
      attributes: this.opt.attributes,
      include: this.opt.include,
      order: [
        // Prioritas 1: Title match
        [
          Sequelize.literal(
            titleConditions.length > 0
              ? `CASE WHEN ${titleConditions
                  .map((_, i) => `"Movie"."title" ILIKE '%${titleWords[i]}%'`)
                  .join(' OR ')} THEN 1 ELSE 5 END`
              : '5',
          ),
          'ASC',
        ],

        // Prioritas 2: Director match
        [
          Sequelize.literal(
            mainDirectorTmdbId
              ? `CASE WHEN "Movie"."director"->>'tmdbId' = '${mainDirectorTmdbId}' THEN 2 ELSE 6 END`
              : '6',
          ),
          'ASC',
        ],

        // Prioritas 3: Genre match
        [
          Sequelize.literal(
            `CASE WHEN EXISTS (
        SELECT 1 FROM "movies_genres" mg
        WHERE mg."movie_id" = "Movie"."id"
        AND mg."genre_id" IN (${genreIds.length > 0 ? genreIds.map((id) => `'${id}'`).join(',') : 'NULL'})
      ) THEN 3 ELSE 7 END`,
          ),
          'ASC',
        ],

        // Prioritas 4: Country & year
        [
          Sequelize.literal(
            minYear !== undefined && maxYear !== undefined && countryId
              ? `CASE WHEN "Movie"."country_id" = '${countryId}' AND "Movie"."year_of_release" BETWEEN ${minYear} AND ${maxYear} THEN 4 ELSE 8 END`
              : '8',
          ),
          'ASC',
        ],

        // Fallback popular/recent
        ['releasedAt', 'DESC'],
        ['createdAt', 'DESC'],
      ],
      limit,
    });

    return {
      message: 'Related movies fetched successfully',
      data: relatedMovies || [],
    };
  }
}
