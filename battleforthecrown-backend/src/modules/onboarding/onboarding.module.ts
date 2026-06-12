import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infra/prisma/prisma.module';
import { AuthContextModule } from '../../common/auth';
import { BarbarianVillageFactory } from '../world/barbarian-village.factory';
import { WorldConfigService } from '../world/world-config.service';
import { OnboardingController } from './onboarding.controller';
import { OnboardingNarrativeTargetService } from './onboarding-narrative-target.service';
import { OnboardingService } from './onboarding.service';

@Module({
  imports: [PrismaModule, AuthContextModule],
  controllers: [OnboardingController],
  providers: [
    OnboardingService,
    OnboardingNarrativeTargetService,
    BarbarianVillageFactory,
    WorldConfigService,
  ],
  exports: [OnboardingService, OnboardingNarrativeTargetService],
})
export class OnboardingModule {}
