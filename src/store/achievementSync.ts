import type { StoreApi } from "zustand";
import { evaluateUnlocked, recordLoginDate, trackTabVisit } from "../services/achievementEngine";
import type { AchievementStats } from "../types/achievements";
import { DEFAULT_ACHIEVEMENT_STATS } from "../types/achievements";

interface AchievementSlice {
  achievementStats: AchievementStats;
  unlockedAchievements: Record<string, number>;
  friends: { online: boolean }[];
}

export function syncAchievements(
  get: StoreApi<AchievementSlice>["getState"],
  set: StoreApi<AchievementSlice>["setState"],
  patch?: Partial<AchievementStats> | ((s: AchievementStats) => AchievementStats),
): void {
  const state = get();
  let stats = state.achievementStats ?? DEFAULT_ACHIEVEMENT_STATS;
  if (patch) {
    stats =
      typeof patch === "function"
        ? patch(stats)
        : { ...stats, ...patch };
  }
  const friendsCount = state.friends?.length ?? 0;
  const allFriendsOnline =
    friendsCount > 0 &&
    (state.friends ?? []).every((f) => f.online);
  const newly = evaluateUnlocked(
    stats,
    state.unlockedAchievements ?? {},
    friendsCount,
    allFriendsOnline,
  );
  const unlocked = { ...(state.unlockedAchievements ?? {}) };
  const now = Date.now();
  for (const id of newly) unlocked[id] = now;
  set({ achievementStats: stats, unlockedAchievements: unlocked });
}

export function trackNavTab(
  get: StoreApi<AchievementSlice>["getState"],
  set: StoreApi<AchievementSlice>["setState"],
  tab: string,
): void {
  syncAchievements(get, set, (s) => trackTabVisit(s, tab));
}

export function recordDailyLogin(
  get: StoreApi<AchievementSlice>["getState"],
  set: StoreApi<AchievementSlice>["setState"],
): void {
  syncAchievements(get, set, (s) => recordLoginDate(s));
}

export async function applyLauncherWindowBehavior(
  behavior: string,
): Promise<void> {
  if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) return;
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  const win = getCurrentWindow();
  if (behavior === "minimize") await win.minimize();
  if (behavior === "hide") await win.hide();
}

export async function restoreLauncherWindow(behavior: string): Promise<void> {
  if (behavior === "keepOpen") return;
  if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) return;
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  const win = getCurrentWindow();
  if (behavior === "hide") await win.show();
  await win.unminimize();
  await win.setFocus();
}
