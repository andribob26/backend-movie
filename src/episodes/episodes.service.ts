import { HttpService } from '@nestjs/axios';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { InferCreationAttributes, Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { PaginationResponse } from 'src/commons/interfaces/pagination-response.interface';
import { Episode } from 'src/entities/episode.entity';
import { File } from 'src/entities/file.entity';
import { Season } from 'src/entities/season.entity';
import { Subtitle } from 'src/entities/subtitle.entity';
import { CreateEpisodeDto } from './dto/create-episode.dto';
import { BaseResponse } from 'src/commons/interfaces/base-response.interface';

const NAME = 'Episode';

@Injectable()
export class EpisodesService {
  constructor(
    @InjectModel(Episode)
    private readonly episodeModel: typeof Episode,
    @InjectModel(Season)
    private readonly seasonModel: typeof Season,
    @InjectModel(Subtitle)
    private readonly subtitleModel: typeof Subtitle,
    @InjectModel(File)
    private readonly fileModel: typeof File,
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
      'thumbnailUrl',
      'title',
      'episodeNumber',
      'synopsis',
      'duration',
      'airedAt',
      'updatedAt',
      'createdAt',
    ],
    include: [
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
    ],
  };

  async findAll(data: {
    page?: number;
    limit?: number;
    search: string;
    orderBy: string;
    orderDirection: 'ASC' | 'DESC';
  }): Promise<PaginationResponse<Episode>> {
    const { page, limit, search, orderBy, orderDirection } = data;

    const where: any = {};

    if (search && search.trim() !== '') {
      where.title = {
        [Op.iLike]: `%${search}%`,
      };
    }

    const orderByMap: Record<string, string> = {
      title: 'title',
      airedAt: 'airedAt',
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

    const { rows, count } = await this.episodeModel.findAndCountAll({
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

  async create(data: CreateEpisodeDto): Promise<BaseResponse<Episode>> {
    const transaction = await this.sequelize.transaction();

    try {
      // ====== VALIDASI FOREIGN KEY ======
      if (data.seasonId) {
        const country = await this.seasonModel.findByPk(data.seasonId, {
          transaction,
        });
        if (!country) throw new NotFoundException('Season not found');
      }

      // ====== CREATE MOVIE ======
      const episode = await this.episodeModel.create(
        {
          tmdbId: data.tmdbId,
          imdbId: data.imdbId,
          byseSlug: data.byseSlug,
          hydraxSlug: data.hydraxSlug,
          thumbnailUrl: data.thumbnailUrl,
          title: data.title,
          synopsis: data.synopsis,
          duration: data.duration,
          airedAt: data.airedAt,
        } as InferCreationAttributes<Episode>,
        { transaction },
      );

      if (episode.dataValues.id) {
        const totalEpisodes = await this.episodeModel.count({
          where: { seasonId: episode.dataValues.seasonId },
          transaction,
        });

        await this.seasonModel.update(
          { totalEpisodes: totalEpisodes },
          {
            where: { id: episode.dataValues.id },
            transaction,
          },
        );
      }

      // ====== ASSOCIATE SUBTITLES ======
      if (data.subtitles && data.subtitles.length > 0) {
        await this.subtitleModel.bulkCreate(
          data.subtitles.map(
            (s) =>
              ({
                episodeId: episode.dataValues.id,
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
      return { message: `${NAME} created successfully`, data: episode };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
