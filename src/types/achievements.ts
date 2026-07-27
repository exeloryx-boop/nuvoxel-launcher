export type AchievementCategory =
  | "all"
  | "friends"
  | "hours"
  | "loaders"
  | "mods"
  | "skins"
  | "servers"
  | "launcher";

export interface AchievementDefinition {
  id: string;
  category: Exclude<AchievementCategory, "all">;
  icon: string;
  titleKey: string;
  descKey: string;
}

export interface AchievementStats {
  totalLaunches: number;
  launchesByLoader: Record<string, number>;
  modsInstalledTotal: number;
  modpackIdsUsed: string[];
  visitedTabs: string[];
  memoryCustomized: boolean;
  customProfilesCreated: number;
  loginDates: string[];
  registrationTimestamp: number | null;
  playTimeSeconds: number;
  gameSessionStart: number | null;
  serverVisits: Record<string, number>;
  uniqueServers: string[];
  skinChangeCount: number;
  uploadedCustomSkin: boolean;
  triedSlimModel: boolean;
  uploadedCape: boolean;
  uploaded4kSkin: boolean;
  uploadedAnimatedCape: boolean;
  friendsAccepted: number;
  updatedOnReleaseDay: boolean;
  forgeOptifineUsed: boolean;
}

export const DEFAULT_ACHIEVEMENT_STATS: AchievementStats = {
  totalLaunches: 0,
  launchesByLoader: {},
  modsInstalledTotal: 0,
  modpackIdsUsed: [],
  visitedTabs: [],
  memoryCustomized: false,
  customProfilesCreated: 0,
  loginDates: [],
  registrationTimestamp: null,
  playTimeSeconds: 0,
  gameSessionStart: null,
  serverVisits: {},
  uniqueServers: [],
  skinChangeCount: 0,
  uploadedCustomSkin: false,
  triedSlimModel: false,
  uploadedCape: false,
  uploaded4kSkin: false,
  uploadedAnimatedCape: false,
  friendsAccepted: 0,
  updatedOnReleaseDay: false,
  forgeOptifineUsed: false,
};

export type LauncherBehavior = "keepOpen" | "minimize" | "hide";
