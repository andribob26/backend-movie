import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Person } from 'src/entities/person.entity';
import { CreatePersonDto } from './dto/create-person.dto';
import { BaseResponse } from 'src/commons/interfaces/base-response.interface';
import { File } from 'src/entities/file.entity';
import { InferCreationAttributes, Op } from 'sequelize';
import { PaginationResponse } from 'src/commons/interfaces/pagination-response.interface';
import { Sequelize } from 'sequelize-typescript';

const NAME = 'Person';

@Injectable()
export class PersonsService {
  constructor(
    @InjectModel(Person)
    private readonly personModel: typeof Person,
    @InjectModel(File)
    private readonly fileModel: typeof File,
    private readonly sequelize: Sequelize,
  ) {}

  async findAll(data: {
    page?: number;
    limit?: number;
    search: string;
    orderBy: string;
    orderDirection: 'ASC' | 'DESC';
  }): Promise<PaginationResponse<Person>> {
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
      attributes: ['id', 'name', 'position', 'updatedAt', 'createdAt'],
      include: [
        {
          model: File,
          as: 'image',
          attributes: ['id', 'fileName', 'updatedAt', 'createdAt'],
        },
      ],
      order: [[orderField, orderDirection]],
    };

    if (offset !== undefined && limit !== undefined) {
      queryOptions.offset = offset;
      queryOptions.limit = limit;
    }

    const { rows, count } =
      await this.personModel.findAndCountAll(queryOptions);

    return {
      message: `${NAME} fetched successfully`,
      data: rows,
      total: count,
      page: page ?? 1,
      limit: limit ?? count,
      lastPage: limit ? Math.ceil(count / limit) : 1,
    };
  }

  async findOne(data: { id: string }): Promise<BaseResponse<Person>> {
    try {
      const dataPerson = await this.personModel.findOne({
        where: { id: data.id },
        attributes: ['id', 'name', 'position', 'updatedAt', 'createdAt'],
        include: [
          {
            model: File,
            as: 'image',
          },
        ],
      });

      if (!dataPerson) {
        throw new NotFoundException(`${NAME} with id ${data.id} not found`);
      }

      return {
        message: `${NAME} fetched successfully`,
        data: dataPerson,
      };
    } catch (error) {
      throw error;
    }
  }

  async create(data: CreatePersonDto): Promise<BaseResponse<Person>> {
    const transaction = await this.sequelize.transaction();
    try {
      if (data.fileId) {
        const file = await this.fileModel.findByPk(data.fileId, {
          transaction,
        });
        if (!file) throw new NotFoundException('File not found');
        await file.update({ isUsed: true }, { transaction });
      }

      // ====== CREATE PERSON ======
      const person = await this.personModel.create(
        {
          name: data.name,
          position: data.position,
          fileId: data.fileId,
        } as InferCreationAttributes<Person>,
        { transaction },
      );

      await transaction.commit();
      return { message: `${NAME} created successfully`, data: person };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
