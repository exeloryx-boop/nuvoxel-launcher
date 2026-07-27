import type { AchievementStats } from "../types/achievements";

const HOUR = 3600;

function loginStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const sorted = [...new Set(dates)].sort().reverse();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  let cursor = today;
  for (const d of sorted) {
    const expected = cursor.toISOString().slice(0, 10);
    if (d !== expected) break;
    streak++;
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function daysSinceRegistration(ts: number | null): number {
  if (!ts) return 0;
  return Math.floor((Date.now() - ts) / (24 * 60 * 60 * 1000));
}

function loadersUsed(stats: AchievementStats): string[] {
  return Object.keys(stats.launchesByLoader).filter(
    (k) => (stats.launchesByLoader[k] ?? 0) > 0,
  );
}

const CHECKS: Record<string, (s: AchievementStats, friendsCount: number, allFriendsOnline: boolean) => boolean> = {
  friend_first: (s) => s.friendsAccepted >= 1,
  friend_5: (_s, f) => f >= 5,
  friend_25: (_s, f) => f >= 25,
  friend_party: (_s, _f, all) => all,

  curious: (s) => s.visitedTabs.length >= 5,
  fine_tune: (s) => s.memoryCustomized,
  aesthetic: (s) => s.customProfilesCreated >= 1,
  early_bird: (s) => s.updatedOnReleaseDay,
  registered: (s) => s.registrationTimestamp != null,
  loyal_7: (s) => loginStreak(s.loginDates) >= 7,
  member_30: (s) => daysSinceRegistration(s.registrationTimestamp) >= 30,
  veteran_365: (s) => daysSinceRegistration(s.registrationTimestamp) >= 365,

  hello_world: (s) => s.totalLaunches >= 1,
  vanilla_10: (s) => (s.launchesByLoader.vanilla ?? 0) >= 10,
  fabric_first: (s) => (s.launchesByLoader.fabric ?? 0) >= 1,
  forge_first: (s) => (s.launchesByLoader.forge ?? 0) >= 1,
  neoforge_first: (s) => (s.launchesByLoader.neoforge ?? 0) >= 1,
  polyglot: (s) => {
    const needed = ["vanilla", "fabric", "forge", "neoforge"];
    return needed.every((l) => (s.launchesByLoader[l] ?? 0) >= 1);
  },
  optimist: (s) => s.forgeOptifineUsed,

  mod_first: (s) => s.modsInstalledTotal >= 1,
  mod_10: (s) => s.modsInstalledTotal >= 10,
  mod_50: (s) => s.modsInstalledTotal >= 50,
  mod_100: (s) => s.modsInstalledTotal >= 100,
  modpack_first: (s) => s.modpackIdsUsed.length >= 1,
  modpack_5: (s) => s.modpackIdsUsed.length >= 5,

  play_1h: (s) => s.playTimeSeconds >= HOUR,
  play_10h: (s) => s.playTimeSeconds >= 10 * HOUR,
  play_100h: (s) => s.playTimeSeconds >= 100 * HOUR,
  play_500h: (s) => s.playTimeSeconds >= 500 * HOUR,
  play_1000h: (s) => s.playTimeSeconds >= 1000 * HOUR,
  play_5000h: (s) => s.playTimeSeconds >= 5000 * HOUR,

  server_first: (s) => s.uniqueServers.length >= 1,
  server_10_same: (s) =>
    Object.values(s.serverVisits).some((c) => c >= 10),
  server_5_unique: (s) => s.uniqueServers.length >= 5,
  server_25_unique: (s) => s.uniqueServers.length >= 25,

  skin_first: (s) => s.uploadedCustomSkin,
  skin_slim: (s) => s.triedSlimModel,
  skin_5: (s) => s.skinChangeCount >= 5,
  cape_first: (s) => s.uploadedCape,
  skin_4k: (s) => s.uploaded4kSkin,
  cape_animated: (s) => s.uploadedAnimatedCape,
};

export function evaluateUnlocked(
  stats: AchievementStats,
  alreadyUnlocked: Record<string, number>,
  friendsCount = 0,
  allFriendsOnline = false,
): string[] {
  const newly: string[] = [];
  for (const id of Object.keys(CHECKS)) {
    if (alreadyUnlocked[id]) continue;
    if (CHECKS[id](stats, friendsCount, allFriendsOnline)) {
      newly.push(id);
    }
  }
  return newly;
}

export function recordLoginDate(stats: AchievementStats): AchievementStats {
  const today = new Date().toISOString().slice(0, 10);
  if (stats.loginDates.includes(today)) return stats;
  return { ...stats, loginDates: [...stats.loginDates, today] };
}

export function trackTabVisit(stats: AchievementStats, tab: string): AchievementStats {
  if (stats.visitedTabs.includes(tab)) return stats;
  return { ...stats, visitedTabs: [...stats.visitedTabs, tab] };
}

export { loadersUsed, loginStreak };
