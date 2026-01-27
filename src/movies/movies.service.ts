import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { BaseResponse } from 'src/commons/interfaces/base-response.interface';
import { Movie } from 'src/entities/movie.entity';
import { InjectModel } from '@nestjs/sequelize';
import { Genre } from 'src/entities/genre.entity';
import { Country } from 'src/entities/country.entity';
import { Video } from 'src/entities/video.entity';
import { Model, Sequelize } from 'sequelize-typescript';
import { File } from 'src/entities/file.entity';
import { InferCreationAttributes, Op } from 'sequelize';
import { AgeRating } from 'src/entities/age-rating.entity';
import {
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
  S3Client,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { ConfigService } from '@nestjs/config';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import * as https from 'https';
import { Subtitle } from 'src/entities/subtitle.entity';
import { MovieGenre } from 'src/entities/movie-genre.entity';
import { PaginationResponse } from 'src/commons/interfaces/pagination-response.interface';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { FeaturedMovie } from 'src/entities/featured-movie.entity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

const NAME = 'Movie';

@Injectable()
export class MoviesService {
  private readonly urlTMDB = 'https://api.themoviedb.org/3';
  private readonly tokenTMDB =
    'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4YzEyMmVmMzE2NmI1MTAxNDczNTA0MDZmMjEwMjhjZSIsIm5iZiI6MTcyNTc2MjQyNy44OTYsInN1YiI6IjY2ZGQwYjdhODFlYTZiZjBmZDc4NzEzOCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.hAVV5g9v6St9q02WJyFOLIOiMRXXrm7eyjTmdzTelL0';
  private readonly tokenIMDB =
    'apikey 11j6gVq3zScIhM2iuDCFSw:4GbrWLVyuPTQOiA0o7LLKb';

  private s3: S3Client;
  private bucket: string;
  constructor(
    @InjectModel(Movie)
    private readonly movieModel: typeof Movie,
    @InjectModel(FeaturedMovie)
    private readonly featuredMovieModel: typeof FeaturedMovie,
    @InjectModel(Country)
    private readonly countryModel: typeof Country,
    @InjectModel(AgeRating)
    private readonly ageRatingModel: typeof AgeRating,
    @InjectModel(File)
    private readonly fileModel: typeof File,
    @InjectModel(Video)
    private readonly videoModel: typeof Video,
    @InjectModel(Subtitle)
    private readonly subtitleModel: typeof Subtitle,
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

    const where: any = {};

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

  async findFeatured(data: {
    page?: number;
    limit?: number;
  }): Promise<PaginationResponse<Movie>> {
    const { page, limit } = data;

    const offset =
      page !== undefined && limit !== undefined
        ? (page - 1) * limit
        : undefined;

    const queryOptions: any = {
      order: [['position', 'ASC']],
      offset,
      limit,
      include: [
        {
          model: this.movieModel,
          as: 'movie',
          required: true,
          attributes: this.opt.attributes,
          include: this.opt.include,
        },
      ],
    };

    if (offset !== undefined && limit !== undefined) {
      queryOptions.offset = offset;
      queryOptions.limit = limit;
    }

    const { rows: featuredItems, count } =
      await this.featuredMovieModel.findAndCountAll(queryOptions);

    const featuredMovies = featuredItems.map((item) => item.movie);

    return {
      message: 'Film unggulan berhasil diambil',
      data: featuredMovies,
      total: count,
      page: page ?? 1,
      limit: limit ?? count,
      lastPage: limit ? Math.ceil(count / limit) : 1,
    };
  }

  async findPopular(data: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginationResponse<Movie>> {
    const { page, limit, search } = data;

    const where: any = {};

    if (search && search.trim() !== '') {
      where.title = {
        [Op.iLike]: `%${search.trim()}%`,
      };
    }

    const offset =
      page !== undefined && limit !== undefined
        ? (page - 1) * limit
        : undefined;

    const queryOptions: any = {
      where,
      attributes: this.opt.attributes,
      include: this.opt.include,
      order: [
        ['popularityScore', 'DESC'],
        ['releasedAt', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    };

    if (offset !== undefined && limit !== undefined) {
      queryOptions.offset = offset;
      queryOptions.limit = limit;
    }

    const { rows, count } = await this.movieModel.findAndCountAll(queryOptions);

    return {
      message: 'Popular movies fetched successfully',
      data: rows,
      total: count,
      page: page ?? 1,
      limit: limit ?? count,
      lastPage: limit ? Math.ceil(count / limit) : 1,
    };
  }

  // 1. Top Minggu Ini (berdasarkan view7 DESC + tie-breaker releasedAt DESC)
  async findTopThisWeek(data: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginationResponse<Movie>> {
    const { page, limit, search } = data;

    const where: any = {};

    if (search && search.trim() !== '') {
      where.title = {
        [Op.iLike]: `%${search.trim()}%`,
      };
    }

    const offset =
      page !== undefined && limit !== undefined
        ? (page - 1) * limit
        : undefined;

    const queryOptions: any = {
      where,
      attributes: this.opt.attributes,
      include: this.opt.include,
      order: [
        ['view7', 'DESC'], // Utama: view minggu ini tertinggi
        ['releasedAt', 'DESC'], // Tie-breaker: film rilis terbaru duluan
        ['createdAt', 'DESC'], // Fallback kalau releasedAt null
      ],
    };

    if (offset !== undefined && limit !== undefined) {
      queryOptions.offset = offset;
      queryOptions.limit = limit;
    }

    const { rows, count } = await this.movieModel.findAndCountAll(queryOptions);

    return {
      message: 'Top movies this week fetched successfully',
      data: rows,
      total: count,
      page: page ?? 1,
      limit: limit ?? count,
      lastPage: limit ? Math.ceil(count / limit) : 1,
    };
  }

  // 2. Top Bulan Ini (berdasarkan view30 DESC + tie-breaker releasedAt DESC)
  async findTopThisMonth(data: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginationResponse<Movie>> {
    const { page, limit, search } = data;

    const where: any = {};

    if (search && search.trim() !== '') {
      where.title = {
        [Op.iLike]: `%${search.trim()}%`,
      };
    }

    const offset =
      page !== undefined && limit !== undefined
        ? (page - 1) * limit
        : undefined;

    const queryOptions: any = {
      where,
      attributes: this.opt.attributes,
      include: this.opt.include,
      order: [
        ['view30', 'DESC'], // Utama: view 30 hari tertinggi
        ['releasedAt', 'DESC'], // Tie-breaker: rilis terbaru
        ['createdAt', 'DESC'], // Fallback
      ],
    };

    if (offset !== undefined && limit !== undefined) {
      queryOptions.offset = offset;
      queryOptions.limit = limit;
    }

    const { rows, count } = await this.movieModel.findAndCountAll(queryOptions);

    return {
      message: 'Top movies this month fetched successfully',
      data: rows,
      total: count,
      page: page ?? 1,
      limit: limit ?? count,
      lastPage: limit ? Math.ceil(count / limit) : 1,
    };
  }

  // 3. Best Rating (berdasarkan rating DESC + tie-breaker releasedAt DESC)
  async findBestRated(data: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginationResponse<Movie>> {
    const { page, limit, search } = data;

    const where: any = {};

    if (search && search.trim() !== '') {
      where.title = {
        [Op.iLike]: `%${search.trim()}%`,
      };
    }

    // Opsional: hanya tampilkan film yang punya rating (hindari rating 0 mendominasi)
    where.rating = {
      [Op.not]: null,
    };

    const offset =
      page !== undefined && limit !== undefined
        ? (page - 1) * limit
        : undefined;

    const queryOptions: any = {
      where,
      attributes: this.opt.attributes,
      include: this.opt.include,
      order: [
        ['rating', 'DESC'], // Utama: rating tertinggi
        ['releasedAt', 'DESC'], // Tie-breaker: rilis terbaru
        ['createdAt', 'DESC'], // Fallback
      ],
    };

    if (offset !== undefined && limit !== undefined) {
      queryOptions.offset = offset;
      queryOptions.limit = limit;
    }

    const { rows, count } = await this.movieModel.findAndCountAll(queryOptions);

    return {
      message: 'Best rated movies fetched successfully',
      data: rows,
      total: count,
      page: page ?? 1,
      limit: limit ?? count,
      lastPage: limit ? Math.ceil(count / limit) : 1,
    };
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

  async create(data: CreateMovieDto): Promise<BaseResponse<Movie>> {
    const transaction = await this.sequelize.transaction();

    try {
      // ====== VALIDASI FOREIGN KEY ======
      if (data.countryId) {
        const country = await this.countryModel.findByPk(data.countryId, {
          transaction,
        });
        if (!country) throw new NotFoundException('Country not found');
      }

      if (data.ageRatingId) {
        const ageRatingId = await this.ageRatingModel.findByPk(
          data.ageRatingId,
          {
            transaction,
          },
        );
        if (!ageRatingId) throw new NotFoundException('Age Rating not found');
      }

      if (data.fileId) {
        const file = await this.fileModel.findByPk(data.fileId, {
          transaction,
        });
        if (!file) throw new NotFoundException('File not found');
        await file.update({ isUsed: true }, { transaction });
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
          duration: data.duration,
          budget: data.budget,
          revenue: data.revenue,
          trailerUrl: data.trailerUrl,
          fileId: data.fileId,
          ageRatingId: data.ageRatingId,
          countryId: data.countryId,
          releasedAt: data.releasedAt,
          director: data.director,
          casts: data.casts,
        } as InferCreationAttributes<Movie>,
        { transaction },
      );

      // ====== ASSOCIATE SUBTITLES ======
      if (data.subtitles && data.subtitles.length > 0) {
        await this.subtitleModel.bulkCreate(
          data.subtitles.map(
            (s) =>
              ({
                movieId: movie.dataValues.id,
                fileId: s.fileId,
                language: s.language,
              }) as InferCreationAttributes<Subtitle>,
          ),
          { transaction },
        );

        const fileIds = data.subtitles
          .map((s) => s.fileId)
          .filter(Boolean) as string[];

        if (fileIds.length > 0) {
          await this.fileModel.update(
            { isUsed: true },
            {
              where: { id: { [Op.in]: fileIds } },
              transaction,
            },
          );
        }
      }

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
      return { message: `${NAME} created successfully`, data: movie };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async update(id: string, data: UpdateMovieDto): Promise<BaseResponse<Movie>> {
    const transaction = await this.sequelize.transaction();

    try {
      // ====== FIND MOVIE ======
      const movie = await this.movieModel.findByPk(id, { transaction });
      if (!movie) throw new NotFoundException('Movie not found');

      // ====== VALIDASI FOREIGN KEY ======
      if (data.countryId) {
        const country = await this.countryModel.findByPk(data.countryId, {
          transaction,
        });
        if (!country) throw new NotFoundException('Country not found');
      }

      if (data.ageRatingId) {
        const ageRating = await this.ageRatingModel.findByPk(data.ageRatingId, {
          transaction,
        });
        if (!ageRating) throw new NotFoundException('Age Rating not found');
      }

      if (data.fileId && data.fileId !== movie.dataValues.fileId) {
        const file = await this.fileModel.findByPk(data.fileId, {
          transaction,
        });
        if (!file) throw new NotFoundException('File not found');

        // file lama (optional: release)
        if (movie.dataValues.fileId) {
          await this.fileModel.update(
            { isUsed: false },
            { where: { id: movie.dataValues.fileId }, transaction },
          );
        }

        await file.update({ isUsed: true }, { transaction });
      }

      // ====== UPDATE MOVIE ======
      await movie.update(
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
          duration: data.duration,
          budget: data.budget,
          revenue: data.revenue,
          trailerUrl: data.trailerUrl,
          fileId: data.fileId,
          ageRatingId: data.ageRatingId,
          countryId: data.countryId,
          releasedAt: data.releasedAt,
          director: data.director,
          casts: data.casts,
        },
        { transaction },
      );

      // ====== UPDATE SUBTITLES ======
      if (data.subtitles) {
        // Ambil file lama dulu
        const oldSubtitles = await this.subtitleModel.findAll({
          where: { movieId: movie.dataValues.id },
          transaction,
        });

        // hanya ambil fileId yang valid (bukan null)
        const oldFileIds = oldSubtitles
          .map((s) => s.dataValues.fileId)
          .filter(Boolean) as string[];

        console.log(oldSubtitles, 'oldSubtitles');

        if (oldFileIds.length > 0) {
          await this.fileModel.update(
            { isUsed: false },
            {
              where: { id: { [Op.in]: oldFileIds } },
              transaction,
            },
          );
        }

        // Hapus subtitle lama
        await this.subtitleModel.destroy({
          where: { movieId: movie.dataValues.id },
          transaction,
        });

        // Tambahkan subtitle baru
        if (data.subtitles.length > 0) {
          await this.subtitleModel.bulkCreate(
            data.subtitles.map(
              (s) =>
                ({
                  movieId: movie.dataValues.id,
                  fileId: s.fileId,
                  language: s.language,
                }) as InferCreationAttributes<Subtitle>,
            ),
            { transaction },
          );

          // Set isUsed true untuk file baru
          const newFileIds = data.subtitles
            .map((s) => s.fileId)
            .filter(Boolean) as string[];
          if (newFileIds.length > 0) {
            await this.fileModel.update(
              { isUsed: true },
              { where: { id: { [Op.in]: newFileIds } }, transaction },
            );
          }
        }
      }

      // ====== UPDATE GENRES ======
      if (data.genres) {
        await this.movieGenreModel.destroy({
          where: { movieId: movie.dataValues.id },
          transaction,
        });

        if (data.genres.length > 0) {
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
      }

      await transaction.commit();
      return { message: `${NAME} updated successfully`, data: movie };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  private normalizeTitleWord(word: string): string {
    return word
      .toLowerCase()
      .replace(/[^\w]/g, '') // hapus : , . - dll
      .replace(/s$/, ''); // singular: aliens → alien
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
    // const personIds =
    //   mainMovie.dataValues.persons?.flatMap((p) => {
    //     const isDirector = p.dataValues.position === 'Director';
    //     if (isDirector) {
    //       return [p.id];
    //     }
    //     return [];
    //   }) || [];

    const countryId = mainMovie.dataValues.countryId || null;

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
        .filter((word) => word.length > 2) // buang kata terlalu pendek
        .slice(0, 5);
    } else {
      console.warn(`Film ID ${movieId} tidak punya title valid`);
    }

    const titleConditions = titleWords.map((word) => ({
      title: { [Op.iLike]: `%${word}%` },
    }));

    const orConditions: any[] = [];

    // Prioritas tinggi: judul mirip
    if (titleConditions.length > 0) {
      orConditions.push({ [Op.or]: titleConditions });
    }

    // Prioritas 2: genre sama (pakai subquery)
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

    // Prioritas 3: person sama (aktor/director)
    // if (personIds.length > 0) {
    //   orConditions.push(
    //     Sequelize.where(
    //       Sequelize.literal(`(
    //       SELECT COUNT(*)
    //       FROM "characters"
    //       WHERE "movie_id" = "Movie"."id"
    //       AND "person_id" IN (${personIds.map((id) => `'${id}'`).join(',')})
    //     )`),
    //       Op.gt,
    //       0,
    //     ),
    //   );
    // }

    // Prioritas rendah: country + tahun (opsional, hanya kalau keduanya ada)
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

    console.log(genreIds, 'akjdkadhkjahjdakdaksdhkjaksdhkaksd');

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
        // Judul mirip skor 1
        [
          Sequelize.literal(
            titleConditions.length > 0
              ? `CASE WHEN ${titleConditions.map((_, i) => `title ILIKE '%${titleWords[i]}%'`).join(' OR ')} THEN 1 ELSE 5 END`
              : '5',
          ),
          'ASC',
        ],

        // Genre skor 2
        [
          Sequelize.literal(
            `CASE WHEN EXISTS (
            SELECT 1 FROM "movies_genres" mg 
            INNER JOIN "genres" g ON mg."genre_id" = g."id" 
            WHERE mg."movie_id" = "Movie"."id" 
            AND g."id" IN (${genreIds.length > 0 ? genreIds.map((id) => `'${id}'`).join(',') : 'NULL'})
          ) THEN 2 ELSE 5 END`,
          ),
          'ASC',
        ],

        // Person skor 3
        // [
        //   Sequelize.literal(
        //     `CASE WHEN EXISTS (
        //     SELECT 1 FROM "characters" c
        //     WHERE c."movie_id" = "Movie"."id"
        //     AND c."person_id" IN (${personIds.length > 0 ? personIds.map((id) => `'${id}'`).join(',') : 'NULL'})
        //   ) THEN 3 ELSE 5 END`,
        //   ),
        //   'ASC',
        // ],

        // Skor 4: punya negara yang sama DAN tahun mirip
        [
          Sequelize.literal(
            minYear !== undefined && maxYear !== undefined && countryId
              ? `CASE WHEN (
          "Movie"."country_id" = '${countryId}'
          AND "Movie"."year_of_release" BETWEEN ${minYear} AND ${maxYear}
        ) THEN 4 ELSE 10 END`
              : '10',
          ),
          'ASC',
        ],

        // ['popularityScore', 'DESC'],
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

  async getMovie(data: { tmdbId: string }): Promise<BaseResponse<any>> {
    const headers = {
      accept: 'application/json',
      Authorization: this.tokenTMDB,
    };

    const movieRequest = this.httpService.get(
      `${this.urlTMDB}/movie/${data.tmdbId}?language=en-US&append_to_response=release_dates,credits,videos`,
      { headers },
    );

    // const movieIMDBRequest = this.httpService.get(
    //   `${this.urlTMDB}/movie/${data.tmdbId}?language=en-US&append_to_response=release_dates,credits,videos`,
    //   { headers },
    // );

    const movieRes = await firstValueFrom(
      this.httpService.get(
        `${this.urlTMDB}/movie/${data.tmdbId}?language=en-US&append_to_response=release_dates,credits,videos`,
        { headers },
      ),
    );

    // const [movieRes] = await Promise.all([firstValueFrom(movieRequest)]);

    const { credits, videos, release_dates, ...movieData } = movieRes.data;

    // ambil trailer YouTube pertama
    const trailer =
      videos?.results?.find(
        (v: any) => v.site === 'YouTube' && v.type === 'Trailer',
      ) ?? null;

    // ambil release_dates untuk US, hanya item pertama
    const usRelease =
      release_dates?.results?.find((r: any) => r.iso_3166_1 === 'US')
        ?.release_dates?.[0] ?? null;

    const imdbId = movieRes.data.imdb_id; // contoh: "tt1375666"

    const imdbResponse = await firstValueFrom(
      this.httpService.get(`https://api.imdbapi.dev/titles/${imdbId}`, {
        headers: {
          'content-type': 'application/json',
        },
      }),
    );

    const imdbData = imdbResponse.data;

    // console.log(imdbData, 'data imdb');

    return {
      message: 'TMDB movies fetched successfully',
      data: {
        ...movieData,
        imdb_rating: imdbData.rating,
        casts: credits.cast.slice(0, 10),
        crews: credits.crew.filter((crew: any) => crew.job === 'Director'),
        trailer: trailer
          ? {
              name: trailer.name,
              key: trailer.key,
              url: `https://www.youtube.com/watch?v=${trailer.key}`,
            }
          : null,
        releaseUS: usRelease
          ? {
              date: usRelease.release_date,
              certification: usRelease.certification,
              type: usRelease.type,
              note: usRelease.note,
            }
          : null,
      },
    };
  }
}
