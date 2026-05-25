import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/auth';
import { WorldService } from './world.service';

@Controller('worlds')
export class PublicWorldsController {
  constructor(private readonly worldService: WorldService) {}

  @Public()
  @Get('public')
  getPublicWorlds() {
    return this.worldService.getPublicWorlds();
  }
}
