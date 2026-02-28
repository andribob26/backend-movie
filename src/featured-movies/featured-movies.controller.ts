import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { buildPaginationResponse } from 'src/commons/helpers/paginate-response.helper';
import { MoviesService } from 'src/movies/movies.service';
import { FeaturedMoviesService } from './featured-movies.service';
import { CreateFeaturedMovieDto } from './dto/create-featured-movie.dto';

@Controller('featured-movies')
export class FeaturedMoviesController {
  constructor(private readonly featuredMoviesService: FeaturedMoviesService) {}

  // 1. Semua film (standar findAll)
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

    const result = await this.featuredMoviesService.findAll({
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
  async create(@Body() body: CreateFeaturedMovieDto) {
    return await this.featuredMoviesService.createBulk(body);
  }
}
