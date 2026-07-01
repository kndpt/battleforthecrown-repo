export const queryKeys = {
  worlds: () => ["worlds"] as const,
  publicWorlds: () => ["worlds", "public"] as const,
  myMemberships: (userId: string | null) => ["memberships", userId] as const,
  myVillages: (userId: string | null, worldId: string | null) =>
    ["villages", userId, worldId] as const,
  buildings: (villageId: string | null) => ["buildings", villageId] as const,
  queue: (villageId: string | null) => ["queue", villageId] as const,
  population: (villageId: string | null) => ["population", villageId] as const,
  resources: (villageId: string | null) => ["resources", villageId] as const,
  crowns: (userId: string | null, worldId: string | null) =>
    ["crowns", userId, worldId] as const,
  villageStrategy: (villageId: string | null) =>
    ["village-strategy", villageId] as const,
  villagePower: (villageId: string | null) =>
    ["power", "village", villageId] as const,
  kingdomPower: (userId: string | null, worldId: string | null) =>
    ["power", "kingdom", userId, worldId] as const,
  publicKingdomPower: (userId: string | null, worldId: string | null) =>
    ["power", "kingdom", "public", userId, worldId] as const,
  publicVillagePower: (villageId: string | null) =>
    ["power", "village", "public", villageId] as const,
  publicPlayerProfile: (userId: string | null, worldId: string | null) =>
    ["public-player-profile", userId, worldId] as const,
  armyInventory: (villageId: string | null) =>
    ["army", "inventory", villageId] as const,
  armyTraining: (villageId: string | null) =>
    ["army", "training", villageId] as const,
  activeExpeditions: (villageId: string | null) =>
    ["combat", "active", villageId] as const,
  openConquests: (userId: string | null, worldId: string | null) =>
    ["combat", "conquests", "open", userId, worldId] as const,
  openExpeditions: (userId: string | null, worldId: string | null) =>
    ["combat", "expeditions", "open", userId, worldId] as const,
  incomingAttacks: (villageId: string | null) =>
    ["combat", "incoming", villageId] as const,
  garrison: (villageId: string | null) =>
    ["combat", "garrison", villageId] as const,
  combatReports: (userId: string | null, worldId: string | null) =>
    ["combat", "reports", userId, worldId] as const,
  combatReport: (reportId: string | null, worldId: string | null) =>
    ["combat", "report", reportId, worldId] as const,
  scoutReports: (userId: string | null, worldId: string | null) =>
    ["combat", "scout-reports", userId, worldId] as const,
  scoutReport: (reportId: string | null, worldId: string | null) =>
    ["combat", "scout-report", reportId, worldId] as const,
  reinforcementReports: (userId: string | null, worldId: string | null) =>
    ["combat", "reinforcement-reports", userId, worldId] as const,
  reinforcementReport: (reportId: string | null, worldId: string | null) =>
    ["combat", "reinforcement-report", reportId, worldId] as const,
  caravanReports: (userId: string | null, worldId: string | null) =>
    ["combat", "caravan-reports", userId, worldId] as const,
  caravanReport: (reportId: string | null, worldId: string | null) =>
    ["combat", "caravan-report", reportId, worldId] as const,
  worldConfigFull: (worldId: string | null) =>
    ["world-config-full", worldId] as const,
  worldEntities: (worldId: string | null) =>
    ["world-entities", worldId] as const,
  worldConfig: (worldId: string | null) => ["world-config", worldId] as const,
  retentionSummary: (userId: string | null, worldId: string | null) =>
    ["retention", "summary", userId, worldId] as const,
  onboardingSummary: (userId: string | null, worldId: string | null) =>
    ["onboarding", "summary", userId, worldId] as const,
  rankingsSummary: (worldId: string | null) =>
    ["rankings", "summary", worldId] as const,
  rankingCycles: (worldId: string | null) =>
    ["rankings", "cycles", worldId] as const,
  rankingTitles: (userId: string | null) =>
    ["ranking-titles", userId] as const,
  finalRankings: (worldId: string | null) =>
    ["rankings", "final", worldId] as const,
  renown: (userId: string | null) => ["renown", userId] as const,
  cosmeticAwards: (userId: string | null) =>
    ["cosmetic-awards", userId] as const,
  villageIntel: (worldId: string | null, villageId: string | null) =>
    ["intel", worldId, villageId] as const,
  myFriendships: (userId: string | null, worldId: string | null) =>
    ["friendships", "me", userId, worldId] as const,
  mapMarkers: (worldId: string | null) =>
    ["map-markers", worldId] as const,
  // Broad-invalidation prefixes (omit trailing discriminants to match across worlds/users).
  renownPrefix: () => ["renown"] as const,
  membershipsPrefix: () => ["memberships"] as const,
  villagesPrefix: () => ["villages"] as const,
  worldEntitiesPrefix: () => ["world-entities"] as const,
  onboardingPrefix: () => ["onboarding"] as const,
  kingdomPowerPrefix: (userId: string | null) =>
    ["power", "kingdom", userId] as const,
  combatReportsPrefix: (userId: string | null) =>
    ["combat", "reports", userId] as const,
  scoutReportsPrefix: (userId: string | null) =>
    ["combat", "scout-reports", userId] as const,
  reinforcementReportsPrefix: (userId: string | null) =>
    ["combat", "reinforcement-reports", userId] as const,
  caravanReportsPrefix: (userId: string | null) =>
    ["combat", "caravan-reports", userId] as const,
  caravanReportPrefix: () => ["combat", "caravan-report"] as const,
};
