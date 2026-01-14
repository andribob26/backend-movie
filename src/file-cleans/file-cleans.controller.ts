import { Controller, Post } from '@nestjs/common';
import { FileCleansService } from './file-cleans.service';
import { BullBoardInstance, InjectBullBoard } from '@bull-board/nestjs';

@Controller('file-cleans')
export class FileCleansController {
  constructor(
    @InjectBullBoard() private readonly boardInstance: BullBoardInstance,
    private readonly fileCleansService: FileCleansService,
  ) {}

  @Post('enqueue')
  async enqueueDeleteUnused() {
    return await this.fileCleansService.enqueueUnusedFiles();
  }
}
