import { BullBoardInstance, InjectBullBoard } from '@bull-board/nestjs';
import { Controller } from '@nestjs/common';

@Controller('daily-views')
export class DailyViewsController {
  constructor(
    @InjectBullBoard() private readonly boardInstance: BullBoardInstance,
  ) {}
}
