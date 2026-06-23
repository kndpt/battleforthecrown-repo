import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infra/prisma/prisma.module';
import { PowerModule } from '../power/power.module';
import { WorldModule } from '../world/world.module';
import { PublicProfileController } from './public-profile.controller';
import { PublicProfileService } from './public-profile.service';

@Module({
  imports: [PrismaModule, PowerModule, WorldModule],
  controllers: [PublicProfileController],
  providers: [PublicProfileService],
})
export class UsersModule {}
