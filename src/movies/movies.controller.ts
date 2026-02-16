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
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { buildPaginationResponse } from 'src/commons/helpers/paginate-response.helper';
import { Movie } from 'src/entities/movie.entity';

@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

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

    const result = await this.moviesService.findAll({
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

  // 2. Film Unggulan (Featured)
  @Get('featured')
  async findFeatured(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
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

    const result = await this.moviesService.findFeatured({
      page: parsedPage,
      limit: parsedLimit,
    });

    return buildPaginationResponse(req, result.message, result.data, {
      total: result.total,
      page: parsedPage ?? 1,
      limit: parsedLimit ?? result.total,
      lastPage: result.lastPage,
    });
  }

  // 3. Popular Movies
  @Get('popular')
  async findPopular(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search = '',
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

    const result = await this.moviesService.findPopular({
      page: parsedPage,
      limit: parsedLimit,
      search,
    });

    return buildPaginationResponse(req, result.message, result.data, {
      total: result.total,
      page: parsedPage ?? 1,
      limit: parsedLimit ?? result.total,
      lastPage: result.lastPage,
    });
  }

  // 4. Top This Week
  @Get('top-this-week')
  async findTopThisWeek(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search = '',
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

    const result = await this.moviesService.findTopThisWeek({
      page: parsedPage,
      limit: parsedLimit,
      search,
    });

    return buildPaginationResponse(req, result.message, result.data, {
      total: result.total,
      page: parsedPage ?? 1,
      limit: parsedLimit ?? result.total,
      lastPage: result.lastPage,
    });
  }

  // 5. Top This Month
  @Get('top-this-month')
  async findTopThisMonth(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search = '',
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

    const result = await this.moviesService.findTopThisMonth({
      page: parsedPage,
      limit: parsedLimit,
      search,
    });

    return buildPaginationResponse(req, result.message, result.data, {
      total: result.total,
      page: parsedPage ?? 1,
      limit: parsedLimit ?? result.total,
      lastPage: result.lastPage,
    });
  }

  // 6. Best Rated
  @Get('best-rated')
  async findBestRated(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search = '',
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

    const result = await this.moviesService.findBestRated({
      page: parsedPage,
      limit: parsedLimit,
      search,
    });

    return buildPaginationResponse(req, result.message, result.data, {
      total: result.total,
      page: parsedPage ?? 1,
      limit: parsedLimit ?? result.total,
      lastPage: result.lastPage,
    });
  }

  // 9. Create movie (admin)
  @Post()
  async create(@Body() body: CreateMovieDto) {
    return await this.moviesService.create(body);
  }

  // 10. Update movie (admin)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateMovieDto) {
    return await this.moviesService.update(id, body);
  }

  @Get('tmdb/:tmdbId')
  async getMovieTMDB(@Param('tmdbId') tmdbId: string) {
    return await this.moviesService.getMovie({ tmdbId });
  }
}
