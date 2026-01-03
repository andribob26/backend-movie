import { Controller, Post } from '@nestjs/common';
import { FileCleansService } from './file-cleans.service';

@Controller('file-cleans')
export class FileCleansController {
  constructor(private readonly fileCleansService: FileCleansService) {}

  @Post('enqueue')
  async enqueueDeleteUnused() {
    return await this.fileCleansService.enqueueUnusedFiles();
  }
}
