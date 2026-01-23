import {
  Controller,
  Get,
  BadRequestException,
  Req,
  Query,
  Param,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { VideosService } from './videos.service';
import { buildPaginationResponse } from 'src/commons/helpers/paginate-response.helper';

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Get()
  async findAll(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search = '',
    @Query('isSuccess') isSuccess = 'false',
    @Query('orderBy') orderBy = 'name',
    @Query('orderDirection') orderDirection: 'ASC' | 'DESC' = 'ASC',
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

    const isSuccessBool = isSuccess === 'true';

    if (!['ASC', 'DESC'].includes(orderDirection)) {
      throw new BadRequestException('Invalid orderDirection parameter');
    }

    const result = await this.videosService.findAll({
      page: parsedPage,
      limit: parsedLimit,
      search,
      isSuccess: isSuccessBool,
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

  @Get('tmdb/:tmdbId')
  async findOneByIdTMDB(@Param('tmdbId') tmdbId: number) {
    return await this.videosService.findOneByIdTMDB({ tmdbId });
  }

  @Get(':fileName')
  async findOne(@Param('fileName') fileName: string) {
    return await this.videosService.findOne({ fileName });
  }

  @Get('hls/token')
  getToken(@Req() req: Request) {
    const userAgent = req.get('user-agent') || 'unknown';
    const origin = req.get('origin') || req.get('referer') || 'unknown';

    console.log('[Token] User-Agent:', userAgent);
    console.log('[Token] Origin/Referer:', origin);

    const allowedOrigins = [
      'https://stream.nimeninja.win',
      'https://player-hls-three.vercel.app',
      'http://localhost:4001',
      'http://localhost:3000',
    ];

    const isAllowed = allowedOrigins.some((o) => origin.startsWith(o));
    console.log('[Token] AllowedOrigins:', allowedOrigins);
    console.log('[Token] isAllowed:', isAllowed);

    if (!isAllowed) {
      console.warn('[Token] Access denied for origin:', origin);
      throw new ForbiddenException('Unexpected error');
    }

    const token = this.videosService.generateToken({
      userAgent,
      allowedOrigin: origin,
    });

    console.log('[Token] Token generated:', token);

    return { token };
  }
}
