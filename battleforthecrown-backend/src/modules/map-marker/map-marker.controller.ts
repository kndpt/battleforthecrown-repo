import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  CreateMapMarkerSchema,
  UpdateMapMarkerSchema,
  type CreateMapMarkerBody,
  type MapMarkerDto,
  type UpdateMapMarkerBody,
} from '@battleforthecrown/shared/map-markers';
import { CurrentUser, type AuthenticatedUser } from '../../common/auth';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { MapMarkerService } from './map-marker.service';

@Controller('worlds/:worldId/map-markers')
export class MapMarkerController {
  constructor(private readonly mapMarkers: MapMarkerService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('worldId') worldId: string,
  ): Promise<MapMarkerDto[]> {
    return this.mapMarkers.listMine(user.id, worldId);
  }

  // Create-or-upsert on the (userId, worldId, x, y) tile → 200 on both paths.
  @Post()
  @HttpCode(200)
  upsert(
    @CurrentUser() user: AuthenticatedUser,
    @Param('worldId') worldId: string,
    @Body(new ZodValidationPipe(CreateMapMarkerSchema))
    body: CreateMapMarkerBody,
  ): Promise<MapMarkerDto> {
    return this.mapMarkers.upsert(user.id, worldId, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('worldId') worldId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateMapMarkerSchema))
    body: UpdateMapMarkerBody,
  ): Promise<MapMarkerDto> {
    return this.mapMarkers.update(user.id, worldId, id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('worldId') worldId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.mapMarkers.remove(user.id, worldId, id);
  }
}
