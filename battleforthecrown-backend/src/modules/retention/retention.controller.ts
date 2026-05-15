import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser, type AuthenticatedUser } from '../../common/auth';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  claimDailyCardSchema,
  type ClaimDailyCardDto,
} from './dto/claim-daily-card.dto';
import { RetentionService } from './retention.service';

@Controller('retention')
export class RetentionController {
  constructor(private readonly retention: RetentionService) {}

  @Get()
  getSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Query('worldId') worldId: string,
  ) {
    return this.retention.getSummary(user.id, worldId);
  }

  @Post('cards/:cardId/claim')
  claimCard(
    @CurrentUser() user: AuthenticatedUser,
    @Param('cardId') cardId: string,
    @Body(new ZodValidationPipe(claimDailyCardSchema)) dto: ClaimDailyCardDto,
  ) {
    return this.retention.claimCard(user.id, cardId, dto.villageId);
  }
}
