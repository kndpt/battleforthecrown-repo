export interface WatchtowerVisionLevel {
  isWorldUnlocked: boolean;
  visibilityRadius: number;
}

export const WATCHTOWER_VISION_LEVELS: Record<number, WatchtowerVisionLevel> = {
  0: { isWorldUnlocked: false, visibilityRadius: 0 },
  1: { isWorldUnlocked: true, visibilityRadius: 10 },
  2: { isWorldUnlocked: true, visibilityRadius: 15 },
  3: { isWorldUnlocked: true, visibilityRadius: 20 },
  4: { isWorldUnlocked: true, visibilityRadius: 25 },
  5: { isWorldUnlocked: true, visibilityRadius: 30 },
  6: { isWorldUnlocked: true, visibilityRadius: 35 },
  7: { isWorldUnlocked: true, visibilityRadius: 40 },
  8: { isWorldUnlocked: true, visibilityRadius: 45 },
  9: { isWorldUnlocked: true, visibilityRadius: 50 },
  10: { isWorldUnlocked: true, visibilityRadius: 55 },
};
