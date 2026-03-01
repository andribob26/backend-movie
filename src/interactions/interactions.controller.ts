import { Body, Controller, Ip, Post, Req } from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import { Request } from 'express';

@Controller('interactions')
export class InteractionsController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @Post('record-view')
  async recordView(
    @Body() body: { movieId: string; episodeId?: string },
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    const userAgent = req.headers['user-agent'] || 'unknown';

    return await this.interactionsService.recordView(
      body.movieId,
      body.episodeId || null,
      ip,
      userAgent,
    );
  }
}
