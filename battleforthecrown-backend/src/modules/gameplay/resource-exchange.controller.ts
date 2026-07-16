import { Controller, Post, Param, Body } from '@nestjs/common';
import {
  ConvertResourcesUseCase,
  type ConvertResourcesResult,
} from './convert-resources.use-case';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  convertResourcesBodySchema,
  type ConvertResourcesBodyDto,
} from './dto/convert-resources.schema';
import { CurrentUser, type AuthenticatedUser } from '../../common/auth';

/**
 * Royal resource exchange endpoint. Lives in GameplayModule (not
 * ResourcesController) because the use-case depends on ResourcesService and
 * OutboxPublisher: hosting it in ResourcesModule would cycle
 * (ResourcesModule → GameplayModule → EventModule → ResourcesModule). Route
 * prefix stays `resources` so the public API is `POST /resources/:villageId/convert`.
 */
@Controller('resources')
export class ResourceExchangeController {
  constructor(private readonly convertResources: ConvertResourcesUseCase) {}

  @Post(':villageId/convert')
  convert(
    @CurrentUser() user: AuthenticatedUser,
    @Param('villageId') villageId: string,
    @Body(new ZodValidationPipe(convertResourcesBodySchema))
    body: ConvertResourcesBodyDto,
  ): Promise<ConvertResourcesResult> {
    return this.convertResources.execute(user.id, {
      villageId,
      sourceType: body.sourceType,
      destinationType: body.destinationType,
      amount: body.amount,
    });
  }
}
