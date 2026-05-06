import type { AuthSessionResponse, AuthSession } from '@battleforthecrown/shared/auth';

export type {
  AuthUser,
  AuthTokens,
  AuthSession,
  AuthSessionResponse,
} from '@battleforthecrown/shared/auth';

export type {
  JoinedVillage,
  JoinWorldResult,
  WorldSummary as World,
  WorldMembershipResponse as WorldMembership,
} from '@battleforthecrown/shared/world';

export type {
  BuildingResponse as BuildingDto,
  QueueEntryResponse as QueueEntryDto,
  PopulationResponse as PopulationDto,
  UpgradeBuildingResponse as UpgradeResponseDto,
} from '@battleforthecrown/shared/village';

export function toAuthSession(payload: AuthSessionResponse): AuthSession {
  return {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    user: { id: payload.userId, email: payload.email },
  };
}
