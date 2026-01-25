import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { BaseResponse } from 'src/commons/interfaces/base-response.interface';
import { PaginationResponse } from 'src/commons/interfaces/pagination-response.interface';
import { Genre } from 'src/entities/genre.entity';

const NAME = 'Genre';

@Injectable()
export class GenresService {
  constructor(
    @InjectModel(Genre)
    private readonly genreModel: typeof Genre,
  ) {}
  async findAll(data: {
    page?: number;
    limit?: number;
    search: string;
    orderBy: string;
    orderDirection: 'ASC' | 'DESC';
  }): Promise<PaginationResponse<Genre>> {
    const { page, limit, search, orderBy, orderDirection } = data;

    const where: any = {};

    if (search && search.trim() !== '') {
      where.name = {
        [Op.iLike]: `%${search}%`,
      };
    }

    const orderByMap: Record<string, string> = {
      name: 'name',
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
      attributes: ['id', "tmdbId", 'name', 'updatedAt', 'createdAt'],
      order: [[orderField, orderDirection]],
    };

    if (offset !== undefined && limit !== undefined) {
      queryOptions.offset = offset;
      queryOptions.limit = limit;
    }

    const { rows, count } = await this.genreModel.findAndCountAll(queryOptions);

    return {
      message: `${NAME} fetched successfully`,
      data: rows,
      total: count,
      page: page ?? 1,
      limit: limit ?? count,
      lastPage: limit ? Math.ceil(count / limit) : 1,
    };
  }

  async findOne(data: { id: string }): Promise<BaseResponse<Genre>> {
    try {
      const dataGenre = await this.genreModel.findOne({
        where: { id: data.id },

        attributes: ['id', 'name', 'updatedAt', 'createdAt'],
      });

      if (!dataGenre) {
        throw new NotFoundException(`${NAME} with id ${data.id} not found`);
      }

      return {
        message: `${NAME} fetched successfully`,
        data: dataGenre,
      };
    } catch (error) {
      throw error;
    }
  }
}
