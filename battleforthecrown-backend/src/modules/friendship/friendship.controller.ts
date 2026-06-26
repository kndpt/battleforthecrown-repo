import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import {
  CreateFriendshipSchema,
  type CreateFriendshipBody,
  type FriendshipDto,
  type MyFriendshipsResponse,
} from '@battleforthecrown/shared/social';
import { CurrentUser, type AuthenticatedUser } from '../../common/auth';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { FriendshipService } from './friendship.service';

@Controller('worlds/:worldId/friendships')
export class FriendshipController {
  constructor(private readonly friendshipService: FriendshipService) {}

  @Get('me')
  getMine(
    @CurrentUser() user: AuthenticatedUser,
    @Param('worldId') worldId: string,
  ): Promise<MyFriendshipsResponse> {
    return this.friendshipService.getMyFriendships(user.id, worldId);
  }

  // Idempotent on the requester side → 200 on both first request and re-request.
  @Post()
  @HttpCode(200)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('worldId') worldId: string,
    @Body(new ZodValidationPipe(CreateFriendshipSchema))
    body: CreateFriendshipBody,
  ): Promise<FriendshipDto> {
    return this.friendshipService.createFriendship(user.id, worldId, body);
  }

  @Post(':id/accept')
  @HttpCode(200)
  accept(
    @CurrentUser() user: AuthenticatedUser,
    @Param('worldId') worldId: string,
    @Param('id') id: string,
  ): Promise<FriendshipDto> {
    return this.friendshipService.acceptFriendship(user.id, worldId, id);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('worldId') worldId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.friendshipService.deleteFriendship(user.id, worldId, id);
  }
}
