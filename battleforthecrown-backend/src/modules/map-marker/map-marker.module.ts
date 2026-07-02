import { Module } from '@nestjs/common';
import { MapMarkerController } from './map-marker.controller';
import { MapMarkerService } from './map-marker.service';
import { WorldAccessModule } from '../world/world-access.module';

/**
 * Private map-markers module (cf. docs/gameplay/26-private-map-markers.md).
 * Self-contained CRUD scoped to `userId × worldId`; no cross-module export.
 */
@Module({
  imports: [WorldAccessModule],
  controllers: [MapMarkerController],
  providers: [MapMarkerService],
})
export class MapMarkerModule {}
