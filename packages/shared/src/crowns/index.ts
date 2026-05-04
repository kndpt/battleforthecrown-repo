export interface CrownsSettings {
  conversionRate: number;
  enabled: boolean;
}

export const DEFAULT_CROWNS: CrownsSettings = {
  conversionRate: 0.05,
  enabled: true,
};

// Legacy alias
export type CrownsConfig = CrownsSettings;
