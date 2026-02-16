import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { buildPaginationResponse } from 'src/commons/helpers/paginate-response.helper';
import { MediaService } from './media.service';
import { Movie } from 'src/entities/movie.entity';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  // 8. Detail film berdasarkan slug
  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    return await this.mediaService.findOne({ slug });
  }

  // 7. Rekomendasi (Rich Recommendation)
  @Get('recommendations')
  async findRecommendations(
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

    const result = await this.mediaService.findRecommendations({
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

  @Get(':slug/related')
  async findRelated(
    @Req() req: Request,
    @Param('slug') slug: string,
    @Query('limit') limit?: string,
  ) {
    let parsedLimit: number | undefined;

    if (limit !== undefined) {
      parsedLimit = parseInt(limit, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) {
        throw new BadRequestException('Invalid limit parameter (1-50)');
      }
    }

    const movieResult = await this.mediaService.findOne({ slug });

    if (!movieResult.data) {
      throw new NotFoundException(`Movie with slug ${slug} not found`);
    }

    const movieId = movieResult.data.id;

    const relatedResult = await this.mediaService.findRelatedMovies(movieId, {
      limit: parsedLimit,
    });

    // Solusi: pakai variabel sementara + non-null assertion atau type guard
    const safeData: Movie[] = relatedResult.data ?? [];

    return buildPaginationResponse(
      req,
      relatedResult.message,
      safeData, // ← sekarang TS tahu ini Movie[]
      {
        total: safeData.length,
        page: 1,
        limit: parsedLimit ?? safeData.length,
        lastPage: 1,
      },
    );
  }
}
