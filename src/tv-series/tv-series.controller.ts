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
import { TvSeriesService } from './tv-series.service';
import { CreateTvSeriesDto } from './dto/create-tv-series.dto';

@Controller('tv-series')
export class TvSeriesController {
  constructor(private readonly tvSeriesService: TvSeriesService) {}

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

    const result = await this.tvSeriesService.findAll({
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
  async create(@Body() body: CreateTvSeriesDto) {
    return await this.tvSeriesService.create(body);
  }

  @Get('tmdb/:tmdbId')
  async getSeriesTMDB(@Param('tmdbId') tmdbId: string) {
    return await this.tvSeriesService.getSeries({ tmdbId });
  }
  @Get('tmdb/:tmdbId/s/:seasonNumber')
  async getSeasonTMDB(
    @Param('tmdbId') tmdbId: string,
    @Param('seasonNumber') seasonNumber: string,
  ) {
    const parsedSeasonNumber = parseInt(seasonNumber, 10);

    if (isNaN(parsedSeasonNumber) || parsedSeasonNumber < 1) {
      throw new BadRequestException('Invalid page parameter');
    }

    return await this.tvSeriesService.getSeason({
      tmdbId,
      seasonNumber: parsedSeasonNumber,
    });
  }
  @Get('tmdb/:tmdbId/s/:seasonNumber/e/:episodeNumber')
  async getEpisodeTMDB(
    @Param('tmdbId') tmdbId: string,
    @Param('seasonNumber') seasonNumber: string,
    @Param('episodeNumber') episodeNumber: string,
  ) {
    const parsedSeasonNumber = parseInt(seasonNumber, 10);
    const parsedEpisodeNumber = parseInt(episodeNumber, 10);

    if (isNaN(parsedSeasonNumber) || parsedSeasonNumber < 1) {
      throw new BadRequestException('Invalid season number parameter');
    }

    if (isNaN(parsedEpisodeNumber) || parsedEpisodeNumber < 1) {
      throw new BadRequestException('Invalid episode number parameter');
    }

    return await this.tvSeriesService.getEpisode({
      tmdbId,
      seasonNumber: parsedSeasonNumber,
      episodeNumber: parsedEpisodeNumber,
    });
  }
}
