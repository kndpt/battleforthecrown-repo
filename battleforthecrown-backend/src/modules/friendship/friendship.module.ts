import { Module } from '@nestjs/common';
import { FriendshipController } from './friendship.controller';
import { FriendshipService } from './friendship.service';

/**
 * Defensive-friends module (cf. docs/gameplay/20-defensive-friends.md).
 * Exports {@link FriendshipService} so combat can authorize cross-player
 * reinforcements and scouting can reveal a target's ACTIVE friends.
 */
@Module({
  controllers: [FriendshipController],
  providers: [FriendshipService],
  exports: [FriendshipService],
})
export class FriendshipModule {}
