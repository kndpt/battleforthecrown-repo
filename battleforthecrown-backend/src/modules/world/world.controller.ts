import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Param,
  HttpCode,
} from '@nestjs/common';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser, Public, type AuthenticatedUser } from '../../common/auth';
import { WorldService } from './world.service';
import { WorldConfigService } from './world-config.service';
import { WorldEntitiesQueryService } from './world-entities-query.service';
import { JoinWorldUseCase } from './join-world.use-case';
import { ResetWorldUseCase } from './reset-world.use-case';
import {
  VisionService,
  type FogResult,
  type VisionDisk,
} from './vision.service';
import { joinWorldSchema, type JoinWorldDto } from './dto/join-world.dto';
import type { WorldMembershipResponse } from '@battleforthecrown/shared/world';

interface PositionedEntity {
  id: string;
  x: number;
  y: number;
}

interface WorldEntitiesPayload<T extends PositionedEntity> {
  entities: Array<FogResult<T>>;
  visionDisks: VisionDisk[];
  fogOfWarEnabled: boolean;
}

@Controller('world')
export class WorldController {
  constructor(
    private readonly worldService: WorldService,
    private readonly worldConfigService: WorldConfigService,
    private readonly worldEntities: WorldEntitiesQueryService,
    private readonly joinWorldUseCase: JoinWorldUseCase,
    private readonly resetWorldUseCase: ResetWorldUseCase,
    private readonly visionService: VisionService,
  ) {}

  @Public()
  @Get()
  getWorlds() {
    return this.worldService.getWorlds();
  }

  @Public()
  @Get(':worldId/details')
  getWorldDetails(@Param('worldId') worldId: string) {
    return this.worldService.getWorldDetails(worldId);
  }

  @Public()
  @Get(':worldId/config')
  getWorldConfig(@Param('worldId') worldId: string) {
    return this.worldService.getWorldConfig(worldId);
  }

  @Get(':worldId/entities')
  async getWorldEntities(
    @CurrentUser() user: AuthenticatedUser,
    @Param('worldId') worldId: string,
    @Query('centerX') centerX?: string,
    @Query('centerY') centerY?: string,
    @Query('radius') radius?: string,
    @Query('kinds') kinds?: string,
  ) {
    const x = centerX ? parseInt(centerX, 10) : undefined;
    const y = centerY ? parseInt(centerY, 10) : undefined;
    const r = radius ? Math.max(1, parseInt(radius, 10)) : undefined;
    const kindList = kinds ? kinds.split(',') : undefined;

    const entities =
      x !== undefined && y !== undefined && r !== undefined
        ? await this.worldEntities.getEntitiesInRadius(
            worldId,
            x,
            y,
            r,
            kindList,
          )
        : await this.worldEntities.getAllEntities(worldId, kindList);

    return this.withVision(worldId, user.id, entities);
  }

  @Post(':worldId/join')
  joinWorld(
    @CurrentUser() user: AuthenticatedUser,
    @Param('worldId') worldId: string,
    @Body(new ZodValidationPipe(joinWorldSchema)) dto: JoinWorldDto,
  ) {
    return this.joinWorldUseCase.execute({
      worldId,
      userId: user.id,
      villageName: dto.villageName,
    });
  }

  @Post(':worldId/enter')
  enterWorld(
    @CurrentUser() user: AuthenticatedUser,
    @Param('worldId') worldId: string,
  ): Promise<WorldMembershipResponse> {
    return this.worldService.touchUserMembership(user.id, worldId);
  }

  @Delete(':worldId/me')
  @HttpCode(204)
  async resetMe(
    @CurrentUser() user: AuthenticatedUser,
    @Param('worldId') worldId: string,
  ): Promise<void> {
    await this.resetWorldUseCase.execute({ userId: user.id, worldId });
  }

  @Get('me/memberships')
  getMyMemberships(@CurrentUser() user: AuthenticatedUser) {
    return this.worldService.getUserMemberships(user.id);
  }

  @Get(':worldId/villages')
  getWorldVillages(
    @Param('worldId') worldId: string,
    @Query('centerX') centerX?: string,
    @Query('centerY') centerY?: string,
    @Query('radius') radius?: string,
  ) {
    const x = centerX ? parseInt(centerX, 10) : undefined;
    const y = centerY ? parseInt(centerY, 10) : undefined;
    const r = radius ? Math.max(1, parseInt(radius, 10)) : undefined;

    if (x !== undefined && y !== undefined && r !== undefined) {
      return this.worldEntities.getVillagesInRadius(worldId, x, y, r);
    }
    return this.worldEntities.getAllVillages(worldId);
  }

  private async withVision<T extends PositionedEntity>(
    worldId: string,
    userId: string,
    entities: T[],
  ): Promise<WorldEntitiesPayload<T>> {
    const config = await this.worldConfigService.getConfig(worldId);
    const fogOfWarEnabled = config.fogOfWar?.enabled === true;
    const disks = await this.visionService.getVisionDisks(userId, worldId);
    return {
      entities: fogOfWarEnabled
        ? this.visionService.applyFogOfWar(entities, disks)
        : entities,
      visionDisks: disks,
      fogOfWarEnabled,
    };
  }
}
