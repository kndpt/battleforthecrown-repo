import { villageStyleOptions } from '@/features/design-system/components/villageStyleData';

export const STRATEGY_LABELS: Record<string, string> = Object.fromEntries(
  villageStyleOptions.map((option) => [option.id, option.name]),
);
