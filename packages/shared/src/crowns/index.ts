export interface CrownsSettings {
  conversionRate: number;
  enabled: boolean;
}

export const DEFAULT_CROWNS: CrownsSettings = {
  conversionRate: 0.2,
  enabled: true,
};

export interface CrownBalanceResponse {
  userId: string;
  worldId: string;
  balance: number;
  productionRate: number;
  lastUpdateTs: string;
}
