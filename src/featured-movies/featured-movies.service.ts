import { HttpService } from '@nestjs/axios';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { FeaturedMovie } from 'src/entities/featured-movie.entity';
import { CreateFeaturedMovieDto } from './dto/create-featured-movie.dto';
import { BaseResponse } from 'src/commons/interfaces/base-response.interface';
import { Movie } from 'src/entities/movie.entity';
import { Country } from 'src/entities/country.entity';
import { Genre } from 'src/entities/genre.entity';
import { AgeRating } from 'src/entities/age-rating.entity';
import { Season } from 'src/entities/season.entity';
import { Subtitle } from 'src/entities/subtitle.entity';
import { File } from 'src/entities/file.entity';
import { PaginationResponse } from 'src/commons/interfaces/pagination-response.interface';
import { Sequelize } from 'sequelize-typescript';
import {
  FindAndCountOptions,
  IncludeOptions,
  InferCreationAttributes,
  Op,
} from 'sequelize';

const NAME = 'Featured Movie';

@Injectable()
export class FeaturedMoviesService {
  constructor(
    @InjectModel(FeaturedMovie)
    private readonly featuredMovieModel: typeof FeaturedMovie,
    @InjectModel(Movie)
    private readonly movieModel: typeof Movie,
    private readonly sequelize: Sequelize,
    private readonly httpService: HttpService,
  ) {}

  private opt = {
    attributes: ['id', 'position', 'updatedAt', 'createdAt'],
    include: [
      {
        model: Movie,
        as: 'movie',
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
            attributes: [
              'id',
              'fileName',
              'folder',
              'originalName',
              'mimeType',
            ],
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
      },
    ],
  };

  async findAll(data: {
    page?: number;
    limit?: number;
    search: string;
    orderBy: string;
    orderDirection: 'ASC' | 'DESC';
  }): Promise<PaginationResponse<FeaturedMovie>> {
    const { page, limit, search, orderBy, orderDirection } = data;

    const orderByMap: Record<string, string> = {
      position: 'position',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    };

    const orderField = orderByMap[orderBy] ?? 'createdAt';

    const offset = page && limit ? (page - 1) * limit : undefined;

    // Ambil include Movie original dari this.opt
    const originalMovieInclude = this.opt.include[0] as IncludeOptions;

    // Buat objek movieInclude baru (copy properti penting secara manual)
    const movieInclude: IncludeOptions = {
      model: originalMovieInclude.model,
      as: originalMovieInclude.as,
      attributes: originalMovieInclude.attributes,
      include: originalMovieInclude.include, // sub-includes (poster, subtitles, seasons, dll) ikut dibawa
    };

    // Tambahkan kondisi search hanya jika ada input search
    if (search && search.trim() !== '') {
      const trimmedSearch = search.trim();
      movieInclude.where = {
        title: {
          [Op.iLike]: `%${trimmedSearch}%`, // PostgreSQL case-insensitive
          // Ganti ke [Op.like] kalau pakai MySQL/SQLite dan ingin case-sensitive
        },
      };
      movieInclude.required = false; // LEFT JOIN: featured tetap muncul walau movie tidak match search
      // Ubah ke true kalau ingin hanya featured yang punya movie cocok title saja (INNER JOIN)
    }

    // Include array final: hanya pakai movieInclude yang sudah dimodif (asumsi hanya 1 include utama)
    const includes = [movieInclude];

    const queryOptions: FindAndCountOptions = {
      where: {}, // bisa tambah filter lain di FeaturedMovie kalau perlu nanti
      attributes: this.opt.attributes,
      include: includes,
      order: [[orderField, orderDirection]],
      distinct: true, // penting agar count tidak duplikat saat ada nested include
      // subQuery: false, // uncomment kalau count masih salah di versi Sequelize tertentu
    };

    if (offset !== undefined) {
      queryOptions.offset = offset;
    }

    if (limit !== undefined) {
      queryOptions.limit = limit;
    }

    const { rows, count } =
      await this.featuredMovieModel.findAndCountAll(queryOptions);

    return {
      message: `${NAME} fetched successfully`,
      data: rows,
      total: count,
      page: page ?? 1,
      limit: limit ?? count,
      lastPage: limit ? Math.ceil(count / limit) : 1,
    };
  }

  async createBulk(
    data: CreateFeaturedMovieDto,
  ): Promise<BaseResponse<FeaturedMovie[]>> {
    const transaction = await this.sequelize.transaction();

    try {
      if (data.featuredMovies.length === 0) {
        // Optional: kalau array kosong, mungkin hapus semua featured atau return sukses kosong
        await this.featuredMovieModel.destroy({ where: {}, transaction });
        await transaction.commit();
        return { message: 'Featured movies cleared successfully', data: [] };
      }

      // 1. Validasi semua movieId ada di database
      const movieIds = data.featuredMovies.map((item) => item.movieId);
      const existingMovies = await this.movieModel.findAll({
        where: { id: movieIds },
        attributes: ['id'],
        transaction,
      });

      const foundIds = new Set(existingMovies.map((m) => m.id));
      const missingIds = movieIds.filter((id) => !foundIds.has(id));

      if (missingIds.length > 0) {
        throw new NotFoundException(
          `Movie not found for IDs: ${missingIds.join(', ')}`,
        );
      }

      // 2. Hapus semua featured existing (replace full list)
      await this.featuredMovieModel.destroy({
        where: {},
        transaction,
      });

      // 3. Siapkan data untuk bulk insert
      const itemsToCreate = data.featuredMovies.map((item) => ({
        movieId: item.movieId,
        position: item.position,
      }));

      // 4. Bulk create (efisien, satu query)
      const createdItems = await this.featuredMovieModel.bulkCreate(
        itemsToCreate as InferCreationAttributes<FeaturedMovie>[],
        {
          transaction,
        },
      );

      await transaction.commit();

      // 5. Trigger revalidate (sama seperti kode kamu, tapi bisa di-refactor jadi method terpisah)
      try {
        const res = await fetch('https://app.flixklix.online/api/revalidate/movie', {
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

      return {
        message: 'Featured movies updated/created successfully',
        data: createdItems,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
