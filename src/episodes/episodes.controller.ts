import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { buildPaginationResponse } from 'src/commons/helpers/paginate-response.helper';
import { EpisodesService } from './episodes.service';
import { CreateEpisodeDto } from './dto/create-episode.dto';

@Controller('episodes')
export class EpisodesController {
  constructor(private readonly episodesService: EpisodesService) {}

  @Get()
  async findAll(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search = '',
    @Query('orderBy') orderBy = 'createdAt',
    @Query('orderDirection') orderDirection: 'ASC' | 'DESC' = 'DESC',
  ) {
    let parsedPage: number | undefined;
    let parsedLimit: number | undefined;

    if (page !== undefined) {
      parsedPage = parseInt(page, 10);
      if (isNaN(parsedPage) || parsedPage < 1) {
        throw new BadRequestException('Invalid page parameter');
      }
    }

    if (limit !== undefined) {
      parsedLimit = parseInt(limit, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        throw new BadRequestException('Invalid limit parameter');
      }
    }

    if (!['ASC', 'DESC'].includes(orderDirection)) {
      throw new BadRequestException('Invalid orderDirection parameter');
    }

    const result = await this.episodesService.findAll({
      page: parsedPage,
      limit: parsedLimit,
      search,
      orderBy,
      orderDirection,
    });

    return buildPaginationResponse(req, result.message, result.data, {
      total: result.total,
      page: parsedPage ?? 1,
      limit: parsedLimit ?? result.total,
      lastPage: result.lastPage,
    });
  }

  @Post()
  async create(@Body() body: CreateEpisodeDto) {
    return await this.episodesService.create(body);
  }
}
