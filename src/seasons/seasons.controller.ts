import { Body, Controller, Post } from '@nestjs/common';
import { CreateSeasonsDto } from './dto/create-seasons.dto';
import { SeasonsService } from './seasons.service';

@Controller('seasons')
export class SeasonsController {
  constructor(private readonly seasonsService: SeasonsService) {}
  
  @Post()
  async create(@Body() body: CreateSeasonsDto) {
    return await this.seasonsService.create(body);
  }
}
