export { HeaderBar, type HeaderBarProps } from './HeaderBar';
export { PopulationIndicator } from './PopulationIndicator';
export { PlayerProfile, type PlayerProfileProps } from './PlayerProfile';
export { ResourceDisplay, type ResourceDisplayProps, type ResourceDisplayItem } from './ResourceDisplay';
export { HeaderActions, type HeaderActionsProps } from './HeaderActions';

// Re-export resource config for convenience
export { RESOURCE_CONFIG, getResourceConfig, formatResourceAmount, type ResourceType } from '@/lib/resourceConfig';
