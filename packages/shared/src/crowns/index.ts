export interface CrownsSettings {
  conversionRate: number;
  enabled: boolean;
}

export const DEFAULT_CROWNS: CrownsSettings = {
  conversionRate: 0.2,
  enabled: true,
};

// Legacy alias
export type CrownsConfig = CrownsSettings;

export interface CrownBalanceResponse {
  userId: string;
  worldId: string;
  balance: number;
  productionRate: number;
  lastUpdateTs: string;
}
