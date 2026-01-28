import { PaginationResponse } from 'src/commons/interfaces/pagination-response.interface';
import { Video } from 'src/entities/video.entity';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseResponse } from 'src/commons/interfaces/base-response.interface';
import { ConfigService } from '@nestjs/config';
import { sign } from 'jsonwebtoken';
import { Movie } from 'src/entities/movie.entity';

const NAME = 'Video';

@Injectable()
export class VideosService {
  constructor(
    @InjectModel(Video)
    private readonly videoModel: typeof Video,
    @InjectModel(Movie)
    private readonly movieModel: typeof Movie,
    private readonly configService: ConfigService,
  ) {}
  async findAll(data: {
    page?: number;
    limit?: number;
    search: string;
    isSuccess: boolean;
    orderBy: string;
    orderDirection: 'ASC' | 'DESC';
  }): Promise<PaginationResponse<Video>> {
    const { page, limit, search, isSuccess, orderBy, orderDirection } = data;

    const where: any = {};

    if (search && search.trim() !== '') {
      where.originalName = {
        [Op.iLike]: `%${search}%`,
      };
    }

    if (isSuccess) {
      where.uploadedProgress = 100;
    }

    const orderByMap: Record<string, string> = {
      originalName: 'originalName',
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
      attributes: [
        'id',
        'fileName',
        'originalName',
        'prefix',
        'hlsObject',
        'uploadedSize',
        'uploadedProgress',
        'updatedAt',
        'createdAt',
      ],
      order: [[orderField, orderDirection]],
    };

    if (offset !== undefined && limit !== undefined) {
      queryOptions.offset = offset;
      queryOptions.limit = limit;
    }

    const { rows, count } = await this.videoModel.findAndCountAll(queryOptions);

    return {
      message: `${NAME} fetched successfully`,
      data: rows,
      total: count,
      page: page ?? 1,
      limit: limit ?? count,
      lastPage: limit ? Math.ceil(count / limit) : 1,
    };
  }

  async findOne(data: { fileName: string }): Promise<BaseResponse<Video>> {
    try {
      const dataGenre = await this.videoModel.findOne({
        where: { fileName: data.fileName },

        attributes: [
          'id',
          'fileName',
          'originalName',
          'prefix',
          'hlsObject',
          'thumbnail',
          'sprites',
          'uploadedSize',
          'uploadedProgress',
          'updatedAt',
          'createdAt',
        ],
      });

      if (!dataGenre) {
        throw new NotFoundException(
          `${NAME} with filename ${data.fileName} not found`,
        );
      }

      return {
        message: `${NAME} fetched successfully`,
        data: dataGenre,
      };
    } catch (error) {
      throw error;
    }
  }

  async findOneByIdTMDB(data: { tmdbId: number }): Promise<BaseResponse<any>> {
    try {
      const dataVideo = await this.videoModel.findOne({
        where: { tmdbId: data.tmdbId },

        attributes: ['prefix', 'sprites'],
      });

      const dataMovie = await this.movieModel.findOne({
        where: { tmdbId: data.tmdbId },
        attributes: ['hydraxSlug'],
      });

      if (!dataVideo) {
        throw new NotFoundException(
          `${NAME} with TMDB_ID ${data.tmdbId} not found`,
        );
      }

      return {
        message: `${NAME} fetched successfully`,
        data: {
          ...dataVideo,
          hydraxSlug: dataMovie?.dataValues?.hydraxSlug ?? null,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async findOneByIdIMDB(data: { imdbId: string }): Promise<BaseResponse<any>> {
    try {
      const dataVideo = await this.videoModel.findOne({
        where: { imdbId: data.imdbId },
        attributes: ['prefix', 'sprites'],
      });

      const dataMovie = await this.movieModel.findOne({
        where: { imdbId: data.imdbId },
        attributes: ['hydraxSlug'],
      });

      if (!dataVideo) {
        throw new NotFoundException(
          `${NAME} with IMDB_ID ${data.imdbId} not found`,
        );
      }

      return {
        message: `${NAME} fetched successfully`,
        data: {
          ...dataVideo,
          hydraxSlug: dataMovie?.dataValues?.hydraxSlug ?? null,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  generateToken({
    userAgent,
    allowedOrigin,
  }: {
    userAgent: string;
    allowedOrigin: string;
  }) {
    const secret = this.configService.get('HLS_TOKEN_SECRET');
    const expiresIn = this.configService.get('HLS_EXPIRES_IN');
    if (!secret) {
      throw new Error('Missing HLS_TOKEN_SECRET in .env');
    }
    return sign({ userAgent, allowedOrigin }, secret, { expiresIn });
  }
}
