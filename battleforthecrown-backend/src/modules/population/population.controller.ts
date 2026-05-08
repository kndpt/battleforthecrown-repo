import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { PopulationService } from './population.service';
import { CurrentUser, type AuthenticatedUser } from '../../common/auth';

@Controller('population')
export class PopulationController {
  constructor(private readonly populationService: PopulationService) {}

  @Get()
  getPopulation(
    @CurrentUser() user: AuthenticatedUser,
    @Query('villageId') villageId?: string,
  ) {
    if (!villageId || villageId.trim() === '') {
      throw new BadRequestException('villageId query parameter is required');
    }
    return this.populationService.getPopulation(villageId, user.id);
  }
}
