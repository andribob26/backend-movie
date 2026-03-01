import { BullBoardInstance, InjectBullBoard } from '@bull-board/nestjs';
import { Controller, Get } from '@nestjs/common';
import { DailyViewsService } from './daily-views.service';

@Controller('daily-views')
export class DailyViewsController {
  constructor(
    private readonly dailyViewsService: DailyViewsService,
    @InjectBullBoard() private readonly boardInstance: BullBoardInstance,
  ) {}

  @Get('trigger-rollup')
  async triggerRollup() {
    await this.dailyViewsService.updateRollingViews();
    return { message: 'Rollup dipicu manual' };
  }
}
